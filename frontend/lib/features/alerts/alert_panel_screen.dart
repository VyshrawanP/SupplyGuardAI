import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/app_models.dart';
import '../../core/providers/app_providers.dart';
import 'widgets/ai_explanation_modal.dart';

class AlertPanelScreen extends ConsumerWidget {
  const AlertPanelScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final alertsAsync = ref.watch(alertsProvider);
    final explanations = ref.watch(explanationsProvider).valueOrNull ?? const [];
    final filter = ref.watch(_filterProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Alert Panel'),
        actions: [
          TextButton(
            onPressed: () async {
              final alerts = alertsAsync.valueOrNull ?? const [];
              for (final alert in alerts.where((item) => !item.acknowledged)) {
                await ref.read(firestoreServiceProvider).acknowledgeAlert(alert.id);
              }
            },
            child: const Text('Acknowledge All'),
          ),
        ],
      ),
      body: Column(
        children: [
          SizedBox(
            height: 52,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              children: [
                for (final choice in const ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'DRONE', 'INVENTORY', 'ROUTE'])
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      selected: filter == choice,
                      label: Text(choice),
                      onSelected: (_) => ref.read(_filterProvider.notifier).state = choice,
                    ),
                  ),
              ],
            ),
          ),
          Expanded(
            child: alertsAsync.when(
              data: (alerts) {
                final filtered = alerts.where((alert) {
                  if (filter == 'ALL') {
                    return true;
                  }
                  return alert.severity.toUpperCase() == filter ||
                      alert.alertType.toUpperCase().contains(filter);
                }).toList();

                if (filtered.any((alert) => alert.severity.toUpperCase() == 'CRITICAL')) {
                  HapticFeedback.heavyImpact();
                }

                return ListView.builder(
                  itemCount: filtered.length,
                  itemBuilder: (context, index) {
                    final alert = filtered[index];
                    final List<AIExplanation> linkedExplanation = explanations.where((item) => item.eventId == alert.id).toList();
                    final AIExplanation? explanation = linkedExplanation.isNotEmpty ? linkedExplanation.first : null;

                    return Dismissible(
                      key: ValueKey(alert.id),
                      direction: DismissDirection.endToStart,
                      onDismissed: (_) => ref.read(firestoreServiceProvider).acknowledgeAlert(alert.id),
                      background: Container(
                        color: Colors.green,
                        alignment: Alignment.centerRight,
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: const Icon(Icons.check, color: Colors.white),
                      ),
                      child: Card(
                        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        child: ListTile(
                          leading: Container(
                            width: 6,
                            decoration: BoxDecoration(
                              color: _severityColor(alert.severity),
                              borderRadius: BorderRadius.circular(999),
                            ),
                          ),
                          title: Text(alert.alertType),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(alert.description),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                children: [
                                  Chip(label: Text(alert.severity)),
                                  if (alert.entityId != null) Chip(label: Text(alert.entityId!)),
                                ],
                              ),
                            ],
                          ),
                          trailing: Wrap(
                            spacing: 8,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.check_circle_outline),
                                onPressed: () => ref.read(firestoreServiceProvider).acknowledgeAlert(alert.id),
                              ),
                              IconButton(
                                icon: const Icon(Icons.psychology_outlined),
                                onPressed: explanation == null
                                    ? null
                                    : () {
                                        showModalBottomSheet<void>(
                                          context: context,
                                          isScrollControlled: true,
                                          builder: (_) => AIExplanationModal(explanation: explanation),
                                        );
                                      },
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                );
              },
              error: (error, _) => Center(child: Text('Failed to load alerts: $error')),
              loading: () => const Center(child: CircularProgressIndicator()),
            ),
          ),
        ],
      ),
    );
  }

  Color _severityColor(String severity) {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return Colors.red;
      case 'HIGH':
        return Colors.orange;
      case 'MEDIUM':
        return Colors.amber;
      default:
        return Colors.blue;
    }
  }
}

final _filterProvider = StateProvider<String>((ref) => 'ALL');
