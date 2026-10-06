# apple-auth-token

Authenticated Sign in with Apple token-custody function.

After Supabase accepts the Apple identity token, the iOS client sends Apple's short-lived authorization code here. The function resolves the signed-in Supabase user, exchanges the code directly with Apple, verifies the returned Apple subject against the account identity, and stores only the refresh token in `apple_auth_tokens` through the service role. The refresh token is used solely by `delete-account` for Apple authorization revocation.

Required deployment order:

1. `supabase db push` for `20260902120000_create_apple_auth_tokens.sql`.
2. Configure `APPLE_SIGN_IN_TEAM_ID`, `APPLE_SIGN_IN_KEY_ID`, `APPLE_SIGN_IN_PRIVATE_KEY`, and `APPLE_SIGN_IN_CLIENT_ID` (or existing `APPLE_BUNDLE_ID`) as Supabase secrets.
3. `supabase functions deploy apple-auth-token`.
4. `supabase functions deploy delete-account`.

Never log authorization codes, access tokens, refresh tokens, identity tokens, or response bodies from Apple token endpoints.
