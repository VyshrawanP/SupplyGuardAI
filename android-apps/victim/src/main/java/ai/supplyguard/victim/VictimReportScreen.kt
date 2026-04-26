package ai.supplyguard.victim

import android.widget.Toast
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.supplyguard.location.LocationHelper
import kotlinx.coroutines.launch
import ai.supplyguard.permissions.PermissionManager
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VictimReportScreen(
  onBack: () -> Unit,
  activeConnectionCount: Int,
  hasMeshPermissions: Boolean,
  responses: List<ai.supplyguard.data.ResponsePayload> = emptyList(),
  onSendVictimReport: (String?, Double?, Double?, Float?) -> Unit,
) {
  val context = LocalContext.current
  val scope = rememberCoroutineScope()
  val locationHelper = remember { LocationHelper(context) }
  
  var selectedNeed by remember { mutableStateOf<String?>(null) }
  var isGettingLocation by remember { mutableStateOf(false) }
  var currentLatitude by remember { mutableStateOf<Double?>(null) }
  var currentLongitude by remember { mutableStateOf<Double?>(null) }
  var currentAccuracyMeters by remember { mutableStateOf<Float?>(null) }
  
  var hasLocationPermission by remember { mutableStateOf(PermissionManager.isLocationGranted(context)) }
  
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

  // Auto-fetch location if granted
  LaunchedEffect(hasLocationPermission) {
    if (hasLocationPermission) {
      isGettingLocation = true
      try {
        val loc = locationHelper.getCurrentLocation()
        if (loc != null) {
          currentLatitude = loc.latitude
          currentLongitude = loc.longitude
          currentAccuracyMeters = loc.accuracy
        }
      } catch (e: Exception) {
        // GPS disabled or permission revoked mid-flight
      } finally {
        isGettingLocation = false
      }
    }
  }

  fun triggerLocationRefresh() {
    if (!hasLocationPermission) {
      Toast.makeText(context, "Location permission required", Toast.LENGTH_SHORT).show()
      return
    }
    scope.launch {
      isGettingLocation = true
      try {
        val loc = locationHelper.getCurrentLocation()
        if (loc != null) {
          currentLatitude = loc.latitude
          currentLongitude = loc.longitude
          currentAccuracyMeters = loc.accuracy
        } else {
          Toast.makeText(context, "Failed to refine location", Toast.LENGTH_SHORT).show()
        }
      } catch (e: Exception) {
        Toast.makeText(context, e.message ?: "Failed to get location", Toast.LENGTH_SHORT).show()
      } finally {
        isGettingLocation = false
      }
    }
  }

  Scaffold(
    containerColor = Color(0xFF121A21), // Dark Navy Background
    topBar = {
      TopAppBar(
        title = { Text("Victim Report", color = Color.White) },
        navigationIcon = {
          IconButton(onClick = onBack) {
            Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
          }
        },
        actions = {
          IconButton(onClick = { /* Profile */ }) {
            Icon(Icons.Default.AccountCircle, contentDescription = "Profile", tint = Color.LightGray)
          }
        },
        colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent)
      )
    },
    bottomBar = {
      // Bottom Sync Bar
      Row(
        modifier = Modifier
          .fillMaxWidth()
          .background(Color(0xFF1E262F))
          .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
      ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
          Box(
            modifier = Modifier
              .size(10.dp)
              .clip(CircleShape)
              .background(if (activeConnectionCount > 0) Color(0xFF4CAF50) else Color(0xFFFFC107))
          )
          Spacer(Modifier.width(8.dp))
          Text(
            if (activeConnectionCount > 0) "Online - syncing via Mesh" else "Offline - will sync when connected",
            color = Color.White,
            fontSize = 14.sp
          )
        }
        Text(
          if (activeConnectionCount > 0) "$activeConnectionCount connections" else "Pending sync",
          color = Color.LightGray,
          fontSize = 12.sp,
          textAlign = TextAlign.End
        )
      }
    }
  ) { padding ->
    Column(
      modifier = Modifier
        .fillMaxSize()
        .padding(padding)
        .padding(horizontal = 24.dp),
      horizontalAlignment = Alignment.CenterHorizontally
    ) {
      Spacer(Modifier.height(32.dp))

      // Giant SOS Button with radar effect
      SosRadarButton(
        onLongPress = {
          onSendVictimReport(selectedNeed, currentLatitude, currentLongitude, currentAccuracyMeters)
          Toast.makeText(context, "Victim Report Broadcasted", Toast.LENGTH_LONG).show()
        }
      )

      Spacer(Modifier.height(48.dp))

      // Needs Grid (Medical, Water, Food, Shelter, Rescue)
      Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
          NeedCard(
            modifier = Modifier.weight(1f),
            icon = Icons.Default.AddCircle,
            label = "Medical Aid",
            isSelected = selectedNeed == "Medical Aid",
            onClick = { selectedNeed = if (selectedNeed == "Medical Aid") null else "Medical Aid" }
          )
          NeedCard(
            modifier = Modifier.weight(1f),
            icon = Icons.Default.Opacity,
            label = "Water",
            isSelected = selectedNeed == "Water",
            onClick = { selectedNeed = if (selectedNeed == "Water") null else "Water" }
          )
          NeedCard(
            modifier = Modifier.weight(1f),
            icon = Icons.Default.Restaurant,
            label = "Food",
            isSelected = selectedNeed == "Food",
            onClick = { selectedNeed = if (selectedNeed == "Food") null else "Food" }
          )
        }
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
          NeedCard(
            modifier = Modifier.weight(1f),
            icon = Icons.Default.Home,
            label = "Shelter",
            isSelected = selectedNeed == "Shelter",
            onClick = { selectedNeed = if (selectedNeed == "Shelter") null else "Shelter" }
          )
          NeedCard(
            modifier = Modifier.weight(1f),
            icon = Icons.Default.Support,
            label = "Rescue",
            isSelected = selectedNeed == "Rescue",
            onClick = { selectedNeed = if (selectedNeed == "Rescue") null else "Rescue" }
          )
        }
      }

      Spacer(Modifier.weight(1f))

      // Rescue Team Messages
      if (responses.isNotEmpty()) {
        Column(
          modifier = Modifier.fillMaxWidth(),
          verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
          Text(
            "MESSAGES FROM RESCUE TEAMS",
            color = Color(0xFF4CAF50),
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.sp
          )
          responses.take(3).forEach { resp ->
            Card(
              colors = CardDefaults.cardColors(containerColor = Color(0xFF2E3D4D).copy(alpha = 0.5f)),
              shape = RoundedCornerShape(8.dp),
              modifier = Modifier.fillMaxWidth()
            ) {
              Row(
                modifier = Modifier.padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
              ) {
                Icon(Icons.Default.Chat, contentDescription = null, tint = Color(0xFF4CAF50), modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(8.dp))
                Text(resp.message, color = Color.White, fontSize = 14.sp)
              }
            }
          }
        }
        Spacer(Modifier.height(24.dp))
      }

      // Location Card
      Box(
        modifier = Modifier
          .fillMaxWidth()
          .clip(RoundedCornerShape(12.dp))
          .background(Color(0xFF1E262F))
          .padding(16.dp)
      ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
          Icon(Icons.Default.LocationOn, contentDescription = null, tint = Color.LightGray)
          Spacer(Modifier.width(12.dp))
          Column(modifier = Modifier.weight(1f)) {
            if (isGettingLocation) {
              Text("Acquiring GPS...", color = Color.White, fontSize = 14.sp)
            } else if (currentLatitude != null && currentLongitude != null) {
              Text(
                "Current Location: ${String.format("%.4f", currentLatitude)}° N, ${String.format("%.4f", currentLongitude)}° W",
                color = Color.White, fontSize = 14.sp
              )
              Text(
                "Accuracy: +/- ${currentAccuracyMeters?.toInt() ?: "?"} meters",
                color = Color.Gray, fontSize = 12.sp
              )
            } else {
              Text("Location Unknown", color = Color.White, fontSize = 14.sp)
              Text("Check device GPS", color = Color.Gray, fontSize = 12.sp)
            }
          }
          TextButton(onClick = { triggerLocationRefresh() }) {
            Text("Refine Location", color = Color(0xFF64B5F6), fontSize = 12.sp)
          }
        }
      }
      
      Spacer(Modifier.height(16.dp))
    }
  }
}

