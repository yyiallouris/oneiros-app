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
- The public web root (`/`) acts as a quiet legal/support landing page that routes people clearly into Privacy, Terms, and Support instead of trying to do full product marketing.
- Data export and fallback account deletion requests route to `ContactScreen` with prefilled request text.
- In-app copy stays user-facing and plain-language. Internal release/setup notes do not appear on the user surface.

## Public legal site (`site/`)

- `site/index.html` is a calm entry layer for public trust information, not a dense legal wall.
- `site/privacy/index.html` explains data handling in plain language, with a shorter section structure and explicit notes about sensitive dream content, AI providers, voice processing, and user controls.
- `site/terms/index.html` explains adult-only use, reflective-not-clinical boundaries, AI-generated output, acceptable use, and the live Free / Premium / Deeper subscription reality.
- `site/support/index.html` handles email support, billing help, account deletion, data deletion, export requests, and the crisis boundary.
- Public pages should stay user-facing, current to the product, and free of internal rollout or setup wording.

## Account deletion (`AccountScreen`, `delete-account` edge function)

- Account settings include `Delete account and data`.
- User sees destructive confirmation before deletion starts.
- Client invokes Supabase edge function `delete-account`, clears local storage, then signs out.
- Edge function deletes Oneiros rows for the authenticated `user_id` and then deletes the Supabase Auth user using the service-role key.

## Legal consent (`LegalConsentScreen`)

- Authenticated users must accept the current legal consent version before entering onboarding or the main app.
- Consent is stored per user with version + timestamp (`legalConsentService`).
- The screen now opens with a calm plain-language summary first: private-journal framing, a clear note about dream-data processing, a reassurance that journal content is not sold/used for advertising, and a separate crisis boundary callout.
- Explicit confirmation remains required for age 18+, sensitive-data processing, AI-output limitations, and emergency/crisis boundaries before the user can continue.
- Consent copy should feel containing and respectful, not like a legal ambush, while still stating clearly that Oneiros is not therapy, diagnosis, medical or mental health care, crisis support, or professional advice.

## AI disclaimers

- Shared AI notices describe reflections as AI-assisted symbolic material for journaling and self-inquiry, not therapy, diagnosis, crisis support, medical care, or professional advice.
- Chat input and quick prompts avoid implying the AI has authoritative answers.

## Auth entry note (`AuthScreen`)

- Auth keeps only a short informational privacy note with a link into Privacy & Legal.
- The auth surface should not ask for broad agreement language before the dedicated consent step; explicit acceptance still happens on `LegalConsentScreen`.

## Login support (`LoginSupportScreen`)

- Reachable from **Auth** and **Biometric lock** (trouble signing in / locked out).
- Requires email + message; calls `sendSupportRequest`; confirmation copy references support inbox; `goBack` after success.

## Regression

- Submit contact with empty message → validation.
- Support form network failure → error alert, stays on screen.
- Back navigation from LoginSupport returns to Auth or Lock screen as expected.
- Legal consent is isolated per user and does not leak across accounts.
- Legal copy flow test protects the core consent/privacy boundaries without locking the app to exact phrasing.
