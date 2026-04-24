package ai.supplyguard.victim

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Badge
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.activity.compose.rememberLauncherForActivityResult
import ai.supplyguard.data.CommandPayload
import ai.supplyguard.data.CommandPriority
import ai.supplyguard.data.SosPayload
import ai.supplyguard.location.LocationDisabledException
import ai.supplyguard.location.LocationHelper
import ai.supplyguard.permissions.PermissionManager
import ai.supplyguard.work.WorkScheduler
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent { VictimAppRoot() }
  }
}

@Composable
private fun VictimAppRoot() {
  VictimTheme {
    val context = LocalContext.current
    val app = context.applicationContext as VictimApp
    val meshPermissions = remember { requiredMeshPermissions() }
    
    var hasMeshPermissions by remember { mutableStateOf(hasAllPermissions(context, meshPermissions)) }

    val meshPermissionLauncher = rememberLauncherForActivityResult(
      contract = ActivityResultContracts.RequestMultiplePermissions(),
      onResult = {
        hasMeshPermissions = hasAllPermissions(context, meshPermissions)
      },
    )

    LaunchedEffect(Unit) {
      if (!hasMeshPermissions) {
        meshPermissionLauncher.launch(meshPermissions)
      }
    }

    LaunchedEffect(hasMeshPermissions) {
      if (hasMeshPermissions) app.meshEngine.start() else app.meshEngine.stop()
    }

    // Re-check permissions every time the app resumes (covers returning from Settings)
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
      val observer = LifecycleEventObserver { _, event ->
        if (event == Lifecycle.Event.ON_RESUME) {
          hasMeshPermissions = hasAllPermissions(context, meshPermissions)
        }
      }
      lifecycleOwner.lifecycle.addObserver(observer)
      onDispose {
        lifecycleOwner.lifecycle.removeObserver(observer)
        app.meshEngine.stop()
      }
    }

    val vm: VictimViewModel = viewModel(
      factory = object : ViewModelProvider.Factory {
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
          @Suppress("UNCHECKED_CAST")
          return VictimViewModel(app.repository) as T
        }
      },
    )

    val state by vm.state.collectAsStateWithLifecycle()
    VictimScreen(
      hasMeshPermissions = hasMeshPermissions,
      commands = state.commands,
      onSendSos = vm::sendSos,
    )
  }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun VictimScreen(
  hasMeshPermissions: Boolean,
  commands: List<CommandPayload>,
  onSendSos: (String?, String?, String?, Double?, Double?, Float?) -> Unit,
) {
  val context = LocalContext.current
  val activity = context as? android.app.Activity
  val scope = rememberCoroutineScope()
  val locationHelper = remember { LocationHelper(context) }

  var hasLocationPermission by remember { mutableStateOf(PermissionManager.isLocationGranted(context)) }
  var showLocationRationale by remember { mutableStateOf(false) }
  var showSettingsRedirect by remember { mutableStateOf(false) }

  val locationPermissionLauncher = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.RequestMultiplePermissions(),
  ) { result ->
    val granted = result.values.any { it }
    hasLocationPermission = granted
    if (!granted && activity != null) {
      if (!PermissionManager.shouldShowLocationRationale(activity)) {
        showSettingsRedirect = true
      }
    }
  }

  // Update permission state when resuming from settings
  val lifecycleOwner = LocalLifecycleOwner.current
  DisposableEffect(lifecycleOwner) {
    val observer = LifecycleEventObserver { _, event ->
      if (event == Lifecycle.Event.ON_RESUME) {
        hasLocationPermission = PermissionManager.isLocationGranted(context)
      }
    }
    lifecycleOwner.lifecycle.addObserver(observer)
    onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
  }

  var syncLabel by remember { mutableStateOf<String?>(null) }
  var name by remember { mutableStateOf("") }
  var location by remember { mutableStateOf("") }
  var need by remember { mutableStateOf("") }
  var currentLatitude by remember { mutableStateOf<Double?>(null) }
  var currentLongitude by remember { mutableStateOf<Double?>(null) }
  var currentAccuracyMeters by remember { mutableStateOf<Float?>(null) }
  var locationStatus by remember { mutableStateOf("") }
  var isGettingLocation by remember { mutableStateOf(false) }

  if (showLocationRationale) {
    AlertDialog(
      onDismissRequest = { showLocationRationale = false },
      title = { Text("Location Permission Required") },
      text = { Text("We need your location to accurately report your position during an SOS.") },
      confirmButton = {
        Button(onClick = {
          showLocationRationale = false
          locationPermissionLauncher.launch(requiredLocationPermissions())
        }) { Text("Allow") }
      },
      dismissButton = {
        Button(onClick = { showLocationRationale = false }) { Text("Cancel") }
      }
    )
  }

  if (showSettingsRedirect) {
    AlertDialog(
      onDismissRequest = { showSettingsRedirect = false },
      title = { Text("Permission Denied") },
      text = { Text("Location permission is permanently denied. Please enable it in App Settings to use this feature.") },
      confirmButton = {
        Button(onClick = {
          showSettingsRedirect = false
          PermissionManager.openAppSettings(context)
        }) { Text("Open Settings") }
      },
      dismissButton = {
        Button(onClick = { showSettingsRedirect = false }) { Text("Cancel") }
      }
    )
  }

  Scaffold(
    topBar = {
      TopAppBar(
        title = {
          Column {
            Text("SupplyGuard", style = MaterialTheme.typography.labelSmall)
            Text("Victim", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
          }
        },
        colors = TopAppBarDefaults.topAppBarColors(
          containerColor = MaterialTheme.colorScheme.surface,
          titleContentColor = MaterialTheme.colorScheme.onSurface,
        ),
        actions = {
          TextButton(
            onClick = {
              WorkScheduler.enqueueBackendSyncNow(context, BuildConfig.BACKEND_BASE_URL)
              syncLabel = "Sync requested"
            },
          ) { Text("Sync") }
        },
      )
    },
  ) { padding ->
    LazyColumn(
      modifier = Modifier
        .fillMaxSize()
        .padding(padding)
        .padding(horizontal = 16.dp),
      verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
      item { Spacer(Modifier.height(4.dp)) }

      if (syncLabel != null) {
        item {
          Text(syncLabel!!, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
        }
      }

      if (!hasMeshPermissions) {
        item {
          Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
            modifier = Modifier.fillMaxWidth(),
          ) {
            Row(
              modifier = Modifier.padding(12.dp),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
              Icon(Icons.Default.Warning, contentDescription = null, tint = MaterialTheme.colorScheme.onErrorContainer)
              Text(
                text = "Bluetooth permissions required for offline mesh messaging.",
                color = MaterialTheme.colorScheme.onErrorContainer,
                style = MaterialTheme.typography.bodySmall,
              )
            }
          }
        }
      }

      // SOS Compose Card
      item {
        Card(
          colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
          modifier = Modifier.fillMaxWidth(),
        ) {
          Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
              Icon(
                Icons.Default.Warning,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.error,
                modifier = Modifier.size(22.dp),
              )
              Text("Send SOS", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            }

            OutlinedTextField(
              value = name,
              onValueChange = { name = it },
              label = { Text("Your Name (optional)") },
              modifier = Modifier.fillMaxWidth(),
              singleLine = true,
            )

            OutlinedTextField(
              value = location,
              onValueChange = { location = it },
              label = { Text("Location Description (optional)") },
              modifier = Modifier.fillMaxWidth(),
              singleLine = true,
            )

            // GPS location status chip
            if (currentLatitude != null && currentLongitude != null) {
              Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                modifier = Modifier.fillMaxWidth(),
              ) {
                Row(
                  modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                  verticalAlignment = Alignment.CenterVertically,
                  horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                  Icon(Icons.Default.LocationOn, contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
                  Column {
                    Text(
                      "GPS Acquired",
                      style = MaterialTheme.typography.labelMedium,
                      color = MaterialTheme.colorScheme.primary,
                      fontWeight = FontWeight.SemiBold,
                    )
                    Text(
                      "Lat: ${String.format("%.6f", currentLatitude)}, Lon: ${String.format("%.6f", currentLongitude)}" +
                        currentAccuracyMeters?.let { " (±${String.format("%.0f", it)}m)" }.orEmpty(),
                      style = MaterialTheme.typography.labelSmall,
                      color = MaterialTheme.colorScheme.onPrimaryContainer,
                    )
                  }
                }
              }
            } else if (locationStatus.isNotEmpty()) {
              Text(
                text = locationStatus,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.error,
              )
            }

            OutlinedTextField(
              value = need,
              onValueChange = { need = it },
              label = { Text("Describe your need (optional)") },
              modifier = Modifier.fillMaxWidth(),
              minLines = 2,
            )

            // Get Location button — tapping while disabled re-requests permission
            Button(
              onClick = {
                if (!hasLocationPermission) {
                  if (activity != null && PermissionManager.shouldShowLocationRationale(activity)) {
                    showLocationRationale = true
                  } else {
                    locationPermissionLauncher.launch(requiredLocationPermissions())
                  }
                  return@Button
                }
                
                if (!locationHelper.isLocationEnabled()) {
                  PermissionManager.openLocationSettings(context)
                  return@Button
                }

                isGettingLocation = true
                scope.launch {
                  try {
                    val locationData = locationHelper.getCurrentLocation()
                    if (locationData != null) {
                      currentLatitude = locationData.latitude
                      currentLongitude = locationData.longitude
                      currentAccuracyMeters = locationData.accuracy
                      val locStr = locationHelper.formatLocation(locationData.latitude, locationData.longitude)
                      location = if (location.isNotBlank()) "$location - $locStr" else locStr
                      
                      // Auto-ping the command center immediately
                      onSendSos(name, location, need, currentLatitude, currentLongitude, currentAccuracyMeters)
                      
                      // Clear the form to indicate success
                      name = ""
                      location = ""
                      need = ""
                      currentLatitude = null
                      currentLongitude = null
                      currentAccuracyMeters = null
                      locationStatus = "Auto-pinged SOS with location!"
                    } else {
                      locationStatus = "Could not get GPS location."
                    }
                  } catch (e: LocationDisabledException) {
                    locationStatus = "GPS is turned off."
                    PermissionManager.openLocationSettings(context)
                  } catch (e: ai.supplyguard.location.LocationPermissionException) {
                    locationStatus = "Location permission not granted."
                    showSettingsRedirect = true
                  } catch (e: Exception) {
                    locationStatus = "Failed to get location."
                  } finally {
                    isGettingLocation = false
                  }
                }
              },
              enabled = !isGettingLocation,
              modifier = Modifier.fillMaxWidth(),
              colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.secondaryContainer,
                contentColor = MaterialTheme.colorScheme.onSecondaryContainer,
              ),
            ) {
              Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(18.dp))
              Spacer(Modifier.width(6.dp))
              Text(if (isGettingLocation) "Getting GPS Location…" else "Get My GPS Location")
            }

            // SOS SEND button — prominent, full-width, error-colored
            Button(
              onClick = {
                onSendSos(name, location, need, currentLatitude, currentLongitude, currentAccuracyMeters)
                name = ""
                location = ""
                need = ""
                currentLatitude = null
                currentLongitude = null
                currentAccuracyMeters = null
                locationStatus = ""
              },
              enabled = hasMeshPermissions,
              modifier = Modifier.fillMaxWidth().height(56.dp),
              colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.error,
                contentColor = MaterialTheme.colorScheme.onError,
                disabledContainerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.5f),
                disabledContentColor = MaterialTheme.colorScheme.onErrorContainer.copy(alpha = 0.5f),
              ),
            ) {
              Icon(Icons.Default.Warning, contentDescription = null, modifier = Modifier.size(20.dp))
              Spacer(Modifier.width(8.dp))
              Text(
                "SEND SOS",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.ExtraBold,
              )
            }
          }
        }
      }

      // Command center updates header
      item {
        Row(
          modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
          Text("Command Center Updates", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
          if (commands.isNotEmpty()) {
            Badge(containerColor = MaterialTheme.colorScheme.primary) {
              Text("${commands.size}", color = MaterialTheme.colorScheme.onPrimary)
            }
          }
        }
      }

      if (commands.isEmpty()) {
        item {
          Text(
            "No updates received yet.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
          )
        }
      } else {
        items(commands) { cmd ->
          CommandCard(cmd)
        }
      }

      item { Spacer(Modifier.height(16.dp)) }
    }
  }
}

