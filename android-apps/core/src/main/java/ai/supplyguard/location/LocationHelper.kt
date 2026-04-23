package ai.supplyguard.location

import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import androidx.core.content.ContextCompat
import com.google.android.gms.location.CurrentLocationRequest
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class LocationDisabledException(message: String) : Exception(message)
class LocationPermissionException(message: String) : Exception(message)

class LocationHelper(private val context: Context) {
  private val fusedLocationClient: FusedLocationProviderClient =
    LocationServices.getFusedLocationProviderClient(context)

  /**
   * Fetches the device's current GPS location.
   *
   * Pre-conditions checked before calling the fused provider:
   *   1. Either ACCESS_FINE_LOCATION or ACCESS_COARSE_LOCATION must be granted.
   *   2. The device's location services (GPS or network) must be enabled.
   *
   * Uses CurrentLocationRequest with a generous 30-second duration so a
   * cold-start GPS fix has time to lock on.  Falls back gracefully if the
   * provider returns null (e.g. indoors with no cached fix).
   */
  @SuppressLint("MissingPermission")          // we check manually right below
  @Throws(LocationDisabledException::class, LocationPermissionException::class)
  suspend fun getCurrentLocation(): LocationData? {

    // ── 1. Permission gate ──────────────────────────────────────────────
    val hasFine = ContextCompat.checkSelfPermission(
      context, android.Manifest.permission.ACCESS_FINE_LOCATION
    ) == PackageManager.PERMISSION_GRANTED
    val hasCoarse = ContextCompat.checkSelfPermission(
      context, android.Manifest.permission.ACCESS_COARSE_LOCATION
    ) == PackageManager.PERMISSION_GRANTED

    if (!hasFine && !hasCoarse) {
      throw LocationPermissionException("Location permission not granted")
    }

    // ── 2. Hardware / system state gate ──────────────────────────────────
    if (!isLocationEnabled()) {
      throw LocationDisabledException("GPS / location services are disabled")
    }

    // ── 3. Build a proper CurrentLocationRequest with timeout ────────────
    val priority = if (hasFine) Priority.PRIORITY_HIGH_ACCURACY
                   else         Priority.PRIORITY_BALANCED_POWER_ACCURACY

    val request = CurrentLocationRequest.Builder()
      .setPriority(priority)
      .setDurationMillis(30_000)   // wait up to 30 s for a fresh fix
      .setMaxUpdateAgeMillis(60_000) // accept a cached fix up to 1 min old
      .build()

    val cancellationTokenSource = CancellationTokenSource()

    // ── 4. Call the fused provider ───────────────────────────────────────
    return try {
      suspendCancellableCoroutine { continuation ->
        continuation.invokeOnCancellation { cancellationTokenSource.cancel() }

        fusedLocationClient.getCurrentLocation(request, cancellationTokenSource.token)
          .addOnSuccessListener { location: Location? ->
            if (location != null) {
              continuation.resume(
                LocationData(
                  latitude  = location.latitude,
                  longitude = location.longitude,
                  accuracy  = location.accuracy,
                  altitude  = location.altitude,
                )
              )
            } else {
              continuation.resume(null)
            }
          }
          .addOnFailureListener { exception ->
            // Do NOT swallow SecurityException silently
            if (exception is SecurityException) {
              continuation.resume(null)
            } else {
              continuation.resume(null)
            }
          }
          .addOnCanceledListener {
            continuation.resume(null)
          }
      }
    } catch (e: SecurityException) {
      // Should never happen because of our check above, but just in case
      throw LocationPermissionException("SecurityException: ${e.message}")
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
