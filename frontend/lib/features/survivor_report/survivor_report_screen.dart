import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';

import '../../core/models/app_models.dart';
import '../../core/providers/app_providers.dart';
import '../../core/widgets/sg_app_bar.dart';

class SurvivorReportScreen extends ConsumerStatefulWidget {
  const SurvivorReportScreen({super.key});

  @override
  ConsumerState<SurvivorReportScreen> createState() => _SurvivorReportScreenState();
}

class _SurvivorReportScreenState extends ConsumerState<SurvivorReportScreen> {
  LatLng? _selected;
  double _count = 1;
  int _severity = 1;
  final TextEditingController _descriptionController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const SgAppBar(title: 'Survivor self-report', kicker: 'SupplyGuard AI'),
      body: Column(
        children: [
          Expanded(
            child: FlutterMap(
              options: MapOptions(
                initialCenter: const LatLng(12.9716, 77.5946),
                initialZoom: 12,
                onTap: (_, point) => setState(() => _selected = point),
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
                  subdomains: const ['a', 'b', 'c', 'd'],
                  userAgentPackageName: 'supplyguard_ai_frontend',
                  retinaMode: true,
                ),
                MarkerLayer(
                  markers: [
                    if (_selected != null)
                      Marker(
                        point: _selected!,
                        width: 44,
                        height: 44,
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.red.withOpacity(0.18),
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(color: Colors.red.withOpacity(0.7)),
                          ),
                          child: const Icon(Icons.location_on_outlined, color: Colors.red),
                        ),
                      ),
                  ],
                ),
                const SimpleAttributionWidget(
                  source: Text('© OpenStreetMap, © CARTO'),
                  alignment: Alignment.bottomRight,
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Slider(
                  value: _count,
                  min: 1,
                  max: 200,
                  divisions: 199,
                  label: _count.round().toString(),
                  onChanged: (value) => setState(() => _count = value),
                ),
                Wrap(
                  spacing: 8,
                  children: List.generate(4, (index) {
                    const labels = ['Need Water', 'Need Food', 'Need Medical', 'Life Threatening'];
                    return ChoiceChip(
                      selected: _severity == index + 1,
                      label: Text(labels[index]),
                      onSelected: (_) => setState(() => _severity = index + 1),
                    );
                  }),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _descriptionController,
                  decoration: const InputDecoration(
                    labelText: 'Description',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: _selected == null
                      ? null
                      : () async {
                          final report = SurvivorReport(
                            id: '',
                            coordinates: GeoPoint(_selected!.latitude, _selected!.longitude),
                            count: _count.round(),
                            severity: _severity,
                            description: _descriptionController.text,
                          );
                          await ref.read(firestoreServiceProvider).submitSurvivorReport(report);
                          if (!mounted) {
                            return;
                          }
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Report submitted successfully')),
                          );
                        },
                  child: const Text('Submit'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
