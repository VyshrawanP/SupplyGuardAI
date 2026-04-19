package ai.supplyguard.mesh

import android.content.Context
import android.content.SharedPreferences
import androidx.core.content.edit
import java.util.UUID

class DeviceIdProvider(context: Context) {
  private val prefs: SharedPreferences =
    context.applicationContext.getSharedPreferences("sg_mesh_prefs", Context.MODE_PRIVATE)

  fun getOrCreate(): String {
    val existing = prefs.getString("device_id", null)
    if (!existing.isNullOrBlank()) return existing
    val created = UUID.randomUUID().toString()
    prefs.edit { putString("device_id", created) }
    return created
  }
}

