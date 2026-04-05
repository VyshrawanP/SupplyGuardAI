import 'package:cloud_firestore/cloud_firestore.dart';

Map<String, dynamic> _mapOf(dynamic value) => value is Map<String, dynamic>
    ? value
    : Map<String, dynamic>.from(value as Map);

List<Map<String, dynamic>> _listOfMaps(dynamic value) => value is List
    ? value.map((entry) => _mapOf(entry)).toList()
    : <Map<String, dynamic>>[];

GeoPoint? _asGeoPoint(dynamic value) {
  if (value == null) {
    return null;
  }
  if (value is GeoPoint) {
    return value;
  }
  if (value is Map) {
    final map = _mapOf(value);
    return GeoPoint(
      (map['lat'] as num?)?.toDouble() ?? (map['latitude'] as num?)?.toDouble() ?? 0,
      (map['lng'] as num?)?.toDouble() ?? (map['longitude'] as num?)?.toDouble() ?? 0,
    );
  }
  return null;
}

String? _asIso(dynamic value) {
  if (value == null) {
    return null;
  }
  if (value is Timestamp) {
    return value.toDate().toIso8601String();
  }
  return value.toString();
}

enum DroneStatus { idle, assigned, inFlight, delivered, returned, charging }

class FlightWaypoint {
  const FlightWaypoint({
    required this.lat,
    required this.lng,
    required this.altitudeM,
  });

  final double lat;
  final double lng;
  final double altitudeM;

  factory FlightWaypoint.fromJson(Map<String, dynamic> json) => FlightWaypoint(
        lat: (json['lat'] as num?)?.toDouble() ?? 0,
        lng: (json['lng'] as num?)?.toDouble() ?? 0,
        altitudeM: (json['altitude_m'] as num?)?.toDouble() ?? 0,
      );

  Map<String, dynamic> toJson() => {
        'lat': lat,
        'lng': lng,
        'altitude_m': altitudeM,
      };

  FlightWaypoint copyWith({double? lat, double? lng, double? altitudeM}) => FlightWaypoint(
        lat: lat ?? this.lat,
        lng: lng ?? this.lng,
        altitudeM: altitudeM ?? this.altitudeM,
      );
}

class Shipment {
  const Shipment({
    required this.id,
    required this.routeId,
    required this.status,
    required this.currentPosition,
    required this.origin,
    required this.destination,
    required this.cargoSummary,
    required this.currentEtaMinutes,
    required this.polyline,
    this.driverName,
    this.riskScore,
    this.delayPredictionMinutes,
  });

  final String id;
  final String routeId;
  final String status;
  final GeoPoint currentPosition;
  final GeoPoint origin;
  final GeoPoint destination;
  final List<String> cargoSummary;
  final int currentEtaMinutes;
  final List<GeoPoint> polyline;
  final String? driverName;
  final int? riskScore;
  final int? delayPredictionMinutes;

  factory Shipment.fromJson(Map<String, dynamic> json) => Shipment(
        id: json['id']?.toString() ?? '',
        routeId: json['route_id']?.toString() ?? '',
        status: json['status']?.toString() ?? 'UNKNOWN',
        currentPosition: _asGeoPoint(json['coordinates']) ?? const GeoPoint(0, 0),
        origin: _asGeoPoint(json['origin']) ?? const GeoPoint(0, 0),
        destination: _asGeoPoint(json['destination']) ?? const GeoPoint(0, 0),
        cargoSummary: (json['cargo_summary'] as List?)?.map((e) => e.toString()).toList() ?? const <String>[],
        currentEtaMinutes: (json['current_eta_minutes'] as num?)?.toInt() ?? 0,
        polyline: (json['polyline'] as List?)
                ?.map((entry) => _asGeoPoint(entry) ?? const GeoPoint(0, 0))
                .toList() ??
            const <GeoPoint>[],
        driverName: json['driver_name']?.toString(),
        riskScore: (json['risk_score'] as num?)?.toInt(),
        delayPredictionMinutes: (json['delay_prediction_minutes'] as num?)?.toInt(),
      );

