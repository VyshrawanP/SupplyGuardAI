package com.example.supplyguard_ai_frontend

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCallback
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor
import android.bluetooth.BluetoothGattServer
import android.bluetooth.BluetoothGattServerCallback
import android.bluetooth.BluetoothGattService
import android.bluetooth.BluetoothManager
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
import android.util.Base64
import android.util.Log
import androidx.annotation.Keep
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import kotlin.math.min

@Keep
class MeshBlePlugin : FlutterPlugin, MethodChannel.MethodCallHandler, EventChannel.StreamHandler {
  companion object {
    private const val TAG = "MeshBle"

    private val SERVICE_UUID: UUID = UUID.fromString("0000feed-0000-1000-8000-00805f9b34fb")
    private val CHAR_UUID: UUID = UUID.fromString("0000beef-0000-1000-8000-00805f9b34fb")
    private val CCCD_UUID: UUID = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb")

    // frame header:
    // [0] version (1)
    // [1..4] msgId (uint32)
    // [5..6] totalLen (uint16)
    // [7..8] offset (uint16)
    private const val HEADER_SIZE = 9
    private const val VERSION: Byte = 1
    private const val MAX_CHUNK = 180
  }

  private lateinit var context: Context
  private lateinit var method: MethodChannel
  private lateinit var events: EventChannel
  private var sink: EventChannel.EventSink? = null

  private var running = false
  private var lastError: String? = null

  private var adapter: BluetoothAdapter? = null
  private var manager: BluetoothManager? = null
  private var advertiser: BluetoothLeAdvertiser? = null
  private var scanner: BluetoothLeScanner? = null
  private var gattServer: BluetoothGattServer? = null

  private var characteristic: BluetoothGattCharacteristic? = null

  private val peers = ConcurrentHashMap<String, PeerLink>()
  private val inboundAssemblies = ConcurrentHashMap<String, Assembly>()

  override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    context = binding.applicationContext
    method = MethodChannel(binding.binaryMessenger, "supplyguard/mesh_ble")
    events = EventChannel(binding.binaryMessenger, "supplyguard/mesh_ble_events")
    method.setMethodCallHandler(this)
    events.setStreamHandler(this)

