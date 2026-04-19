package ai.supplyguard.mesh

import ai.supplyguard.data.MeshEnvelope
import ai.supplyguard.data.MeshMessageType
import ai.supplyguard.data.ResponsePayload
import ai.supplyguard.data.SosPayload
import ai.supplyguard.db.AppDatabase
import ai.supplyguard.db.MessageSyncState
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

class MeshRepository(
  private val db: AppDatabase,
  private val deviceId: String,
) {
  private val dao = db.meshMessageDao()
  private val json = Json { ignoreUnknownKeys = true }
  val router = MeshRouter(dao)

  fun watchSos(): Flow<List<MeshEnvelope>> =
    dao.watchByType(MeshMessageType.SOS.name).map { entities -> entities.map { it.toEnvelope() } }

  fun watchResponses(): Flow<List<MeshEnvelope>> =
    dao.watchByType(MeshMessageType.RESPONSE.name).map { entities -> entities.map { it.toEnvelope() } }

  fun watchAll(): Flow<List<MeshEnvelope>> =
    dao.watchAll().map { entities -> entities.map { it.toEnvelope() } }

  suspend fun createSos(name: String?, locationText: String?, need: String?): MeshEnvelope {
    val payload = json.encodeToString(SosPayload(name, locationText, need))
    val env = MeshEnvelope(
      type = MeshMessageType.SOS,
      timestampEpochMs = System.currentTimeMillis(),
      ttl = 8,
      hops = 0,
      originDeviceId = deviceId,
      payload = payload,
    )
    router.onReceive(env, rssi = null)
    return env
  }

  suspend fun createResponse(targetMessageId: String, message: String): MeshEnvelope {
    val payload = json.encodeToString(ResponsePayload(targetMessageId = targetMessageId, message = message))
    val env = MeshEnvelope(
      type = MeshMessageType.RESPONSE,
      timestampEpochMs = System.currentTimeMillis(),
      ttl = 8,
      hops = 0,
      originDeviceId = deviceId,
      payload = payload,
    )
    router.onReceive(env, rssi = null)
    return env
  }

  suspend fun markSynced(ids: List<String>) {
    dao.setSyncState(ids, MessageSyncState.SYNCED)
  }

  private fun ai.supplyguard.db.MeshMessageEntity.toEnvelope(): MeshEnvelope {
    return MeshEnvelope(
      id = id,
      type = MeshMessageType.valueOf(type),
      timestampEpochMs = timestampEpochMs,
      ttl = ttl,
      hops = hops,
      originDeviceId = originDeviceId,
      payload = payloadJson,
    )
  }
}