  factory Shipment.fromFirestore(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? <String, dynamic>{};
    return Shipment.fromJson({...data, 'id': doc.id});
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'route_id': routeId,
        'status': status,
        'coordinates': currentPosition,
        'origin': origin,
        'destination': destination,
        'cargo_summary': cargoSummary,
        'current_eta_minutes': currentEtaMinutes,
        'polyline': polyline.map((e) => {'lat': e.latitude, 'lng': e.longitude}).toList(),
        'driver_name': driverName,
        'risk_score': riskScore,
        'delay_prediction_minutes': delayPredictionMinutes,
      };

  Shipment copyWith({
    String? id,
    String? routeId,
    String? status,
    GeoPoint? currentPosition,
    GeoPoint? origin,
    GeoPoint? destination,
    List<String>? cargoSummary,
    int? currentEtaMinutes,
    List<GeoPoint>? polyline,
    String? driverName,
    int? riskScore,
    int? delayPredictionMinutes,
  }) =>
      Shipment(
        id: id ?? this.id,
        routeId: routeId ?? this.routeId,
        status: status ?? this.status,
        currentPosition: currentPosition ?? this.currentPosition,
        origin: origin ?? this.origin,
        destination: destination ?? this.destination,
        cargoSummary: cargoSummary ?? this.cargoSummary,
        currentEtaMinutes: currentEtaMinutes ?? this.currentEtaMinutes,
        polyline: polyline ?? this.polyline,
        driverName: driverName ?? this.driverName,
        riskScore: riskScore ?? this.riskScore,
        delayPredictionMinutes: delayPredictionMinutes ?? this.delayPredictionMinutes,
      );
}

class Drone {
  const Drone({
    required this.id,
    required this.model,
    required this.status,
    required this.batteryPercent,
    required this.currentPosition,
    required this.maxPayloadKg,
    required this.availablePayloadKg,
    this.operatorUid,
  });

  final String id;
  final String model;
  final DroneStatus status;
  final double batteryPercent;
  final GeoPoint currentPosition;
  final double maxPayloadKg;
  final double availablePayloadKg;
  final String? operatorUid;

  factory Drone.fromJson(Map<String, dynamic> json) => Drone(
        id: json['id']?.toString() ?? json['drone_id']?.toString() ?? '',
        model: json['model']?.toString() ?? 'Unknown',
        status: _parseDroneStatus(json['status']?.toString()),
        batteryPercent: (json['battery_percent'] as num?)?.toDouble() ?? 0,
        currentPosition: _asGeoPoint(json['current_position']) ?? const GeoPoint(0, 0),
        maxPayloadKg: (json['max_payload_kg'] as num?)?.toDouble() ?? 0,
        availablePayloadKg: (json['available_payload_kg'] as num?)?.toDouble() ?? 0,
        operatorUid: json['operator_uid']?.toString(),
      );

  factory Drone.fromFirestore(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? <String, dynamic>{};
    return Drone.fromJson({...data, 'id': doc.id});
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'model': model,
        'status': status.name.toUpperCase(),
        'battery_percent': batteryPercent,
        'current_position': currentPosition,
        'max_payload_kg': maxPayloadKg,
        'available_payload_kg': availablePayloadKg,
        'operator_uid': operatorUid,
      };

  Drone copyWith({
    String? id,
    String? model,
    DroneStatus? status,
    double? batteryPercent,
    GeoPoint? currentPosition,
    double? maxPayloadKg,
    double? availablePayloadKg,
    String? operatorUid,
  }) =>
      Drone(
        id: id ?? this.id,
        model: model ?? this.model,
        status: status ?? this.status,
        batteryPercent: batteryPercent ?? this.batteryPercent,
        currentPosition: currentPosition ?? this.currentPosition,
        maxPayloadKg: maxPayloadKg ?? this.maxPayloadKg,
        availablePayloadKg: availablePayloadKg ?? this.availablePayloadKg,
        operatorUid: operatorUid ?? this.operatorUid,
      );
}

DroneStatus _parseDroneStatus(String? value) {
  switch ((value ?? '').toUpperCase()) {
    case 'ASSIGNED':
      return DroneStatus.assigned;
    case 'IN_FLIGHT':
      return DroneStatus.inFlight;
    case 'DELIVERED':
      return DroneStatus.delivered;
    case 'RETURNED':
      return DroneStatus.returned;
    case 'CHARGING':
      return DroneStatus.charging;
    default:
      return DroneStatus.idle;
  }
}

