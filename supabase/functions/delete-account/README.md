# delete-account

Deletes the authenticated user's Oneiros data and then deletes the Supabase Auth user.

Required env:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APPLE_SIGN_IN_TEAM_ID`
- `APPLE_SIGN_IN_KEY_ID`
- `APPLE_SIGN_IN_PRIVATE_KEY`
- `APPLE_SIGN_IN_CLIENT_ID` (defaults to `APPLE_BUNDLE_ID` when omitted)

The function resolves the caller from the incoming bearer token. For an Apple identity it exchanges a fresh deletion-time authorization code or loads the service-role-only stored refresh token, verifies the Apple subject, and calls Apple's revoke endpoint. Revocation must succeed before destructive deletion begins. It then deletes rows with `user_id` from Oneiros-owned tables and calls the Supabase Auth Admin delete-user endpoint.

User-owned billing tables now included in deletion:

- `billing_accounts`
- `subscription_entitlements`
- `subscription_transactions`
- `quota_buckets`
- `quota_events`
- `ai_generation_artifacts`
- `apple_auth_tokens`
