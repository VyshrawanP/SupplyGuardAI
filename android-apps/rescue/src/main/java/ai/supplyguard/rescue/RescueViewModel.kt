package ai.supplyguard.rescue

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import ai.supplyguard.data.CommandPayload
import ai.supplyguard.data.MeshEnvelope
import ai.supplyguard.data.SosPayload
import ai.supplyguard.mesh.MeshRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json

data class SosItem(
  val envelope: MeshEnvelope,
  val payload: SosPayload?,
)

data class RescueUiState(
  val commands: List<CommandPayload> = emptyList(),
  val sos: List<SosItem> = emptyList(),
)

class RescueViewModel(
  private val repository: MeshRepository,
) : ViewModel() {
  private val json = Json { ignoreUnknownKeys = true }

  val state: StateFlow<RescueUiState> = combine(
    repository.watchCommands(),
    repository.watchSos(),
  ) { commandEnvs, sosEnvs ->
    RescueUiState(
      commands = commandEnvs
        .sortedByDescending { it.timestampEpochMs }
        .mapNotNull { env -> env.toCommandPayloadOrNull() },
      sos = sosEnvs
        .sortedByDescending { it.timestampEpochMs }
        .map { env -> SosItem(envelope = env, payload = env.toSosPayloadOrNull()) },
    )
  }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), RescueUiState())

  fun sendResponse(targetMessageId: String, message: String) {
    viewModelScope.launch {
      repository.createResponse(targetMessageId = targetMessageId, message = message)
    }
  }

  private fun MeshEnvelope.toCommandPayloadOrNull(): CommandPayload? {
    return try {
      json.decodeFromString(CommandPayload.serializer(), payload)
    } catch (_: Throwable) {
      null
    }
  }

  private fun MeshEnvelope.toSosPayloadOrNull(): SosPayload? {
    return try {
      json.decodeFromString(SosPayload.serializer(), payload)
    } catch (_: Throwable) {
      null
    }
  }
}
