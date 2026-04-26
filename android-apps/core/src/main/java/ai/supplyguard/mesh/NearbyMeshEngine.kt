package ai.supplyguard.mesh

import android.content.Context
import android.util.Log
import ai.supplyguard.data.CommandPayload
import ai.supplyguard.data.MeshEnvelope
import ai.supplyguard.data.MeshMessageType
import ai.supplyguard.db.AppDatabase
import ai.supplyguard.notify.CommandNotifications
import com.google.android.gms.nearby.Nearby
import com.google.android.gms.nearby.connection.AdvertisingOptions
import com.google.android.gms.nearby.connection.ConnectionInfo
import com.google.android.gms.nearby.connection.ConnectionLifecycleCallback
import com.google.android.gms.nearby.connection.ConnectionResolution
import com.google.android.gms.nearby.connection.ConnectionsClient
import com.google.android.gms.nearby.connection.DiscoveryOptions
import com.google.android.gms.nearby.connection.EndpointDiscoveryCallback
import com.google.android.gms.nearby.connection.Payload
import com.google.android.gms.nearby.connection.PayloadCallback
import com.google.android.gms.nearby.connection.PayloadTransferUpdate
import com.google.android.gms.nearby.connection.Strategy
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.nio.charset.StandardCharsets
import java.util.concurrent.ConcurrentHashMap

/**
 * Wi-Fi enabled mesh engine utilizing Google Nearby Connections API.
 * Uses Strategy.P2P_CLUSTER for true multi-hop mesh capability using Wi-Fi Direct/Hotspot.
 */
class NearbyMeshEngine(
  private val context: Context,
  private val db: AppDatabase,
  private val repository: MeshRepository,
  private val deviceId: String
) {
  private val appContext = context.applicationContext
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
  private val json = Json { ignoreUnknownKeys = true }
  
  private val connectionsClient: ConnectionsClient = Nearby.getConnectionsClient(appContext)
  private val SERVICE_ID = "ai.supplyguard.mesh.NEARBY_SERVICE"

  private val activeEndpoints = ConcurrentHashMap<String, Boolean>()
  private val _activeConnectionCount = MutableStateFlow(0)
  val activeConnectionCount: StateFlow<Int> = _activeConnectionCount

  private val TAG = "NearbyMeshEngine"

  @Volatile private var running: Boolean = false

  fun start() {
    if (running) return
    running = true
    Log.d(TAG, "Starting NearbyMeshEngine")
    startAdvertising()
    startDiscovery()
  }

  fun stop() {
    running = false
    connectionsClient.stopAllEndpoints()
    connectionsClient.stopAdvertising()
    connectionsClient.stopDiscovery()
    activeEndpoints.clear()
    _activeConnectionCount.value = 0
  }

  private fun startAdvertising() {
    val options = AdvertisingOptions.Builder().setStrategy(Strategy.P2P_CLUSTER).build()
    connectionsClient.startAdvertising(
      deviceId,
      SERVICE_ID,
      connectionLifecycleCallback,
      options
    ).addOnSuccessListener {
      Log.d(TAG, "Advertising started successfully")
    }.addOnFailureListener { e ->
      Log.e(TAG, "Advertising failed: ${e.message}")
      if (running) {
        scope.launch {
          delay(5000)
          startAdvertising()
        }
      }
    }
  }

  private fun startDiscovery() {
    val options = DiscoveryOptions.Builder().setStrategy(Strategy.P2P_CLUSTER).build()
    connectionsClient.startDiscovery(
      SERVICE_ID,
      endpointDiscoveryCallback,
      options
    ).addOnSuccessListener {
      Log.d(TAG, "Discovery started successfully")
    }.addOnFailureListener { e ->
      Log.e(TAG, "Discovery failed: ${e.message}")
      if (running) {
        scope.launch {
          delay(5000)
          startDiscovery()
        }
      }
    }
  }

  private val endpointDiscoveryCallback = object : EndpointDiscoveryCallback() {
    override fun onEndpointFound(endpointId: String, info: com.google.android.gms.nearby.connection.DiscoveredEndpointInfo) {
      if (!running) return
      Log.d(TAG, "Endpoint found: $endpointId (${info.endpointName})")
      connectionsClient.requestConnection(deviceId, endpointId, connectionLifecycleCallback)
    }
    override fun onEndpointLost(endpointId: String) {}
  }

  private val connectionLifecycleCallback = object : ConnectionLifecycleCallback() {
    override fun onConnectionInitiated(endpointId: String, info: ConnectionInfo) {
      // Auto-accept all connections in the cluster
      connectionsClient.acceptConnection(endpointId, payloadCallback)
    }

    override fun onConnectionResult(endpointId: String, result: ConnectionResolution) {
      if (result.status.isSuccess) {
        Log.i(TAG, "Connected to $endpointId")
        activeEndpoints[endpointId] = true
        _activeConnectionCount.value = activeEndpoints.size
        scope.launch { sendForwardCandidates(endpointId) }
      } else {
        Log.w(TAG, "Connection to $endpointId failed: ${result.status}")
      }
    }

    override fun onDisconnected(endpointId: String) {
      activeEndpoints.remove(endpointId)
      _activeConnectionCount.value = activeEndpoints.size
    }
  }

  private val payloadCallback = object : PayloadCallback() {
    override fun onPayloadReceived(endpointId: String, payload: Payload) {
      if (payload.type == Payload.Type.BYTES) {
        val bytes = payload.asBytes() ?: return
        scope.launch {
          try {
            val raw = String(bytes, StandardCharsets.UTF_8)
            val env = json.decodeFromString(MeshEnvelope.serializer(), raw)
            Log.d(TAG, "Received payload ${env.id} type=${env.type} from $endpointId")
            val isNew = repository.router.onReceive(env, rssi = null)
            if (isNew && env.type == MeshMessageType.COMMAND) {
              runCatching { json.decodeFromString(CommandPayload.serializer(), env.payload) }
                .getOrNull()
                ?.let { CommandNotifications.notifyCommand(appContext, env.id, it) }
            }
          } catch (_: Throwable) {
            // ignore malformed messages
          }
        }
      }
    }
    override fun onPayloadTransferUpdate(endpointId: String, update: PayloadTransferUpdate) {}
  }

  private suspend fun sendForwardCandidates(endpointId: String) {
    val dao = db.meshMessageDao()
    val now = System.currentTimeMillis()
    val candidates = dao.loadForwardCandidates(olderThanEpochMs = now - 25_000L).take(32)
    if (candidates.isEmpty()) return
    
    dao.markForwardAttempt(candidates.map { it.id }, now)

    for (entity in candidates) {
      val env = MeshEnvelope(
        id = entity.id,
        type = MeshMessageType.valueOf(entity.type),
        timestampEpochMs = entity.timestampEpochMs,
        ttl = entity.ttl,
        hops = entity.hops,
        originDeviceId = entity.originDeviceId,
        payload = entity.payloadJson,
      )
      if (!repository.router.shouldForward(env)) continue
      val forwarded = repository.router.decrementTtl(env)
      val bytes = json.encodeToString(MeshEnvelope.serializer(), forwarded)
        .toByteArray(StandardCharsets.UTF_8)

      connectionsClient.sendPayload(endpointId, Payload.fromBytes(bytes))
      delay(50) // Small delay to prevent flooding the pipe
    }
  }
}
