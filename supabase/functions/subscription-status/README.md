# subscription-status

Authenticated Edge Function that returns the normalized subscription view for the current user.

Response includes:

- `plan_code`
- `entitlement_state`
- `current_period_start`
- `current_period_end`
- `app_account_token`
- `google_obfuscated_account_id`
- quota summaries for dream reflections, Recent Dream Field, and period reflections

Required env:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
