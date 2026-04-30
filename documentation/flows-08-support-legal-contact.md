# Support, legal, and contact

## Contact (`ContactScreen`)

- Reachable from Write **menu** (authenticated).
- Fields: optional subject, required message.
- `sendContactMessage` → edge function; success clears form and shows thank-you alert; failure shows generic error.

## Privacy & Legal (`PrivacyScreen`)

- Reachable from Write **menu**.
- Plain-language notice covering journal data, sensitive information, AI processing, limited operational access, user controls, and emergency boundaries.
- Data export and fallback account deletion requests route to `ContactScreen` with prefilled request text.
- Product summary only; hosted Privacy Policy / Terms should exist before public release.

## Account deletion (`AccountScreen`, `delete-account` edge function)

- Account settings include `Delete account and data`.
- User sees destructive confirmation before deletion starts.
- Client invokes Supabase edge function `delete-account`, clears local storage, then signs out.
- Edge function deletes Oneiros rows for the authenticated `user_id` and then deletes the Supabase Auth user using the service-role key.

## Legal consent (`LegalConsentScreen`)

- Authenticated users must accept the current legal consent version before entering onboarding or the main app.
- Consent is stored per user with version + timestamp (`legalConsentService`).
- User confirms age 18+, wellness-only use, sensitive-data processing, and AI-output limitations.

## AI disclaimers

- `DreamDetailScreen` and `InterpretationChatScreen` show compact notices near AI reflections.
- Chat input and quick prompts avoid implying the AI has authoritative answers.

## Login support (`LoginSupportScreen`)

- Reachable from **Auth** and **Biometric lock** (trouble signing in / locked out).
- Requires email + message; calls `sendSupportRequest`; confirmation copy references support inbox; `goBack` after success.

## Regression

- Submit contact with empty message → validation.
- Support form network failure → error alert, stays on screen.
- Back navigation from LoginSupport returns to Auth or Lock screen as expected.
- Legal consent is isolated per user and does not leak across accounts.
