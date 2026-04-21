import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/providers/app_providers.dart';
import '../../core/theme/sg_theme.dart';

class LanRelaySettingsCard extends ConsumerStatefulWidget {
  const LanRelaySettingsCard({super.key});

  @override
  ConsumerState<LanRelaySettingsCard> createState() => _LanRelaySettingsCardState();
}

class _LanRelaySettingsCardState extends ConsumerState<LanRelaySettingsCard> {
  final _baseUrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    Future<void>.microtask(_load);
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final value = prefs.getString('sg_lan_relay_base_url_v1') ?? '';
    if (!mounted) return;
    _baseUrl.text = value;
    setState(() {});
  }

  Future<void> _apply() async {
    final value = _baseUrl.text.trim();
    final prefs = await SharedPreferences.getInstance();
    if (value.isEmpty) {
      await prefs.remove('sg_lan_relay_base_url_v1');
    } else {
      await prefs.setString('sg_lan_relay_base_url_v1', value);
    }
    // Restart mesh to pick up the new URL.
    final mesh = ref.read(meshServiceProvider);
    await mesh.stop();
    try {
      await mesh.start();
    } catch (_) {}
  }

  @override
  void dispose() {
    _baseUrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final mesh = ref.watch(meshServiceProvider);
    final lastError = mesh.status.lastError;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('LAN relay', style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text(
              'Set this to your laptop IP running `npm run dev` (example: http://192.168.233.49:3000).',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: SgColors.textSecondary),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _baseUrl,
              keyboardType: TextInputType.url,
              decoration: const InputDecoration(
                labelText: 'Base URL',
                hintText: 'http://<laptop-ip>:3000',
                border: OutlineInputBorder(),
              ),
              onSubmitted: (_) => _apply(),
            ),
            if (lastError != null && lastError.trim().isNotEmpty) ...[
              const SizedBox(height: 10),
              Text(
                'Last error: $lastError',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: SgColors.warning),
              ),
            ],
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: FilledButton.icon(
                    onPressed: _apply,
                    icon: const Icon(Icons.link),
                    label: const Text('Apply'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