@Composable
private fun CommandCard(payload: CommandPayload) {
  val (containerColor, contentColor) = when (payload.priority) {
    CommandPriority.INFO     -> MaterialTheme.colorScheme.surfaceVariant to MaterialTheme.colorScheme.onSurfaceVariant
    CommandPriority.WARNING  -> MaterialTheme.colorScheme.tertiaryContainer to MaterialTheme.colorScheme.onTertiaryContainer
    CommandPriority.CRITICAL -> MaterialTheme.colorScheme.errorContainer to MaterialTheme.colorScheme.onErrorContainer
  }

  Card(colors = CardDefaults.cardColors(containerColor = containerColor)) {
    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
      Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        if (payload.priority == CommandPriority.CRITICAL) {
          Icon(Icons.Default.Warning, contentDescription = null, tint = contentColor, modifier = Modifier.size(16.dp))
        }
        Text(payload.title ?: "Update", style = MaterialTheme.typography.titleSmall, color = contentColor, fontWeight = FontWeight.SemiBold)
      }
      Text(payload.message, style = MaterialTheme.typography.bodyMedium, color = contentColor)
      if (payload.latitude != null && payload.longitude != null) {
        val accuracy = payload.accuracyMeters?.let { " (±${String.format("%.0f", it)}m)" } ?: ""
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
          Icon(Icons.Default.LocationOn, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(14.dp))
          Text(
            "Lat: ${String.format("%.6f", payload.latitude)}, Lon: ${String.format("%.6f", payload.longitude)}$accuracy",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.primary,
          )
        }
      }
      Text(
        payload.priority.name,
        style = MaterialTheme.typography.labelSmall,
        color = contentColor.copy(alpha = 0.7f),
      )
    }
  }
}

