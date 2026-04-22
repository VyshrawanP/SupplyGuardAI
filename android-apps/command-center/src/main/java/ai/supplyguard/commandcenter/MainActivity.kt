package ai.supplyguard.commandcenter

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
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
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import ai.supplyguard.data.CommandPayload
import ai.supplyguard.data.CommandPriority
import ai.supplyguard.data.ResponsePayload
import ai.supplyguard.data.SosPayload
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent { CommandCenterRoot() }
  }
}

@Composable
private fun CommandCenterRoot() {
  MaterialTheme {
    val context = LocalContext.current
    val app = context.applicationContext as CommandCenterApp
    val permissions = remember { requiredPermissions() }
    var showWebUi by remember { mutableStateOf(false) }

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

    val vm: CommandCenterViewModel = viewModel(
      factory = object : ViewModelProvider.Factory {
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
          @Suppress("UNCHECKED_CAST")
          return CommandCenterViewModel(app.repository) as T
        }
      },
    )
    val state by vm.state.collectAsStateWithLifecycle()

    if (showWebUi) {
      WebGatewayScreen(
        hasPermissions = hasPermissions,
        repository = app.repository,
        onBack = { showWebUi = false },
      )
    } else {
      CommandCenterScreen(
        hasPermissions = hasPermissions,
        commands = state.commands,
        sos = state.sos.map { it.second },
        responses = state.responses.map { it.second },
        onBroadcast = vm::broadcast,
        onOpenWebUi = { showWebUi = true },
      )
    }
  }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun CommandCenterScreen(
  hasPermissions: Boolean,
  commands: List<CommandPayload>,
  sos: List<SosPayload?>,
  responses: List<ResponsePayload?>,
  onBroadcast: (String?, String, CommandPriority) -> Unit,
  onOpenWebUi: () -> Unit,
) {
  var title by remember { mutableStateOf("") }
  var message by remember { mutableStateOf("") }
  var priority by remember { mutableStateOf(CommandPriority.INFO) }
  var priorityMenuOpen by remember { mutableStateOf(false) }

  Scaffold(topBar = { TopAppBar(title = { Text("SupplyGuard Command Center") }) }) { padding ->
    Column(
      modifier = Modifier
        .fillMaxSize()
        .padding(padding)
        .padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
      Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
        TextButton(onClick = onOpenWebUi) { Text("Open Web UI") }
      }

      if (!hasPermissions) {
        Text(
          text = "Bluetooth permissions are required to broadcast offline mesh messages.",
          color = MaterialTheme.colorScheme.error,
        )
      }

      Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
          Text("Broadcast to field devices", style = MaterialTheme.typography.titleMedium)

          OutlinedTextField(
            value = title,
            onValueChange = { title = it },
            label = { Text("Title (optional)") },
            modifier = Modifier.fillMaxWidth(),
          )

          OutlinedTextField(
            value = message,
            onValueChange = { message = it },
            label = { Text("Message") },
            modifier = Modifier.fillMaxWidth(),
            minLines = 2,
          )

          Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            TextButton(onClick = { priorityMenuOpen = true }) { Text("Priority: ${priority.name}") }
            DropdownMenu(expanded = priorityMenuOpen, onDismissRequest = { priorityMenuOpen = false }) {
              CommandPriority.entries.forEach { option ->
                DropdownMenuItem(
                  text = { Text(option.name) },
                  onClick = {
                    priority = option
                    priorityMenuOpen = false
                  },
                )
              }
            }

            Spacer(modifier = Modifier.weight(1f))
            Button(
              enabled = hasPermissions && message.isNotBlank(),
              onClick = {
                onBroadcast(title, message, priority)
                message = ""
              },
            ) { Text("Send") }
          }
        }
      }

      Text("Sent/Received Commands", style = MaterialTheme.typography.titleMedium)
      LazyColumn(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp),
      ) {
        if (commands.isEmpty()) {
          item { Text("No command messages yet.") }
        } else {
          items(commands) { cmd -> CommandCard(cmd) }
        }
        item { Spacer(Modifier.height(8.dp)) }
      }

      Text("Received SOS", style = MaterialTheme.typography.titleMedium)
      LazyColumn(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp),
      ) {
        if (sos.isEmpty()) {
          item { Text("No SOS received yet.") }
        } else {
          items(sos) { payload ->
            SosCard(payload)
          }
        }
        item { Spacer(Modifier.height(8.dp)) }
      }

      Text("Received Responses", style = MaterialTheme.typography.titleMedium)
      LazyColumn(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp),
      ) {
        if (responses.isEmpty()) {
          item { Text("No responses received yet.") }
        } else {
          items(responses) { payload ->
            ResponseCard(payload)
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

@Composable
private fun SosCard(payload: SosPayload?) {
  val title = payload?.name?.takeIf { it.isNotBlank() } ?: "SOS"
  val location = payload?.locationText?.takeIf { it.isNotBlank() } ?: "Unknown location"
  val need = payload?.need?.takeIf { it.isNotBlank() } ?: "No details"

  Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
      Text(title, style = MaterialTheme.typography.titleSmall)
      Text(location, style = MaterialTheme.typography.bodySmall)
      Text(need, style = MaterialTheme.typography.bodyMedium)
    }
  }
}

@Composable
private fun ResponseCard(payload: ResponsePayload?) {
  val target = payload?.targetMessageId ?: "Unknown"
  val message = payload?.message ?: "(unreadable payload)"

  Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
      Text("Response to $target", style = MaterialTheme.typography.titleSmall)
      Text(message, style = MaterialTheme.typography.bodyMedium)
    }
  }
}

