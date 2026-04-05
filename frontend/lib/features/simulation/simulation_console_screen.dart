import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/app_models.dart';
import '../../core/providers/app_providers.dart';

class SimulationConsoleScreen extends ConsumerStatefulWidget {
  const SimulationConsoleScreen({super.key});

  @override
  ConsumerState<SimulationConsoleScreen> createState() => _SimulationConsoleScreenState();
}

class _SimulationConsoleScreenState extends ConsumerState<SimulationConsoleScreen> {
  bool _loading = false;
  double _primarySlider = 2;
  double _secondarySlider = 24;

  @override
  Widget build(BuildContext context) {
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
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(scenario == 'FLOOD' ? 'Water level (m)' : 'Radius / severity'),
                  Slider(
                    value: _primarySlider,
                    min: 1,
                    max: scenario == 'CYCLONE' ? 300 : 5,
                    divisions: scenario == 'CYCLONE' ? 299 : 8,
                    label: _primarySlider.toStringAsFixed(1),
                    onChanged: (value) => setState(() => _primarySlider = value),
                  ),
                  Text(scenario == 'FLOOD' ? 'Duration (hours)' : 'ETA / repair window'),
                  Slider(
                    value: _secondarySlider,
                    min: 1,
                    max: 72,
                    divisions: 71,
                    label: _secondarySlider.round().toString(),
                    onChanged: (value) => setState(() => _secondarySlider = value),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _loading
                ? null
                : () async {
                    setState(() => _loading = true);
                    final result = await ref.read(apiServiceProvider).runSimulation(
                      scenarioType: scenario,
                      parameters: {
                        'water_level_meters': _primarySlider,
                        'duration_hours': _secondarySlider,
                        'notes': ref.read(_scenarioNotesProvider),
                      },
                    );
                    ref.read(simulationStateProvider.notifier).state = result;
                    if (mounted) {
                      setState(() => _loading = false);
                    }
                  },
            child: Text(_loading ? 'Running...' : 'Run Simulation'),
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
