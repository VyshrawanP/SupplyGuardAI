import 'dart:convert';

enum MeshSeverity { low, medium, high, critical }

enum MeshDeliveryStatus { pending, delivered, failed }

class MeshPacket {
  MeshPacket({
    required this.id,
    required this.type,
    required this.originDeviceId,
    required this.timestampIso,
    required this.ttl,
    required this.hops,
    required this.payload,
    this.targetDeviceId,
    this.trace,
  });

  final String id;
  final String type; // 'alert' | 'ack'
  final String originDeviceId;
  final String? targetDeviceId;
  final String timestampIso;
  final int ttl;
  final int hops;
  final Map<String, dynamic> payload;

  // Debug-friendly breadcrumb of deviceIds that handled the packet.
  final List<String>? trace;

  MeshPacket copyWith({
    int? ttl,
    int? hops,
    List<String>? trace,
  }) {
    return MeshPacket(
      id: id,
      type: type,
      originDeviceId: originDeviceId,
      targetDeviceId: targetDeviceId,
      timestampIso: timestampIso,
      ttl: ttl ?? this.ttl,
      hops: hops ?? this.hops,
      payload: payload,
      trace: trace ?? this.trace,
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'type': type,
        'originDeviceId': originDeviceId,
        'targetDeviceId': targetDeviceId,
        'timestampIso': timestampIso,
        'ttl': ttl,
        'hops': hops,
        'payload': payload,
        'trace': trace,
      };

  static MeshPacket fromJson(Map<String, dynamic> json) {
    return MeshPacket(
      id: json['id']?.toString() ?? '',
      type: json['type']?.toString() ?? '',
      originDeviceId: json['originDeviceId']?.toString() ?? '',
      targetDeviceId: json['targetDeviceId']?.toString(),
      timestampIso: json['timestampIso']?.toString() ?? DateTime.now().toIso8601String(),
      ttl: (json['ttl'] is num) ? (json['ttl'] as num).toInt() : 0,
      hops: (json['hops'] is num) ? (json['hops'] as num).toInt() : 0,
      payload: (json['payload'] is Map<String, dynamic>)
          ? (json['payload'] as Map<String, dynamic>)
          : <String, dynamic>{},
      trace: (json['trace'] is List) ? (json['trace'] as List).map((e) => e.toString()).toList(growable: false) : null,
    );
  }

  String encodeUtf8Json() => jsonEncode(toJson());

  static MeshPacket decodeUtf8Json(String raw) => fromJson(jsonDecode(raw) as Map<String, dynamic>);
}

class MeshAlertMessage {
  MeshAlertMessage({
    required this.id,
    required this.message,
    required this.severity,
    required this.lat,
    required this.lng,
    required this.timestampIso,
    required this.originDeviceId,
    required this.ttl,
    required this.hops,
    this.targetDeviceId,
    this.trace,
  });

  final String id;
  final String message;
  final MeshSeverity severity;
  final double lat;
  final double lng;
  final String timestampIso;
  final String originDeviceId;
  final String? targetDeviceId;
  final int ttl;
  final int hops;
  final List<String>? trace;
}
