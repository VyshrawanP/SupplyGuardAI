import 'dart:async';
import 'dart:typed_data';

import 'mesh_transport.dart';

/// Fan-in/fan-out transport to combine BLE mesh and LAN relay.
class MeshCompositeTransport implements MeshTransport {
  MeshCompositeTransport(this._transports);

  final List<MeshTransport> _transports;

  final _inboundController = StreamController<MeshInboundFrame>.broadcast();
  final _statusController = StreamController<MeshTransportStatus>.broadcast();

  final List<StreamSubscription<dynamic>> _subs = <StreamSubscription<dynamic>>[];

  final Map<int, MeshTransportStatus> _latest = <int, MeshTransportStatus>{};

  @override
  Stream<MeshInboundFrame> get inboundFrames => _inboundController.stream;

  @override
  Stream<MeshTransportStatus> get statusStream => _statusController.stream;

  void _emitMerged() {
    final statuses = _latest.values.toList(growable: false);
    final running = statuses.any((s) => s.running);
    final peerIds = <String>[];
    for (final s in statuses) {
      peerIds.addAll(s.peerIds);
    }
    final lastError = statuses.map((s) => s.lastError).whereType<String>().toList().lastOrNull;
    _statusController.add(
      MeshTransportStatus(
        running: running,
        peerCount: peerIds.length,
        peerIds: peerIds,
        lastError: lastError,
      ),
    );
  }

  @override
  Future<void> start({required String deviceName}) async {
    await stop();
    for (var i = 0; i < _transports.length; i++) {
      final t = _transports[i];
      _subs.add(t.inboundFrames.listen(_inboundController.add));
      _subs.add(t.statusStream.listen((status) {
        _latest[i] = status;
        _emitMerged();
      }));
      // Start transports sequentially; one failure shouldn't block the rest.
      try {
        await t.start(deviceName: deviceName);
      } catch (_) {
        // ignore
      }
    }
  }

  @override
  Future<void> stop() async {
    for (final sub in _subs) {
      await sub.cancel();
    }
    _subs.clear();
    _latest.clear();
    for (final t in _transports) {
      try {
        await t.stop();
      } catch (_) {}
    }
  }

  @override
  Future<void> sendToAll(Uint8List bytes) async {
    for (final t in _transports) {
      try {
        await t.sendToAll(bytes);
      } catch (_) {
        // ignore
      }
    }
  }

  Future<void> dispose() async {
    await stop();
    await _inboundController.close();
    await _statusController.close();
  }
}

extension<T> on List<T> {
  T? get lastOrNull => isEmpty ? null : this[length - 1];
}

