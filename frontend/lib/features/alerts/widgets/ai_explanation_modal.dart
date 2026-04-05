import 'package:flutter/material.dart';

import '../../../core/models/app_models.dart';

class AIExplanationModal extends StatelessWidget {
  const AIExplanationModal({
    super.key,
    required this.explanation,
  });

  final AIExplanation explanation;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: ListView(
        shrinkWrap: true,
        children: [
          Text('AI Explanation', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 16),
          _Section(title: 'Situation Summary', body: explanation.situationSummary),
          _Section(title: 'Why Action Was Taken', body: explanation.whyActionWasTaken),
          _Section(title: 'Expected Outcome', body: explanation.expectedOutcome),
          _Section(title: 'Confidence Level', body: explanation.confidenceNarrative),
          _Section(title: 'Coordinator Guidance', body: explanation.coordinatorGuidance),
          const SizedBox(height: 12),
          Text('Event: ${explanation.eventId ?? 'N/A'}'),
          Text('Action: ${explanation.actionTaken}'),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({
    required this.title,
    required this.body,
  });

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 6),
          Text(body),
        ],
      ),
    );
  }
}
