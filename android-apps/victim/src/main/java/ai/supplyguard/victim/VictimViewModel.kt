package ai.supplyguard.victim

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import ai.supplyguard.data.CommandPayload
import ai.supplyguard.data.CommandTarget
import ai.supplyguard.data.MeshEnvelope
import ai.supplyguard.data.SosPayload
import ai.supplyguard.mesh.MeshRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json

data class VictimUiState(
  val commands: List<CommandPayload> = emptyList(),
  val latestSos: SosPayload? = null,
)

class VictimViewModel(
  private val repository: MeshRepository,
) : ViewModel() {
  private val json = Json { ignoreUnknownKeys = true }

  val state: StateFlow<VictimUiState> = repository.watchCommands()
    .map { envelopes ->
      VictimUiState(
        commands = envelopes
          .sortedByDescending { it.timestampEpochMs }
          .mapNotNull { it.toCommandPayloadOrNull() }
          .filter { cmd -> cmd.targetApp == CommandTarget.VICTIM || cmd.targetApp == CommandTarget.ALL },
      )
    }
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), VictimUiState())

  fun sendSos(
    name: String?,
    locationText: String?,
    need: String?,
    latitude: Double?,
    longitude: Double?,
    accuracyMeters: Float?,
  ) {
    viewModelScope.launch {
      repository.createSos(
        name = name?.takeIf { it.isNotBlank() },
        locationText = locationText?.takeIf { it.isNotBlank() },
        need = need?.takeIf { it.isNotBlank() },
        latitude = latitude,
        longitude = longitude,
        accuracyMeters = accuracyMeters,
      )
    }
  }

  private fun MeshEnvelope.toCommandPayloadOrNull(): CommandPayload? {
    return try {
      json.decodeFromString(CommandPayload.serializer(), payload)
    } catch (_: Throwable) {
      null
    }
  }
}
