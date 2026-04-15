import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import 'mesh_models.dart';
import 'mesh_transport.dart';

class MeshService extends ChangeNotifier {
  MeshService({required MeshTransport transport}) : _transport = transport;

  static const _prefsSeenKey = 'sg_mesh_seen_ids_v1';
  static const _prefsInboxKey = 'sg_mesh_inbox_v1';

  // Keep memory bounded.
  static const _maxSeen = 800;
  static const _maxInbox = 120;

  final MeshTransport _transport;

  StreamSubscription<MeshInboundFrame>? _inboundSub;
  StreamSubscription<MeshTransportStatus>? _statusSub;

  String _deviceId = 'unknown';
  MeshTransportStatus _status = MeshTransportStatus(
    running: false,
    peerCount: 0,
    peerIds: const <String>[],
    lastError: null,
  );

  final Set<String> _seenIds = <String>{};
  final List<MeshAlertMessage> _inbox = <MeshAlertMessage>[];

  final Map<String, Completer<void>> _pendingAcks = <String, Completer<void>>{};

  String get deviceId => _deviceId;
  MeshTransportStatus get status => _status;
  List<MeshAlertMessage> get inbox => List.unmodifiable(_inbox);

  bool get running => _status.running;

  Future<void> initialize() async {
    final prefs = await SharedPreferences.getInstance();

    _deviceId = prefs.getString('sg_mesh_device_id') ?? const Uuid().v4();
    await prefs.setString('sg_mesh_device_id', _deviceId);

    final seen = prefs.getStringList(_prefsSeenKey) ?? <String>[];
    _seenIds
      ..clear()
      ..addAll(seen.take(_maxSeen));

    final inboxRaw = prefs.getStringList(_prefsInboxKey) ?? <String>[];
    _inbox
      ..clear()
      ..addAll(inboxRaw
          .map((e) => _tryDecodeAlert(e))
          .whereType<MeshAlertMessage>()
          .take(_maxInbox));

    notifyListeners();
  }

  Future<void> start() async {
    // Start even if no internet; this is local-radio style.
    await _transport.start(deviceName: 'SupplyGuard-${_deviceId.substring(0, 4)}');

    _inboundSub ??= _transport.inboundFrames.listen(_onFrame);
    _statusSub ??= _transport.statusStream.listen((value) {
      _status = value;
      notifyListeners();
    });
  }

  Future<void> stop() async {
    await _transport.stop();
    await _inboundSub?.cancel();
    await _statusSub?.cancel();
    _inboundSub = null;
    _statusSub = null;
  }

  Future<void> broadcastAlert({
    required String message,
    required MeshSeverity severity,
    required double lat,
    required double lng,
    int ttl = 6,
    String? targetDeviceId,
    Duration deliveryTimeout = const Duration(seconds: 30),
  }) async {
    final trimmed = message.trim();
    if (trimmed.isEmpty) return;

    if (_status.peerCount == 0) {
      // No peers in range to hop through.
      throw StateError('No nearby devices in range');
    }

    final packetId = const Uuid().v4();
    final packet = MeshPacket(
      id: packetId,
      type: 'alert',
      originDeviceId: _deviceId,
      targetDeviceId: targetDeviceId,
      timestampIso: DateTime.now().toIso8601String(),
      ttl: ttl,
      hops: 0,
      payload: <String, dynamic>{
        'message': trimmed,
        'severity': severity.name,
        'lat': lat,
        'lng': lng,
      },
      trace: <String>[_deviceId],
    );

    _rememberSeen(packet.id);
    _addToInbox(_toAlertMessage(packet));

    if (targetDeviceId != null) {
      final completer = Completer<void>();
      _pendingAcks[packet.id] = completer;
      Timer(deliveryTimeout, () {
        if (!completer.isCompleted) {
          completer.completeError(StateError('Out of range: delivery not acknowledged'));
        }
        _pendingAcks.remove(packet.id);
      });
    }

    await _transport.sendToAll(utf8.encode(packet.encodeUtf8Json()));

    if (targetDeviceId != null) {
      await _pendingAcks[packet.id]!.future;
    }
  }

  void _onFrame(MeshInboundFrame frame) {
    try {
      final raw = utf8.decode(frame.bytes, allowMalformed: true);
      final decoded = jsonDecode(raw);
      if (decoded is! Map<String, dynamic>) return;
      final packet = MeshPacket.fromJson(decoded);
      _handlePacket(packet, fromPeerId: frame.fromPeerId);
    } catch (_) {
      // ignore malformed frames
    }
  }

