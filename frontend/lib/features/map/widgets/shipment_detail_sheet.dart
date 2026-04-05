import 'package:flutter/material.dart';

import '../../../core/models/app_models.dart';

class ShipmentDetailSheet extends StatelessWidget {
  const ShipmentDetailSheet({
    super.key,
    required this.shipment,
  });

  final Shipment shipment;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Shipment ${shipment.id}', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 12),
          Text('Cargo: ${shipment.cargoSummary.join(', ')}'),
          Text('Risk Score: ${shipment.riskScore ?? 'N/A'}'),
          Text('Delay Prediction: ${shipment.delayPredictionMinutes ?? 0} mins'),
          Text('Current ETA: ${shipment.currentEtaMinutes} mins'),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            children: [
              FilledButton(onPressed: () {}, child: const Text('Force Reroute')),
              OutlinedButton(onPressed: () {}, child: const Text('View Full Route')),
              OutlinedButton(onPressed: () {}, child: const Text('Contact Driver')),
            ],
          ),
        ],
      ),
    );
  }
}
