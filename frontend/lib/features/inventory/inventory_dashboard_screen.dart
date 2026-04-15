import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/app_models.dart';
import '../../core/providers/app_providers.dart';
import '../../core/theme/sg_theme.dart';
import '../../core/widgets/sg_app_bar.dart';

class InventoryDashboardScreen extends ConsumerWidget {
  const InventoryDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final warehousesAsync = ref.watch(warehousesProvider);
    final selectedWarehouseId = ref.watch(selectedWarehouseIdProvider);

    return Scaffold(
      appBar: const SgAppBar(title: 'Inventory dashboard', kicker: 'SupplyGuard AI'),
      body: warehousesAsync.when(
        data: (warehouses) {
          final selected = selectedWarehouseId ?? (warehouses.isNotEmpty ? warehouses.first.id : null);
          if (selected == null) {
            return const Center(child: Text('No warehouses available'));
          }

          final inventoryAsync = ref.watch(_warehouseInventoryProvider(selected));

          return Column(
            children: [
              SizedBox(
                height: 124,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.all(12),
                  children: warehouses.map((warehouse) {
                    final isSelected = warehouse.id == selected;
                    return GestureDetector(
                      onTap: () => ref.read(selectedWarehouseIdProvider.notifier).state = warehouse.id,
                      child: Container(
                        width: 220,
                        margin: const EdgeInsets.only(right: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFF0B2531) : SgColors.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: SgColors.border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              warehouse.name,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const Spacer(),
                            Text(warehouse.city, style: Theme.of(context).textTheme.bodySmall),
                            Text(
                              'Assigned pop: ${warehouse.assignedPopulation}',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              Expanded(
                child: inventoryAsync.when(
                  data: (items) {
                    final itemList = items.values.toList()..sort((a, b) => a.daysRemaining.compareTo(b.daysRemaining));
                    return ListView(
                      padding: const EdgeInsets.all(12),
                      children: [
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: SizedBox(
                              height: 180,
                              child: BarChart(
                                BarChartData(
                                  barGroups: itemList.take(6).toList().asMap().entries.map((entry) {
                                    return BarChartGroupData(
                                      x: entry.key,
                                      barRods: [
                                        BarChartRodData(toY: entry.value.daysRemaining),
                                      ],
                                    );
                                  }).toList(),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        ...itemList.map((item) => Card(
                              child: ListTile(
                                title: Text(item.itemName),
                                subtitle: Text('Stock ${item.currentQuantity} ${item.unit} • ${item.daysRemaining.toStringAsFixed(1)} days left'),
                                trailing: Text(item.status),
                              ),
                            )),
                      ],
                    );
                  },
                  error: (error, _) => Center(child: Text('Inventory error: $error')),
                  loading: () => const Center(child: CircularProgressIndicator()),
                ),
              ),
            ],
          );
        },
        error: (error, _) => Center(child: Text('Failed to load warehouses: $error')),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

final _warehouseInventoryProvider = StreamProvider.family<Map<String, InventoryItem>, String>((ref, warehouseId) {
  return ref.watch(firestoreServiceProvider).watchWarehouseInventory(warehouseId);
});