class DroneDispatch {
  const DroneDispatch({
    required this.id,
    required this.droneId,
    required this.status,
    required this.destination,
    required this.etaMinutes,
    required this.payloadManifest,
    required this.flightPlan,
  });

  final String id;
  final String droneId;
  final String status;
  final GeoPoint destination;
  final int etaMinutes;
  final List<Map<String, dynamic>> payloadManifest;
  final List<FlightWaypoint> flightPlan;

  factory DroneDispatch.fromJson(Map<String, dynamic> json) => DroneDispatch(
        id: json['id']?.toString() ?? json['dispatch_id']?.toString() ?? '',
        droneId: json['drone_id']?.toString() ?? '',
        status: json['status']?.toString() ?? 'UNKNOWN',
        destination: _asGeoPoint(json['destination']) ?? const GeoPoint(0, 0),
        etaMinutes: (json['eta_minutes'] as num?)?.toInt() ?? 0,
        payloadManifest: _listOfMaps(json['payload_manifest']),
        flightPlan: _listOfMaps(_mapOf(json['flight_plan'])['waypoints'])
            .map(FlightWaypoint.fromJson)
            .toList(),
      );

  factory DroneDispatch.fromFirestore(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? <String, dynamic>{};
    return DroneDispatch.fromJson({...data, 'id': doc.id});
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'drone_id': droneId,
        'status': status,
        'destination': destination,
        'eta_minutes': etaMinutes,
        'payload_manifest': payloadManifest,
        'flight_plan': {
          'waypoints': flightPlan.map((e) => e.toJson()).toList(),
        },
      };
}

class Warehouse {
  const Warehouse({
    required this.id,
    required this.name,
    required this.city,
    required this.location,
    required this.status,
    this.assignedPopulation = 0,
  });

  final String id;
  final String name;
  final String city;
  final GeoPoint location;
  final String status;
  final int assignedPopulation;

  factory Warehouse.fromJson(Map<String, dynamic> json) => Warehouse(
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        city: json['city']?.toString() ?? '',
        location: _asGeoPoint(json['location']) ?? const GeoPoint(0, 0),
        status: json['status']?.toString() ?? 'UNKNOWN',
        assignedPopulation: (json['assigned_population'] as num?)?.toInt() ?? 0,
      );

  factory Warehouse.fromFirestore(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? <String, dynamic>{};
    return Warehouse.fromJson({...data, 'id': doc.id});
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'city': city,
        'location': location,
        'status': status,
        'assigned_population': assignedPopulation,
      };
}

class InventoryItem {
  const InventoryItem({
    required this.itemName,
    required this.currentQuantity,
    required this.unit,
    required this.minimumThreshold,
    required this.daysRemaining,
    required this.depletionRatePerDay,
    required this.status,
    this.lastRestockedAt,
  });

  final String itemName;
  final double currentQuantity;
  final String unit;
  final double minimumThreshold;
  final double daysRemaining;
  final double depletionRatePerDay;
  final String status;
  final String? lastRestockedAt;

  factory InventoryItem.fromJson(Map<String, dynamic> json) => InventoryItem(
        itemName: json['item_name']?.toString() ?? '',
        currentQuantity: (json['current_quantity'] as num?)?.toDouble() ?? (json['quantity'] as num?)?.toDouble() ?? 0,
        unit: json['unit']?.toString() ?? '',
        minimumThreshold: (json['minimum_threshold'] as num?)?.toDouble() ?? 0,
        daysRemaining: (json['days_remaining'] as num?)?.toDouble() ?? 0,
        depletionRatePerDay: (json['depletion_rate_per_day'] as num?)?.toDouble() ?? 0,
        status: json['status']?.toString() ?? 'ADEQUATE',
        lastRestockedAt: _asIso(json['last_restocked_at']),
      );

  Map<String, dynamic> toJson() => {
        'item_name': itemName,
        'current_quantity': currentQuantity,
        'unit': unit,
        'minimum_threshold': minimumThreshold,
        'days_remaining': daysRemaining,
        'depletion_rate_per_day': depletionRatePerDay,
        'status': status,
        'last_restocked_at': lastRestockedAt,
      };
}

