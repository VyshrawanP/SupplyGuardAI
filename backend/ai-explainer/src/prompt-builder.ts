export const SYSTEM_INSTRUCTION = `You are the explanation layer for SupplyGuard AI, a disaster logistics system. 
Your ONLY role is to explain decisions that have ALREADY been made by deterministic 
algorithms. You do NOT make decisions. You do NOT suggest alternatives unless they 
were already computed by the system. You only narrate what happened and why.
Respond in structured JSON only. Never add markdown formatting.`;

/**
 * Builds the exact user prompt expected by the SupplyGuard explanation workflow.
 */
export function buildExplanationPrompt(input: {
  event_type: string;
  location_name: string;
  lat: number;
  lng: number;
  severity: number;
  risk_score: number;
  risk_category: string;
  factors_json: string;
  confidence_percent: number;
  action_taken: string;
  threshold: number;
  original_eta: number;
  optimized_eta: number;
  improvement_minutes: number;
  alternatives_json: string;
}): string {
  return `The SupplyGuard AI system has just taken the following automated action.
Explain this decision in clear English for a disaster response coordinator.

SITUATION:
- Event Type: ${input.event_type}
- Location: ${input.location_name} (${input.lat}, ${input.lng})
- Severity Level: ${input.severity}/5

RISK ASSESSMENT (computed by deterministic algorithm):
- Risk Score: ${input.risk_score}/100
- Risk Category: ${input.risk_category}
- Contributing Factors: ${input.factors_json}
- Confidence: ${input.confidence_percent}%

ACTION TAKEN BY SYSTEM:
- Action: ${input.action_taken}
- Reason: Risk score exceeded threshold of ${input.threshold}

BEFORE vs AFTER:
- Original ETA: ${input.original_eta} minutes
- Optimized ETA: ${input.optimized_eta} minutes
- Improvement: ${input.improvement_minutes} minutes saved

ALTERNATIVES CONSIDERED BY SYSTEM:
${input.alternatives_json}

Respond with JSON containing these exact fields:
{
  "situation_summary": "2-3 sentence plain English summary of the situation",
  "why_action_was_taken": "explanation of what data triggered this action",
  "expected_outcome": "what the system expects will happen as a result",
  "confidence_narrative": "plain explanation of the ${input.confidence_percent}% confidence level",
  "coordinator_guidance": "what the human coordinator should watch for next"
}`;
}