private fun requiredMeshPermissions(): Array<String> {
  return if (Build.VERSION.SDK_INT >= 33) {
    arrayOf(
      Manifest.permission.POST_NOTIFICATIONS,
      Manifest.permission.BLUETOOTH_SCAN,
      Manifest.permission.BLUETOOTH_CONNECT,
      Manifest.permission.BLUETOOTH_ADVERTISE,
      Manifest.permission.ACCESS_FINE_LOCATION,
      Manifest.permission.ACCESS_COARSE_LOCATION,
    )
  } else if (Build.VERSION.SDK_INT >= 31) {
    arrayOf(
      Manifest.permission.BLUETOOTH_SCAN,
      Manifest.permission.BLUETOOTH_CONNECT,
      Manifest.permission.BLUETOOTH_ADVERTISE,
      Manifest.permission.ACCESS_FINE_LOCATION,
      Manifest.permission.ACCESS_COARSE_LOCATION,
    )
  } else {
    arrayOf(
      Manifest.permission.ACCESS_FINE_LOCATION,
      Manifest.permission.ACCESS_COARSE_LOCATION,
      Manifest.permission.BLUETOOTH,
      Manifest.permission.BLUETOOTH_ADMIN,
    )
  }
}

private fun requiredLocationPermissions(): Array<String> {
  return arrayOf(
    Manifest.permission.ACCESS_FINE_LOCATION,
    Manifest.permission.ACCESS_COARSE_LOCATION
  )
}

private fun hasAllPermissions(activity: android.content.Context, permissions: Array<String>): Boolean {
  return permissions.all {
    ContextCompat.checkSelfPermission(activity, it) == PackageManager.PERMISSION_GRANTED
  }
}
