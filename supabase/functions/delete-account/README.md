# delete-account

Deletes the authenticated user's Oneiros data and then deletes the Supabase Auth user.

Required env:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The function resolves the caller from the incoming bearer token, deletes rows with `user_id` from Oneiros-owned tables, then calls the Supabase Auth Admin delete-user endpoint.

User-owned billing tables now included in deletion:

- `billing_accounts`
- `subscription_entitlements`
- `subscription_transactions`
- `quota_buckets`
- `quota_events`
- `ai_generation_artifacts`
