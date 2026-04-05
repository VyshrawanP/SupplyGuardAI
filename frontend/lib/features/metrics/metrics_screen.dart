import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/app_providers.dart';

class MetricsScreen extends ConsumerWidget {
  const MetricsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final shipments = ref.watch(shipmentsProvider).valueOrNull ?? const [];
    final drones = ref.watch(dronesProvider).valueOrNull ?? const [];
    final alerts = ref.watch(alertsProvider).valueOrNull ?? const [];
    final clusters = ref.watch(clustersProvider).valueOrNull ?? const [];

    return Scaffold(
      appBar: AppBar(title: const Text('Metrics Dashboard')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _KpiCard(title: 'Active Shipments', value: '${shipments.length}'),
              _KpiCard(title: 'Active Drones', value: '${drones.length}'),
              _KpiCard(title: 'Critical Alerts', value: '${alerts.where((a) => a.severity == 'CRITICAL').length}'),
              _KpiCard(title: 'Survivor Clusters', value: '${clusters.length}'),
            ],
          ),
          const SizedBox(height: 20),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                height: 220,
                child: LineChart(
                  LineChartData(
                    lineBarsData: [
                      LineChartBarData(
                        spots: List.generate(shipments.length, (index) => FlSpot(index.toDouble(), (shipments[index].riskScore ?? 0).toDouble())),
                        isCurved: true,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _KpiCard extends StatelessWidget {
  const _KpiCard({
    required this.title,
    required this.value,
  });

  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 180,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title),
              const SizedBox(height: 8),
              Text(value, style: Theme.of(context).textTheme.headlineSmall),
            ],
          ),
        ),
      ),
    );
  }
}
