package ai.supplyguard.commandcenter

import android.graphics.Paint
import android.preference.PreferenceManager
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.outlined.WarningAmber
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import org.osmdroid.config.Configuration
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.Polyline

// ── Models ───────────────────────────────────────────────────────────────────

data class CriticalAlert(val id: String, val title: String, val description: String, val isHazard: Boolean)

data class HospitalStatus(
  val id: String,
  val name: String,
  val level: String,
  val distance: String,
  val capacityCurrent: Int,
  val capacityMax: Int,
  val capacityPercentage: Int,
  val capacityLabel: String,
  val capacityColor: Color,
  val personnelCurrent: Int,
  val personnelMax: Int,
  val personnelPercentage: Int,
  val personnelLabel: String,
  val personnelColor: Color,
  val location: GeoPoint
)

// ── Dummy Data ───────────────────────────────────────────────────────────────

val mockAlerts = listOf(
  CriticalAlert("1", "Hazard Icons", "Disaster Areas", true),
  CriticalAlert("2", "Flooding Event", "Active decation...", true)
)

val mockHospitals = listOf(
  HospitalStatus(
    id = "1",
    name = "Saint Paul Hospital",
    level = "Level II",
    distance = "1.2 mi",
    capacityCurrent = 84, capacityMax = 100, capacityPercentage = 84,
    capacityLabel = "84% Available", capacityColor = Color(0xFF4CAF50), // Green
    personnelCurrent = 45, personnelMax = 50, personnelPercentage = 90,
    personnelLabel = "90% Full", personnelColor = Color(0xFF4CAF50),
    location = GeoPoint(12.9716 + 0.01, 77.5946 - 0.01) // Bangalore offset
  ),
  HospitalStatus(
    id = "2",
    name = "Mercy Medical Center",
    level = "General Hospital",
    distance = "2.5 mi",
    capacityCurrent = 74, capacityMax = 120, capacityPercentage = 62,
    capacityLabel = "62%", capacityColor = Color(0xFF4CAF50),
    personnelCurrent = 36, personnelMax = 50, personnelPercentage = 72,
    personnelLabel = "72%", personnelColor = Color(0xFFFFC107), // Yellow
    location = GeoPoint(12.9716 - 0.02, 77.5946 - 0.02)
  ),
  HospitalStatus(
    id = "3",
    name = "Memorial General",
    level = "Level I",
    distance = "3.1 mi",
    capacityCurrent = 182, capacityMax = 200, capacityPercentage = 91,
    capacityLabel = "91% Critical", capacityColor = Color(0xFFFF9800), // Orange
    personnelCurrent = 94, personnelMax = 100, personnelPercentage = 94,
    personnelLabel = "94% Critical", personnelColor = Color(0xFFF44336), // Red
    location = GeoPoint(12.9716 - 0.01, 77.5946 + 0.02)
  ),
  HospitalStatus(
    id = "4",
    name = "Central Clinic",
    level = "General Hospital",
    distance = "5.0 mi",
    capacityCurrent = 14, capacityMax = 40, capacityPercentage = 35,
    capacityLabel = "35%", capacityColor = Color(0xFF4CAF50),
    personnelCurrent = 20, personnelMax = 30, personnelPercentage = 66,
    personnelLabel = "66%", personnelColor = Color(0xFF4CAF50),
    location = GeoPoint(12.9716 + 0.02, 77.5946 + 0.03)
  )
)

// ── Composable ───────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardTab() {
  val context = LocalContext.current
  LaunchedEffect(Unit) {
    Configuration.getInstance().load(context, PreferenceManager.getDefaultSharedPreferences(context))
  }

  val bottomSheetState = rememberBottomSheetScaffoldState(
    bottomSheetState = rememberStandardBottomSheetState(
      initialValue = SheetValue.PartiallyExpanded
    )
  )

  BottomSheetScaffold(
    scaffoldState = bottomSheetState,
    sheetPeekHeight = 300.dp,
    sheetContainerColor = Color(0xFF151A22), // Deep navy
    sheetContentColor = Color.White,
    sheetDragHandle = { BottomSheetDefaults.DragHandle(color = Color.Gray) },
    sheetContent = {
      DashboardBottomSheetContent()
    }
  ) { padding ->
    Box(modifier = Modifier.fillMaxSize().padding(padding)) {
      AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { ctx ->
          MapView(ctx).apply {
            setMultiTouchControls(true)
            val mapController = controller
            mapController.setZoom(13.0)
            val centerPoint = GeoPoint(12.9716, 77.5946) // Bangalore
            mapController.setCenter(centerPoint)
            
            // Add custom markers
            mockHospitals.forEach { hospital ->
              val marker = Marker(this)
              marker.position = hospital.location
              marker.title = hospital.name
              // Use default marker icon but could be customized
              overlays.add(marker)
            }
            
            // Draw a pseudo route
            val route = Polyline()
            val points = listOf(
              mockHospitals[0].location,
              GeoPoint(12.9716, 77.5946),
              mockHospitals[1].location,
              mockHospitals[2].location
            )
            route.setPoints(points)
            route.outlinePaint.color = android.graphics.Color.parseColor("#2196F3") // Blue route
            route.outlinePaint.strokeWidth = 10f
            route.outlinePaint.strokeCap = Paint.Cap.ROUND
            overlays.add(route)
            
            invalidate()
          }
        }
      )
    }
  }
}

