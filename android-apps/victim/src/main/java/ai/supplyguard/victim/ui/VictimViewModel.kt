package ai.supplyguard.victim.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import ai.supplyguard.victim.VictimApp
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.collectLatest
import ai.supplyguard.data.ResponsePayload
import kotlinx.serialization.json.Json

data class VictimUiState(
  val name: String = "",
  val locationText: String = "",
  val need: String = "",
  val sending: Boolean = false,
  val lastMessageId: String? = null,
  val status: String = "idle",
)

class VictimViewModel(app: Application) : AndroidViewModel(app) {
  private val victimApp = app as VictimApp
  private val repo = victimApp.repo
  private val json = Json { ignoreUnknownKeys = true }

  private val _state = MutableStateFlow(VictimUiState())
  val state: StateFlow<VictimUiState> = _state.asStateFlow()

  fun setName(value: String) = _state.value.let { _state.value = it.copy(name = value) }
  fun setLocationText(value: String) = _state.value.let { _state.value = it.copy(locationText = value) }
  fun setNeed(value: String) = _state.value.let { _state.value = it.copy(need = value) }

  fun sendSos() {
    val current = _state.value
    if (current.sending) return
    _state.value = current.copy(sending = true, status = "queued")

    viewModelScope.launch {
      try {
        val env = repo.createSos(
          name = current.name.trim().ifEmpty { null },
          locationText = current.locationText.trim().ifEmpty { null },
          need = current.need.trim().ifEmpty { null },
        )
        _state.value = _state.value.copy(
          sending = false,
          lastMessageId = env.id,
          status = "broadcasting via mesh",
        )

        // Mark acknowledged once we receive a RESPONSE that targets this SOS.
        viewModelScope.launch {
          repo.watchResponses().collectLatest { responses ->
            val id = _state.value.lastMessageId ?: return@collectLatest
            val match = responses.firstOrNull { resp ->
              runCatching { json.decodeFromString(ResponsePayload.serializer(), resp.payload) }
                .getOrNull()
                ?.targetMessageId == id
            }
            if (match != null) {
              _state.value = _state.value.copy(status = "acknowledged (response received)")
            }
          }
        }
      } catch (e: Throwable) {
        _state.value = _state.value.copy(sending = false, status = "failed: ${e.message}")
      }
    }
  }
}
