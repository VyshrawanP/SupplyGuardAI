package ai.supplyguard.commandcenter

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MailOutline
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
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
import ai.supplyguard.work.WorkScheduler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent { CommandCenterRoot() }
  }
}

private enum class CcTab(val label: String, val icon: ImageVector) {
  DASHBOARD("Dashboard", Icons.Default.LocationOn),
  SEND("Send", Icons.Default.MailOutline),
  SOS("SOS", Icons.Default.Warning),
  LOG("Log", Icons.Default.Notifications),
}

@Composable
private fun CommandCenterRoot() {
  CommandCenterTheme {
    val context = LocalContext.current
    val app = context.applicationContext as CommandCenterApp
    val permissions = remember { requiredMeshPermissions() }
    var showWebUi by remember { mutableStateOf(false) }

    var hasPermissions by remember { mutableStateOf(hasAllPermissions(context, permissions)) }
    
    val permissionLauncher = rememberLauncherForActivityResult(
      contract = ActivityResultContracts.RequestMultiplePermissions(),
      onResult = { result -> 
        hasPermissions = result.values.all { it } 
      },
    )

    // Launch mesh permissions only if needed. Command Center has no "Get Location" button.
    LaunchedEffect(Unit) { 
      if (!hasPermissions) {
        permissionLauncher.launch(permissions)
      }
    }
    val bleCount by app.meshEngine.activeConnectionCount.collectAsStateWithLifecycle(0)
    val nearbyCount by app.nearbyMeshEngine.activeConnectionCount.collectAsStateWithLifecycle(0)
    val activeConnectionCount = bleCount + nearbyCount

    LaunchedEffect(hasPermissions) {
      if (hasPermissions) {
        app.meshEngine.start()
        app.nearbyMeshEngine.start()
      } else {
        app.meshEngine.stop()
        app.nearbyMeshEngine.stop()
      }
    }
    DisposableEffect(Unit) {
      onDispose {
        app.meshEngine.stop()
        app.nearbyMeshEngine.stop()
      }
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
      WebGatewayScreen(hasPermissions = hasPermissions, repository = app.repository, onBack = { showWebUi = false })
    } else {
      CommandCenterScreen(
        hasPermissions = hasPermissions,
        activeConnectionCount = activeConnectionCount,
        commands = state.commands,
        sos = state.sos,
        responses = state.responses.map { it.second },
        onSendToVictim = vm::sendToVictim,
        onSendToRescue = vm::sendToRescue,
        onBroadcast = vm::broadcast,
        onForwardSosLocationToRescue = vm::forwardSosLocationToRescue,
        onOpenWebUi = { showWebUi = true },
      )
    }
  }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun CommandCenterScreen(
  hasPermissions: Boolean,
  activeConnectionCount: Int,
  commands: List<CommandPayload>,
  sos: List<Pair<ai.supplyguard.data.MeshEnvelope, SosPayload?>>,
  responses: List<ResponsePayload?>,
  onSendToVictim: (String?, String, CommandPriority) -> Unit,
  onSendToRescue: (String?, String, CommandPriority, Double?, Double?, Float?) -> Unit,
  onBroadcast: (String?, String, CommandPriority) -> Unit,
  onForwardSosLocationToRescue: (ai.supplyguard.data.MeshEnvelope, SosPayload?) -> Unit,
  onOpenWebUi: () -> Unit,
) {
  val context = LocalContext.current
  var selectedTab by remember { mutableStateOf(CcTab.DASHBOARD) }

  Scaffold(
    topBar = {
      TopAppBar(
        title = {
          Column {
            Text("SupplyGuard", style = MaterialTheme.typography.labelSmall)
            Text("Command Center", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
          }
        },
        colors = TopAppBarDefaults.topAppBarColors(
          containerColor = MaterialTheme.colorScheme.surface,
          titleContentColor = MaterialTheme.colorScheme.onSurface,
        ),
        actions = {
          if (activeConnectionCount > 0) {
            Badge(containerColor = MaterialTheme.colorScheme.primaryContainer) {
              Text("$activeConnectionCount Linked", color = MaterialTheme.colorScheme.onPrimaryContainer)
            }
          }
          TextButton(onClick = {
            WorkScheduler.enqueueBackendSyncNow(context, BuildConfig.BACKEND_BASE_URL)
          }) { Text("Sync") }
          TextButton(onClick = onOpenWebUi) { Text("Web UI") }
        },
      )
    },
    bottomBar = {
      NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
        CcTab.entries.forEach { tab ->
          val badgeCount = when (tab) {
            CcTab.SOS -> sos.size
            CcTab.LOG -> commands.size + responses.size
            else -> 0
          }
          NavigationBarItem(
            selected = selectedTab == tab,
            onClick = { selectedTab = tab },
            icon = {
              if (badgeCount > 0) {
                BadgedBox(badge = {
                  Badge { Text("$badgeCount") }
                }) {
                  Icon(tab.icon, contentDescription = tab.label)
                }
              } else {
                Icon(tab.icon, contentDescription = tab.label)
              }
            },
            label = { Text(tab.label, fontWeight = if (selectedTab == tab) FontWeight.Bold else FontWeight.Normal) },
          )
        }
      }
    },
  ) { padding ->
    Column(
      modifier = Modifier
        .fillMaxSize()
        .padding(padding),
    ) {
      if (!hasPermissions) {
        Card(
          colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
          modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
        ) {
          Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Icon(Icons.Default.Warning, contentDescription = null, tint = MaterialTheme.colorScheme.onErrorContainer)
            Text("Bluetooth permissions required.", color = MaterialTheme.colorScheme.onErrorContainer,
              style = MaterialTheme.typography.bodySmall)
          }
        }
      }

      when (selectedTab) {
        CcTab.DASHBOARD -> DashboardTab()
        CcTab.SEND -> SendTab(hasPermissions, onSendToVictim, onSendToRescue, onBroadcast)
        CcTab.SOS  -> SosTab(sos, hasPermissions, onForwardSosLocationToRescue)
        CcTab.LOG  -> LogTab(commands, responses)
      }
    }
  }
}

