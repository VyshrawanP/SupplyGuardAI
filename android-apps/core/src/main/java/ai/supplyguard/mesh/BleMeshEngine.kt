package ai.supplyguard.mesh

import android.annotation.SuppressLint
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCallback
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattServer
import android.bluetooth.BluetoothGattServerCallback
import android.bluetooth.BluetoothGattService
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.BluetoothLeAdvertiser
import android.bluetooth.le.BluetoothLeScanner
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.Context
import android.util.Log
import android.os.ParcelUuid
import ai.supplyguard.data.CommandPayload
import ai.supplyguard.data.MeshEnvelope
import ai.supplyguard.data.MeshMessageType
import ai.supplyguard.db.AppDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import ai.supplyguard.notify.CommandNotifications
import kotlinx.serialization.json.Json
import java.nio.charset.StandardCharsets
import java.util.concurrent.ConcurrentHashMap

/**
 * Minimal BLE mesh engine:
 * - Advertises a service UUID for discovery
 * - Runs a GATT server with a single write characteristic for message exchange
 * - Scans on a duty-cycle and connects to peers to exchange "forward candidates"
 *
 * This implements store-and-forward multi-hop propagation without needing internet.
 */
class BleMeshEngine(
  private val context: Context,
  private val db: AppDatabase,
  private val repository: MeshRepository,
) {
  private val appContext = context.applicationContext
  private val scope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
  private val json = Json { ignoreUnknownKeys = true }

  private val btManager: BluetoothManager? =
    try { appContext.getSystemService(BluetoothManager::class.java) } catch (_: Throwable) { null }
  private val adapter = try { btManager?.adapter } catch (_: Throwable) { null }

  private var advertiser: BluetoothLeAdvertiser? = null
  private var scanner: BluetoothLeScanner? = null
  private var gattServer: BluetoothGattServer? = null

  private val activeConnections = ConcurrentHashMap<String, BluetoothGatt>()
  private val _activeConnectionCount = MutableStateFlow(0)
  val activeConnectionCount: StateFlow<Int> = _activeConnectionCount
  
  private val TAG = "BleMeshEngine"

  private var loopJob: Job? = null

  @Volatile private var running: Boolean = false
  @Volatile private var isAdvertising: Boolean = false

  @SuppressLint("MissingPermission")
  fun start() {
    if (running) return
    running = true
    Log.d(TAG, "Starting BleMeshEngine")

    try { startGattServer() } catch (_: Throwable) {}
    try { startAdvertising() } catch (_: Throwable) {}

    loopJob = scope.launch { dutyCycleLoop() }
  }

  @SuppressLint("MissingPermission")
  fun stop() {
    running = false
    isAdvertising = false
    loopJob?.cancel()
    loopJob = null

    try {
      adapter?.bluetoothLeScanner?.stopScan(scanCallback)
    } catch (_: Throwable) {}
    try {
      adapter?.bluetoothLeAdvertiser?.stopAdvertising(advertiseCallback)
    } catch (_: Throwable) {}

    activeConnections.values.forEach {
      try {
        it.disconnect()
        it.close()
      } catch (_: Throwable) {}
    }
    activeConnections.clear()
    _activeConnectionCount.value = 0

    try {
      gattServer?.close()
    } catch (_: Throwable) {}
    gattServer = null
  }

  @SuppressLint("MissingPermission")
  private fun startGattServer() {
    val server = try {
      btManager?.openGattServer(appContext, gattServerCallback)
    } catch (_: Throwable) { return }
    if (server == null) return
    try {
      val service = BluetoothGattService(BleUuids.SERVICE_UUID, BluetoothGattService.SERVICE_TYPE_PRIMARY)
      val messageChar = BluetoothGattCharacteristic(
        BleUuids.MESSAGE_CHAR_UUID,
        BluetoothGattCharacteristic.PROPERTY_WRITE or BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE,
        BluetoothGattCharacteristic.PERMISSION_WRITE,
      )
      service.addCharacteristic(messageChar)
      server.addService(service)
      gattServer = server
    } catch (_: Throwable) {
      try { server.close() } catch (_: Throwable) {}
    }
  }

  private val advertiseCallback = object : AdvertiseCallback() {
    override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
      Log.d(TAG, "BLE Advertising started successfully")
      isAdvertising = true
    }
    override fun onStartFailure(errorCode: Int) {
      Log.e(TAG, "BLE Advertising failed with code $errorCode")
      isAdvertising = false
    }
  }

  @SuppressLint("MissingPermission")
  private fun startAdvertising() {
    if (isAdvertising) return
    val adv = try { adapter?.bluetoothLeAdvertiser } catch (_: Throwable) { null } ?: return
    try {
      val settings = AdvertiseSettings.Builder()
        .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_BALANCED)
        .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_MEDIUM)
        .setConnectable(true)
        .build()

      val data = AdvertiseData.Builder()
        .setIncludeDeviceName(false)
        .addServiceUuid(ParcelUuid(BleUuids.SERVICE_UUID))
        .build()

      adv.startAdvertising(settings, data, advertiseCallback)
      isAdvertising = true
    } catch (_: Throwable) {
      isAdvertising = false
    }
  }

  @SuppressLint("MissingPermission")
  private suspend fun dutyCycleLoop() {
    // Simple duty cycle: scan 6s, rest 18s. Tunable for battery life.
    val scanOnMs = 6_000L
    val scanOffMs = 18_000L

    while (running) {
      try {
        if (gattServer == null) startGattServer() // retry if failed initially
        if (!isAdvertising) startAdvertising() // retry if failed initially
        startScan()
        delay(scanOnMs)
      } catch (_: Throwable) {
        // Keep loop alive.
      } finally {
        try {
          adapter?.bluetoothLeScanner?.stopScan(scanCallback)
        } catch (_: Throwable) {}
      }
      delay(scanOffMs)
    }
  }

  @SuppressLint("MissingPermission")
  private fun startScan() {
    val s = try { adapter?.bluetoothLeScanner } catch (_: Throwable) { null } ?: return
    val filters = listOf(
      ScanFilter.Builder()
        .setServiceUuid(ParcelUuid(BleUuids.SERVICE_UUID))
        .build(),
    )
    val settings = ScanSettings.Builder()
      .setScanMode(ScanSettings.SCAN_MODE_BALANCED)
      .build()

    s.startScan(filters, settings, scanCallback)
    Log.d(TAG, "BLE Scan started")
  }



  private val scanCallback = object : ScanCallback() {
    @SuppressLint("MissingPermission")
    override fun onScanResult(callbackType: Int, result: ScanResult) {
      val device = result.device ?: return
      // Avoid connecting to ourselves and avoid reconnect spam.
      if (!running) return
      if (activeConnections.containsKey(device.address)) return
      Log.d(TAG, "Device found: ${device.address} (${device.name ?: "Unknown"})")
      connectAndExchange(device)
    }
  }

  @SuppressLint("MissingPermission")
  private fun connectAndExchange(device: BluetoothDevice) {
    try {
      val gatt = device.connectGatt(appContext, false, object : BluetoothGattCallback() {
        override fun onConnectionStateChange(g: BluetoothGatt, status: Int, newState: Int) {
          if (newState == BluetoothProfile.STATE_CONNECTED) {
            Log.i(TAG, "Connected to ${device.address}")
            activeConnections[device.address] = g
            _activeConnectionCount.value = activeConnections.size
            try { g.requestMtu(512) } catch (_: Throwable) { g.requestMtu(185) }
            try { g.discoverServices() } catch (_: Throwable) {}
          } else {
            Log.i(TAG, "Disconnected from ${device.address}")
            activeConnections.remove(device.address)
            _activeConnectionCount.value = activeConnections.size
            try { g.close() } catch (_: Throwable) {}
          }
        }

        override fun onMtuChanged(g: BluetoothGatt, mtu: Int, status: Int) {
          // no-op
        }

        override fun onServicesDiscovered(g: BluetoothGatt, status: Int) {
          if (status != BluetoothGatt.GATT_SUCCESS) { g.disconnect(); return }
          val service = g.getService(BleUuids.SERVICE_UUID) ?: run { g.disconnect(); return }
          val ch = service.getCharacteristic(BleUuids.MESSAGE_CHAR_UUID) ?: run { g.disconnect(); return }
          scope.launch { sendForwardCandidates(g, ch) }
        }
      })
      if (gatt == null) return
    } catch (_: Throwable) {
      // connectGatt can throw SecurityException on MIUI if BT state is inconsistent
    }
  }

  @SuppressLint("MissingPermission")
  private suspend fun sendForwardCandidates(gatt: BluetoothGatt, ch: BluetoothGattCharacteristic) {
    val dao = db.meshMessageDao()
    val now = System.currentTimeMillis()
    val candidates = dao.loadForwardCandidates(olderThanEpochMs = now - 25_000L)
      .take(32)
    if (candidates.isEmpty()) {
      gatt.disconnect()
      return
    }
    dao.markForwardAttempt(candidates.map { it.id }, now)

    for (entity in candidates) {
      val env = MeshEnvelope(
        id = entity.id,
        type = ai.supplyguard.data.MeshMessageType.valueOf(entity.type),
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

      if (bytes.size > 512) {
        Log.w(TAG, "Payload too large for single BLE write (${bytes.size} bytes). Truncation may occur.")
      }

      ch.value = bytes
      ch.writeType = BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE
      Log.d(TAG, "Writing ${bytes.size} bytes to ${gatt.device.address}")
      val ok = gatt.writeCharacteristic(ch)
      if (!ok) {
        Log.e(TAG, "Failed to write characteristic to ${gatt.device.address}")
        break
      }
      delay(120)
    }

    gatt.disconnect()
  }

  private val gattServerCallback = object : BluetoothGattServerCallback() {
    @SuppressLint("MissingPermission")
    override fun onCharacteristicWriteRequest(
      device: BluetoothDevice,
      requestId: Int,
      characteristic: BluetoothGattCharacteristic,
      preparedWrite: Boolean,
      responseNeeded: Boolean,
      offset: Int,
      value: ByteArray,
    ) {
      if (characteristic.uuid != BleUuids.MESSAGE_CHAR_UUID) return
      scope.launch {
        try {
          val raw = String(value, StandardCharsets.UTF_8)
          val env = json.decodeFromString(MeshEnvelope.serializer(), raw)
          Log.d(TAG, "BLE received payload ${env.id} type=${env.type} from ${device.address}")
          val isNew = repository.router.onReceive(env, rssi = null)
          if (isNew && env.type == MeshMessageType.COMMAND) {
            runCatching { json.decodeFromString(CommandPayload.serializer(), env.payload) }
              .getOrNull()
              ?.let { CommandNotifications.notifyCommand(appContext, env.id, it) }
          }
          if (isNew && repository.router.shouldForward(env)) {
            // Stored; will be forwarded on the next scan/connect loop.
          }
        } catch (_: Throwable) {
          // ignore malformed messages
        }
      }
      if (responseNeeded) {
        gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, byteArrayOf())
      }
    }
  }
}
