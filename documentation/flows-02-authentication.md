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
2. Submits email → `resetPasswordForEmail` with `redirectTo: oneiros-dream-journal://auth/confirm`.
3. User taps link in email → deep link:
   - Sets `PENDING_PASSWORD_RESET_KEY` in AsyncStorage when `type` is recovery.
   - Establishes session.
4. `RootNavigator` shows **`SetPassword`** until new password saved and flag cleared.
5. `updateUser({ password })` → remove `PENDING_PASSWORD_RESET_KEY` → continue to onboarding or main app.

## Resend reset link

- Cooldown (~60s); handles rate-limit errors by extending cooldown.

## Google OAuth

1. `signInWithOAuth` with `skipBrowserRedirect: true` + `WebBrowser.openAuthSessionAsync`.
2. Tokens extracted from redirect URL → `setSession`, or fallback session poll after dismiss.
3. If user dismisses browser, short wait + `getSession` (deep link may still complete).
4. **New vs returning** Google user: `isNewGoogleUser` (created_at within ~60s, single identity) → different welcome alert.

## Deep link error URLs

- OAuth `error` param: treated as handled-but-not-error to user (cancel / stale link); no intrusive alert.

## Login support (signed out or locked)

- `LoginSupportScreen`: email + message → `sendSupportRequest` edge function.
- Reachable from `AuthScreen` and `BiometricLockScreen`.

## Timeouts & errors

- Auth requests race a ~25s timeout → user-facing connection message.
- Invalid credentials vs network errors → different copy.

## Regression checklist (auth)

- Sign up → OTP wrong → OTP correct.
- Sign up → only magic link, no OTP.
- Forgot password → link expired / wrong → error path.
- Google cancel vs success vs “dismiss but session from deep link”.
- Set password: mismatch, too short, network timeout (`SetPasswordScreen` has ~15s timeout).