// ── Send Tab ────────────────────────────────────────────────────────────────

@Composable
private fun SendTab(
  hasPermissions: Boolean,
  onSendToVictim: (String?, String, CommandPriority) -> Unit,
  onSendToRescue: (String?, String, CommandPriority, Double?, Double?, Float?) -> Unit,
  onBroadcast: (String?, String, CommandPriority) -> Unit,
) {
  LazyColumn(
    modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
    verticalArrangement = Arrangement.spacedBy(12.dp),
  ) {
    item { Spacer(Modifier.height(4.dp)) }

    // Message to Victim
    item {
      MessageComposeCard(
        title = "Message Victim App",
        hasPermissions = hasPermissions,
        onSend = { title, message, priority -> onSendToVictim(title, message, priority) },
      )
    }

    // Message to Rescue
    item {
      MessageComposeCard(
        title = "Message Rescue App",
        hasPermissions = hasPermissions,
        onSend = { title, message, priority -> onSendToRescue(title, message, priority, null, null, null) },
      )
    }

    // Broadcast
    item {
      MessageComposeCard(
        title = "Broadcast to All",
        hasPermissions = hasPermissions,
        onSend = { title, message, priority -> onBroadcast(title, message, priority) },
      )
    }

    item { Spacer(Modifier.height(16.dp)) }
  }
}

@Composable
private fun MessageComposeCard(
  title: String,
  hasPermissions: Boolean,
  onSend: (String?, String, CommandPriority) -> Unit,
) {
  var msgTitle by remember { mutableStateOf("") }
  var msgBody by remember { mutableStateOf("") }
  var priority by remember { mutableStateOf(CommandPriority.INFO) }
  var menuOpen by remember { mutableStateOf(false) }

  Card(
    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
    modifier = Modifier.fillMaxWidth(),
  ) {
    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
      Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
      OutlinedTextField(
        value = msgTitle,
        onValueChange = { msgTitle = it },
        label = { Text("Title (optional)") },
        modifier = Modifier.fillMaxWidth(),
        singleLine = true,
      )
      OutlinedTextField(
        value = msgBody,
        onValueChange = { msgBody = it },
        label = { Text("Message") },
        modifier = Modifier.fillMaxWidth(),
        minLines = 2,
      )
      Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically) {
        Box {
          TextButton(onClick = { menuOpen = true }) {
            Text("Priority: ${priority.name}", style = MaterialTheme.typography.labelMedium)
          }
          DropdownMenu(expanded = menuOpen, onDismissRequest = { menuOpen = false }) {
            CommandPriority.entries.forEach { opt ->
              DropdownMenuItem(
                text = { Text(opt.name) },
                onClick = { priority = opt; menuOpen = false },
              )
            }
          }
        }
        Button(
          enabled = hasPermissions && msgBody.isNotBlank(),
          onClick = {
            onSend(msgTitle.takeIf { it.isNotBlank() }, msgBody.trim(), priority)
            msgTitle = ""; msgBody = ""; priority = CommandPriority.INFO
          },
        ) {
          Icon(Icons.Default.MailOutline, contentDescription = null, modifier = Modifier.size(16.dp))
          Spacer(Modifier.width(4.dp))
          Text("Send")
        }
      }
    }
  }
}