@Composable
private fun DashboardBottomSheetContent() {
  Column(
    modifier = Modifier
      .fillMaxWidth()
      .padding(horizontal = 16.dp)
      .padding(bottom = 16.dp),
    verticalArrangement = Arrangement.spacedBy(16.dp)
  ) {
    // Top Row: Alerts & Incident Status
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
      // Critical Alerts
      Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Critical Alerts (2 Active)", style = MaterialTheme.typography.titleSmall, color = Color.LightGray)
        mockAlerts.forEach { alert ->
          Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            Icon(Icons.Outlined.WarningAmber, contentDescription = null, tint = Color(0xFFFF5722), modifier = Modifier.size(16.dp))
            Text("${alert.title}: ${alert.description}", style = MaterialTheme.typography.bodySmall, maxLines = 1, overflow = TextOverflow.Ellipsis)
          }
        }
      }
      
      // Incident Status
      Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Incident Status", style = MaterialTheme.typography.titleSmall, color = Color.LightGray)
        Text("Flooding Event - Active", style = MaterialTheme.typography.bodySmall)
        Text("Personnel deployed", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
      }
    }
    
    Divider(color = Color.White.copy(alpha = 0.1f))
    
    // Hospitals Header
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.SpaceBetween,
      verticalAlignment = Alignment.CenterVertically
    ) {
      Text("Hospitals & Resource Status", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
      TextButton(onClick = { /* TODO */ }) {
        Icon(Icons.Default.List, contentDescription = null, modifier = Modifier.size(18.dp), tint = Color.LightGray)
        Spacer(Modifier.width(4.dp))
        Text("List View", color = Color.LightGray)
      }
    }
    
    // Hospital List
    LazyColumn(
      modifier = Modifier.fillMaxWidth(),
      verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
      items(mockHospitals) { hospital ->
        HospitalStatusCard(hospital)
      }
    }
  }
}

@Composable
private fun HospitalStatusCard(hospital: HospitalStatus) {
  Card(
    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E2630)),
    modifier = Modifier.fillMaxWidth()
  ) {
    Row(
      modifier = Modifier.fillMaxWidth().padding(12.dp),
      horizontalArrangement = Arrangement.SpaceBetween
    ) {
      // Left side: Name & Distance
      Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(hospital.name + if (hospital.level != "General Hospital") " (${hospital.level})" else "", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
        Text("General Hospital", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
          Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(12.dp), tint = Color.Gray)
          Text("Distance: ${hospital.distance}", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
        }
      }
      
      // Right side: Progress Bars
      Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        // Capacity Bar
        Column(horizontalAlignment = Alignment.End) {
          Text("Capacity: ${hospital.capacityPercentage}% [${hospital.capacityCurrent}/${hospital.capacityMax}]", style = MaterialTheme.typography.labelSmall, color = Color.LightGray)
          Spacer(Modifier.height(4.dp))
          CustomProgressBar(percentage = hospital.capacityPercentage, label = hospital.capacityLabel, color = hospital.capacityColor)
        }
        
        // Personnel Bar
        Column(horizontalAlignment = Alignment.End) {
          Text("Personnel: ${hospital.personnelPercentage}% [${hospital.personnelCurrent}/${hospital.personnelMax}]", style = MaterialTheme.typography.labelSmall, color = Color.LightGray)
          Spacer(Modifier.height(4.dp))
          CustomProgressBar(percentage = hospital.personnelPercentage, label = hospital.personnelLabel, color = hospital.personnelColor)
        }
      }
    }
  }
}

@Composable
private fun CustomProgressBar(percentage: Int, label: String, color: Color) {
  Box(
    modifier = Modifier
      .fillMaxWidth(0.8f) // Make it take up 80% of its container
      .height(16.dp)
      .clip(RoundedCornerShape(8.dp))
      .background(Color(0xFF2C3545))
  ) {
    Box(
      modifier = Modifier
        .fillMaxWidth(percentage / 100f)
        .fillMaxHeight()
        .background(color),
      contentAlignment = Alignment.CenterEnd
    ) {
      Text(
        text = label,
        color = Color.Black,
        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold, fontSize = androidx.compose.ui.unit.TextUnit(10f, androidx.compose.ui.unit.TextUnitType.Sp)),
        modifier = Modifier.padding(end = 4.dp),
        maxLines = 1
      )
    }
    if (percentage < 30) {
      // If percentage is too small to fit the text inside the colored bar, draw it outside
      Text(
        text = label,
        color = color,
        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold, fontSize = androidx.compose.ui.unit.TextUnit(10f, androidx.compose.ui.unit.TextUnitType.Sp)),
        modifier = Modifier.padding(start = 4.dp).align(Alignment.CenterStart)
      )
    }
  }
}
