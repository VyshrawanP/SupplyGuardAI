package ai.supplyguard.rescue

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
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
import ai.supplyguard.data.CommandPayload
import ai.supplyguard.data.CommandPriority
import ai.supplyguard.location.LocationHelper
import ai.supplyguard.work.WorkScheduler
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent { RescueAppRoot() }
  }
}

@Composable
private fun RescueAppRoot() {
  RescueTheme {
    val context = LocalContext.current
    val app = context.applicationContext as RescueApp
    val meshPermissions = remember { requiredMeshPermissions() }
    val locationPermissions = remember { requiredLocationPermissions() }
    val allPermissions = remember { (meshPermissions + locationPermissions).distinct().toTypedArray() }

    var hasMeshPermissions by remember { mutableStateOf(hasAllPermissions(context, meshPermissions)) }
    var hasLocationPermission by remember { mutableStateOf(hasAllPermissions(context, locationPermissions)) }
    val permissionLauncher = rememberLauncherForActivityResult(
      contract = ActivityResultContracts.RequestMultiplePermissions(),
      onResult = {
        hasMeshPermissions = hasAllPermissions(context, meshPermissions)
        hasLocationPermission = hasAllPermissions(context, locationPermissions)
      },
    )

    LaunchedEffect(Unit) {
      if (!hasMeshPermissions || !hasLocationPermission) permissionLauncher.launch(allPermissions)
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
          hasLocationPermission = hasAllPermissions(context, locationPermissions)
        }
      }
      lifecycleOwner.lifecycle.addObserver(observer)
      onDispose {
        lifecycleOwner.lifecycle.removeObserver(observer)
        app.meshEngine.stop()
      }
    }

    val vm: RescueViewModel = viewModel(
      factory = object : ViewModelProvider.Factory {
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
          @Suppress("UNCHECKED_CAST")
          return RescueViewModel(app.repository) as T
        }
      },
    )
    val state by vm.state.collectAsStateWithLifecycle()

    RescueScreen(
      hasMeshPermissions = hasMeshPermissions,
      hasLocationPermission = hasLocationPermission,
      commands = state.commands,
      sos = state.sos,
      onSendResponse = vm::sendResponse,
      onSendLocationBroadcast = vm::sendLocationBroadcast,
      onRequestLocationPermission = { permissionLauncher.launch(allPermissions) },
    )
  }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun RescueScreen(
  hasMeshPermissions: Boolean,
  hasLocationPermission: Boolean,
  commands: List<CommandPayload>,
  sos: List<SosItem>,
  onSendResponse: (String, String, Double?, Double?, Float?) -> Unit,
  onSendLocationBroadcast: (Double, Double, Float?) -> Unit,
  onRequestLocationPermission: () -> Unit,
) {
  val context = LocalContext.current
  val scope = rememberCoroutineScope()
  val locationHelper = remember { LocationHelper(context) }

  var syncLabel by remember { mutableStateOf<String?>(null) }
  var activeRespondTarget by remember { mutableStateOf<SosItem?>(null) }
  var responseMessage by remember { mutableStateOf("") }
  var isGettingLocation by remember { mutableStateOf(false) }
  var isGettingShareLocation by remember { mutableStateOf(false) }
  var currentLatitude by remember { mutableStateOf<Double?>(null) }
  var currentLongitude by remember { mutableStateOf<Double?>(null) }
  var currentAccuracyMeters by remember { mutableStateOf<Float?>(null) }
  var locationStatus by remember { mutableStateOf("") }
  var shareLocationStatus by remember { mutableStateOf("") }

  // Response dialog
  if (activeRespondTarget != null) {
    AlertDialog(
      onDismissRequest = {
        activeRespondTarget = null
        currentLatitude = null
        currentLongitude = null
        currentAccuracyMeters = null
        locationStatus = ""
      },
      title = { Text("Send Response") },
      text = {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
          OutlinedTextField(
            value = responseMessage,
            onValueChange = { responseMessage = it },
            label = { Text("Message") },
            modifier = Modifier.fillMaxWidth(),
            minLines = 2,
          )
          Button(
            onClick = {
              isGettingLocation = true
              scope.launch {
                val locationData = locationHelper.getCurrentLocation()
                if (locationData != null) {
                  currentLatitude = locationData.latitude
                  currentLongitude = locationData.longitude
                  currentAccuracyMeters = locationData.accuracy
                  locationStatus = "📍 Attached: ${locationHelper.formatCoordinates(locationData)}"
                } else {
                  locationStatus = "Could not get GPS location"
                }
                isGettingLocation = false
              }
            },
            enabled = hasLocationPermission && !isGettingLocation,
            modifier = Modifier.fillMaxWidth(),
          ) {
            Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(6.dp))
            Text(if (isGettingLocation) "Getting GPS…" else "Attach My Location")
          }
          if (locationStatus.isNotEmpty()) {
            Text(
              locationStatus,
              style = MaterialTheme.typography.labelSmall,
              color = if (currentLatitude != null) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
            )
          }
        }
      },
      confirmButton = {
        TextButton(
          enabled = hasMeshPermissions && responseMessage.isNotBlank(),
          onClick = {
            val target = activeRespondTarget ?: return@TextButton
            onSendResponse(
              target.envelope.id,
              responseMessage.trim(),
              currentLatitude,
              currentLongitude,
              currentAccuracyMeters,
            )
            responseMessage = ""
            currentLatitude = null
            currentLongitude = null
            currentAccuracyMeters = null
            locationStatus = ""
            activeRespondTarget = null
          },
        ) { Text("Send") }
      },
      dismissButton = {
        TextButton(onClick = {
          activeRespondTarget = null
          currentLatitude = null
          currentLongitude = null
          currentAccuracyMeters = null
          locationStatus = ""
        }) { Text("Cancel") }
      },
    )
  }

  Scaffold(
    topBar = {
      TopAppBar(
        title = {
          Column {
            Text("SupplyGuard", style = MaterialTheme.typography.labelSmall)
            Text("Rescue", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
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

      // Share My Location — standalone prominent card
      item {
        Card(
          colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
          modifier = Modifier.fillMaxWidth(),
        ) {
          Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
              Icon(Icons.Default.LocationOn, contentDescription = null,
                tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(22.dp))
              Text(
                "Share My Location",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
              )
            }
            Text(
              "Broadcast your current GPS coordinates to command center and nearby devices.",
              style = MaterialTheme.typography.bodySmall,
              color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f),
            )

            // Show last shared location if available
            if (shareLocationStatus.isNotEmpty()) {
              Text(
                shareLocationStatus,
                style = MaterialTheme.typography.labelSmall,
                color = if (shareLocationStatus.startsWith("📍"))
                  MaterialTheme.colorScheme.primary
                else
                  MaterialTheme.colorScheme.error,
              )
            }

            Button(
              onClick = {
                if (!hasLocationPermission) {
                  onRequestLocationPermission()
                  return@Button
                }
                isGettingShareLocation = true
                scope.launch {
                  val locationData = locationHelper.getCurrentLocation()
                  if (locationData != null) {
                    onSendLocationBroadcast(locationData.latitude, locationData.longitude, locationData.accuracy)
                    shareLocationStatus = "📍 Sent: Lat ${String.format("%.6f", locationData.latitude)}, " +
                      "Lon ${String.format("%.6f", locationData.longitude)}" +
                      (locationData.accuracy.takeIf { it > 0 }?.let { " (±${String.format("%.0f", it)}m)" } ?: "")
                  } else {
                    shareLocationStatus = "Could not get GPS location. Is GPS enabled?"
                  }
                  isGettingShareLocation = false
                }
              },
              enabled = hasMeshPermissions && !isGettingShareLocation,
              modifier = Modifier.fillMaxWidth(),
              colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary,
              ),
            ) {
              Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(18.dp))
              Spacer(Modifier.width(6.dp))
              Text(
                if (isGettingShareLocation) "Getting GPS…" else "Send My Location Now",
                fontWeight = FontWeight.SemiBold,
              )
            }
          }
        }
      }

      // Command Center Updates
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
        item { Text("No updates received yet.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant) }
      } else {
        items(commands) { cmd -> CommandCard(cmd) }
      }

      // Incoming SOS
      item {
        Row(
          modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
          Text("Incoming SOS", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
          if (sos.isNotEmpty()) {
            Badge(containerColor = MaterialTheme.colorScheme.error) {
              Text("${sos.size}", color = MaterialTheme.colorScheme.onError)
            }
          }
        }
      }

      if (sos.isEmpty()) {
        item { Text("No SOS received yet.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant) }
      } else {
        items(sos) { item ->
          SosCard(item = item, hasMeshPermissions = hasMeshPermissions, onRespond = { activeRespondTarget = item })
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
      Text(payload.priority.name, style = MaterialTheme.typography.labelSmall, color = contentColor.copy(alpha = 0.7f))
    }
  }
}

@Composable
private fun SosCard(item: SosItem, hasMeshPermissions: Boolean, onRespond: () -> Unit) {
  val title = item.payload?.name?.takeIf { it.isNotBlank() } ?: "SOS"
  val location = item.payload?.locationText?.takeIf { it.isNotBlank() } ?: "Unknown location"
  val need = item.payload?.need?.takeIf { it.isNotBlank() } ?: "No details provided"
  val hasCoordinates = item.payload?.latitude != null && item.payload?.longitude != null

  Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)) {
    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
      Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        Icon(Icons.Default.Warning, contentDescription = null,
          tint = MaterialTheme.colorScheme.onErrorContainer, modifier = Modifier.size(18.dp))
        Text(title, style = MaterialTheme.typography.titleSmall,
          color = MaterialTheme.colorScheme.onErrorContainer, fontWeight = FontWeight.Bold)
      }
      Text(location, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onErrorContainer)

      if (hasCoordinates) {
        Card(
          colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
          modifier = Modifier.fillMaxWidth(),
        ) {
          Row(
            modifier = Modifier.padding(10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
          ) {
            Icon(Icons.Default.LocationOn, contentDescription = null,
              tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp))
            Column {
              Text("GPS Location", style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold)
              Text(
                "Lat: ${String.format("%.6f", item.payload?.latitude)}, Lon: ${String.format("%.6f", item.payload?.longitude)}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
              )
              if (item.payload?.accuracyMeters != null) {
                Text(
                  "Accuracy: ±${String.format("%.0f", item.payload.accuracyMeters)}m",
                  style = MaterialTheme.typography.labelSmall,
                  color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f),
                )
              }
            }
          }
        }
      }

      Text(need, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onErrorContainer)
      Button(
        onClick = onRespond,
        enabled = hasMeshPermissions,
        modifier = Modifier.fillMaxWidth(),
        colors = ButtonDefaults.buttonColors(
          containerColor = MaterialTheme.colorScheme.primary,
          contentColor = MaterialTheme.colorScheme.onPrimary,
        ),
      ) {
        Text("Send Response", fontWeight = FontWeight.SemiBold)
      }
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
    )
  } else if (Build.VERSION.SDK_INT >= 31) {
    arrayOf(
      Manifest.permission.BLUETOOTH_SCAN,
      Manifest.permission.BLUETOOTH_CONNECT,
      Manifest.permission.BLUETOOTH_ADVERTISE,
    )
  } else {
    arrayOf(
      Manifest.permission.BLUETOOTH,
      Manifest.permission.BLUETOOTH_ADMIN,
    )
  }
}

private fun requiredLocationPermissions(): Array<String> {
  return arrayOf(Manifest.permission.ACCESS_FINE_LOCATION)
}

private fun hasAllPermissions(context: android.content.Context, permissions: Array<String>): Boolean {
  return permissions.all {
    ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED
  }
}