// ── SOS Tab ─────────────────────────────────────────────────────────────────

@Composable
private fun SosTab(
  sos: List<Pair<ai.supplyguard.data.MeshEnvelope, SosPayload?>>,
  hasPermissions: Boolean,
  onForwardSosLocationToRescue: (ai.supplyguard.data.MeshEnvelope, SosPayload?) -> Unit,
) {
  if (sos.isEmpty()) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
      Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Icon(Icons.Default.Warning, contentDescription = null,
          tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(48.dp))
        Text("No SOS received yet.", color = MaterialTheme.colorScheme.onSurfaceVariant)
      }
    }
  } else {
    LazyColumn(
      modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
      verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
      item { Spacer(Modifier.height(4.dp)) }
      items(sos) { (envelope, payload) ->
        SosCard(
          envelope = envelope, payload = payload,
          hasPermissions = hasPermissions,
          onForwardToRescue = { onForwardSosLocationToRescue(envelope, payload) },
        )
      }
      item { Spacer(Modifier.height(16.dp)) }
    }
  }
}

// ── Log Tab ──────────────────────────────────────────────────────────────────

@Composable
private fun LogTab(commands: List<CommandPayload>, responses: List<ResponsePayload?>) {
  LazyColumn(
    modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
    verticalArrangement = Arrangement.spacedBy(10.dp),
  ) {
    item { Spacer(Modifier.height(4.dp)) }
    item {
      Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        Text("Sent / Received Commands", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
        if (commands.isNotEmpty()) Badge(containerColor = MaterialTheme.colorScheme.primary) { Text("${commands.size}") }
      }
    }
    if (commands.isEmpty()) {
      item { Text("No command messages yet.", color = MaterialTheme.colorScheme.onSurfaceVariant) }
    } else {
      items(commands) { cmd -> CommandCard(cmd) }
    }

    item {
      Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        Text("Received Responses", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
        if (responses.isNotEmpty()) Badge(containerColor = MaterialTheme.colorScheme.secondary) { Text("${responses.size}") }
      }
    }
    if (responses.isEmpty()) {
      item { Text("No responses received yet.", color = MaterialTheme.colorScheme.onSurfaceVariant) }
    } else {
      items(responses) { payload -> ResponseCard(payload) }
    }
    item { Spacer(Modifier.height(16.dp)) }
  }
}

// ── Card composables ─────────────────────────────────────────────────────────

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
        if (payload.priority == CommandPriority.CRITICAL)
          Icon(Icons.Default.Warning, contentDescription = null, tint = contentColor, modifier = Modifier.size(16.dp))
        Text(payload.title ?: "Update", style = MaterialTheme.typography.titleSmall,
          color = contentColor, fontWeight = FontWeight.SemiBold)
      }
      Text(payload.message, style = MaterialTheme.typography.bodyMedium, color = contentColor)
      if (payload.latitude != null && payload.longitude != null) {
        val acc = payload.accuracyMeters?.let { " (±${String.format("%.0f", it)}m)" } ?: ""
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
          Icon(Icons.Default.LocationOn, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(14.dp))
          Text("Lat: ${String.format("%.6f", payload.latitude)}, Lon: ${String.format("%.6f", payload.longitude)}$acc",
            style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
        }
      }
      Text(payload.priority.name, style = MaterialTheme.typography.labelSmall, color = contentColor.copy(alpha = 0.7f))
    }
  }
}

