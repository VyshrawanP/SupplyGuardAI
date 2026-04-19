import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:supply_guard_ai/services/logistics_service.dart';
import 'package:lucide_icons/lucide_icons.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  Widget build(BuildContext context) {
    final service = Provider.of<LogisticsService>(context);

    return Scaffold(
      body: Row(
        children: [
          // Sidebar
          Container(
            width: 300,
            color: const Color(0xFF121214),
            child: Column(
              children: [
                _buildHeader(),
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      _buildAlertsSection(service),
                      const SizedBox(height: 24),
                      _buildSimulationSection(service),
                      const SizedBox(height: 24),
                      _buildShipmentsSection(service),
                    ],
                  ),
                ),
              ],
            ),
          ),
          // Main Content
          Expanded(
            child: Column(
              children: [
                _buildTopBar(),
                Expanded(
                  child: Stack(
                    children: [
                      _buildMap(service),
                      _buildMetricsOverlay(),
                    ],
                  ),
                ),
                if (service.selectedShipment != null) _buildAIPanel(service),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.white10)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.blue,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(LucideIcons.shieldAlert, color: Colors.white),
          ),
          const SizedBox(width: 12),
          const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('SupplyGuard AI', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              Text('Disaster Logistics', style: TextStyle(fontSize: 10, color: Colors.grey)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMap(LogisticsService service) {
    const center = LatLng(12.9716, 77.5946); // Bengaluru

    return FlutterMap(
      options: MapOptions(
        initialCenter: center,
        initialZoom: 11,
        interactionOptions: const InteractionOptions(flags: InteractiveFlag.all),
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          subdomains: const ['a', 'b', 'c', 'd'],
          userAgentPackageName: 'supply_guard_ai',
        ),
        MarkerLayer(
          markers: service.shipments.map((shipment) {
            final color = shipment.status == 'delayed' ? Colors.orange : Colors.cyanAccent;
            return Marker(
              point: shipment.currentPos,
              width: 42,
              height: 42,
              child: GestureDetector(
                onTap: () => service.selectShipment(shipment),
                child: Container(
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.18),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: color.withOpacity(0.65)),
                  ),
                  child: Icon(
                    LucideIcons.truck,
                    color: color,
                    size: 18,
                  ),
                ),
              ),
            );
          }).toList(growable: false),
        ),
        const SimpleAttributionWidget(
          source: Text('© OpenStreetMap, © CARTO'),
          alignment: Alignment.bottomRight,
        ),
      ],
    );
  }

  Widget _buildAIPanel(LogisticsService service) {
    return Container(
      height: 250,
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Color(0xFF121214),
        border: Border(top: BorderSide(color: Colors.white10)),
      ),
      child: Row(
        children: [
          // Shipment Info
          Expanded(
            flex: 1,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Shipment: ${service.selectedShipment!.id}', style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                Row(
                  children: [
                    _buildStatCard('Risk Score', '${service.selectedShipment!.riskScore}%', Colors.red),
                    const SizedBox(width: 16),
                    _buildStatCard('Delay', '+${service.selectedShipment!.delay}m', Colors.yellow),
                  ],
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () => service.generateAIExplanation(),
                  icon: const Icon(LucideIcons.brainCircuit),
                  label: const Text('Generate AI Explanation'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    minimumSize: const Size(double.infinity, 50),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 24),
          // AI Output
          Expanded(
            flex: 2,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(LucideIcons.brainCircuit, color: Colors.purple, size: 16),
                      SizedBox(width: 8),
                      Text('Gemini Explainability Layer', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    service.aiExplanation ?? 'Select a shipment and generate explanation...',
                    style: const TextStyle(color: Colors.grey),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey)),
            Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }

  // ... other helper widgets (Alerts, Simulation, Shipments) ...
  Widget _buildAlertsSection(LogisticsService service) => Container();
  Widget _buildSimulationSection(LogisticsService service) => Container();
  Widget _buildShipmentsSection(LogisticsService service) => Container();
  Widget _buildTopBar() => Container();
  Widget _buildMetricsOverlay() => Container();
}
