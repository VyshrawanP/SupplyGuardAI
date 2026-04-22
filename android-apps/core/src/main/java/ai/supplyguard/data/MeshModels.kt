package ai.supplyguard.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import java.util.UUID

/**
 * High-level message types carried across the mesh.
 */
@Serializable
enum class MeshMessageType {
  @SerialName("SOS")
  SOS,
  @SerialName("RESPONSE")
  RESPONSE,
  @SerialName("ACK")
  ACK,
  /**
   * Broadcast messages sent from the "command center" device to all field devices.
   */
  @SerialName("COMMAND")
  COMMAND,
}

/**
 * Envelope that all mesh messages travel inside.
 *
 * Store-and-forward behavior is achieved by persisting envelopes locally and
 * periodically exchanging them with nearby peers.
 */
@Serializable
data class MeshEnvelope(
  val id: String = UUID.randomUUID().toString(),
  val type: MeshMessageType,
  val timestampEpochMs: Long,
  val ttl: Int,
  val hops: Int,
  val originDeviceId: String,
  val payload: String,
)

@Serializable
data class SosPayload(
  val name: String? = null,
  val locationText: String? = null,
  val need: String? = null,
)

@Serializable
data class ResponsePayload(
  val targetMessageId: String,
  val message: String,
)

@Serializable
data class AckPayload(
  val targetMessageId: String,
)

@Serializable
enum class CommandPriority {
  @SerialName("INFO")
  INFO,
  @SerialName("WARNING")
  WARNING,
  @SerialName("CRITICAL")
  CRITICAL,
}

@Serializable
data class CommandPayload(
  val title: String? = null,
  val message: String,
  val priority: CommandPriority = CommandPriority.INFO,
)