@Composable
private fun SosCard(
  envelope: ai.supplyguard.data.MeshEnvelope,
  payload: SosPayload?,
  hasPermissions: Boolean,
  onForwardToRescue: () -> Unit,
) {
  val title = payload?.name?.takeIf { it.isNotBlank() } ?: "SOS"
  val location = payload?.locationText?.takeIf { it.isNotBlank() } ?: "Unknown location"
  val need = payload?.need?.takeIf { it.isNotBlank() } ?: "No details"
  val hasCoordinates = payload?.latitude != null && payload?.longitude != null

  Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)) {
    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
      Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        Icon(Icons.Default.Warning, contentDescription = null,
          tint = MaterialTheme.colorScheme.onErrorContainer, modifier = Modifier.size(18.dp))
        Text(title, style = MaterialTheme.typography.titleSmall,
          color = MaterialTheme.colorScheme.onErrorContainer, fontWeight = FontWeight.Bold)
      }
      Text(location, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onErrorContainer)
      if (hasCoordinates) {
        val acc = payload?.accuracyMeters?.let { " (±${String.format("%.0f", it)}m)" } ?: ""
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
          Icon(Icons.Default.LocationOn, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(14.dp))
          Text("Lat: ${String.format("%.6f", payload?.latitude)}, Lon: ${String.format("%.6f", payload?.longitude)}$acc",
            style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
        }
      }
      Text(need, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onErrorContainer)
      Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically) {
        Text("ID: ${envelope.id.take(8)}", style = MaterialTheme.typography.labelSmall,
          color = MaterialTheme.colorScheme.onErrorContainer.copy(alpha = 0.6f))
        if (hasCoordinates) {
          Button(onClick = onForwardToRescue, enabled = hasPermissions,
            colors = ButtonDefaults.buttonColors(
              containerColor = MaterialTheme.colorScheme.primary,
              contentColor = MaterialTheme.colorScheme.onPrimary,
            )) {
            Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(14.dp))
            Spacer(Modifier.width(4.dp))
            Text("Forward to Rescue", style = MaterialTheme.typography.labelMedium)
          }
        }
      }
    }
  }
}

@Composable
private fun ResponseCard(payload: ResponsePayload?) {
  val target = payload?.targetMessageId?.take(8) ?: "Unknown"
  val message = payload?.message ?: "(unreadable payload)"
  val hasCoordinates = payload?.latitude != null && payload?.longitude != null

  Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)) {
    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
      Text("Response → $target", style = MaterialTheme.typography.titleSmall,
        color = MaterialTheme.colorScheme.onSecondaryContainer, fontWeight = FontWeight.SemiBold)
      Text(message, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSecondaryContainer)
      if (hasCoordinates) {
        val acc = payload?.accuracyMeters?.let { " (±${String.format("%.0f", it)}m)" } ?: ""
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
          Icon(Icons.Default.LocationOn, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(14.dp))
          Text("Lat: ${String.format("%.6f", payload?.latitude)}, Lon: ${String.format("%.6f", payload?.longitude)}$acc",
            style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
        }
      }
    }
  }
}

// ── Web Gateway ──────────────────────────────────────────────────────────────

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
      "WARNING"  -> CommandPriority.WARNING
      else       -> CommandPriority.INFO
    }
    scope.launch {
      repository.createCommand(title = safeTitle, message = safeMessage.take(400), priority = safePriority)
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
    Column(modifier = Modifier.fillMaxSize().padding(padding)) {
      if (!hasPermissions) {
        Text(
          modifier = Modifier.padding(16.dp),
          text = "Bluetooth permissions required. Go back and allow permissions.",
          color = MaterialTheme.colorScheme.error,
        )
      }
      AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { ctx ->
          WebView(ctx).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            addJavascriptInterface(CommandCenterJsBridge(scope, repository), "SupplyGuardBridge")
            webViewClient = object : WebViewClient() {
              override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
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

// ── Permissions ──────────────────────────────────────────────────────────────



private fun requiredMeshPermissions(): Array<String> {
  return if (Build.VERSION.SDK_INT >= 33) {
    arrayOf(Manifest.permission.POST_NOTIFICATIONS, Manifest.permission.BLUETOOTH_SCAN,
      Manifest.permission.BLUETOOTH_CONNECT, Manifest.permission.BLUETOOTH_ADVERTISE,
      Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION,
      Manifest.permission.NEARBY_WIFI_DEVICES)
  } else if (Build.VERSION.SDK_INT >= 31) {
    arrayOf(Manifest.permission.BLUETOOTH_SCAN, Manifest.permission.BLUETOOTH_CONNECT,
      Manifest.permission.BLUETOOTH_ADVERTISE,
      Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
  } else {
    arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.BLUETOOTH,
      Manifest.permission.BLUETOOTH_ADMIN)
  }
}

private fun hasAllPermissions(context: android.content.Context, permissions: Array<String>): Boolean {
  return permissions.all { ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED }
}