class RescueTeam {
  const RescueTeam({
    required this.id,
    required this.name,
    required this.status,
    required this.currentPosition,
    required this.teamCapacity,
    required this.roster,
  });

  final String id;
  final String name;
  final String status;
  final GeoPoint currentPosition;
  final int teamCapacity;
  final List<String> roster;

  factory RescueTeam.fromJson(Map<String, dynamic> json) => RescueTeam(
        id: json['id']?.toString() ?? json['team_id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        status: json['status']?.toString() ?? 'UNKNOWN',
        currentPosition: _asGeoPoint(json['current_position']) ?? const GeoPoint(0, 0),
        teamCapacity: (json['team_capacity'] as num?)?.toInt() ?? 0,
        roster: (json['roster'] as List?)?.map((e) => e.toString()).toList() ?? const <String>[],
      );

  factory RescueTeam.fromFirestore(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? <String, dynamic>{};
    return RescueTeam.fromJson({...data, 'id': doc.id});
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'status': status,
        'current_position': currentPosition,
        'team_capacity': teamCapacity,
        'roster': roster,
      };
}

class RescueAssignment {
  const RescueAssignment({
    required this.id,
    required this.clusterId,
    required this.teamId,
    required this.status,
    required this.etaMinutes,
  });

  final String id;
  final String clusterId;
  final String teamId;
  final String status;
  final int etaMinutes;

  factory RescueAssignment.fromJson(Map<String, dynamic> json) => RescueAssignment(
        id: json['id']?.toString() ?? json['assignment_id']?.toString() ?? '',
        clusterId: json['cluster_id']?.toString() ?? '',
        teamId: json['team_id']?.toString() ?? '',
        status: json['status']?.toString() ?? '',
        etaMinutes: (json['eta_minutes'] as num?)?.toInt() ?? 0,
      );

  factory RescueAssignment.fromFirestore(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? <String, dynamic>{};
    return RescueAssignment.fromJson({...data, 'id': doc.id});
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'cluster_id': clusterId,
        'team_id': teamId,
        'status': status,
        'eta_minutes': etaMinutes,
      };
}

class SurvivorCluster {
  const SurvivorCluster({
    required this.clusterId,
    required this.center,
    required this.estimatedPopulation,
    required this.severity,
    required this.reportCount,
    required this.status,
    this.createdAt,
  });

  final String clusterId;
  final GeoPoint center;
  final int estimatedPopulation;
  final int severity;
  final int reportCount;
  final String status;
  final String? createdAt;

  factory SurvivorCluster.fromJson(Map<String, dynamic> json) => SurvivorCluster(
        clusterId: json['cluster_id']?.toString() ?? json['id']?.toString() ?? '',
        center: _asGeoPoint(json['center']) ?? const GeoPoint(0, 0),
        estimatedPopulation: (json['estimated_population'] as num?)?.toInt() ?? 0,
        severity: (json['severity'] as num?)?.toInt() ?? 1,
        reportCount: (json['report_count'] as num?)?.toInt() ?? 0,
        status: json['status']?.toString() ?? 'UNASSIGNED',
        createdAt: _asIso(json['created_at']),
      );

  factory SurvivorCluster.fromFirestore(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? <String, dynamic>{};
    return SurvivorCluster.fromJson({...data, 'id': doc.id});
  }

  Map<String, dynamic> toJson() => {
        'cluster_id': clusterId,
        'center': {'lat': center.latitude, 'lng': center.longitude},
        'estimated_population': estimatedPopulation,
        'severity': severity,
        'report_count': reportCount,
        'status': status,
        'created_at': createdAt,
      };
}

class SurvivorReport {
  const SurvivorReport({
    required this.id,
    required this.coordinates,
    required this.count,
    required this.severity,
    this.description,
    this.clusterId,
    this.timestamp,
  });

  final String id;
  final GeoPoint coordinates;
  final int count;
  final int severity;
  final String? description;
  final String? clusterId;
  final String? timestamp;

