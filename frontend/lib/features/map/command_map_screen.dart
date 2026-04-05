import 'dart:math' as math;

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../core/providers/app_providers.dart';
import 'widgets/drone_detail_sheet.dart';
import 'widgets/shipment_detail_sheet.dart';

class CommandMapScreen extends ConsumerWidget {
  const CommandMapScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final shipmentsAsync = ref.watch(shipmentsProvider);
    final dronesAsync = ref.watch(dronesProvider);
    final clustersAsync = ref.watch(clustersProvider);
    final teamsAsync = ref.watch(teamsProvider);
    final warehousesAsync = ref.watch(warehousesProvider);
    final eventsAsync = ref.watch(disasterEventsProvider);
    final layers = ref.watch(mapLayerVisibilityProvider);

    return Scaffold(
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: const CameraPosition(
              target: LatLng(20.2961, 85.8245),
              zoom: 7,
            ),
            markers: {
              if (layers['shipments'] == true)
                ...shipmentsAsync.valueOrNull?.map((shipment) => Marker(
                      markerId: MarkerId('shipment-${shipment.id}'),
                      position: LatLng(
                        shipment.currentPosition.latitude,
                        shipment.currentPosition.longitude,
                      ),
                      infoWindow: InfoWindow(title: shipment.id),
                      onTap: () {
                        showModalBottomSheet<void>(
                          context: context,
                          builder: (_) => ShipmentDetailSheet(shipment: shipment),
                        );
                      },
                    )) ??
                    const <Marker>{},
              if (layers['drones'] == true)
                ...dronesAsync.valueOrNull?.map((drone) => Marker(
                      markerId: MarkerId('drone-${drone.id}'),
                      position: LatLng(
                        drone.currentPosition.latitude,
                        drone.currentPosition.longitude,
                      ),
                      infoWindow: InfoWindow(title: drone.id),
                      onTap: () {
                        showModalBottomSheet<void>(
                          context: context,
                          builder: (_) => DroneDetailSheet(drone: drone),
                        );
                      },
                      icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
                    )) ??
                    const <Marker>{},
              if (layers['survivors'] == true)
                ...clustersAsync.valueOrNull?.map((cluster) => Marker(
                      markerId: MarkerId('cluster-${cluster.clusterId}'),
                      position: LatLng(cluster.center.latitude, cluster.center.longitude),
                      icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRose),
                      infoWindow: InfoWindow(title: 'Cluster ${cluster.clusterId}'),
                    )) ??
                    const <Marker>{},
              if (layers['teams'] == true)
                ...teamsAsync.valueOrNull?.map((team) => Marker(
                      markerId: MarkerId('team-${team.id}'),
                      position: LatLng(team.currentPosition.latitude, team.currentPosition.longitude),
                      icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
                      infoWindow: InfoWindow(title: team.name),
                    )) ??
                    const <Marker>{},
              if (layers['warehouses'] == true)
                ...warehousesAsync.valueOrNull?.map((warehouse) => Marker(
                      markerId: MarkerId('warehouse-${warehouse.id}'),
                      position: LatLng(warehouse.location.latitude, warehouse.location.longitude),
                      icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange),
                      infoWindow: InfoWindow(title: warehouse.name),
                    )) ??
                    const <Marker>{},
            },
            polylines: {
              if (layers['routes'] == true)
                ...shipmentsAsync.valueOrNull?.map((shipment) => Polyline(
                      polylineId: PolylineId('route-${shipment.id}'),
                      points: shipment.polyline
                          .map((point) => LatLng(point.latitude, point.longitude))
                          .toList(),
                      color: shipment.status == 'DELAYED'
                          ? Colors.red
                          : shipment.status == 'AT_RISK'
                              ? Colors.blue
                              : Colors.green,
                      width: 4,
                    )) ??
                    const <Polyline>{},
            },
            polygons: {
              if (layers['riskZones'] == true)
                ...eventsAsync.valueOrNull?.map((event) => Polygon(
                      polygonId: PolygonId('event-${event.id}'),
                      points: _circleApproximation(event.coordinates, event.affectedRadiusKm),
                      fillColor: Colors.red.withOpacity(0.16),
                      strokeColor: Colors.red,
                      strokeWidth: 2,
                    )) ??
                    const <Polygon>{},
            },
            circles: {
              if (layers['survivors'] == true)
                ...clustersAsync.valueOrNull?.map((cluster) => Circle(
                      circleId: CircleId(cluster.clusterId),
                      center: LatLng(cluster.center.latitude, cluster.center.longitude),
                      radius: 500,
                      fillColor: Colors.red.withOpacity(0.16),
                      strokeColor: Colors.redAccent,
                    )) ??
                    const <Circle>{},
            },
          ),
          Positioned(
            top: 56,
            left: 16,
            right: 16,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  for (final layer in const [
                    'shipments',
                    'drones',
                    'routes',
                    'survivors',
                    'teams',
                    'warehouses',
                    'riskZones',
                  ])
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        selected: layers[layer] ?? true,
                        label: Text(layer),
                        onSelected: (_) => ref.read(mapLayerVisibilityProvider.notifier).toggle(layer),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<LatLng> _circleApproximation(GeoPoint center, double radiusKm) {
    const steps = 20;
    return List<LatLng>.generate(steps, (index) {
      final angle = index / steps * 6.283185307179586;
      final latOffset = (radiusKm / 111) * math.sin(angle);
      final lngOffset = (radiusKm / (111 * math.cos(center.latitude * 0.0174533))) * math.cos(angle);
      return LatLng(center.latitude + latOffset, center.longitude + lngOffset);
    });
  }
}
