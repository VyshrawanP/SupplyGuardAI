import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/app_models.dart';
import '../../core/providers/app_providers.dart';

class SimulationConsoleScreen extends ConsumerWidget {
  const SimulationConsoleScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final simulation = ref.watch(simulationStateProvider);
    final scenario = ref.watch(_scenarioProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Simulation Console')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'FLOOD', label: Text('FLOOD')),
              ButtonSegment(value: 'CYCLONE', label: Text('CYCLONE')),
              ButtonSegment(value: 'ROAD_COLLAPSE', label: Text('ROAD')),
              ButtonSegment(value: 'BRIDGE_FAILURE', label: Text('BRIDGE')),
            ],
            selected: {scenario},
            onSelectionChanged: (value) => ref.read(_scenarioProvider.notifier).state = value.first,
          ),
          const SizedBox(height: 20),
          TextField(
            decoration: const InputDecoration(
              labelText: 'Scenario notes / parameters',
              border: OutlineInputBorder(),
            ),
            maxLines: 4,
            onChanged: (value) => ref.read(_scenarioNotesProvider.notifier).state = value,
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: () {
              ref.read(simulationStateProvider.notifier).state = SimulationResult(
                sessionId: DateTime.now().millisecondsSinceEpoch.toString(),
                scenarioType: scenario,
                impactSummary: const {
                  'shipments_disrupted': 4,
                  'drones_needed': 2,
                  'inventory_depletion': 3,
                  'rescue_missions': 2,
                  'lives_at_risk': 18,
                },
                computedAt: DateTime.now().toIso8601String(),
              );
            },
            child: const Text('Run Simulation'),
          ),
          const SizedBox(height: 20),
          if (simulation != null) ...[
            Text('Session ${simulation.sessionId}', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            ...(simulation.impactSummary.entries).map((entry) => Card(
                  child: ListTile(
                    title: Text(entry.key),
                    trailing: Text(entry.value.toString()),
                  ),
                )),
          ],
        ],
      ),
    );
  }
}

final _scenarioProvider = StateProvider<String>((ref) => 'FLOOD');
final _scenarioNotesProvider = StateProvider<String>((ref) => '');
