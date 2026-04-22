package ai.supplyguard.work

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import ai.supplyguard.db.MeshMessageEntity
import ai.supplyguard.db.AppDatabase
import ai.supplyguard.db.MessageSyncState
import ai.supplyguard.net.ApiMessageDto
import ai.supplyguard.net.BackendClient

/**
 * Syncs locally stored mesh messages to the backend once internet is available.
 *
 * Configure using input Data:
 * - baseUrl: e.g. https://your-domain.com
 */
class BackendSyncWorker(
  appContext: Context,
  params: WorkerParameters,
) : CoroutineWorker(appContext, params) {

  override suspend fun doWork(): Result {
    val baseUrl = inputData.getString("baseUrl") ?: return Result.failure()
    val api = BackendClient.create(baseUrl)
    val db = AppDatabase.get(applicationContext)
    val dao = db.meshMessageDao()
    val prefs = applicationContext.getSharedPreferences("sg_backend_sync", Context.MODE_PRIVATE)
    val lastPullEpochMs = prefs.getLong("last_pull_epoch_ms", 0L)

    return try {
      val batch = dao.loadBySyncState(MessageSyncState.SYNC_PENDING, limit = 50)
      if (batch.isNotEmpty()) {
        val dtos = batch.map {
          ApiMessageDto(
            id = it.id,
            type = it.type,
            payload = it.payloadJson,
            timestampEpochMs = it.timestampEpochMs,
            originDeviceId = it.originDeviceId,
            hops = it.hops,
          )
        }

        api.postMessages(dtos)
        dao.setSyncState(batch.map { it.id }, MessageSyncState.SYNCED)
      }

      // Pull COMMAND messages created by other sources (e.g. web command center).
      val pulled = api.getMessages(type = "COMMAND", sinceEpochMs = lastPullEpochMs, limit = 200)
      if (pulled.isNotEmpty()) {
        val now = System.currentTimeMillis()
        var maxTs = lastPullEpochMs
        for (msg in pulled) {
          maxTs = maxOf(maxTs, msg.timestampEpochMs)
          dao.insertIgnore(
            MeshMessageEntity(
              id = msg.id,
              type = msg.type,
              payloadJson = msg.payload,
              timestampEpochMs = msg.timestampEpochMs,
              ttl = 8,
              hops = msg.hops,
              originDeviceId = msg.originDeviceId,
              receivedRssi = null,
              receivedAtEpochMs = now,
              lastForwardAttemptEpochMs = null,
              syncState = MessageSyncState.SYNCED,
            ),
          )
        }
        prefs.edit().putLong("last_pull_epoch_ms", maxTs).apply()
      }

      Result.success()
    } catch (_: Throwable) {
      Result.retry()
    }
  }
}