  void _handlePacket(MeshPacket packet, {required String fromPeerId}) {
    if (packet.id.isEmpty) return;
    if (_seenIds.contains(packet.id)) return;

    _rememberSeen(packet.id);

    final traced = <String>[
      ...(packet.trace ?? const <String>[]),
      _deviceId,
    ];

    if (packet.type == 'ack') {
      final ackFor = packet.payload['ackFor']?.toString();
      if (ackFor != null) {
        final pending = _pendingAcks.remove(ackFor);
        pending?.complete();
      }
      // Forward ACK toward the origin too (multi-hop).
      _forwardIfPossible(packet.copyWith(ttl: packet.ttl - 1, hops: packet.hops + 1, trace: traced), exceptPeerId: fromPeerId);
      return;
    }

    if (packet.type != 'alert') return;

    _addToInbox(_toAlertMessage(packet.copyWith(trace: traced)));

    final target = packet.targetDeviceId;
    final isTargeted = target != null;
    final isForMe = !isTargeted || target == _deviceId;

    if (isForMe && isTargeted) {
      // Send ACK back into the mesh. It will be relayed hop-by-hop.
      final ack = MeshPacket(
        id: const Uuid().v4(),
        type: 'ack',
        originDeviceId: _deviceId,
        targetDeviceId: packet.originDeviceId,
        timestampIso: DateTime.now().toIso8601String(),
        ttl: max(1, min(10, packet.ttl)),
        hops: 0,
        payload: <String, dynamic>{'ackFor': packet.id},
        trace: <String>[_deviceId],
      );
      _transport.sendToAll(utf8.encode(ack.encodeUtf8Json()));
    }

    _forwardIfPossible(
      packet.copyWith(ttl: packet.ttl - 1, hops: packet.hops + 1, trace: traced),
      exceptPeerId: fromPeerId,
    );
  }

  void _forwardIfPossible(MeshPacket packet, {required String exceptPeerId}) {
    if (packet.ttl <= 0) return;

    // If targeted and we are the target, do not keep flooding.
    final target = packet.targetDeviceId;
    if (target != null && target == _deviceId) return;

    // Best-effort flood to peers. Transport may choose to ignore exceptPeerId internally.
    _transport.sendToAll(utf8.encode(packet.encodeUtf8Json()));
  }

  MeshAlertMessage _toAlertMessage(MeshPacket packet) {
    final payload = packet.payload;
    final severityRaw = payload['severity']?.toString() ?? 'high';
    final severity = MeshSeverity.values.firstWhere(
      (e) => e.name == severityRaw,
      orElse: () => MeshSeverity.high,
    );
    return MeshAlertMessage(
      id: packet.id,
      message: payload['message']?.toString() ?? '',
      severity: severity,
      lat: (payload['lat'] is num) ? (payload['lat'] as num).toDouble() : 0,
      lng: (payload['lng'] is num) ? (payload['lng'] as num).toDouble() : 0,
      timestampIso: packet.timestampIso,
      originDeviceId: packet.originDeviceId,
      targetDeviceId: packet.targetDeviceId,
      ttl: packet.ttl,
      hops: packet.hops,
      trace: packet.trace,
    );
  }

  MeshAlertMessage? _tryDecodeAlert(String raw) {
    try {
      final json = jsonDecode(raw) as Map<String, dynamic>;
      final packet = MeshPacket.fromJson(json);
      if (packet.type != 'alert') return null;
      return _toAlertMessage(packet);
    } catch (_) {
      return null;
    }
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_prefsSeenKey, _seenIds.toList(growable: false));

    final inboxPackets = _inbox
        .take(_maxInbox)
        .map((msg) => MeshPacket(
              id: msg.id,
              type: 'alert',
              originDeviceId: msg.originDeviceId,
              targetDeviceId: msg.targetDeviceId,
              timestampIso: msg.timestampIso,
              ttl: msg.ttl,
              hops: msg.hops,
              payload: <String, dynamic>{
                'message': msg.message,
                'severity': msg.severity.name,
                'lat': msg.lat,
                'lng': msg.lng,
              },
              trace: msg.trace,
            ).encodeUtf8Json())
        .toList(growable: false);

    await prefs.setStringList(_prefsInboxKey, inboxPackets);
  }

  void _rememberSeen(String id) {
    _seenIds.add(id);
    if (_seenIds.length > _maxSeen) {
      // Drop oldest deterministically by sorting; small N so OK.
      final list = _seenIds.toList()..sort();
      _seenIds
        ..clear()
        ..addAll(list.skip(max(0, list.length - _maxSeen)));
    }
    unawaited(_persist());
  }

  void _addToInbox(MeshAlertMessage message) {
    _inbox.insert(0, message);
    if (_inbox.length > _maxInbox) {
      _inbox.removeRange(_maxInbox, _inbox.length);
    }
    notifyListeners();
    unawaited(_persist());
  }
}
