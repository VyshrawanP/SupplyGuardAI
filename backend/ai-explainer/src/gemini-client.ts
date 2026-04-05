import { PubSub } from '@google-cloud/pubsub';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { buildExplanationPrompt, SYSTEM_INSTRUCTION } from './prompt-builder';
import { getFirestore } from './shared';

const pubsub = new PubSub({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

function fallbackExplanation(input: {
  event_id?: string;
  event_type: string;
  risk_score: number;
  risk_category: string;
  confidence_percent: number;
  action_taken: string;
  improvement_minutes: number;
}): Record<string, string> {
  return {
    situation_summary: `${input.event_type} conditions pushed the route or response plan into the ${input.risk_category.toLowerCase()} risk band at ${input.risk_score}/100.`,
    why_action_was_taken: `The system took ${input.action_taken} because the deterministic risk score crossed the operational threshold and indicated rising disruption likelihood.`,
    expected_outcome: `The system expects the action to reduce downstream delay and protect response continuity, with an estimated improvement of ${input.improvement_minutes} minutes where routing data was available.`,
    confidence_narrative: `Confidence is ${input.confidence_percent}% based on source freshness and how complete the weather, route, and sensor inputs were at computation time.`,
    coordinator_guidance: 'Watch field telemetry, fresh route updates, and inventory runway in case the situation escalates further.',
  };
}

function parseExplanationJson(text: string): Record<string, string> {
  const parsed = JSON.parse(text) as Record<string, string>;
  const required = [
    'situation_summary',
    'why_action_was_taken',
    'expected_outcome',
    'confidence_narrative',
    'coordinator_guidance',
  ];

  for (const key of required) {
    if (!parsed[key]) {
      throw new Error(`Missing required field ${key}`);
    }
  }

  return parsed;
}

/**
 * Generates, validates, stores, and publishes an AI explanation with fallback behavior.
 */
export async function generateExplanation(input: {
  event_id?: string;
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
}): Promise<Record<string, unknown>> {
  const prompt = buildExplanationPrompt(input);
  let explanation = fallbackExplanation(input);

  if (process.env.GEMINI_API_KEY) {
    const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = client.getGenerativeModel({
      model: 'gemini-pro',
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 500,
      },
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    try {
      const result = await model.generateContent(prompt);
      explanation = parseExplanationJson(result.response.text());
    } catch {
      try {
        const retry = await model.generateContent(`${prompt}\n\nOutput only valid JSON with the exact required keys.`);
        explanation = parseExplanationJson(retry.response.text());
      } catch {
        explanation = fallbackExplanation(input);
      }
    }
  }

  const firestore = getFirestore();
  const docRef = firestore.collection('ai-explanations').doc();
  const record = {
    explanation_id: docRef.id,
    event_id: input.event_id || null,
    action_taken: input.action_taken,
    created_at: new Date().toISOString(),
    ...explanation,
  };

  await docRef.set(record);

  await pubsub.topic(process.env.PUBSUB_ROUTE_UPDATES_TOPIC || 'route-updates').publishMessage({
    json: record,
    attributes: {
      event_id: input.event_id || '',
      action_taken: input.action_taken,
    },
  });

  return record;
}