  factory SurvivorReport.fromJson(Map<String, dynamic> json) => SurvivorReport(
        id: json['id']?.toString() ?? '',
        coordinates: _asGeoPoint(json['coordinates']) ?? const GeoPoint(0, 0),
        count: (json['count'] as num?)?.toInt() ?? 1,
        severity: (json['severity'] as num?)?.toInt() ?? 1,
        description: json['description']?.toString(),
        clusterId: json['cluster_id']?.toString(),
        timestamp: _asIso(json['timestamp']),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'coordinates': coordinates,
        'count': count,
        'severity': severity,
        'description': description,
        'cluster_id': clusterId,
        'timestamp': timestamp,
      };

  SurvivorReport copyWith({
    String? id,
    GeoPoint? coordinates,
    int? count,
    int? severity,
    String? description,
    String? clusterId,
    String? timestamp,
  }) =>
      SurvivorReport(
        id: id ?? this.id,
        coordinates: coordinates ?? this.coordinates,
        count: count ?? this.count,
        severity: severity ?? this.severity,
        description: description ?? this.description,
        clusterId: clusterId ?? this.clusterId,
        timestamp: timestamp ?? this.timestamp,
      );
}

class DisasterEvent {
  const DisasterEvent({
    required this.id,
    required this.type,
    required this.severity,
    required this.coordinates,
    required this.affectedRadiusKm,
    this.source,
  });

  final String id;
  final String type;
  final int severity;
  final GeoPoint coordinates;
  final double affectedRadiusKm;
  final String? source;

  factory DisasterEvent.fromJson(Map<String, dynamic> json) => DisasterEvent(
        id: json['id']?.toString() ?? json['event_id']?.toString() ?? '',
        type: json['type']?.toString() ?? '',
        severity: (json['severity'] as num?)?.toInt() ?? 1,
        coordinates: _asGeoPoint(json['coordinates']) ?? const GeoPoint(0, 0),
        affectedRadiusKm: (json['affected_radius_km'] as num?)?.toDouble() ?? 0,
        source: json['source']?.toString(),
      );

  factory DisasterEvent.fromFirestore(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? <String, dynamic>{};
    return DisasterEvent.fromJson({...data, 'id': doc.id});
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type,
        'severity': severity,
        'coordinates': coordinates,
        'affected_radius_km': affectedRadiusKm,
        'source': source,
      };
}

class RiskScore {
  const RiskScore({
    required this.routeId,
    required this.riskScore,
    required this.delayMinutes,
    required this.riskCategory,
    required this.confidencePercent,
    required this.computedAt,
    required this.contributingFactors,
    required this.affectedRouteIds,
  });

  final String routeId;
  final int riskScore;
  final int delayMinutes;
  final String riskCategory;
  final int confidencePercent;
  final String computedAt;
  final List<Map<String, dynamic>> contributingFactors;
  final List<String> affectedRouteIds;

  factory RiskScore.fromJson(Map<String, dynamic> json) => RiskScore(
        routeId: json['route_id']?.toString() ?? '',
        riskScore: (json['risk_score'] as num?)?.toInt() ?? 0,
        delayMinutes: (json['delay_minutes'] as num?)?.toInt() ?? 0,
        riskCategory: json['risk_category']?.toString() ?? '',
        confidencePercent: (json['confidence_percent'] as num?)?.toInt() ?? 0,
        computedAt: json['computed_at']?.toString() ?? '',
        contributingFactors: _listOfMaps(json['contributing_factors']),
        affectedRouteIds: (json['affected_route_ids'] as List?)?.map((e) => e.toString()).toList() ?? const <String>[],
      );

  Map<String, dynamic> toJson() => {
        'route_id': routeId,
        'risk_score': riskScore,
        'delay_minutes': delayMinutes,
        'risk_category': riskCategory,
        'confidence_percent': confidencePercent,
        'computed_at': computedAt,
        'contributing_factors': contributingFactors,
        'affected_route_ids': affectedRouteIds,
      };
}

class OptimizedRoute {
  const OptimizedRoute({
    required this.shipmentId,
    required this.primaryRoute,
    required this.alternatives,
    required this.improvementMinutes,
    required this.improvementPercent,
    required this.generatedAt,
  });

