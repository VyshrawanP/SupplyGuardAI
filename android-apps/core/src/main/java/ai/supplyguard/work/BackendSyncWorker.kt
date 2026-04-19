package ai.supplyguard.work

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
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

    return try {
      val batch = dao.loadBySyncState(MessageSyncState.SYNC_PENDING, limit = 50)
      if (batch.isEmpty()) return Result.success()

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
      Result.success()
    } catch (_: Throwable) {
      Result.retry()
    }
  }
}

