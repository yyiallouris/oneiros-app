# Support, legal, and contact

## Contact (`ContactScreen`)

- Reachable from Write **menu** (authenticated).
- Fields: optional subject, required message.
- `sendContactMessage` resolves the signed-in account email and invokes the shared `support-request` edge function; the client never writes `contact_messages` directly or selects the destination address.
- The edge function resolves the bearer session when available, sends the request to the server-owned support inbox through Resend, and sends a best-effort acknowledgement to the user. Authenticated `contact_messages` persistence is a best-effort operational archive and cannot block email delivery.
- Success clears the form, announces an inline confirmation, then returns to **Write** after a short readable delay.
- Failure shows accessible inline feedback and keeps the subject/message draft untouched so the user can retry. This is deliberately not a native `Alert`: React Native Web does not surface that API reliably.

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
- `site/support/index.html` handles email support, billing help, account deletion, data deletion, export requests, and the crisis boundary. Its accessible web form posts to the same canonical `support-request` function through the same-origin Vercel `/api/support` proxy; a visible `mailto:` link remains as fallback.
- Public pages should stay user-facing, current to the product, and free of internal rollout or setup wording.

## Account deletion (`AccountScreen`, `delete-account` edge function)

- Account settings include `Delete account and data`.
- User sees destructive confirmation before deletion starts.
- Client invokes Supabase edge function `delete-account`, clears local storage, then signs out.
- Edge function deletes Oneiros rows for the authenticated `user_id` and then deletes the Supabase Auth user using the service-role key.

## Legal consent (`LegalConsentScreen`)

- Authenticated users must accept the current legal consent version before entering onboarding or the main app.
- Consent is stored per user with version + timestamp (`legalConsentService`).
- The screen opens with a short plain-language summary first: private-journal framing, a clear note about dream-data processing, and a reassurance that journal content is not sold/used for advertising.
- Consent is explicit through a single `Agree and continue` action plus links to the full Privacy Policy and Terms of Use.
- The entry surface must not feel like a checkbox wall or a fear-first warning screen.
- Clinical/emergency boundaries remain part of Oneiros legal copy, but they should not be presented as the first emotional note on app entry.

## AI disclaimers

- Shared AI notices describe reflections as AI-assisted symbolic material for journaling and self-inquiry, not therapy, diagnosis, crisis support, medical care, or professional advice.
- Chat input and quick prompts avoid implying the AI has authoritative answers.

## Auth entry note (`AuthScreen`)

- Auth keeps only a short informational privacy note with a link into Privacy & Legal.
- The auth surface should not ask for broad agreement language before the dedicated consent step; explicit acceptance still happens on `LegalConsentScreen`.

## Login support (`LoginSupportScreen`)

- Reachable from **Auth** and **Biometric lock** (trouble signing in / locked out).
- Requires email + message and invokes the same `support-request` function without requiring a signed-in session.
- The function sends the request to the support inbox and a best-effort acknowledgement to the supplied address.
- Success announces an inline confirmation, then resets navigation to **Auth** after a short readable delay. Failure remains on the form with the entered email/message intact.

## Shared support delivery

- Production destination and sender identity are server-owned through `SUPPORT_EMAIL` and `FROM_EMAIL`; they are not shipped in Expo config.
- The public website keeps Supabase credentials server-side in Vercel environment variables. `/api/support` validates input and origin, absorbs the hidden-field spam case, and forwards only email, optional subject, and message.
- Resend handles automated sending for both support surfaces and Supabase Auth, but Resend domain verification alone does not create a mailbox.
- `support@oneirosjournal.com` must be provisioned as a real receiving mailbox. Root `@` MX records belong to that mailbox provider, while Resend return-path records remain isolated on `send.oneirosjournal.com`.
- The old `contact-email` / Postmark path is not canonical and must not be deployed.
- Direct client inserts remain denied by RLS. Authenticated persistence is attempted only inside the Edge Function and is best-effort; archive failure must not prevent the support inbox from receiving the request.
- Edge failures emit privacy-safe structured logs with `request_id`, processing stage/status, and no support-message body. Supabase Function logs are the current diagnostic record; proactive paging requires a separately configured monitoring/log-drain integration and must not be assumed to exist.

## Regression

- Submit contact with empty message → validation.
- Authenticated contact submission → one backend delivery; archive row persists when the table is available, while archive failure remains non-blocking; direct client insert remains RLS-denied.
- Signed-out Login Support submission → inbox delivery and acknowledgement without requiring auth.
- Support form network failure → inline error, entered draft remains, no navigation.
- Signed-in success → inline confirmation then `MainTabs/Write`.
- Signed-out success → inline confirmation then navigation reset to `Auth`.
- Back navigation before submission from LoginSupport returns to Auth or Lock screen as expected.
- Legal consent is isolated per user and does not leak across accounts.
- Legal copy flow test protects the core consent/privacy boundaries without locking the app to exact phrasing.
