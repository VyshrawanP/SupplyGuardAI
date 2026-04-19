package ai.supplyguard.rescue

import android.app.Application
import ai.supplyguard.db.AppDatabase
import ai.supplyguard.mesh.BleMeshEngine
import ai.supplyguard.mesh.DeviceIdProvider
import ai.supplyguard.mesh.MeshRepository
import ai.supplyguard.work.WorkScheduler

class RescueApp : Application() {
  lateinit var db: AppDatabase
    private set
  lateinit var deviceId: String
    private set
  lateinit var repo: MeshRepository
    private set
  lateinit var ble: BleMeshEngine
    private set

  override fun onCreate() {
    super.onCreate()
    db = AppDatabase.get(this)
    deviceId = DeviceIdProvider(this).getOrCreate()
    repo = MeshRepository(db = db, deviceId = deviceId)
    ble = BleMeshEngine(context = this, db = db, repository = repo).also { it.start() }

    WorkScheduler.scheduleBackendSync(this, baseUrl = "http://10.0.2.2:3000")
  }
}