private class CommandCenterJsBridge(
  private val scope: CoroutineScope,
  private val repository: ai.supplyguard.mesh.MeshRepository,
) {
  @JavascriptInterface
  fun broadcastCommand(title: String?, message: String?, priority: String?) {
    val safeMessage = (message ?: "").trim()
    if (safeMessage.isBlank()) return
    val safeTitle = title?.trim()?.takeIf { it.isNotBlank() }?.take(80)
    val safePriority = when ((priority ?: "").trim().uppercase()) {
      "CRITICAL" -> CommandPriority.CRITICAL
      "WARNING" -> CommandPriority.WARNING
      else -> CommandPriority.INFO
    }

    scope.launch {
      repository.createCommand(
        title = safeTitle,
        message = safeMessage.take(400),
        priority = safePriority,
      )
    }
  }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun WebGatewayScreen(
  hasPermissions: Boolean,
  repository: ai.supplyguard.mesh.MeshRepository,
  onBack: () -> Unit,
) {
  val scope = rememberCoroutineScope()

  Scaffold(
    topBar = {
      TopAppBar(
        title = { Text("Web Gateway (Offline)") },
        navigationIcon = { TextButton(onClick = onBack) { Text("Back") } },
      )
    },
  ) { padding ->
    Column(
      modifier = Modifier
        .fillMaxSize()
        .padding(padding),
    ) {
      if (!hasPermissions) {
        Text(
          modifier = Modifier.padding(16.dp),
          text = "Bluetooth permissions are required. Go back and allow permissions.",
          color = MaterialTheme.colorScheme.error,
        )
      }

      AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { ctx ->
          WebView(ctx).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            // Load only packaged assets by default for safety.
            addJavascriptInterface(CommandCenterJsBridge(scope, repository), "SupplyGuardBridge")
            webViewClient = object : WebViewClient() {
              override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                // Block navigation away from packaged assets.
                return !(url.startsWith("file:///android_asset/web/") || url == "about:blank")
              }
            }
            loadUrl("file:///android_asset/web/index.html")
          }
        },
      )
    }
  }
}

private fun requiredPermissions(): Array<String> {
  return if (Build.VERSION.SDK_INT >= 31) {
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

private fun hasAllPermissions(context: android.content.Context, permissions: Array<String>): Boolean {
  return permissions.all {
    ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED
  }
}