    manager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    adapter = manager?.adapter
    advertiser = adapter?.bluetoothLeAdvertiser
    scanner = adapter?.bluetoothLeScanner
  }

  override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    stopInternal()
    method.setMethodCallHandler(null)
    events.setStreamHandler(null)
  }

  override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
    sink = events
    emitStatus()
  }

  override fun onCancel(arguments: Any?) {
    sink = null
  }

  override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
    when (call.method) {
      "start" -> {
        val deviceName = (call.argument<String>("deviceName") ?: "SupplyGuard").take(16)
        startInternal(deviceName)
        result.success(null)
      }
      "stop" -> {
        stopInternal()
        result.success(null)
      }
      "sendToAll" -> {
        val b64 = call.argument<String>("b64")
        if (b64 == null) {
          result.error("bad_args", "missing b64", null)
          return
        }
        val bytes = Base64.decode(b64, Base64.DEFAULT)
        sendToAll(bytes)
        result.success(null)
      }
      else -> result.notImplemented()
    }
  }

  private fun startInternal(deviceName: String) {
    if (running) return
    lastError = null

    val bt = adapter
    if (bt == null || !bt.isEnabled) {
      lastError = "bluetooth_disabled"
      emitError(lastError!!)
      emitStatus()
      return
    }

    try {
      bt.name = deviceName
    } catch (e: Throwable) {
      // ignore
    }

    try {
      setupGattServer()
      startAdvertising()
      startScanning()
      running = true
      emitStatus()
    } catch (e: Throwable) {
      lastError = "start_failed:${e.message}"
      emitError(lastError!!)
      emitStatus()
    }
  }

  private fun stopInternal() {
    if (!running && peers.isEmpty()) return
    running = false
    try {
      advertiser?.stopAdvertising(advertiseCallback)
    } catch (_: Throwable) {}
    try {
      scanner?.stopScan(scanCallback)
    } catch (_: Throwable) {}
    try {
      for (p in peers.values) {
        try { p.gatt?.close() } catch (_: Throwable) {}
      }
    } finally {
      peers.clear()
    }
    try {
      gattServer?.close()
    } catch (_: Throwable) {}
    gattServer = null
    characteristic = null
    inboundAssemblies.clear()
    emitStatus()
  }

  private fun setupGattServer() {
    val mgr = manager ?: throw IllegalStateException("no_bt_manager")
    val server = mgr.openGattServer(context, gattServerCallback)
    gattServer = server

    val svc = BluetoothGattService(SERVICE_UUID, BluetoothGattService.SERVICE_TYPE_PRIMARY)
    val chr = BluetoothGattCharacteristic(
      CHAR_UUID,
      BluetoothGattCharacteristic.PROPERTY_WRITE or BluetoothGattCharacteristic.PROPERTY_NOTIFY,
      BluetoothGattCharacteristic.PERMISSION_WRITE
    )
    val cccd = BluetoothGattDescriptor(
      CCCD_UUID,
      BluetoothGattDescriptor.PERMISSION_READ or BluetoothGattDescriptor.PERMISSION_WRITE
    )
    chr.addDescriptor(cccd)
    svc.addCharacteristic(chr)
    server.addService(svc)
    characteristic = chr
  }

  private fun startAdvertising() {
    val adv = advertiser ?: throw IllegalStateException("no_advertiser")
    val settings = AdvertiseSettings.Builder()
      .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
      .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
      .setConnectable(true)
      .build()
    val data = AdvertiseData.Builder()
      .setIncludeDeviceName(true)
      .addServiceUuid(ParcelUuid(SERVICE_UUID))
      .build()
    adv.startAdvertising(settings, data, advertiseCallback)
  }

  private fun startScanning() {
    val scn = scanner ?: throw IllegalStateException("no_scanner")
    val filter = ScanFilter.Builder().setServiceUuid(ParcelUuid(SERVICE_UUID)).build()
    val settings = ScanSettings.Builder()
      .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
      .build()
    scn.startScan(listOf(filter), settings, scanCallback)
  }

  private fun connectTo(device: BluetoothDevice) {
    val addr = device.address ?: return
    if (peers.containsKey(addr)) return

    try {
      val gatt = device.connectGatt(context, false, gattCallback)
      peers[addr] = PeerLink(device = device, gatt = gatt, characteristic = null)
      emitStatus()
    } catch (e: Throwable) {
      lastError = "connect_failed:${e.message}"
      emitError(lastError!!)
      emitStatus()
    }
  }

  private fun sendToAll(payload: ByteArray) {
    if (peers.isEmpty()) {
      emitError("no_peers_in_range")
      return
    }
    val msgId = (System.nanoTime() and 0xffffffffL).toInt()
    val totalLen = payload.size
    var offset = 0

    while (offset < totalLen) {
      val chunkLen = min(MAX_CHUNK, totalLen - offset)
      val frame = ByteArray(HEADER_SIZE + chunkLen)
      frame[0] = VERSION
      val header = ByteBuffer.wrap(frame).order(ByteOrder.BIG_ENDIAN)
      header.put(0, VERSION)
      header.putInt(1, msgId)
      header.putShort(5, totalLen.toShort())
      header.putShort(7, offset.toShort())
      System.arraycopy(payload, offset, frame, HEADER_SIZE, chunkLen)

      // Central links
      for (p in peers.values) {
        val gatt = p.gatt ?: continue
        val chr = p.characteristic ?: continue
        chr.value = frame
        chr.writeType = BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT
        try {
          gatt.writeCharacteristic(chr)
        } catch (_: Throwable) {}
      }

      // Peripheral notify (best effort broadcast to subscribed centrals)
      val server = gattServer
      val chrServer = characteristic
      if (server != null && chrServer != null) {
        chrServer.value = frame
        // notify all connected devices known by server callback; we don't have the list here,
        // but Android will ignore if no subscriptions exist.
        // Note: for true broadcast, centrals should subscribe to notifications.
      }

      offset += chunkLen
    }
  }

  private fun handleInboundFrame(fromPeerId: String, frame: ByteArray) {
    if (frame.size < HEADER_SIZE) return
    if (frame[0] != VERSION) return

    val buf = ByteBuffer.wrap(frame).order(ByteOrder.BIG_ENDIAN)
    val msgId = buf.getInt(1)
    val totalLen = (buf.getShort(5).toInt() and 0xffff)
    val offset = (buf.getShort(7).toInt() and 0xffff)
    val chunk = frame.copyOfRange(HEADER_SIZE, frame.size)

    val key = "$fromPeerId:$msgId"
    val assembly = inboundAssemblies.getOrPut(key) { Assembly(totalLen) }
    assembly.put(offset, chunk)

    if (assembly.isComplete()) {
      inboundAssemblies.remove(key)
      emitFrame(fromPeerId, assembly.bytes)
    }
  }

  private fun emitStatus() {
    val ids = peers.keys().toList()
    sink?.success(
      mapOf(
        "type" to "status",
        "running" to running,
        "peerIds" to ids,
        "lastError" to lastError
      )
    )
  }

  private fun emitError(message: String) {
    sink?.success(mapOf("type" to "error", "message" to message))
  }

  private fun emitFrame(fromPeerId: String, payload: ByteArray) {
    sink?.success(
      mapOf(
        "type" to "frame",
        "fromPeerId" to fromPeerId,
        "b64" to Base64.encodeToString(payload, Base64.NO_WRAP)
      )
    )
  }

  private val advertiseCallback = object : AdvertiseCallback() {
    override fun onStartFailure(errorCode: Int) {
      lastError = "advertise_failed:$errorCode"
      emitError(lastError!!)
      emitStatus()
    }
  }

  private val scanCallback = object : ScanCallback() {
    override fun onScanResult(callbackType: Int, result: ScanResult) {
      val device = result.device ?: return
      connectTo(device)
    }
  }

  private val gattCallback = object : BluetoothGattCallback() {
    override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
      if (newState == BluetoothGatt.STATE_CONNECTED) {
        try { gatt.discoverServices() } catch (_: Throwable) {}
      }
      if (newState == BluetoothGatt.STATE_DISCONNECTED) {
        val addr = gatt.device?.address
        if (addr != null) {
          peers.remove(addr)
          emitStatus()
        }
        try { gatt.close() } catch (_: Throwable) {}
      }
    }

    override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
      val addr = gatt.device?.address ?: return
      val svc = gatt.getService(SERVICE_UUID) ?: return
      val chr = svc.getCharacteristic(CHAR_UUID) ?: return
      peers[addr]?.characteristic = chr
      emitStatus()
      // notifications
      try {
        gatt.setCharacteristicNotification(chr, true)
        val desc = chr.getDescriptor(CCCD_UUID)
        desc.value = BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
        gatt.writeDescriptor(desc)
      } catch (_: Throwable) {}
      // request larger MTU if possible
      try { gatt.requestMtu(247) } catch (_: Throwable) {}
    }

    override fun onCharacteristicChanged(gatt: BluetoothGatt, characteristic: BluetoothGattCharacteristic) {
      val addr = gatt.device?.address ?: return
      val value = characteristic.value ?: return
      handleInboundFrame(addr, value)
    }

    override fun onCharacteristicWrite(gatt: BluetoothGatt, characteristic: BluetoothGattCharacteristic, status: Int) {
      // no-op
    }
  }

  private val gattServerCallback = object : BluetoothGattServerCallback() {
    override fun onCharacteristicWriteRequest(
      device: BluetoothDevice,
      requestId: Int,
      characteristic: BluetoothGattCharacteristic,
      preparedWrite: Boolean,
      responseNeeded: Boolean,
      offset: Int,
      value: ByteArray?
    ) {
      val server = gattServer
      if (responseNeeded && server != null) {
        server.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, null)
      }
      val addr = device.address ?: "unknown"
      if (value != null) {
        handleInboundFrame(addr, value)
      }
    }
  }

  private data class PeerLink(
    val device: BluetoothDevice,
    var gatt: BluetoothGatt?,
    var characteristic: BluetoothGattCharacteristic?
  )

  private class Assembly(total: Int) {
    val bytes: ByteArray = ByteArray(total)
    private val received = BooleanArray(total)
    private var receivedCount = 0

    fun put(offset: Int, chunk: ByteArray) {
      val end = min(bytes.size, offset + chunk.size)
      var i = offset
      var j = 0
      while (i < end && j < chunk.size) {
        bytes[i] = chunk[j]
        if (!received[i]) {
          received[i] = true
          receivedCount += 1
        }
        i += 1
        j += 1
      }
    }

    fun isComplete(): Boolean = receivedCount >= bytes.size
  }
}

