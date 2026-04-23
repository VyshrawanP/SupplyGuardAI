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

  fun sendToVictim(title: String?, message: String, priority: CommandPriority) {
    viewModelScope.launch {
      repository.sendToVictim(
        title = title?.takeIf { it.isNotBlank() },
        message = message.trim(),
        priority = priority,
      )
    }
  }

  fun sendToRescue(
    title: String?,
    message: String,
    priority: CommandPriority,
    latitude: Double? = null,
    longitude: Double? = null,
    accuracyMeters: Float? = null,
  ) {
    viewModelScope.launch {
      repository.sendToRescue(
        title = title?.takeIf { it.isNotBlank() },
        message = message.trim(),
        priority = priority,
        latitude = latitude,
        longitude = longitude,
        accuracyMeters = accuracyMeters,
      )
    }
  }

  fun forwardSosLocationToRescue(envelope: MeshEnvelope, payload: SosPayload?) {
    val lat = payload?.latitude ?: return
    val lon = payload.longitude ?: return
    val accuracy = payload.accuracyMeters
    val who = payload.name?.takeIf { it.isNotBlank() } ?: envelope.originDeviceId.takeLast(6)
    val locationText = payload.locationText?.takeIf { it.isNotBlank() }
    val need = payload.need?.takeIf { it.isNotBlank() }
    val message = buildString {
      append("Forwarded victim location for ")
      append(who)
      append(".")
      if (locationText != null) {
        append(" Location: ")
        append(locationText)
        append(".")
      }
      if (need != null) {
        append(" Need: ")
        append(need)
        append(".")
      }
      append(" Source SOS id: ")
      append(envelope.id)
      append(".")
    }

    viewModelScope.launch {
      repository.sendToRescue(
        title = "Victim location",
        message = message,
        priority = CommandPriority.WARNING,
        latitude = lat,
        longitude = lon,
        accuracyMeters = accuracy,
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
