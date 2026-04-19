package ai.supplyguard.victim

import android.os.Bundle
import android.Manifest
import android.os.Build
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import ai.supplyguard.victim.ui.VictimViewModel
import androidx.core.content.ContextCompat
import android.content.pm.PackageManager

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent {
      MaterialTheme {
        BlePermissionGate {
          VictimScreen()
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

  val launcher = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.RequestMultiplePermissions(),
  ) { results ->
    granted = results.values.all { it }
  }

  val allGrantedNow = permissions.all { perm ->
    ContextCompat.checkSelfPermission(LocalContext.current, perm) == PackageManager.PERMISSION_GRANTED
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
        Text("Bluetooth permissions are required to send SOS over the offline mesh.")
        Button(onClick = { launcher.launch(permissions) }) {
          Text("Grant permissions")
        }
      }
    }
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun VictimScreen(vm: VictimViewModel = viewModel()) {
  val state by vm.state.collectAsState()

  Scaffold(
    topBar = {
      TopAppBar(title = { Text("SEND SOS") })
    },
  ) { padding ->
    Column(
      modifier = Modifier
        .fillMaxSize()
        .padding(padding)
        .padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
      Card(modifier = Modifier.padding(0.dp)) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
          OutlinedTextField(
            value = state.name,
            onValueChange = vm::setName,
            label = { Text("Name (optional)") },
            keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Words),
            modifier = Modifier.fillMaxWidth(),
          )
          OutlinedTextField(
            value = state.locationText,
            onValueChange = vm::setLocationText,
            label = { Text("Location (text, optional)") },
            keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences),
          )
          OutlinedTextField(
            value = state.need,
            onValueChange = vm::setNeed,
            label = { Text("Need (food/medical/etc, optional)") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text),
          )
        }
      }

      Button(
        onClick = vm::sendSos,
        enabled = !state.sending,
        modifier = Modifier.height(54.dp),
      ) {
        Text(if (state.sending) "Sending..." else "SEND SOS")
      }

      if (state.lastMessageId != null) {
        Spacer(modifier = Modifier.height(8.dp))
        Text("Message ID: ${state.lastMessageId}", style = MaterialTheme.typography.bodySmall)
        Text("Status: ${state.status}", style = MaterialTheme.typography.bodySmall)
      }
    }
  }
}
