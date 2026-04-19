package ai.supplyguard.rescue

import android.os.Bundle
import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.compose.rememberLauncherForActivityResult
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
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import ai.supplyguard.data.MeshEnvelope
import ai.supplyguard.data.SosPayload
import ai.supplyguard.rescue.ui.RescueViewModel
import androidx.core.content.ContextCompat
import kotlinx.serialization.json.Json

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent {
      MaterialTheme {
        BlePermissionGate {
          RescueScreen()
        }
      }
    }
  }
}

@Composable
private fun BlePermissionGate(content: @Composable () -> Unit) {
  val permissions = remember {
    if (Build.VERSION.SDK_INT >= 31) {
      arrayOf(
        Manifest.permission.BLUETOOTH_SCAN,
        Manifest.permission.BLUETOOTH_CONNECT,
        Manifest.permission.BLUETOOTH_ADVERTISE,
      )
    } else {
      arrayOf(
        Manifest.permission.ACCESS_FINE_LOCATION,
      )
    }
  }

  var granted by remember { mutableStateOf(false) }
  val context = LocalContext.current

  val launcher = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.RequestMultiplePermissions(),
  ) { results ->
    granted = results.values.all { it }
  }

  val allGrantedNow = permissions.all { perm ->
    ContextCompat.checkSelfPermission(context, perm) == PackageManager.PERMISSION_GRANTED
  }

  granted = granted || allGrantedNow

  if (granted) {
    content()
  } else {
    Scaffold(
      topBar = { TopAppBar(title = { Text("Permissions") }) },
    ) { padding ->
      Column(
        modifier = Modifier
          .fillMaxSize()
          .padding(padding)
          .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
      ) {
        Text("Bluetooth permissions are required to receive SOS over the offline mesh.")
        Button(onClick = { launcher.launch(permissions) }) {
          Text("Grant permissions")
        }
      }
    }
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun RescueScreen(vm: RescueViewModel = viewModel()) {
  val sosList by vm.sos.collectAsState()
  var respondingTo by remember { mutableStateOf<MeshEnvelope?>(null) }

  Scaffold(
    topBar = { TopAppBar(title = { Text("Rescue Team") }) },
  ) { padding ->
    Column(
      modifier = Modifier
        .fillMaxSize()
        .padding(padding)
        .padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
      Text("Incoming SOS", style = MaterialTheme.typography.titleMedium)
      Card {
        LazyColumn(
          modifier = Modifier
            .fillMaxWidth()
            .height(520.dp)
            .padding(8.dp),
          verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
          items(sosList, key = { it.id }) { env ->
            SosRow(env = env, onRespond = { respondingTo = env })
          }
        }
      }
    }

    if (respondingTo != null) {
      RespondDialog(
        env = respondingTo!!,
        onDismiss = { respondingTo = null },
        onSend = { msg ->
          vm.sendResponse(targetMessageId = respondingTo!!.id, message = msg)
          respondingTo = null
        },
      )
    }
  }
}

@Composable
private fun SosRow(env: MeshEnvelope, onRespond: () -> Unit) {
  val json = remember { Json { ignoreUnknownKeys = true } }
  val payload = remember(env.payload) {
    runCatching { json.decodeFromString(SosPayload.serializer(), env.payload) }.getOrNull()
  }

  Card {
    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
      Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text("SOS ${env.id.take(8)}", style = MaterialTheme.typography.titleSmall)
        Text("hops ${env.hops} ttl ${env.ttl}", style = MaterialTheme.typography.bodySmall)
      }
      Text(
        payload?.need ?: "Need help",
        style = MaterialTheme.typography.bodyMedium,
      )
      Text(
        listOfNotNull(payload?.name?.takeIf { it.isNotBlank() }, payload?.locationText?.takeIf { it.isNotBlank() })
          .joinToString(" • ")
          .ifEmpty { "Unknown identity/location" },
        style = MaterialTheme.typography.bodySmall,
      )
      Spacer(modifier = Modifier.height(4.dp))
      Button(onClick = onRespond) { Text("Send Response") }
    }
  }
}

@Composable
private fun RespondDialog(env: MeshEnvelope, onDismiss: () -> Unit, onSend: (String) -> Unit) {
  var message by remember { mutableStateOf("Rescue team en route. Stay where you are if safe.") }

  AlertDialog(
    onDismissRequest = onDismiss,
    title = { Text("Respond to SOS") },
    text = {
      Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text("Target: ${env.id}")
        OutlinedTextField(
          value = message,
          onValueChange = { message = it },
          label = { Text("Response message") },
          modifier = Modifier.fillMaxWidth(),
          minLines = 2,
          maxLines = 5,
        )
      }
    },
    confirmButton = {
      Button(onClick = { onSend(message.trim()) }, enabled = message.trim().isNotEmpty()) {
        Text("Send")
      }
    },
    dismissButton = {
      Button(onClick = onDismiss) { Text("Cancel") }
    },
  )
}
