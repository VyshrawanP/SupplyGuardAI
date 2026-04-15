import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../core/providers/app_providers.dart';
import '../../core/services/mesh/mesh_models.dart';
import '../../core/theme/sg_theme.dart';
import '../../core/widgets/sg_app_bar.dart';

class MeshConsoleScreen extends ConsumerStatefulWidget {
  const MeshConsoleScreen({super.key});

  @override
  ConsumerState<MeshConsoleScreen> createState() => _MeshConsoleScreenState();
}

class _MeshConsoleScreenState extends ConsumerState<MeshConsoleScreen> {
  final _message = TextEditingController();
  final _targetDeviceId = TextEditingController();
  MeshSeverity _severity = MeshSeverity.high;

  @override
  void initState() {
    super.initState();
    Future<void>.microtask(_ensurePermissions);
  }

  Future<void> _ensurePermissions() async {
    // Android 12+ needs bluetooth permissions; pre-12 needs location for scanning.
    final perms = <Permission>[
      Permission.bluetoothScan,
      Permission.bluetoothConnect,
      Permission.bluetoothAdvertise,
      Permission.locationWhenInUse,
    ];
    for (final p in perms) {
      if (await p.status.isGranted) continue;
      await p.request();
    }
  }

  @override
  void dispose() {
    _message.dispose();
    _targetDeviceId.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final mesh = ref.watch(meshServiceProvider);

    return Scaffold(
      appBar: SgAppBar(
        title: 'Offline mesh relay',
        kicker: 'SupplyGuard AI',
        actions: [
          IconButton(
            tooltip: 'Restart Mesh',
            onPressed: () async {
              await mesh.stop();
              await mesh.start();
            },
            icon: const Icon(Icons.restart_alt),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _StatusCard(mesh: mesh),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Broadcast Alert', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _message,
                    decoration: const InputDecoration(
                      labelText: 'Message',
                      hintText: 'Need water at Koramangala',
                      border: OutlineInputBorder(),
                    ),
                    minLines: 2,
                    maxLines: 4,
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<MeshSeverity>(
                    initialValue: _severity,
                    decoration: const InputDecoration(
                      labelText: 'Severity',
                      border: OutlineInputBorder(),
                    ),
                    items: MeshSeverity.values
                        .map((s) => DropdownMenuItem(value: s, child: Text(s.name.toUpperCase())))
                        .toList(),
                    onChanged: (value) => setState(() => _severity = value ?? MeshSeverity.high),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _targetDeviceId,
                    decoration: const InputDecoration(
                      labelText: 'Target Device ID (optional)',
                      hintText: 'If set, waits for ACK or fails out-of-range',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: () async {
                        try {
                          await mesh.broadcastAlert(
                            message: _message.text,
                            severity: _severity,
                            lat: 12.9716,
                            lng: 77.5946,
                            targetDeviceId: _targetDeviceId.text.trim().isEmpty ? null : _targetDeviceId.text.trim(),
                          );
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Alert sent')),
                            );
                          }
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Send failed: $e')),
                            );
                          }
                        }
                      },
                      icon: const Icon(Icons.campaign),
                      label: const Text('Send'),
                    ),
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
                  const Text('Inbox (Multi-hop)', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  if (mesh.inbox.isEmpty)
                    const Text('No alerts yet.')
                  else
                    ...mesh.inbox.take(30).map((msg) => _AlertTile(msg: msg)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusCard extends StatelessWidget {
  const _StatusCard({required this.mesh});

  final dynamic mesh;

  @override
  Widget build(BuildContext context) {
    final status = mesh.status;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Mesh Status', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Text('Device ID: ${mesh.deviceId}'),
            Text('Running: ${status.running}'),
            Text('Peers: ${status.peerCount}'),
            if (status.lastError != null) Text('Last error: ${status.lastError}'),
            const SizedBox(height: 6),
            const Text(
              'Tip: Multi-hop needs multiple phones nearby with Bluetooth on. Use a Target Device ID to require ACK, otherwise it floods locally.',
              style: TextStyle(color: SgColors.textSecondary),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ...status.peerIds.take(12).map((id) => Chip(label: Text(id))),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _AlertTile extends StatelessWidget {
  const _AlertTile({required this.msg});

  final MeshAlertMessage msg;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      leading: CircleAvatar(
        backgroundColor: _colorFor(msg.severity),
        child: Text(msg.severity.name.substring(0, 1).toUpperCase()),
      ),
      title: Text(msg.message),
      subtitle: Text(
        'from ${msg.originDeviceId} | hops ${msg.hops} | ttl ${msg.ttl}${msg.targetDeviceId != null ? ' | target ${msg.targetDeviceId}' : ''}',
      ),
      trailing: msg.trace == null ? null : Tooltip(
        message: msg.trace!.join(' → '),
        child: const Icon(Icons.route, size: 18),
      ),
    );
  }

  Color _colorFor(MeshSeverity s) {
    switch (s) {
      case MeshSeverity.low:
        return Colors.green;
      case MeshSeverity.medium:
        return Colors.amber;
      case MeshSeverity.high:
        return Colors.orange;
      case MeshSeverity.critical:
        return Colors.red;
    }
  }
}
