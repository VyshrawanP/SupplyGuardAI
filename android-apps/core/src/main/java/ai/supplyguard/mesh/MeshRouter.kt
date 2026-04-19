package ai.supplyguard.mesh

import ai.supplyguard.data.MeshEnvelope
import ai.supplyguard.db.MessageSyncState
import ai.supplyguard.db.MeshMessageDao
import ai.supplyguard.db.MeshMessageEntity

/**
 * Core routing logic:
 * - Dedupe using DB primary key
 * - Store every message locally
 * - Only forward new messages with ttl > 0
 */
class MeshRouter(
  private val dao: MeshMessageDao,
) {
  suspend fun onReceive(envelope: MeshEnvelope, rssi: Int?): Boolean {
    val now = System.currentTimeMillis()
    val inserted = dao.insertIgnore(
      MeshMessageEntity(
        id = envelope.id,
        type = envelope.type.name,
        payloadJson = envelope.payload,
        timestampEpochMs = envelope.timestampEpochMs,
        ttl = envelope.ttl,
        hops = envelope.hops,
        originDeviceId = envelope.originDeviceId,
        receivedRssi = rssi,
        receivedAtEpochMs = now,
        lastForwardAttemptEpochMs = null,
        syncState = MessageSyncState.SYNC_PENDING,
      ),
    )
    // If inserted== -1/0 means existed; ignore duplicates.
    return inserted != -1L && inserted != 0L
  }

  fun shouldForward(envelope: MeshEnvelope): Boolean = envelope.ttl > 0

  fun decrementTtl(envelope: MeshEnvelope): MeshEnvelope =
    envelope.copy(ttl = (envelope.ttl - 1).coerceAtLeast(0), hops = envelope.hops + 1)
}

