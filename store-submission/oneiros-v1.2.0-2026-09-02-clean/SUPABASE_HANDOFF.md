# Supabase handoff — owner-operated only

These production changes are intentionally **not** executed by Codex. The project owner applies every Supabase update.

## 1. Configure the Apple revocation secrets

Create a git-ignored root file named `.env.apple.local`:

```dotenv
APPLE_SIGN_IN_TEAM_ID=566V64LC79
APPLE_SIGN_IN_KEY_ID=<SIGN_IN_WITH_APPLE_KEY_ID>
APPLE_SIGN_IN_CLIENT_ID=com.oneirosdreamjournal.app
APPLE_SIGN_IN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n<KEY_BODY>\n-----END PRIVATE KEY-----"
```

- Confirm the Team ID in Apple Developer before applying it; `566V64LC79` is the Apple signing team used by the current EAS production credentials.
- Use a **Sign in with Apple** key, not an App Store Connect API key.
- Never commit `.env.apple.local` or the `.p8` private key.

Apply the secrets:

```bash
supabase secrets set --env-file .env.apple.local
```

## 2. Push the token-custody migration

```bash
supabase db push
```

Migration: `supabase/migrations/20260902120000_create_apple_auth_tokens.sql`

## 3. Deploy the affected functions

```bash
supabase functions deploy apple-auth-token
supabase functions deploy delete-account
npm run deploy:ai-entitlements-gateway
```

Use the npm wrapper for `ai-entitlements-gateway`; its production prompt-identity guard must remain fail-closed. `openai-proxy` does not need deployment for this change because no extraction or reflection prompt contract changed.

## 4. Production smoke checks before store submission

1. Sign in with Apple on a fresh iOS install; the app must complete sign-in rather than log back out.
2. Confirm one `apple_auth_tokens` row exists for that test user without exposing its token in logs or client responses.
3. Request account deletion, complete the fresh Apple prompt, and confirm the account and its token row are removed.
4. Send a harmless Exploring reply and a blocked explicit harmful-instruction request; the latter must fail before quota use.
5. Only after these checks pass should build 6 be uploaded for review.
