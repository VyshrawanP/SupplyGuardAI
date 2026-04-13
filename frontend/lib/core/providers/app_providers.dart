import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/app_models.dart';
import '../services/api_service.dart';
import '../services/firestore_service.dart';
import '../services/offline_sync_service.dart';
import '../services/mesh/mesh_service.dart';
import '../services/mesh/mesh_transport_ble_channel.dart';
import '../services/mesh/mesh_transport_noop.dart';
import 'package:flutter/foundation.dart';

final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService();
});

final firestoreServiceProvider = Provider<FirestoreService>((ref) {
  return FirestoreService();
});

final offlineSyncServiceProvider = ChangeNotifierProvider<OfflineSyncService>((ref) {
  final service = OfflineSyncService();
  ref.onDispose(service.dispose);
  return service;
});

final meshServiceProvider = ChangeNotifierProvider<MeshService>((ref) {
  final transport = (kIsWeb || defaultTargetPlatform != TargetPlatform.android)
      ? MeshNoopTransport()
      : MeshBleChannelTransport();
  final service = MeshService(transport: transport);

  // Fire and forget initialization; the UI can show status while it connects.
  () async {
    await service.initialize();
    try {
      await service.start();
    } catch {
      // Surface transport errors through status; keep app usable.
    }
  }();

  ref.onDispose(() {
    service.stop();
    if (transport is MeshBleChannelTransport) {
      transport.dispose();
    }
    if (transport is MeshNoopTransport) {
      transport.dispose();
    }
  });

  return service;
});

final shipmentsProvider = StreamProvider<List<Shipment>>((ref) {
  return ref.watch(firestoreServiceProvider).watchActiveShipments();
});

final dronesProvider = StreamProvider<List<Drone>>((ref) {
  return ref.watch(firestoreServiceProvider).watchFleet();
});

final dispatchesProvider = StreamProvider<List<DroneDispatch>>((ref) {
  return ref.watch(firestoreServiceProvider).watchActiveDispatches();
});

final warehousesProvider = StreamProvider<List<Warehouse>>((ref) {
  return ref.watch(firestoreServiceProvider).watchWarehouses();
});

final alertsProvider = StreamProvider<List<SystemAlert>>((ref) {
  return ref.watch(firestoreServiceProvider).watchAlerts();
});

final explanationsProvider = StreamProvider<List<AIExplanation>>((ref) {
  return ref.watch(firestoreServiceProvider).watchExplanations();
});

final clustersProvider = StreamProvider<List<SurvivorCluster>>((ref) {
  return ref.watch(firestoreServiceProvider).watchActiveClusters();
});

final teamsProvider = StreamProvider<List<RescueTeam>>((ref) {
  return ref.watch(firestoreServiceProvider).watchTeams();
});

final assignmentsProvider = StreamProvider<List<RescueAssignment>>((ref) {
  return ref.watch(firestoreServiceProvider).watchAssignments();
});

final disasterEventsProvider = StreamProvider<List<DisasterEvent>>((ref) {
  return ref.watch(firestoreServiceProvider).watchDisasterEvents();
});

final selectedShipmentProvider = StateProvider<Shipment?>((ref) => null);
final selectedWarehouseIdProvider = StateProvider<String?>((ref) => null);
final simulationStateProvider = StateProvider<SimulationResult?>((ref) => null);
final offlineModeToggleProvider = StateProvider<bool>((ref) => false);

final mapLayerVisibilityProvider = StateNotifierProvider<MapLayerVisibilityNotifier, Map<String, bool>>((ref) {
  return MapLayerVisibilityNotifier();
});

final metricsProvider = Provider<Map<String, AsyncValue<dynamic>>>((ref) {
  return {
    'shipments': ref.watch(shipmentsProvider),
    'drones': ref.watch(dronesProvider),
    'alerts': ref.watch(alertsProvider),
    'clusters': ref.watch(clustersProvider),
  };
});

class MapLayerVisibilityNotifier extends StateNotifier<Map<String, bool>> {
  MapLayerVisibilityNotifier()
      : super(const {
          'shipments': true,
          'drones': true,
          'routes': true,
          'survivors': true,
          'teams': true,
          'warehouses': true,
          'riskZones': true,
        });

  void toggle(String layer) {
    state = {
      ...state,
      layer: !(state[layer] ?? true),
    };
  }
}
