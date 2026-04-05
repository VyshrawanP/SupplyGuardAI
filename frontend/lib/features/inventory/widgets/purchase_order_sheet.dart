import 'package:flutter/material.dart';

import '../../../core/models/app_models.dart';

class PurchaseOrderSheet extends StatelessWidget {
  const PurchaseOrderSheet({
    super.key,
    required this.purchaseOrder,
  });

  final PurchaseOrder purchaseOrder;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Purchase Order ${purchaseOrder.id}', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 12),
          Text('Warehouse: ${purchaseOrder.warehouseId}'),
          Text('Supplier: ${purchaseOrder.supplierId}'),
          Text('Delivery Address: ${purchaseOrder.deliveryAddress}'),
          Text('Required By: ${purchaseOrder.requiredBy}'),
          Text('Estimated Cost: INR ${purchaseOrder.estimatedCostInr.toStringAsFixed(0)}'),
          const SizedBox(height: 12),
          ...purchaseOrder.items.map((item) => Text('${item['item_name']}: ${item['quantity']} ${item['unit']}')),
          const SizedBox(height: 16),
          FilledButton(onPressed: () {}, child: const Text('Export as PDF')),
        ],
      ),
    );
  }
}
