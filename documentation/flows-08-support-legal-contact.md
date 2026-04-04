# Support, legal, and contact

## Contact (`ContactScreen`)

- Reachable from Write **menu** (authenticated).
- Fields: optional subject, required message.
- `sendContactMessage` → edge function; success clears form and shows thank-you alert; failure shows generic error.

## Privacy (`PrivacyScreen`)

- Reachable from Write **menu**.
- Static / informational content (no submission flow in code reviewed).

## Login support (`LoginSupportScreen`)

- Reachable from **Auth** and **Biometric lock** (trouble signing in / locked out).
- Requires email + message; calls `sendSupportRequest`; confirmation copy references support inbox; `goBack` after success.

## Regression

- Submit contact with empty message → validation.
- Support form network failure → error alert, stays on screen.
- Back navigation from LoginSupport returns to Auth or Lock screen as expected.
