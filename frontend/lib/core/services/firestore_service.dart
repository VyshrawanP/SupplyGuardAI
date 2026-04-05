import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/app_models.dart';

class FirestoreService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Stream<List<Shipment>> watchActiveShipments() {
    return _db
        .collection('shipments')
        .snapshots()
        .map((snapshot) => snapshot.docs.map(Shipment.fromFirestore).toList());
  }

  Future<void> updateShipmentPosition(String id, GeoPoint position) async {
    await _db.collection('shipments').doc(id).set({
      'coordinates': position,
      'last_position_update': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  Stream<List<Drone>> watchFleet() {
    return _db
        .collection('drone-fleet')
        .snapshots()
        .map((snapshot) => snapshot.docs.map(Drone.fromFirestore).toList());
  }

  Stream<List<DroneDispatch>> watchActiveDispatches() {
    return _db
        .collection('drone-dispatches')
        .where('status', whereIn: ['ASSIGNED', 'IN_FLIGHT'])
        .snapshots()
        .map((snapshot) => snapshot.docs.map(DroneDispatch.fromFirestore).toList());
  }

  Future<void> updateDroneStatus(String id, DroneStatus status) async {
    await _db.collection('drone-fleet').doc(id).set({
      'status': status.name.toUpperCase(),
      'updated_at': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  Stream<List<RescueTeam>> watchTeams() {
    return _db
        .collection('rescue-teams')
        .snapshots()
        .map((snapshot) => snapshot.docs.map(RescueTeam.fromFirestore).toList());
  }

  Stream<List<SurvivorCluster>> watchActiveClusters() {
    return _db
        .collection('survivor-clusters')
        .where('status', whereIn: ['UNASSIGNED', 'ASSIGNED', 'REACHED'])
        .snapshots()
        .map((snapshot) => snapshot.docs.map(SurvivorCluster.fromFirestore).toList());
  }

  Future<void> submitSurvivorReport(SurvivorReport report) async {
    await _db.collection('survivor-reports').add({
      ...report.toJson(),
      'timestamp': FieldValue.serverTimestamp(),
      'cluster_id': report.clusterId,
    });
  }

  Stream<Map<String, InventoryItem>> watchWarehouseInventory(String warehouseId) {
    return _db
        .collection('warehouses')
        .doc(warehouseId)
        .collection('inventory')
        .snapshots()
        .map((snapshot) => {
              for (final doc in snapshot.docs) doc.id: InventoryItem.fromJson({
                ...doc.data(),
                'item_name': doc.id,
              }),
            });
  }

  Stream<List<SystemAlert>> watchAlerts() {
    return _db
        .collection('system-alerts')
        .orderBy('created_at', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs.map(SystemAlert.fromFirestore).toList());
  }

  Stream<List<AIExplanation>> watchExplanations() {
    return _db
        .collection('ai-explanations')
        .orderBy('created_at', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs.map(AIExplanation.fromFirestore).toList());
  }

  Stream<List<Warehouse>> watchWarehouses() {
    return _db
        .collection('warehouses')
        .snapshots()
        .map((snapshot) => snapshot.docs.map(Warehouse.fromFirestore).toList());
  }

  Stream<List<DisasterEvent>> watchDisasterEvents() {
    return _db
        .collection('disaster-events')
        .snapshots()
        .map((snapshot) => snapshot.docs.map(DisasterEvent.fromFirestore).toList());
  }

  Stream<List<RescueAssignment>> watchAssignments() {
    return _db
        .collection('rescue-assignments')
        .snapshots()
        .map((snapshot) => snapshot.docs.map(RescueAssignment.fromFirestore).toList());
  }

  Future<void> acknowledgeAlert(String alertId) async {
    await _db.collection('system-alerts').doc(alertId).set({
      'acknowledged': true,
      'acknowledged_at': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  static Future<void> initializeOffline() async {
    FirebaseFirestore.instance.settings = const Settings(
      persistenceEnabled: true,
      cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
    );
  }
}
