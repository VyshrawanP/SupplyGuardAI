import 'dart:async';
import 'dart:typed_data';

class MeshInboundFrame {
  MeshInboundFrame({
    required this.fromPeerId,
    required this.bytes,
  });

  final String fromPeerId;
  final Uint8List bytes;
}

class MeshTransportStatus {
  MeshTransportStatus({
    required this.running,
    required this.peerCount,
    required this.peerIds,
    required this.lastError,
  });

  final bool running;
  final int peerCount;
  final List<String> peerIds;
  final String? lastError;
}

abstract class MeshTransport {
  Stream<MeshInboundFrame> get inboundFrames;
  Stream<MeshTransportStatus> get statusStream;

  Future<void> start({required String deviceName});
  Future<void> stop();

  Future<void> sendToAll(Uint8List bytes);
}

