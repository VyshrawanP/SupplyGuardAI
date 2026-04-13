import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/services.dart';

import 'mesh_transport.dart';

/// Android-only BLE mesh transport via platform channels.
///
/// Notes:
/// - This requires an Android implementation that provides:
///   - MethodChannel `supplyguard/mesh_ble` methods: `start`, `stop`, `sendToAll`
///   - EventChannel `supplyguard/mesh_ble_events` events: `status`, `frame`, `error`
class MeshBleChannelTransport implements MeshTransport {
  static const MethodChannel _method = MethodChannel('supplyguard/mesh_ble');
  static const EventChannel _events = EventChannel('supplyguard/mesh_ble_events');

  final _inboundController = StreamController<MeshInboundFrame>.broadcast();
  final _statusController = StreamController<MeshTransportStatus>.broadcast();

  StreamSubscription<dynamic>? _sub;
  MeshTransportStatus _lastStatus = MeshTransportStatus(
    running: false,
    peerCount: 0,
    peerIds: const <String>[],
    lastError: null,
  );

  @override
  Stream<MeshInboundFrame> get inboundFrames => _inboundController.stream;

  @override
  Stream<MeshTransportStatus> get statusStream => _statusController.stream;

  Future<void> _ensureListening() async {
    _sub ??= _events.receiveBroadcastStream().listen((event) {
      if (event is Map) {
        final type = event['type']?.toString();
        if (type == 'status') {
          final running = event['running'] == true;
          final peerIds = (event['peerIds'] is List)
              ? (event['peerIds'] as List).map((e) => e.toString()).toList()
              : <String>[];
          final status = MeshTransportStatus(
            running: running,
            peerCount: peerIds.length,
            peerIds: peerIds,
            lastError: event['lastError']?.toString(),
          );
          _lastStatus = status;
          _statusController.add(status);
          return;
        }

        if (type == 'frame') {
          final from = event['fromPeerId']?.toString() ?? 'unknown';
          final b64 = event['b64']?.toString();
          if (b64 == null) return;
          final bytes = base64Decode(b64);
          _inboundController.add(MeshInboundFrame(fromPeerId: from, bytes: Uint8List.fromList(bytes)));
          return;
        }

        if (type == 'error') {
          _lastStatus = MeshTransportStatus(
            running: _lastStatus.running,
            peerCount: _lastStatus.peerCount,
            peerIds: _lastStatus.peerIds,
            lastError: event['message']?.toString() ?? 'mesh_ble_error',
          );
          _statusController.add(_lastStatus);
          return;
        }
      }
    });
  }

  @override
  Future<void> start({required String deviceName}) async {
    await _ensureListening();
    await _method.invokeMethod<void>('start', <String, dynamic>{'deviceName': deviceName});
  }

  @override
  Future<void> stop() async {
    await _method.invokeMethod<void>('stop');
  }

  @override
  Future<void> sendToAll(Uint8List bytes) async {
    await _method.invokeMethod<void>('sendToAll', <String, dynamic>{
      'b64': base64Encode(bytes),
    });
  }

  Future<void> dispose() async {
    await _sub?.cancel();
    await _inboundController.close();
    await _statusController.close();
  }
}

