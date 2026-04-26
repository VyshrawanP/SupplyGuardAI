package ai.supplyguard.rescue

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import org.osmdroid.config.Configuration
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.Polyline
import ai.supplyguard.data.SosPayload

// Pseudo-colors based on the mockup
private val BgDark = Color(0xFF151A22)
private val CardDark = Color(0xFF1E2630)
private val AccentBlue = Color(0xFF75A4FA)
private val TextMuted = Color(0xFFA0ABBA)
private val DarkBlueButton = Color(0xFF263344)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MissionDetailsScreen(
  sosPayload: SosPayload?,
  onBack: () -> Unit,
  // Pseudo-fields as requested for future expansion
  missionId: String = "RT-402 - Flood Rescue (Site A)",
  adultCount: Int = 3,
  childCount: Int = 1,
  hospitalName: String = "Metro General",
  hospitalDistance: String = "2.1 MILES",
  icuBeds: Int = 12,
  hospitalContact: String = "(555) 123-4567",
  eta: String = "4 MIN",
  needs: List<String> = listOf("Water", "Medical", "Food")
) {
  val context = LocalContext.current
  LaunchedEffect(Unit) {
    Configuration.getInstance().userAgentValue = context.packageName
  }

  // Fallback location to Bangalore if not provided in payload
  val lat = sosPayload?.latitude ?: 12.9716
  val lon = sosPayload?.longitude ?: 77.5946

  Scaffold(
    containerColor = BgDark,
    topBar = {
      TopAppBar(
        title = {
          Text(
            "MISSION DETAILS",
            color = Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = 16.sp,
            modifier = Modifier.fillMaxWidth(),
            textAlign = TextAlign.Center
          )
        },
        navigationIcon = {
          IconButton(onClick = onBack) {
            Icon(Icons.Default.Menu, contentDescription = "Menu", tint = Color.White)
          }
        },
        actions = {
          Box(modifier = Modifier.padding(end = 16.dp)) {
            Icon(Icons.Outlined.Notifications, contentDescription = "Alerts", tint = Color.White)
            Box(
              modifier = Modifier
                .size(8.dp)
                .clip(CircleShape)
                .background(Color.Red)
                .align(Alignment.TopEnd)
            )
          }
        },
        colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent)
      )
    },
    bottomBar = {
      Column {
        // Action Buttons Row
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
          horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
          Button(
            onClick = { /* TODO */ },
            modifier = Modifier.weight(1f).height(48.dp),
            colors = ButtonDefaults.buttonColors(containerColor = DarkBlueButton),
            shape = RoundedCornerShape(24.dp)
          ) {
            Icon(Icons.Default.WarningAmber, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(8.dp))
            Text("REQUEST BACKUP", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
          }
          Button(
            onClick = { /* TODO */ },
            modifier = Modifier.weight(1f).height(48.dp),
            colors = ButtonDefaults.buttonColors(containerColor = AccentBlue),
            shape = RoundedCornerShape(24.dp)
          ) {
            Icon(Icons.Default.Check, contentDescription = null, tint = Color.Black, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(8.dp))
            Text("MARK COMPLETE", color = Color.Black, fontSize = 12.sp, fontWeight = FontWeight.Bold)
          }
        }
        Divider(color = Color(0xFF2C3643), thickness = 1.dp)
        // Bottom Navigation Placeholder
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .height(56.dp)
            .padding(horizontal = 24.dp),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Icon(Icons.Default.Home, contentDescription = "Home", tint = AccentBlue)
          Icon(Icons.Default.Search, contentDescription = "Search", tint = TextMuted)
          Icon(Icons.Default.Assignment, contentDescription = "Tasks", tint = TextMuted)
          Icon(Icons.Default.Person, contentDescription = "Profile", tint = TextMuted)
        }
      }
    }
  ) { padding ->
    Column(
      modifier = Modifier
        .fillMaxSize()
        .padding(padding)
        .padding(horizontal = 16.dp)
    ) {
      Text(
        "OCT 26 | 09:42 AM",
        color = TextMuted,
        fontSize = 11.sp,
        modifier = Modifier.fillMaxWidth(),
        textAlign = TextAlign.End
      )
      Spacer(Modifier.height(8.dp))

      // Card 1: Mission Info
      Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = CardDark),
        modifier = Modifier.fillMaxWidth()
      ) {
        Column(modifier = Modifier.padding(16.dp)) {
          Text("MISSION ID: ", color = TextMuted, fontSize = 12.sp, style = LocalTextStyle.current.copy(fontWeight = FontWeight.Bold))
          Text(missionId, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
          
          Spacer(Modifier.height(16.dp))
          Text("VICTIM LOCATION", color = TextMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
          Spacer(Modifier.height(4.dp))
          Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Map, contentDescription = null, tint = AccentBlue, modifier = Modifier.size(24.dp))
            Spacer(Modifier.width(8.dp))
            Text(
              sosPayload?.locationText ?: "142 Skyway Rd,\nBangalore",
              color = Color.White,
              fontSize = 14.sp,
              modifier = Modifier.weight(1f)
            )
            // Mini map placeholder
            Box(
              modifier = Modifier
                .size(60.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(Color(0xFF2C3643))
            ) {
              Icon(Icons.Default.LocationOn, contentDescription = null, tint = Color.Red, modifier = Modifier.align(Alignment.Center))
            }
          }

          Spacer(Modifier.height(16.dp))
          Text("MEDICAL NEEDS", color = TextMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
          Spacer(Modifier.height(8.dp))
          Row(
            horizontalArrangement = Arrangement.spacedBy(16.dp)
          ) {
            if (needs.contains("Water")) NeedIcon(Icons.Default.Opacity, "Water", AccentBlue)
            if (needs.contains("Medical")) NeedIcon(Icons.Default.AddCircle, "Medical", Color(0xFFE57373))
            if (needs.contains("Food")) NeedIcon(Icons.Default.Restaurant, "Food", Color(0xFFFFCA28))
          }
          Spacer(Modifier.height(8.dp))
          Text(
            "$adultCount adults, $childCount child (Minor Injuries)",
            color = Color.White,
            fontSize = 13.sp
          )
        }
      }

      Spacer(Modifier.height(12.dp))

      // Card 2: Map
      Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = CardDark),
        modifier = Modifier
          .fillMaxWidth()
          .height(220.dp)
      ) {
        Box(modifier = Modifier.fillMaxSize()) {
          // OpenStreetMap View
          AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
              MapView(ctx).apply {
                setMultiTouchControls(true)
                controller.setZoom(16.0)
                controller.setCenter(GeoPoint(lat, lon))
                
                // Add Victim Marker
                val victimMarker = Marker(this)
                victimMarker.position = GeoPoint(lat, lon)
                victimMarker.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
                victimMarker.title = "Victim Location"
                overlays.add(victimMarker)

                // Add pseudo Hospital Marker slightly offset
                val hospMarker = Marker(this)
                hospMarker.position = GeoPoint(lat + 0.005, lon + 0.005)
                hospMarker.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
                hospMarker.title = hospitalName
                // Ideally set custom icon, but default is fine for now
                overlays.add(hospMarker)

                // Draw simple route polyline between victim and hospital
                val route = Polyline()
                route.addPoint(GeoPoint(lat, lon))
                route.addPoint(GeoPoint(lat + 0.003, lon + 0.002))
                route.addPoint(GeoPoint(lat + 0.005, lon + 0.005))
                route.outlinePaint.color = android.graphics.Color.parseColor("#75A4FA")
                route.outlinePaint.strokeWidth = 10f
                overlays.add(route)
              }
            }
          )

          // Turn by Turn overlay
          Box(
            modifier = Modifier
              .padding(16.dp)
              .align(Alignment.TopCenter)
              .clip(RoundedCornerShape(8.dp))
              .background(Color(0xD91E2630))
              .padding(horizontal = 12.dp, vertical = 6.dp)
          ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
              Icon(Icons.Default.TurnRight, contentDescription = null, tint = Color.White, modifier = Modifier.size(20.dp))
              Spacer(Modifier.width(8.dp))
              Column {
                Text("Right Turn", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Text("0.4 miles", color = TextMuted, fontSize = 10.sp)
              }
            }
          }

          // ETA overlay
          Box(
            modifier = Modifier
              .padding(16.dp)
              .align(Alignment.BottomEnd)
              .clip(RoundedCornerShape(8.dp))
              .background(Color(0xD91E2630))
              .padding(horizontal = 12.dp, vertical = 6.dp)
          ) {
            Column(horizontalAlignment = Alignment.End) {
              Text("ETA COUNTDOWN", color = TextMuted, fontSize = 8.sp)
              Text(eta, color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
              Text("TO DESTINATION", color = TextMuted, fontSize = 8.sp)
            }
          }
        }
      }

      Spacer(Modifier.height(12.dp))

      // Card 3: Hospital Details
      Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = CardDark),
        modifier = Modifier.fillMaxWidth()
      ) {
        Column(modifier = Modifier.padding(16.dp)) {
          Text("HOSPITAL DESTINATION CARD (#16202A)", color = TextMuted, fontSize = 10.sp, fontWeight = FontWeight.Bold)
          Spacer(Modifier.height(8.dp))
          Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
              modifier = Modifier
                .size(36.dp)
                .clip(CircleShape)
                .background(AccentBlue),
              contentAlignment = Alignment.Center
            ) {
              Text("H", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 20.sp)
            }
            Spacer(Modifier.width(12.dp))
            Column {
              Text(hospitalName, color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
              Text("DISTANCE: $hospitalDistance", color = TextMuted, fontSize = 11.sp)
            }
          }
          Spacer(Modifier.height(12.dp))
          Divider(color = Color(0xFF2C3643), thickness = 1.dp)
          Spacer(Modifier.height(12.dp))
          Text("AVAILABLE ICU BEDS: $icuBeds", color = TextMuted, fontSize = 12.sp)
          Text("CONTACT: $hospitalContact | ETA: $eta", color = TextMuted, fontSize = 12.sp)
        }
      }
    }
  }
}

@Composable
fun NeedIcon(icon: ImageVector, label: String, tint: Color) {
  Column(horizontalAlignment = Alignment.CenterHorizontally) {
    Icon(icon, contentDescription = label, tint = tint, modifier = Modifier.size(28.dp))
    Spacer(Modifier.height(4.dp))
    Text(label, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Medium)
  }
}
