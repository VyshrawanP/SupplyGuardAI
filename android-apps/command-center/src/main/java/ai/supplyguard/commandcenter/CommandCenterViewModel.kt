package ai.supplyguard.commandcenter

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import ai.supplyguard.data.CommandPayload
import ai.supplyguard.data.CommandPriority
import ai.supplyguard.data.MeshEnvelope
import ai.supplyguard.data.ResponsePayload
import ai.supplyguard.data.SosPayload
import ai.supplyguard.mesh.MeshRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json

data class CommandCenterUiState(
  val commands: List<CommandPayload> = emptyList(),
  val sos: List<Pair<MeshEnvelope, SosPayload?>> = emptyList(),
  val responses: List<Pair<MeshEnvelope, ResponsePayload?>> = emptyList(),
)

class CommandCenterViewModel(
  private val repository: MeshRepository,
) : ViewModel() {
  private val json = Json { ignoreUnknownKeys = true }

  val state: StateFlow<CommandCenterUiState> = combine(
    repository.watchCommands(),
    repository.watchSos(),
    repository.watchResponses(),
  ) { cmdEnvs, sosEnvs, respEnvs ->
    CommandCenterUiState(
      commands = cmdEnvs
        .sortedByDescending { it.timestampEpochMs }
        .mapNotNull { env -> env.toCommandPayloadOrNull() },
      sos = sosEnvs
        .sortedByDescending { it.timestampEpochMs }
        .map { env -> env to env.toSosPayloadOrNull() },
      responses = respEnvs
        .sortedByDescending { it.timestampEpochMs }
        .map { env -> env to env.toResponsePayloadOrNull() },
    )
  }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), CommandCenterUiState())

  fun broadcast(title: String?, message: String, priority: CommandPriority) {
    viewModelScope.launch {
      repository.createCommand(
        title = title?.takeIf { it.isNotBlank() },
        message = message.trim(),
        priority = priority,
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

  private fun MeshEnvelope.toSosPayloadOrNull(): SosPayload? {
    return try {
      json.decodeFromString(SosPayload.serializer(), payload)
    } catch (_: Throwable) {
      null
    }
  }

  private fun MeshEnvelope.toResponsePayloadOrNull(): ResponsePayload? {
    return try {
      json.decodeFromString(ResponsePayload.serializer(), payload)
    } catch (_: Throwable) {
      null
    }
  }
}