  final String shipmentId;
  final Map<String, dynamic> primaryRoute;
  final List<Map<String, dynamic>> alternatives;
  final int improvementMinutes;
  final double improvementPercent;
  final String generatedAt;

  factory OptimizedRoute.fromJson(Map<String, dynamic> json) => OptimizedRoute(
        shipmentId: json['shipment_id']?.toString() ?? '',
        primaryRoute: _mapOf(json['primary_route'] ?? <String, dynamic>{}),
        alternatives: _listOfMaps(json['alternatives']),
        improvementMinutes: (json['improvement_minutes'] as num?)?.toInt() ?? 0,
        improvementPercent: (json['improvement_percent'] as num?)?.toDouble() ?? 0,
        generatedAt: json['generated_at']?.toString() ?? '',
      );

  Map<String, dynamic> toJson() => {
        'shipment_id': shipmentId,
        'primary_route': primaryRoute,
        'alternatives': alternatives,
        'improvement_minutes': improvementMinutes,
        'improvement_percent': improvementPercent,
        'generated_at': generatedAt,
      };
}

class SystemAlert {
  const SystemAlert({
    required this.id,
    required this.alertType,
    required this.severity,
    required this.description,
    required this.createdAt,
    required this.acknowledged,
    this.entityId,
    this.entityType,
    this.metadata = const <String, dynamic>{},
  });

  final String id;
  final String alertType;
  final String severity;
  final String description;
  final String createdAt;
  final bool acknowledged;
  final String? entityId;
  final String? entityType;
  final Map<String, dynamic> metadata;

  factory SystemAlert.fromJson(Map<String, dynamic> json) => SystemAlert(
        id: json['id']?.toString() ?? json['alert_id']?.toString() ?? '',
        alertType: json['alert_type']?.toString() ?? '',
        severity: json['severity']?.toString() ?? '',
        description: json['description']?.toString() ?? '',
        createdAt: _asIso(json['created_at']) ?? '',
        acknowledged: json['acknowledged'] == true,
        entityId: json['entity_id']?.toString(),
        entityType: json['entity_type']?.toString(),
        metadata: json['metadata'] is Map ? _mapOf(json['metadata']) : const <String, dynamic>{},
      );

  factory SystemAlert.fromFirestore(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? <String, dynamic>{};
    return SystemAlert.fromJson({...data, 'id': doc.id});
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'alert_type': alertType,
        'severity': severity,
        'description': description,
        'created_at': createdAt,
        'acknowledged': acknowledged,
        'entity_id': entityId,
        'entity_type': entityType,
        'metadata': metadata,
      };
}

class AIExplanation {
  const AIExplanation({
    required this.id,
    required this.actionTaken,
    required this.situationSummary,
    required this.whyActionWasTaken,
    required this.expectedOutcome,
    required this.confidenceNarrative,
    required this.coordinatorGuidance,
    this.eventId,
    this.createdAt,
  });

  final String id;
  final String actionTaken;
  final String situationSummary;
  final String whyActionWasTaken;
  final String expectedOutcome;
  final String confidenceNarrative;
  final String coordinatorGuidance;
  final String? eventId;
  final String? createdAt;

  factory AIExplanation.fromJson(Map<String, dynamic> json) => AIExplanation(
        id: json['id']?.toString() ?? json['explanation_id']?.toString() ?? '',
        actionTaken: json['action_taken']?.toString() ?? '',
        situationSummary: json['situation_summary']?.toString() ?? '',
        whyActionWasTaken: json['why_action_was_taken']?.toString() ?? '',
        expectedOutcome: json['expected_outcome']?.toString() ?? '',
        confidenceNarrative: json['confidence_narrative']?.toString() ?? '',
        coordinatorGuidance: json['coordinator_guidance']?.toString() ?? '',
        eventId: json['event_id']?.toString(),
        createdAt: _asIso(json['created_at']),
      );

  factory AIExplanation.fromFirestore(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? <String, dynamic>{};
    return AIExplanation.fromJson({...data, 'id': doc.id});
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'action_taken': actionTaken,
        'situation_summary': situationSummary,
        'why_action_was_taken': whyActionWasTaken,
        'expected_outcome': expectedOutcome,
        'confidence_narrative': confidenceNarrative,
        'coordinator_guidance': coordinatorGuidance,
        'event_id': eventId,
        'created_at': createdAt,
      };
}

class SupplierAlert {
  const SupplierAlert({
    required this.id,
    required this.warehouseId,
    required this.supplierId,
    required this.itemName,
    required this.status,
    required this.severity,
    required this.acknowledged,
  });

