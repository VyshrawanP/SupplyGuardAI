import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/app_providers.dart';
import '../../core/services/mesh/mesh_models.dart';
import '../../core/theme/sg_theme.dart';
import '../../core/widgets/sg_app_bar.dart';
import 'lan_relay_settings_card.dart';

class RescueTeamHomeScreen extends ConsumerStatefulWidget {
  const RescueTeamHomeScreen({super.key});

  @override
  ConsumerState<RescueTeamHomeScreen> createState() => _RescueTeamHomeScreenState();
}

class _RescueTeamHomeScreenState extends ConsumerState<RescueTeamHomeScreen> {
  final _reply = TextEditingController();

  @override
  void dispose() {
    _reply.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final mesh = ref.watch(meshServiceProvider);

    return Scaffold(
      appBar: const SgAppBar(
        title: 'Rescue Team',
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
                  const Text('Incoming SOS', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  if (mesh.inbox.isEmpty)
                    const Text('No SOS messages yet.')
                  else
                    ...mesh.inbox.take(50).map((msg) => _SosCard(message: msg, reply: _reply)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            mesh.status.peerCount == 0 ? 'No peers detected.' : 'Peers in range: ${mesh.status.peerCount}',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: SgColors.textSecondary),
          ),
        ],
      ),
    );
  }
}

class _SosCard extends ConsumerWidget {
  const _SosCard({
    required this.message,
    required this.reply,
  });

  final MeshAlertMessage message;
  final TextEditingController reply;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mesh = ref.watch(meshServiceProvider);
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              message.message,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            Text(
              'from: ${message.originDeviceId} | ${message.timestampIso}',
              style: const TextStyle(color: SgColors.textSecondary, fontSize: 12),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: reply,
              decoration: const InputDecoration(
                labelText: 'Response message',
                hintText: 'We received your SOS. Help is on the way.',
                border: OutlineInputBorder(),
              ),
              minLines: 1,
              maxLines: 3,
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: () async {
                  try {
                    final text = reply.text.trim();
                    if (text.isEmpty) return;
                    // Target the victim device if available; this will wait for ACK and fail if out of range.
                    await mesh.broadcastAlert(
                      message: 'RESPONSE | $text | to: ${message.originDeviceId} | from: ${mesh.deviceId}',
                      severity: MeshSeverity.high,
                      lat: 12.9716,
                      lng: 77.5946,
                      targetDeviceId: message.originDeviceId,
                    );
                    if (!context.mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Response delivered (ACK received)')),
                    );
                  } catch (e) {
                    if (!context.mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Send failed: $e')),
                    );
                  }
                },
                icon: const Icon(Icons.reply),
                label: const Text('Send response'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

