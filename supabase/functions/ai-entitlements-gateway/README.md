# ai-entitlements-gateway

Authenticated Edge Function for quota-controlled AI generation.

Supported actions:

- `dream_reflection_generate`
- `dream_reflection_regenerate`
- `dream_followup_reply`
- `recent_dream_field_generate`
- `period_reflection_generate`

Every request must include an idempotency key.

Behavior:

- reserves quota through SQL RPCs
- calls `openai-proxy` server-side
- persists interpretations or premium artifacts
- commits quota on success
- releases quota on failure

Important rollout note:

- This is backend-ready but current mobile screens are not yet cut over to it.

Required env:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
