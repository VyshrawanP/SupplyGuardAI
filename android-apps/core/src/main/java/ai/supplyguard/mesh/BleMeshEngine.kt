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
import android.os.ParcelUuid
import ai.supplyguard.data.MeshEnvelope
import ai.supplyguard.db.AppDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
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

  private val btManager: BluetoothManager =
    appContext.getSystemService(BluetoothManager::class.java)
  private val adapter = btManager.adapter

  private var advertiser: BluetoothLeAdvertiser? = null
  private var scanner: BluetoothLeScanner? = null
  private var gattServer: BluetoothGattServer? = null

  private val activeConnections = ConcurrentHashMap<String, BluetoothGatt>()
  private var loopJob: Job? = null

  @Volatile private var running: Boolean = false

  fun start() {
    if (running) return
    running = true

    advertiser = adapter.bluetoothLeAdvertiser
    scanner = adapter.bluetoothLeScanner

    startGattServer()
    startAdvertising()

    loopJob = scope.launch { dutyCycleLoop() }
  }

  fun stop() {
    running = false
    loopJob?.cancel()
    loopJob = null

    try {
      scanner?.stopScan(scanCallback)
    } catch (_: Throwable) {}
    try {
      advertiser?.stopAdvertising(advertiseCallback)
    } catch (_: Throwable) {}

    activeConnections.values.forEach {
      try {
        it.disconnect()
        it.close()
      } catch (_: Throwable) {}
    }
    activeConnections.clear()

    try {
      gattServer?.close()
    } catch (_: Throwable) {}
    gattServer = null
  }

  private fun startGattServer() {
    val server = btManager.openGattServer(appContext, gattServerCallback)
    val service = BluetoothGattService(BleUuids.SERVICE_UUID, BluetoothGattService.SERVICE_TYPE_PRIMARY)
    val messageChar = BluetoothGattCharacteristic(
      BleUuids.MESSAGE_CHAR_UUID,
      BluetoothGattCharacteristic.PROPERTY_WRITE or BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE,
      BluetoothGattCharacteristic.PERMISSION_WRITE,
    )
    service.addCharacteristic(messageChar)
    server.addService(service)
    gattServer = server
  }

  private fun startAdvertising() {
    val adv = advertiser ?: return

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
  }

  @SuppressLint("MissingPermission")
  private suspend fun dutyCycleLoop() {
    // Simple duty cycle: scan 6s, rest 18s. Tunable for battery life.
    val scanOnMs = 6_000L
    val scanOffMs = 18_000L

    while (running) {
      try {
        startScan()
        delay(scanOnMs)
      } catch (_: Throwable) {
        // Keep loop alive.
      } finally {
        try {
          scanner?.stopScan(scanCallback)
        } catch (_: Throwable) {}
      }
      delay(scanOffMs)
    }
  }

  @SuppressLint("MissingPermission")
  private fun startScan() {
    val s = scanner ?: return
    val filters = listOf(
      ScanFilter.Builder()
        .setServiceUuid(ParcelUuid(BleUuids.SERVICE_UUID))
        .build(),
    )
    val settings = ScanSettings.Builder()
      .setScanMode(ScanSettings.SCAN_MODE_BALANCED)
      .build()

    s.startScan(filters, settings, scanCallback)
  }

  private val advertiseCallback = object : AdvertiseCallback() {}

  private val scanCallback = object : ScanCallback() {
    override fun onScanResult(callbackType: Int, result: ScanResult) {
      val device = result.device ?: return
      // Avoid connecting to ourselves and avoid reconnect spam.
      if (!running) return
      val key = device.address
      if (activeConnections.containsKey(key)) return
      connectAndExchange(device)
    }
  }

  @SuppressLint("MissingPermission")
  private fun connectAndExchange(device: BluetoothDevice) {
    val gatt = device.connectGatt(appContext, false, object : BluetoothGattCallback() {
      override fun onConnectionStateChange(g: BluetoothGatt, status: Int, newState: Int) {
        if (newState == BluetoothProfile.STATE_CONNECTED) {
          activeConnections[device.address] = g
          g.requestMtu(185)
          g.discoverServices()
        } else {
          activeConnections.remove(device.address)
          try {
            g.close()
          } catch (_: Throwable) {}
        }
      }

      override fun onMtuChanged(g: BluetoothGatt, mtu: Int, status: Int) {
        // no-op
      }

      override fun onServicesDiscovered(g: BluetoothGatt, status: Int) {
        if (status != BluetoothGatt.GATT_SUCCESS) {
          g.disconnect()
          return
        }
        val service = g.getService(BleUuids.SERVICE_UUID) ?: run {
          g.disconnect()
          return
        }
        val ch = service.getCharacteristic(BleUuids.MESSAGE_CHAR_UUID) ?: run {
          g.disconnect()
          return
        }
        scope.launch { sendForwardCandidates(g, ch) }
      }
    })
    // In case connectGatt returns immediately null on some devices, ignore.
    if (gatt == null) return
  }

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

      ch.value = bytes
      ch.writeType = BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE
      val ok = gatt.writeCharacteristic(ch)
      if (!ok) break
      delay(90)
    }

    gatt.disconnect()
  }

  private val gattServerCallback = object : BluetoothGattServerCallback() {
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
          val isNew = repository.router.onReceive(env, rssi = null)
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

