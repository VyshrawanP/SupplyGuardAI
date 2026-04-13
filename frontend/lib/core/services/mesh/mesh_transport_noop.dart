import 'dart:async';
import 'dart:typed_data';

import 'mesh_transport.dart';

class MeshNoopTransport implements MeshTransport {
  final _inboundController = StreamController<MeshInboundFrame>.broadcast();
  final _statusController = StreamController<MeshTransportStatus>.broadcast();

  MeshTransportStatus _status = MeshTransportStatus(
    running: false,
    peerCount: 0,
    peerIds: const <String>[],
    lastError: 'mesh_transport_unavailable',
  );

  @override
  Stream<MeshInboundFrame> get inboundFrames => _inboundController.stream;

  @override
  Stream<MeshTransportStatus> get statusStream => _statusController.stream;

  @override
  Future<void> start({required String deviceName}) async {
    _status = MeshTransportStatus(
      running: false,
      peerCount: 0,
      peerIds: const <String>[],
      lastError: 'mesh_transport_unavailable',
    );
    _statusController.add(_status);
  }

  @override
  Future<void> stop() async {
    _status = MeshTransportStatus(
      running: false,
      peerCount: 0,
      peerIds: const <String>[],
      lastError: 'mesh_transport_unavailable',
    );
    _statusController.add(_status);
  }

  @override
  Future<void> sendToAll(Uint8List bytes) async {
    // noop
  }

  Future<void> dispose() async {
    await _inboundController.close();
    await _statusController.close();
  }
}

