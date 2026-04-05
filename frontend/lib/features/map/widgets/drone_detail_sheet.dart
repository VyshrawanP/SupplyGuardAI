import 'package:flutter/material.dart';

import '../../../core/models/app_models.dart';

class DroneDetailSheet extends StatelessWidget {
  const DroneDetailSheet({
    super.key,
    required this.drone,
  });

  final Drone drone;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(drone.id, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 12),
          Text('Model: ${drone.model}'),
          Text('Battery: ${drone.batteryPercent.toStringAsFixed(0)}%'),
          Text('Status: ${drone.status.name}'),
          Text('Payload: ${drone.availablePayloadKg}/${drone.maxPayloadKg} kg'),
          const SizedBox(height: 12),
          LinearProgressIndicator(value: drone.batteryPercent / 100),
        ],
      ),
    );
  }
}
