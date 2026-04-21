import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/app_providers.dart';
import '../../core/services/mesh/mesh_models.dart';
import '../../core/theme/sg_theme.dart';
import '../../core/widgets/sg_app_bar.dart';
import 'lan_relay_settings_card.dart';

class VictimHomeScreen extends ConsumerStatefulWidget {
  const VictimHomeScreen({super.key});

  @override
  ConsumerState<VictimHomeScreen> createState() => _VictimHomeScreenState();
}

class _VictimHomeScreenState extends ConsumerState<VictimHomeScreen> {
  final _name = TextEditingController();
  final _location = TextEditingController();
  final _need = TextEditingController();

  @override
  void dispose() {
    _name.dispose();
    _location.dispose();
    _need.dispose();
    super.dispose();
  }

  String _buildSosMessage({required String deviceId}) {
    final name = _name.text.trim();
    final loc = _location.text.trim();
    final need = _need.text.trim();
    final parts = <String>[
      'SOS',
      if (need.isNotEmpty) 'need: $need',
      if (name.isNotEmpty) 'name: $name',
      if (loc.isNotEmpty) 'location: $loc',
      'device: $deviceId',
    ];
    return parts.join(' | ');
  }

  @override
  Widget build(BuildContext context) {
    final mesh = ref.watch(meshServiceProvider);

    return Scaffold(
      appBar: const SgAppBar(
        title: 'Victim SOS',
        kicker: 'SupplyGuard AI',
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const LanRelaySettingsCard(),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Send SOS', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _name,
                    decoration: const InputDecoration(
                      labelText: 'Name (optional)',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _location,
                    decoration: const InputDecoration(
                      labelText: 'Location (optional)',
                      hintText: 'Example: Indiranagar, Bengaluru',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _need,
                    decoration: const InputDecoration(
                      labelText: 'Need (optional)',
                      hintText: 'Food, medical, water, rescue',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      style: FilledButton.styleFrom(
                        backgroundColor: SgColors.critical,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      onPressed: () async {
                        try {
                          final msg = _buildSosMessage(deviceId: mesh.deviceId);
                          await mesh.broadcastAlert(
                            message: msg,
                            severity: MeshSeverity.critical,
                            lat: 12.9716,
                            lng: 77.5946,
                          );
                          if (!context.mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('SOS sent')),
                          );
                        } catch (e) {
                          if (!context.mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Send failed: $e')),
                          );
                        }
                      },
                      icon: const Icon(Icons.sos),
                      label: const Text('SEND SOS'),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    mesh.status.peerCount == 0
                        ? 'No peers detected. If you are out of range, SOS cannot hop.'
                        : 'Peers in range: ${mesh.status.peerCount}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: SgColors.textSecondary),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Broadcast inbox', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  if (mesh.inbox.isEmpty)
                    const Text('No messages yet.')
                  else
                    ...mesh.inbox.take(40).map(
                          (msg) => ListTile(
                            dense: true,
                            title: Text(
                              msg.message,
                              style: const TextStyle(fontSize: 13),
                            ),
                            subtitle: Text(
                              '${msg.severity.name.toUpperCase()} | ${msg.timestampIso}',
                              style: const TextStyle(color: SgColors.textSecondary, fontSize: 12),
                            ),
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
}

