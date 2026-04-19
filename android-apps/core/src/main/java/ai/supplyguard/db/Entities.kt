package ai.supplyguard.db

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

enum class MessageSyncState {
  LOCAL_ONLY,
  SYNC_PENDING,
  SYNCED,
}

/**
 * One row per unique message ID.
 *
 * The primary key gives us strong dedupe guarantees across app restarts.
 */
@Entity(
  tableName = "mesh_messages",
  indices = [
    Index(value = ["type"]),
    Index(value = ["timestampEpochMs"]),
    Index(value = ["syncState"]),
  ],
)
data class MeshMessageEntity(
  @PrimaryKey val id: String,
  val type: String,
  val payloadJson: String,
  val timestampEpochMs: Long,
  val ttl: Int,
  val hops: Int,
  val originDeviceId: String,
  val receivedRssi: Int?,
  val receivedAtEpochMs: Long,
  val lastForwardAttemptEpochMs: Long?,
  val syncState: MessageSyncState,
)

