import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'mesh_models.dart';
import 'mesh_transport.dart';

/// LAN relay mesh transport for "phones on the same hotspot/Wi-Fi" setups.
///
/// This connects to:
/// - `GET  /mesh-relay/events?device=<deviceId>` (SSE)
/// - `POST /mesh-relay/publish?sender=<relayClientId>&device=<deviceId>`
///
/// It exchanges messages using the web app's `MeshWireMessage` format:
/// `{ kind: 'mesh_alert', alert: { ... } }`
class MeshLanRelayTransport implements MeshTransport {
  MeshLanRelayTransport({
    required String baseUrl,
  }) : _baseUrlSeed = baseUrl.replaceAll(RegExp(r'/$'), '');

  // Seed URL from compile-time config. Can be overridden at runtime via SharedPreferences.
  final String _baseUrlSeed;

  final _inboundController = StreamController<MeshInboundFrame>.broadcast();
  final _statusController = StreamController<MeshTransportStatus>.broadcast();

  StreamSubscription<String>? _sseSub;
  CancelToken? _cancelToken;
  Timer? _retryTimer;

  String? _relayClientId;
  List<String> _peerIds = const <String>[];
  bool _running = false;
  String? _lastError;
  int _consecutiveFailures = 0;

  static const _prefsBaseUrlKey = 'sg_lan_relay_base_url_v1';

  @override
  Stream<MeshInboundFrame> get inboundFrames => _inboundController.stream;

  @override
  Stream<MeshTransportStatus> get statusStream => _statusController.stream;

  void _emitStatus() {
    _statusController.add(
      MeshTransportStatus(
        running: _running,
        peerCount: _peerIds.length,
        peerIds: _peerIds,
        lastError: _lastError,
      ),
    );
  }

