# Support, legal, and contact

## Contact (`ContactScreen`)

- Reachable from Write **menu** (authenticated).
- Fields: optional subject, required message.
- `sendContactMessage` → edge function; success clears form and shows thank-you alert; failure shows generic error.

## Privacy & Legal (`PrivacyScreen`)

- Reachable from Write **menu**.
- Plain-language notice frames Oneiros as a private, protected dream journal for wellness and self-inquiry, while preserving legal boundaries for non-clinical use.
- Notice covers journal data, sensitive information, AI processing, limited operational access, user controls, and emergency boundaries.
- Hosted Privacy Policy and Terms links are read from `EXPO_PUBLIC_PRIVACY_POLICY_URL` and `EXPO_PUBLIC_TERMS_URL`; when configured, the screen opens those URLs from the legal notice.
- Public store-review pages live under `site/` and are served by Vercel: `/privacy`, `/terms`, and `/support`.
- Data export and fallback account deletion requests route to `ContactScreen` with prefilled request text.
- Product summary only; hosted Privacy Policy / Terms must exist before public release and be configured for EAS/store builds.

## Account deletion (`AccountScreen`, `delete-account` edge function)

- Account settings include `Delete account and data`.
- User sees destructive confirmation before deletion starts.
- Client invokes Supabase edge function `delete-account`, clears local storage, then signs out.
- Edge function deletes Oneiros rows for the authenticated `user_id` and then deletes the Supabase Auth user using the service-role key.

## Legal consent (`LegalConsentScreen`)

- Authenticated users must accept the current legal consent version before entering onboarding or the main app.
- Consent is stored per user with version + timestamp (`legalConsentService`).
- User confirms age 18+, wellness/self-inquiry-only use, sensitive-data processing, AI-output limitations, and emergency/crisis boundaries.
- Consent copy uses a protected-space tone but keeps explicit statements that Oneiros is not therapy, diagnosis, medical or mental health care, crisis support, or professional advice.

## AI disclaimers

- Shared AI notices describe reflections as AI-assisted symbolic material for journaling and self-inquiry, not therapy, diagnosis, crisis support, medical care, or professional advice.
- Chat input and quick prompts avoid implying the AI has authoritative answers.

## Login support (`LoginSupportScreen`)

- Reachable from **Auth** and **Biometric lock** (trouble signing in / locked out).
- Requires email + message; calls `sendSupportRequest`; confirmation copy references support inbox; `goBack` after success.

## Regression

- Submit contact with empty message → validation.
- Support form network failure → error alert, stays on screen.
- Back navigation from LoginSupport returns to Auth or Lock screen as expected.
- Legal consent is isolated per user and does not leak across accounts.
- Legal copy flow test protects the core consent/privacy boundaries without locking the app to exact phrasing.
