# App entry, loading, and session lifecycle

## Happy path — first launch

1. `App.tsx` shows `LoadingScreen` until `onComplete`; native splash is hidden immediately.
2. `RootNavigator` mounts. In parallel:
   - `StorageService.initialize()` runs (user change detection, local clear if user switched).
   - Cold-start auth deep links are polled (`Linking.getInitialURL` with retries) for `oneiros-dream-journal://` and processed via `processAuthDeepLink`.
3. `supabase.auth.getSession()` sets initial session.
4. If session exists: load `PENDING_PASSWORD_RESET_KEY`, sync biometric preference from remote, load onboarding completion for current user.
5. User lands on the appropriate root (see `documentation/README.md` gating table).

## Session while offline (regression-critical)

- On `onAuthStateChange`, if Supabase reports **no session** but there was a **previous session**, the app calls `isOnline()`.
- **If offline:** the previous session is **preserved** in React state (avoids kicking the user to login when token refresh fails without network — Supabase/auth-js behavior).

## App background / foreground — biometric re-lock

- When app goes to **background**, after a short debounce (~300 ms), `biometricUnlocked` is reset so the user must unlock again if app lock is enabled.
- When returning **active**, biometric preference is refreshed from device capability.

## Deep link on cold start

- Scheme: `oneiros-dream-journal://`.
- Handled paths include: `token_hash` + `type` (OTP verify), or `access_token` + `refresh_token` (OAuth / post-verify), including `type=recovery` for password reset flows.
- See [flows-02-authentication.md](./flows-02-authentication.md).

## Regression ideas

- Kill app → reopen: session restored when online; offline should not force logout.
- Cold start with valid auth URL in clipboard / initial URL: session or recovery state applied.
- Background app with biometric on → foreground: lock screen appears.
