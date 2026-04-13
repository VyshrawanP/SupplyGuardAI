# Privacy & Security Notes

## Authentication & roles

- API gateway expects Firebase ID tokens (`Authorization: Bearer ...`) and resolves user role from Firestore:
  - `backend/api-gateway/src/middleware/auth.ts`

## Firestore rules

The repository includes:

- `firestore.rules` (demo-friendly)
- `firestore/firestore.rules.prod` (production-oriented template)

For a real deployment:

- require authentication for operational collections
- restrict writes by role (admin/operator)
- avoid any hardcoded identities (emails) inside rules

## Operational data

Recommended stance:

- store only what’s necessary to coordinate response
- avoid storing survivor PII by default
- keep audit logs for critical actions (dispatch, evacuation, stock reorders)
