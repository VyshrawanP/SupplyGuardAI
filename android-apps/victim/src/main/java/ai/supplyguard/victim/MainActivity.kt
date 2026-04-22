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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.activity.compose.rememberLauncherForActivityResult
import ai.supplyguard.data.CommandPayload
import ai.supplyguard.data.CommandPriority
import ai.supplyguard.work.WorkScheduler

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent { VictimAppRoot() }
  }
}

@Composable
private fun VictimAppRoot() {
  MaterialTheme {
    val context = LocalContext.current
    val app = context.applicationContext as VictimApp
    val permissions = remember { requiredPermissions() }

    var hasPermissions by remember { mutableStateOf(hasAllPermissions(context, permissions)) }
    val permissionLauncher = rememberLauncherForActivityResult(
      contract = ActivityResultContracts.RequestMultiplePermissions(),
      onResult = { result -> hasPermissions = result.values.all { it } },
    )

    LaunchedEffect(Unit) {
      if (!hasPermissions) permissionLauncher.launch(permissions)
    }

    LaunchedEffect(hasPermissions) {
      if (hasPermissions) app.meshEngine.start() else app.meshEngine.stop()
    }

    DisposableEffect(Unit) {
      onDispose { app.meshEngine.stop() }
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
      hasPermissions = hasPermissions,
      commands = state.commands,
      onSendSos = vm::sendSos,
    )
  }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun VictimScreen(
  hasPermissions: Boolean,
  commands: List<CommandPayload>,
  onSendSos: (String?, String?, String?) -> Unit,
) {
  val context = LocalContext.current
  var syncLabel by remember { mutableStateOf<String?>(null) }
  var name by remember { mutableStateOf("") }
  var location by remember { mutableStateOf("") }
  var need by remember { mutableStateOf("") }

  Scaffold(
    topBar = { TopAppBar(title = { Text("SupplyGuard Victim") }) },
  ) { padding ->
    Column(
      modifier = Modifier
        .fillMaxSize()
        .padding(padding)
        .padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
      if (!hasPermissions) {
        Text(
          text = "Bluetooth permissions are required to run offline mesh messaging.",
          color = MaterialTheme.colorScheme.error,
        )
      }

      Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
        TextButton(
          onClick = {
            WorkScheduler.enqueueBackendSyncNow(context, BuildConfig.BACKEND_BASE_URL)
            syncLabel = "Sync requested"
          },
        ) { Text("Sync now") }
      }
      if (syncLabel != null) {
        Text(syncLabel!!, style = MaterialTheme.typography.labelSmall)
      }

      Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
          Text("Send SOS", style = MaterialTheme.typography.titleMedium)
          OutlinedTextField(
            value = name,
            onValueChange = { name = it },
            label = { Text("Name (optional)") },
            modifier = Modifier.fillMaxWidth(),
          )
          OutlinedTextField(
            value = location,
            onValueChange = { location = it },
            label = { Text("Location (optional)") },
            modifier = Modifier.fillMaxWidth(),
          )
          OutlinedTextField(
            value = need,
            onValueChange = { need = it },
            label = { Text("Need (optional)") },
            modifier = Modifier.fillMaxWidth(),
          )
          Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
            Button(onClick = { onSendSos(name, location, need) }, enabled = hasPermissions) {
              Text("SEND SOS")
            }
          }
        }
      }

      Text("Command Center Updates", style = MaterialTheme.typography.titleMedium)
      LazyColumn(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp),
      ) {
        if (commands.isEmpty()) {
          item { Text("No updates received yet.") }
        } else {
          items(commands) { cmd ->
            CommandCard(cmd)
          }
        }
        item { Spacer(Modifier.height(8.dp)) }
      }
    }
  }
}

@Composable
private fun CommandCard(payload: CommandPayload) {
  val tone = when (payload.priority) {
    CommandPriority.INFO -> MaterialTheme.colorScheme.surfaceVariant
    CommandPriority.WARNING -> MaterialTheme.colorScheme.tertiaryContainer
    CommandPriority.CRITICAL -> MaterialTheme.colorScheme.errorContainer
  }

  Card(colors = CardDefaults.cardColors(containerColor = tone)) {
    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
      Text(payload.title ?: "Update", style = MaterialTheme.typography.titleSmall)
      Text(payload.message, style = MaterialTheme.typography.bodyMedium)
      Text(payload.priority.name, style = MaterialTheme.typography.labelSmall)
    }
  }
}

private fun requiredPermissions(): Array<String> {
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
      Manifest.permission.ACCESS_FINE_LOCATION,
      Manifest.permission.BLUETOOTH,
      Manifest.permission.BLUETOOTH_ADMIN,
    )
  }
}

private fun hasAllPermissions(activity: android.content.Context, permissions: Array<String>): Boolean {
  return permissions.all {
    ContextCompat.checkSelfPermission(activity, it) == PackageManager.PERMISSION_GRANTED
  }
}
