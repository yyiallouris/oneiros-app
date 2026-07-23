# Authentication and account recovery

All auth UI lives in `AuthScreen` unless noted. Backend: Supabase Auth.

## Modes on Auth screen

- **Login** — email + password → `signInWithPassword`.
- **Sign up** — email + password + confirm; minimum length `MIN_PASSWORD_LENGTH` (8).

## Happy path — email sign up (confirmation required)

1. User submits sign up with valid fields.
2. If Supabase returns user **without** session (email confirmation enabled):
   - UI enters **verification** state: OTP field, resend with cooldown (~60s).
3. User either:
   - Enters **OTP** → `verifyOtp` with `type: 'email'`, or
   - Opens **magic link** from email → deep link → `processAuthDeepLink` → session.
4. On success, alerts confirm; `RootNavigator` shows post-auth flow (onboarding / main app).

## Happy path — email login

1. Valid credentials → session → storage init + background fetch/sync (see [flows-05-sync-offline.md](./flows-05-sync-offline.md)).

## Regression — unverified email on login

- Error message matched as “email not confirmed” / similar → app sets **pending verification** state for that email (OTP + resend) instead of generic invalid credentials.

## Forgot password

1. From login UI, user opens **Reset password** (`showForgotPassword`).
2. Submits email → `resetPasswordForEmail` with `redirectTo: oneiros-dream-journal://auth/recovery`.
3. User taps link in email → deep link:
   - Sets `PENDING_PASSWORD_RESET_KEY` in AsyncStorage when the URL is `auth/recovery` or `type=recovery`.
   - Establishes session.
4. `RootNavigator` shows **`SetPassword`** until new password saved and flag cleared.
5. `updateUser({ password })` → remove `PENDING_PASSWORD_RESET_KEY` → continue to onboarding or main app.

## Resend reset link

- Cooldown (~60s); handles rate-limit errors by extending cooldown.

## Social sign-in: Apple, Google, and Discord

1. Below the email primary CTA, Auth shows an **or continue with** divider and a centered row of equal-size squircle icon buttons (Google → Apple on iOS → Discord). Provider assets are logo-only transparent PNGs; squircle chrome and soft shadow are styled in-app. Labels stay accessibility-only (`Continue with …`) so the same controls work for login and sign up.
2. On iOS, Apple uses native Apple authentication (custom icon button; same `signInAsync` + hashed nonce path), then sends the identity token to Supabase with `signInWithIdToken`.
3. Google and Discord use browser OAuth via `signInWithOAuth` with the selected provider, `skipBrowserRedirect: true`, PKCE (`flowType: 'pkce'`), and `WebBrowser.openAuthSessionAsync`.
4. Redirect target is `oneiros-dream-journal://auth/callback` (must be allowlisted in Supabase Redirect URLs). After consent, Supabase returns either:
   - **PKCE** `?code=…` → `exchangeCodeForSession` (primary path; password recovery uses `oneiros-dream-journal://auth/recovery?code=…` so the app routes to `SetPassword`), or
   - **Implicit** `#access_token=…&refresh_token=…` → `setSession`.
5. AuthScreen and `processAuthDeepLink` share the same completion path for browser results and live deep-link events. Concurrent callers for the same URL share one in-flight Promise (`Map<url, Promise>`), then a short post-success TTL prevents re-exchange of a one-time PKCE code. Cold-start `getInitialURL` is owned only by RootNavigator and a concrete initial callback URL is processed once before checking the stored session.
6. If the browser dismisses early, the app polls briefly for a session before showing “cancelled”.
7. **New vs returning** social user: `isNewOAuthUser` (created_at within ~60s, single identity). New users skip the welcome modal and go straight into LegalConsent/Onboarding; returning users may see a short “Welcome back” alert (deduped). Provider/new-user metadata prefers the user returned from `setSession` / `exchangeCodeForSession` (or local `getSession`); it does not wait on network `getUser()`.
8. Provider-specific cancel/error copy uses the selected provider label. Loading copy shows `Continuing with {Provider}…`.
9. After session start, RootNavigator shows branded `LoadingScreen` while resolving **local** biometric/onboarding/legal flags. It passes `session.user.id` into those reads and never re-enters `supabase.auth.getSession()` from the auth-state notification. The `onAuthStateChange` subscriber returns synchronously; all Supabase-dependent follow-up work is deferred until after the auth lock is released. Remote biometric preference sync runs in the background and must not block routing.

## Deep link error URLs

- OAuth `error` param: treated as handled-but-not-error to user (cancel / stale link); no intrusive alert.

## Login support (signed out or locked)

- `LoginSupportScreen`: email + message → `sendSupportRequest` edge function.
- Reachable from `AuthScreen` and `BiometricLockScreen`.

## Timeouts & errors

- Auth requests race a ~25s timeout → user-facing connection message.
- Deep-link auth steps (`verifyOtp`, `setSession`, PKCE `exchangeCodeForSession`) race a shorter timeout (~15s) so provider callbacks cannot leave the app on the branded loading screen indefinitely. PKCE timeout copy is flow-specific (`Social sign-in` or `Password reset`), never hardcoded to Google for recovery links.
- Invalid credentials vs network errors → different copy.

## Regression checklist (auth)

- Sign up → OTP wrong → OTP correct.
- Sign up → only magic link, no OTP.
- Forgot password → link expired / wrong → error path.
- Apple cancel vs success on iOS.
- Google / Discord cancel vs success vs “dismiss but session from deep link”.
- Google and recovery PKCE `/auth/v1/token` succeeds, auth subscriber returns immediately, and the app leaves `LoadingScreen`.
- Set password: mismatch, too short, network timeout (`SetPasswordScreen` has ~15s timeout).
