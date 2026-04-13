# Responsible AI

## Principle: AI explains, deterministic engines decide

SupplyGuard AI uses AI for **explanations**, not autonomous operational decisions.

- Decision logic (risk scoring, routing choice, dispatch plan) is deterministic and inspectable.
- The Gemini-powered explainer narrates *why* a decision was made and what to watch next.

Implementation reference: `backend/ai-explainer/src/prompt-builder.ts`.

## Failure modes and mitigations

- **Hallucination risk**
  - Mitigation: explainer receives structured fields (risk score, thresholds, factors JSON, before/after ETAs) and must output structured JSON.
- **Service outage / no API key**
  - Mitigation: command console still functions; explanation is an enhancement, not a dependency.
- **Over-trust**
  - Mitigation: UI should show confidence, label simulations as simulations, and keep the decision boundary visible (thresholds + factors).

## Human-in-the-loop

Operators remain the final authority for:

- dispatch approvals
- evacuation decisions
- medical triage policies

## Privacy by design

- Prefer aggregated operational signals over personal data.
- Use role-based access for any sensitive collections.