  Future<String> _deviceId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('sg_mesh_device_id') ?? 'unknown';
  }

  Future<String> _resolveBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final override = prefs.getString(_prefsBaseUrlKey);
    final resolved = (override?.trim().isNotEmpty == true) ? override!.trim() : _baseUrlSeed;
    return resolved.replaceAll(RegExp(r'/$'), '');
  }

  @override
  Future<void> start({required String deviceName}) async {
    if (_running) return;

    final baseUrl = await _resolveBaseUrl();

    _running = true;
    _lastError = null;
    _consecutiveFailures = 0;
    _emitStatus();

    await _connectSse(baseUrl);
  }

  Future<void> _connectSse(String baseUrl) async {
    final dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 0),
      headers: const {
        'Accept': 'text/event-stream',
      },
      responseType: ResponseType.stream,
    ));

    final deviceId = await _deviceId();

    _cancelToken = CancelToken();
    try {
      final response = await dio.get<ResponseBody>(
        '/mesh-relay/events',
        queryParameters: {'device': deviceId},
        cancelToken: _cancelToken,
        options: Options(responseType: ResponseType.stream),
      );

      final body = response.data;
      if (body == null) {
        _lastError = 'lan_relay_no_response_body';
        _emitStatus();
        return;
      }

      // Parse SSE by lines; we only care about `data: ...`.
      _sseSub = body.stream
          .map<List<int>>((chunk) => chunk)
          .transform(utf8.decoder)
          .transform(const LineSplitter())
          .listen(_onSseLine, onError: (e) {
        _lastError = 'lan_relay_stream_error: $e';
        _scheduleReconnect();
      }, onDone: () {
        _lastError = 'lan_relay_disconnected';
        _scheduleReconnect();
      });
    } catch (e) {
      _lastError = 'lan_relay_connect_failed($baseUrl): $e';
      _scheduleReconnect();
    }
  }

  void _scheduleReconnect() {
    if (!_running) return;
    _consecutiveFailures += 1;
    _emitStatus();

    _retryTimer?.cancel();
    final backoffSeconds = (_consecutiveFailures <= 1)
        ? 2
        : (_consecutiveFailures <= 3)
            ? 5
            : (_consecutiveFailures <= 6)
                ? 10
                : 20;
    _retryTimer = Timer(Duration(seconds: backoffSeconds), () async {
      if (!_running) return;
      try {
        await _sseSub?.cancel();
      } catch (_) {}
      _sseSub = null;
      try {
        _cancelToken?.cancel('reconnect');
      } catch (_) {}
      _cancelToken = null;

      final baseUrl = await _resolveBaseUrl();
      await _connectSse(baseUrl);
    });
  }

  void _onSseLine(String line) {
    final trimmed = line.trimRight();
    if (!trimmed.startsWith('data:')) return;
    final raw = trimmed.substring('data:'.length).trim();
    if (raw.isEmpty) return;

    final decoded = (() {
      try {
        return jsonDecode(raw);
      } catch (_) {
        return null;
      }
    })();

    if (decoded is! Map) return;

    final type = decoded['type']?.toString();
    if (type == 'relay-welcome') {
      _relayClientId = decoded['id']?.toString();
      final peers = decoded['peers'];
      if (peers is List) {
        _peerIds = peers.map((e) => (e is Map ? e['id'] : e)?.toString() ?? '').where((e) => e.isNotEmpty).toList();
      } else {
        _peerIds = const <String>[];
      }
      _emitStatus();
      _consecutiveFailures = 0;
      return;
    }

    if (type == 'relay-peer-join') {
      final id = decoded['id']?.toString();
      if (id != null && id.isNotEmpty && !_peerIds.contains(id)) {
        _peerIds = [..._peerIds, id];
        _emitStatus();
      }
      return;
    }

    if (type == 'relay-peer-leave') {
      final id = decoded['id']?.toString();
      if (id != null && id.isNotEmpty && _peerIds.contains(id)) {
        _peerIds = _peerIds.where((p) => p != id).toList(growable: false);
        _emitStatus();
      }
      return;
    }

    // MeshWireMessage relay (server pass-through).
    if (decoded['kind']?.toString() != 'mesh_alert') return;
    final alert = decoded['alert'];
    if (alert is! Map) return;

    final packet = MeshPacket(
      id: alert['id']?.toString() ?? '',
      type: 'alert',
      originDeviceId: alert['originPeerId']?.toString() ?? 'unknown',
      timestampIso: alert['timestamp']?.toString() ?? DateTime.now().toIso8601String(),
      ttl: (alert['ttl'] is num) ? (alert['ttl'] as num).toInt() : 0,
      hops: (alert['hops'] is num) ? (alert['hops'] as num).toInt() : 0,
      payload: <String, dynamic>{
        'message': alert['message']?.toString() ?? '',
        'severity': alert['severity']?.toString() ?? 'high',
        'lat': (alert['location'] is Map)
            ? (alert['location']['lat'] as num?)?.toDouble() ?? 0
            : 0,
        'lng': (alert['location'] is Map)
            ? (alert['location']['lng'] as num?)?.toDouble() ?? 0
            : 0,
      },
      trace: null,
    );

    final bytes = Uint8List.fromList(utf8.encode(packet.encodeUtf8Json()));
    _inboundController.add(MeshInboundFrame(fromPeerId: 'lan-relay', bytes: bytes));
  }

  @override
  Future<void> stop() async {
    _running = false;
    _lastError = null;
    _retryTimer?.cancel();
    _retryTimer = null;
    _emitStatus();

    try {
      _cancelToken?.cancel('stopped');
    } catch (_) {}
    _cancelToken = null;

    await _sseSub?.cancel();
    _sseSub = null;
  }

  @override
  Future<void> sendToAll(Uint8List bytes) async {
    if (!_running) return;
    final relayId = _relayClientId;
    if (relayId == null || relayId.isEmpty) return;

    MeshPacket? packet;
    try {
      final decoded = jsonDecode(utf8.decode(bytes)) as Map<String, dynamic>;
      packet = MeshPacket.fromJson(decoded);
    } catch (_) {
      return;
    }
    if (packet.type != 'alert') return;

    final payload = packet.payload;
    final msg = payload['message']?.toString() ?? '';
    if (msg.trim().isEmpty) return;

    final deviceId = await _deviceId();
    final wire = <String, dynamic>{
      'kind': 'mesh_alert',
      'alert': {
        'id': packet.id,
        'message': msg,
        'location': {
          'lat': (payload['lat'] is num) ? (payload['lat'] as num).toDouble() : 0.0,
          'lng': (payload['lng'] is num) ? (payload['lng'] as num).toDouble() : 0.0,
        },
        'timestamp': packet.timestampIso,
        'severity': payload['severity']?.toString() ?? 'high',
        'ttl': packet.ttl,
        'hops': packet.hops,
        // Preserve original origin across relays. For locally-created messages,
        // `originDeviceId` is already this device's ID.
        'originPeerId': packet.originDeviceId,
      },
    };

    final dio = Dio(BaseOptions(
      baseUrl: await _resolveBaseUrl(),
      connectTimeout: const Duration(seconds: 12),
      receiveTimeout: const Duration(seconds: 8),
    ));
    try {
      await dio.post(
        '/mesh-relay/publish',
        queryParameters: {'sender': relayId, 'device': deviceId},
        data: wire,
        options: Options(headers: {'Content-Type': 'application/json'}),
      );
    } catch (_) {
      // best-effort
    }
  }

  Future<void> dispose() async {
    await stop();
    await _inboundController.close();
    await _statusController.close();
  }
}
