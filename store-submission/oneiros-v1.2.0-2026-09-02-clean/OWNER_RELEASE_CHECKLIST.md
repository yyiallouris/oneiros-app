# Oneiros 1.2.0 — owner release checklist

This is the remaining owner-operated sequence after Codex completed the source, screenshot, asset, documentation, test, and build-artifact work. Do not submit either store build until sections 1–4 pass. Do not upload the Google Play feature graphic until separate product-owner authorization.

## Already complete — no owner action

- Clean Apple screenshots: 7 opaque PNG files at `1320 × 2868` under `apple/iphone-6.9/`.
- Clean Google phone screenshots: 7 opaque PNG files at `1080 × 1920` under `google-play/phone/`.
- Dream Fabric is visible in screenshot 04 on both platforms.
- Google Play icon: `google-play/icon-512.png`, `512 × 512`, under 1 MB.
- Held feature graphic: `google-play/feature-graphic-1024x500.png`, exact `1024 × 500`, opaque. Do not upload it yet.
- Validated App Store artifact: `builds/Oneiros-1.2.0-build-6.ipa`.
- Validated Play artifact: `builds/Oneiros-1.2.0-build-6.aab`.
- Build 5 and failed/canceled attempts are non-submittable. Never take a binary from `builds/superseded-do-not-submit/`.
- Reader/chat/essay/extraction prompt text, models, cardinality, approved identities, streaming reveal, approximately 15-second partial reveal, `PhasedTypingText`, and `Continue the conversation` are unchanged.

## 1. Owner-only Supabase rollout

From the repository root, create `.env.apple.local` yourself. It does not exist yet, which is why the earlier `chmod` command failed.

```dotenv
APPLE_SIGN_IN_TEAM_ID=566V64LC79
APPLE_SIGN_IN_KEY_ID=<SIGN_IN_WITH_APPLE_KEY_ID>
APPLE_SIGN_IN_CLIENT_ID=com.oneirosdreamjournal.app
APPLE_SIGN_IN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n<KEY_BODY>\n-----END PRIVATE KEY-----"
```

Use a Sign in with Apple `.p8` key, not an App Store Connect API key. Never commit this file or key. Then run:

```bash
cd /Users/yiannisyiallouris/Documents/perso/oneiros-app
chmod 600 .env.apple.local
supabase secrets set --env-file .env.apple.local
supabase db push
supabase functions deploy apple-auth-token
supabase functions deploy delete-account
npm run deploy:ai-entitlements-gateway
```

The database migration is `supabase/migrations/20260902120000_create_apple_auth_tokens.sql`. The gateway must be deployed through the npm wrapper because it enforces the approved prompt/runtime identity. Do not deploy `openai-proxy`; no reflection or extraction prompt contract changed. See `SUPABASE_HANDOFF.md` for the production checks.

## 2. Public legal/support site

Preview the changed Privacy, Terms, and Support pages locally:

```bash
cd /Users/yiannisyiallouris/Documents/perso/oneiros-app
npm run site:preview
```

After visual approval, stop the preview with `Ctrl+C`. In Vercel, confirm the Production environment has server-only `SUPABASE_URL` and `SUPABASE_ANON_KEY`, then deploy the repository using the normal Oneiros Vercel workflow. If the local Vercel CLI is already linked and this is the intended production project, the direct command is:

```bash
npx vercel --prod
```

Verify these public URLs and submit one real support/deletion request end to end:

- `https://oneirosjournal.com/privacy`
- `https://oneirosjournal.com/terms`
- `https://oneirosjournal.com/support`

## 3. Pre-submission device tracks

Upload `builds/Oneiros-1.2.0-build-6.ipa` to App Store Connect/TestFlight and `builds/Oneiros-1.2.0-build-6.aab` to a Google Play internal or closed test track. These are console uploads, not review submission.

On physical iPhone and Android devices, verify:

1. Fresh install, signup/login, email recovery, Apple/Google/Discord sign-in as applicable.
2. Legal consent and all hosted links.
3. Text dream save/edit/delete and Dream Details with Dream Fabric.
4. Optional microphone: deny, allow from Settings, online/offline capture, retry/discard, append-once recovery, and five-minute cap.
5. Reflection streaming and approximately 15-second partial reveal; follow-up chat and `Continue the conversation`.
6. AI-response report flow without raw dream/output being attached automatically.
7. Monthly/yearly purchase, restore, entitlement refresh, upgrade/downgrade, expiry/cancellation, and manage-subscription link with sandbox/license testers.
8. Fresh Apple sign-in followed by account deletion; confirm Apple token revocation and removal of the account/token row.
9. Android Play pre-launch report: no startup crash, permission issue, 16 KB warning, or device-compatibility blocker.

## 4. Store-console declarations

App Store Connect:

- Confirm app record, agreements/tax/banking, primary category, 18+ age-rating answers, export compliance, App Privacy answers, support/privacy/terms URLs, countries/pricing, and all four subscription products/localizations.
- Provide a stable reviewer account and review notes explaining that Oneiros is an adult wellness/self-inquiry journal, not therapy or medical care, plus exact routes to subscriptions, restore, voice, Dream Details, Dream Fabric, Insights, reporting, and account deletion.
- Upload the 7 Apple screenshots in numeric order and select only build `1.2.0 (6)`.

Google Play Console:

- Confirm Play App Signing, app access/reviewer account, Data Safety, ads declaration, content rating, 18+ target audience, account-deletion URL, countries/pricing, testing eligibility, and subscription products `oneiros_premium` / `oneiros_deeper` with `monthly` / `yearly` base plans.
- Confirm Google OAuth release SHA-1, RTDN/PubSub, billing webhook configuration, and production billing secrets.
- Upload the icon, 7 phone screenshots in numeric order, and only `Oneiros-1.2.0-build-6.aab`.
- Keep `google-play/feature-graphic-1024x500.png` unuploaded until separate authorization.

## 5. Final review submission

Only after sections 1–4 pass, explicitly authorize the final store submissions. Do not use `eas submit` or press **Submit for Review / Send for review** before that approval. Preserve the local SHA-256 checks from `builds/ARTIFACTS.md` as the artifact handoff record.
