package ai.supplyguard.commandcenter

import android.app.Application
import ai.supplyguard.db.AppDatabase
import ai.supplyguard.mesh.BleMeshEngine
import ai.supplyguard.mesh.DeviceIdProvider
import ai.supplyguard.mesh.MeshRepository
import ai.supplyguard.work.WorkScheduler

class CommandCenterApp : Application() {
  lateinit var db: AppDatabase
    private set

  lateinit var repository: MeshRepository
    private set

  lateinit var meshEngine: BleMeshEngine
    private set

  override fun onCreate() {
    super.onCreate()
    db = AppDatabase.get(this)
    val deviceId = DeviceIdProvider(this).getOrCreate()
    repository = MeshRepository(db = db, deviceId = deviceId)
    meshEngine = BleMeshEngine(context = this, db = db, repository = repository)

    WorkScheduler.enqueueBackendSyncNow(this, BuildConfig.BACKEND_BASE_URL)
    WorkScheduler.scheduleBackendSync(this, BuildConfig.BACKEND_BASE_URL)
  }
}
