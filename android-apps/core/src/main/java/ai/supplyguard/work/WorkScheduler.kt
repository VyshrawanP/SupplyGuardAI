package ai.supplyguard.work

import android.content.Context
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.workDataOf
import java.util.concurrent.TimeUnit

object WorkScheduler {
  fun enqueueBackendSyncNow(context: Context, baseUrl: String) {
    val constraints = Constraints.Builder()
      .setRequiredNetworkType(NetworkType.CONNECTED)
      .build()

    val request = OneTimeWorkRequestBuilder<BackendSyncWorker>()
      .setConstraints(constraints)
      .setInputData(workDataOf("baseUrl" to baseUrl))
      .build()

    WorkManager.getInstance(context).enqueue(request)
  }

  fun scheduleBackendSync(context: Context, baseUrl: String) {
    val constraints = Constraints.Builder()
      .setRequiredNetworkType(NetworkType.CONNECTED)
      .build()

    val request = PeriodicWorkRequestBuilder<BackendSyncWorker>(15, TimeUnit.MINUTES)
      .setConstraints(constraints)
      .setInputData(workDataOf("baseUrl" to baseUrl))
      .build()

    WorkManager.getInstance(context)
      .enqueueUniquePeriodicWork("sg_backend_sync", ExistingPeriodicWorkPolicy.UPDATE, request)
  }
}