@Composable
fun NeedCard(
  modifier: Modifier = Modifier,
  icon: ImageVector,
  label: String,
  isSelected: Boolean,
  onClick: () -> Unit
) {
  val bgColor = if (isSelected) Color(0xFF2E3D4D) else Color(0xFF1E262F)
  val tintColor = if (isSelected) Color.White else Color.LightGray
  
  Column(
    modifier = modifier
      .clip(RoundedCornerShape(12.dp))
      .background(bgColor)
      .clickable { onClick() }
      .padding(vertical = 16.dp),
    horizontalAlignment = Alignment.CenterHorizontally
  ) {
    Icon(icon, contentDescription = label, tint = tintColor, modifier = Modifier.size(32.dp))
    Spacer(Modifier.height(8.dp))
    Text(label, color = tintColor, fontSize = 14.sp)
  }
}

@Composable
fun SosRadarButton(onLongPress: () -> Unit) {
  val infiniteTransition = rememberInfiniteTransition(label = "radar")
  
  val scale1 by infiniteTransition.animateFloat(
    initialValue = 1f,
    targetValue = 1.4f,
    animationSpec = infiniteRepeatable(
      animation = tween(2000, easing = LinearEasing),
      repeatMode = RepeatMode.Restart
    ),
    label = "scale1"
  )
  val alpha1 by infiniteTransition.animateFloat(
    initialValue = 0.5f,
    targetValue = 0f,
    animationSpec = infiniteRepeatable(
      animation = tween(2000, easing = LinearEasing),
      repeatMode = RepeatMode.Restart
    ),
    label = "alpha1"
  )

  val scale2 by infiniteTransition.animateFloat(
    initialValue = 1f,
    targetValue = 1.6f,
    animationSpec = infiniteRepeatable(
      animation = tween(2000, delayMillis = 1000, easing = LinearEasing),
      repeatMode = RepeatMode.Restart
    ),
    label = "scale2"
  )
  val alpha2 by infiniteTransition.animateFloat(
    initialValue = 0.4f,
    targetValue = 0f,
    animationSpec = infiniteRepeatable(
      animation = tween(2000, delayMillis = 1000, easing = LinearEasing),
      repeatMode = RepeatMode.Restart
    ),
    label = "alpha2"
  )

  Box(
    contentAlignment = Alignment.Center,
    modifier = Modifier.size(240.dp)
  ) {
    // Radar rings
    Box(
      modifier = Modifier
        .size(160.dp)
        .scale(scale2)
        .alpha(alpha2)
        .clip(CircleShape)
        .background(Color(0xFFE53935))
    )
    Box(
      modifier = Modifier
        .size(160.dp)
        .scale(scale1)
        .alpha(alpha1)
        .clip(CircleShape)
        .background(Color(0xFFE53935))
    )
    
    // Solid base layer for the SOS button
    Box(
      modifier = Modifier
        .size(160.dp)
        .clip(CircleShape)
        .background(Color(0xFFB71C1C)) // Darker red background
    )

    // Inner Button with gradient
    Box(
      modifier = Modifier
        .size(140.dp)
        .clip(CircleShape)
        .background(
          Brush.radialGradient(
            colors = listOf(Color(0xFFFF5252), Color(0xFFD32F2F))
          )
        )
        .pointerInput(Unit) {
          detectTapGestures(
            onLongPress = { onLongPress() }
          )
        },
      contentAlignment = Alignment.Center
    ) {
      Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text("SOS", color = Color.White, fontSize = 48.sp, fontWeight = FontWeight.Bold)
        Text("TAP & HOLD TO SEND\nEMERGENCY ALERT", color = Color.White, fontSize = 10.sp, textAlign = TextAlign.Center, lineHeight = 12.sp)
      }
    }
  }
}
