package ai.supplyguard.location

import android.content.Context
import android.location.Location
import android.location.LocationManager
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class LocationHelper(private val context: Context) {
  private val fusedLocationClient: FusedLocationProviderClient =
    LocationServices.getFusedLocationProviderClient(context)

  suspend fun getCurrentLocation(): LocationData? {
    if (!isLocationEnabled()) return null
    return try {
      suspendCancellableCoroutine { continuation ->
        val priority = Priority.PRIORITY_HIGH_ACCURACY
        val token = CancellationTokenSource().token

        fusedLocationClient.getCurrentLocation(priority, token)
          .addOnSuccessListener { location: Location? ->
            if (location != null) {
              continuation.resume(
                LocationData(
                  latitude = location.latitude,
                  longitude = location.longitude,
                  accuracy = location.accuracy,
                  altitude = location.altitude,
                )
              )
            } else {
              continuation.resume(null)
            }
          }
          .addOnFailureListener { exception ->
            continuation.resume(null)
          }
          .addOnCanceledListener {
            continuation.resume(null)
          }
      }
    } catch (e: Exception) {
      null
    }
  }

  fun isLocationEnabled(): Boolean {
    val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    return locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
      locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
  }

  fun formatLocation(latitude: Double, longitude: Double): String {
    return String.format("%.4f, %.4f", latitude, longitude)
  }

  fun formatCoordinates(location: LocationData): String {
    val coords = formatLocation(location.latitude, location.longitude)
    val accuracy = if (location.accuracy > 0f) String.format(" (±%.0fm)", location.accuracy) else ""
    return coords + accuracy
  }
}

data class LocationData(
  val latitude: Double,
  val longitude: Double,
  val accuracy: Float = 0f,
  val altitude: Double = 0.0,
)
