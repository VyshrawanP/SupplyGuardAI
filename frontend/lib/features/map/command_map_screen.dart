import 'dart:math' as math;

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';

import '../../core/providers/app_providers.dart';
import '../../core/widgets/sg_app_bar.dart';
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

    final shipments = shipmentsAsync.asData?.value ?? const [];
    final drones = dronesAsync.asData?.value ?? const [];
    final clusters = clustersAsync.asData?.value ?? const [];
    final teams = teamsAsync.asData?.value ?? const [];
    final warehouses = warehousesAsync.asData?.value ?? const [];
    final events = eventsAsync.asData?.value ?? const [];

    return Scaffold(
      appBar: const SgAppBar(
        title: 'Bengaluru street operations',
        kicker: 'SupplyGuard AI',
      ),
      body: Stack(
        children: [
          FlutterMap(
            options: MapOptions(
              initialCenter: const LatLng(12.9716, 77.5946),
              initialZoom: 11,
              interactionOptions: const InteractionOptions(flags: InteractiveFlag.all),
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
                subdomains: const ['a', 'b', 'c', 'd'],
                userAgentPackageName: 'supplyguard_ai_frontend',
                retinaMode: true,
              ),
              if (layers['riskZones'] == true)
                PolygonLayer(
                  polygons: events
                      .map(
                        (event) => Polygon(
                          points: _circleApproximation(event.coordinates, event.affectedRadiusKm),
                          color: Colors.red.withOpacity(0.14),
                          borderColor: Colors.red.withOpacity(0.9),
                          borderStrokeWidth: 2,
                        ),
                      )
                      .toList(growable: false),
                ),
              if (layers['routes'] == true)
                PolylineLayer(
                  polylines: shipments
                      .map(
                        (shipment) => Polyline(
                          points: shipment.polyline
                              .map((point) => LatLng(point.latitude, point.longitude))
                              .toList(growable: false),
                          color: shipment.status == 'DELAYED'
                              ? Colors.red
                              : shipment.status == 'AT_RISK'
                                  ? Colors.blue
                                  : Colors.green,
                          strokeWidth: 4,
                        ),
                      )
                      .toList(growable: false),
                ),
              MarkerLayer(
                markers: [
                  if (layers['shipments'] == true)
                    ...shipments.map((shipment) => _marker(
                          id: 'shipment-${shipment.id}',
                          point: LatLng(shipment.currentPosition.latitude, shipment.currentPosition.longitude),
                          color: const Color(0xFF67E8F9),
                          icon: Icons.local_shipping_outlined,
                          onTap: () {
                            showModalBottomSheet<void>(
                              context: context,
                              builder: (_) => ShipmentDetailSheet(shipment: shipment),
                            );
                          },
                        )),
                  if (layers['drones'] == true)
                    ...drones.map((drone) => _marker(
                          id: 'drone-${drone.id}',
                          point: LatLng(drone.currentPosition.latitude, drone.currentPosition.longitude),
                          color: const Color(0xFF3B82F6),
                          icon: Icons.flight_outlined,
                          onTap: () {
                            showModalBottomSheet<void>(
                              context: context,
                              builder: (_) => DroneDetailSheet(drone: drone),
                            );
                          },
                        )),
                  if (layers['survivors'] == true)
                    ...clusters.map((cluster) => _marker(
                          id: 'cluster-${cluster.clusterId}',
                          point: LatLng(cluster.center.latitude, cluster.center.longitude),
                          color: const Color(0xFFFB7185),
                          icon: Icons.sos_outlined,
                          onTap: () {},
                        )),
                  if (layers['teams'] == true)
                    ...teams.map((team) => _marker(
                          id: 'team-${team.id}',
                          point: LatLng(team.currentPosition.latitude, team.currentPosition.longitude),
                          color: const Color(0xFF34D399),
                          icon: Icons.person_pin_circle_outlined,
                          onTap: () {},
                        )),
                  if (layers['warehouses'] == true)
                    ...warehouses.map((warehouse) => _marker(
                          id: 'warehouse-${warehouse.id}',
                          point: LatLng(warehouse.location.latitude, warehouse.location.longitude),
                          color: const Color(0xFFF59E0B),
                          icon: Icons.warehouse_outlined,
                          onTap: () {},
                        )),
                ],
              ),
              if (layers['survivors'] == true)
                CircleLayer(
                  circles: clusters
                      .map(
                        (cluster) => CircleMarker(
                          point: LatLng(cluster.center.latitude, cluster.center.longitude),
                          useRadiusInMeter: true,
                          radius: 500,
                          color: Colors.red.withOpacity(0.12),
                          borderColor: Colors.redAccent.withOpacity(0.6),
                          borderStrokeWidth: 2,
                        ),
                      )
                      .toList(growable: false),
                ),
              const SimpleAttributionWidget(
                source: Text('© OpenStreetMap, © CARTO'),
                alignment: Alignment.bottomRight,
              ),
            ],
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

  static Marker _marker({
    required String id,
    required LatLng point,
    required Color color,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Marker(
      key: ValueKey(id),
      point: point,
      width: 44,
      height: 44,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            color: color.withOpacity(0.18),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: color.withOpacity(0.7)),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
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
