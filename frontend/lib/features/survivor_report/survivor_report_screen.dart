import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

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
            child: GoogleMap(
              initialCameraPosition: const CameraPosition(
                target: LatLng(12.9716, 77.5946),
                zoom: 12,
              ),
              onTap: (position) => setState(() => _selected = position),
              markers: {
                if (_selected != null)
                  Marker(
                    markerId: const MarkerId('selected'),
                    position: _selected!,
                  ),
              },
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