  final String id;
  final String warehouseId;
  final String supplierId;
  final String itemName;
  final String status;
  final String severity;
  final bool acknowledged;

  factory SupplierAlert.fromJson(Map<String, dynamic> json) => SupplierAlert(
        id: json['id']?.toString() ?? '',
        warehouseId: json['warehouse_id']?.toString() ?? '',
        supplierId: json['supplier_id']?.toString() ?? '',
        itemName: json['item_name']?.toString() ?? '',
        status: json['status']?.toString() ?? '',
        severity: json['severity']?.toString() ?? '',
        acknowledged: json['acknowledged'] == true,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'warehouse_id': warehouseId,
        'supplier_id': supplierId,
        'item_name': itemName,
        'status': status,
        'severity': severity,
        'acknowledged': acknowledged,
      };
}

class LifeJacket {
  const LifeJacket({
    required this.id,
    required this.status,
    required this.size,
    this.dispatchId,
    this.warehouseId,
  });

  final String id;
  final String status;
  final String size;
  final String? dispatchId;
  final String? warehouseId;

  factory LifeJacket.fromJson(Map<String, dynamic> json) => LifeJacket(
        id: json['id']?.toString() ?? json['jacket_id']?.toString() ?? '',
        status: json['status']?.toString() ?? '',
        size: json['size']?.toString() ?? '',
        dispatchId: json['dispatch_id']?.toString(),
        warehouseId: json['warehouse_id']?.toString(),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'status': status,
        'size': size,
        'dispatch_id': dispatchId,
        'warehouse_id': warehouseId,
      };
}

class PurchaseOrder {
  const PurchaseOrder({
    required this.id,
    required this.warehouseId,
    required this.supplierId,
    required this.items,
    required this.deliveryAddress,
    required this.createdAt,
    required this.requiredBy,
    required this.estimatedCostInr,
  });

  final String id;
  final String warehouseId;
  final String supplierId;
  final List<Map<String, dynamic>> items;
  final String deliveryAddress;
  final String createdAt;
  final String requiredBy;
  final double estimatedCostInr;

  factory PurchaseOrder.fromJson(Map<String, dynamic> json) => PurchaseOrder(
        id: json['id']?.toString() ?? json['po_id']?.toString() ?? '',
        warehouseId: json['warehouse_id']?.toString() ?? '',
        supplierId: json['supplier_id']?.toString() ?? '',
        items: _listOfMaps(json['items']),
        deliveryAddress: json['delivery_address']?.toString() ?? '',
        createdAt: json['created_at']?.toString() ?? '',
        requiredBy: json['required_by']?.toString() ?? '',
        estimatedCostInr: (json['estimated_cost_inr'] as num?)?.toDouble() ?? 0,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'warehouse_id': warehouseId,
        'supplier_id': supplierId,
        'items': items,
        'delivery_address': deliveryAddress,
        'created_at': createdAt,
        'required_by': requiredBy,
        'estimated_cost_inr': estimatedCostInr,
      };
}

class SimulationResult {
  const SimulationResult({
    required this.sessionId,
    required this.scenarioType,
    required this.impactSummary,
    required this.computedAt,
  });

  final String sessionId;
  final String scenarioType;
  final Map<String, dynamic> impactSummary;
  final String computedAt;

  factory SimulationResult.fromJson(Map<String, dynamic> json) => SimulationResult(
        sessionId: json['session_id']?.toString() ?? '',
        scenarioType: json['scenario_type']?.toString() ?? '',
        impactSummary: _mapOf(json['impact_summary'] ?? <String, dynamic>{}),
        computedAt: json['computed_at']?.toString() ?? '',
      );

  Map<String, dynamic> toJson() => {
        'session_id': sessionId,
        'scenario_type': scenarioType,
        'impact_summary': impactSummary,
        'computed_at': computedAt,
      };
}
