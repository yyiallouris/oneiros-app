# App entry, loading, and session lifecycle

## Happy path — first launch

1. `App.tsx` shows `LoadingScreen` until `onComplete`; native splash is hidden immediately.
2. Native splash is symbol-only on a warm paper background.
3. In-app loading uses the same paper field with the droplet logo and `Oneiros` wordmark while session/bootstrap completes.
4. `RootNavigator` mounts. In parallel:
   - `StorageService.initialize()` runs (user change detection, local clear if user switched). A signed-out cold start preserves the last owner ID as a cleanup fence rather than deleting it prematurely.
   - Cold-start auth deep links are polled (`Linking.getInitialURL` with retries) for `oneiros-dream-journal://` and processed via `processAuthDeepLink`.
5. `supabase.auth.getSession()` sets initial session.
6. If session exists: load local route-critical flags only (`PENDING_PASSWORD_RESET_KEY`, local biometric preference, onboarding/legal). The gate receives the known `session.user.id` directly, so it does not call `supabase.auth.getSession()` again while handling an auth event. Remote biometric sync runs in the background and must never block the route gate.
7. While that local route state resolves, RootNavigator shows branded `LoadingScreen` (never a blank paper view).
8. User lands on the appropriate root (see `documentation/README.md` gating table).

## Paper background continuity

- `App.tsx` root shell and `NavigationContainer` both carry the Oneiros paper background tone, so route transitions and intermediate navigator surfaces do not flash default white behind screens.
- Individual screens still own their `PaperBackground` image treatment, but the global navigator fallback must remain warm paper when a scene is mounting, unmounting, or mid-transition.

## Navigator route boundary

- **No session (public):** `Auth`, `LoginSupport`, `Privacy` only.
- **With session:** gate screens (`SetPassword` / `BiometricLock` / `LegalConsent` / `Onboarding` / `MainTabs`) plus authenticated stack screens (`DreamDetail`, `Account`, etc.). Authenticated screens are not registered while signed out.

## Session while offline (regression-critical)

- On `onAuthStateChange`, if Supabase reports **no session** but there was a **previous session**, the app calls `isOnline()`.
- **If offline:** the previous session is **preserved** in React state (avoids kicking the user to login when token refresh fails without network — Supabase/auth-js behavior).
- The Supabase auth subscriber itself is synchronous and returns immediately. Route resolution runs without returning its Promise to `onAuthStateChange`; subscription refresh is deferred to a later tick. This prevents the exclusive auth-lock deadlock where PKCE waits for a subscriber that calls `getSession()`.

## App background / foreground — biometric re-lock

- When app goes to **background**, after a short debounce (~300 ms), `biometricUnlocked` is reset so the user must unlock again if app lock is enabled.
- When returning **active**, biometric preference is refreshed from device capability.

## Deep link on cold start

- Scheme: `oneiros-dream-journal://`.
- **Owner:** RootNavigator polls `Linking.getInitialURL` (with retries) and runs `processAuthDeepLink`. Once a concrete app-scheme initial URL is found, it is processed once, then RootNavigator proceeds to session resolution so a stale or slow one-time OAuth code cannot keep startup loading indefinitely. AuthScreen does **not** process cold-start initial URLs; it only listens for live `Linking` `url` events while mounted.
- Handled paths include: `token_hash` + `type` (OTP verify), PKCE `code` (`exchangeCodeForSession`), or `access_token` + `refresh_token` (OAuth / post-verify). Password reset links use `oneiros-dream-journal://auth/recovery` and also remain compatible with older `type=recovery` links.
- Deep-link auth steps have a bounded timeout (~15s) and return a handled error instead of leaving the app on the loading screen forever.
- See [flows-02-authentication.md](./flows-02-authentication.md).

## Regression ideas

- Kill app → reopen: session restored when online; offline should not force logout.
- Cold start with valid auth URL in clipboard / initial URL: session or recovery state applied.
- Background app with biometric on → foreground: lock screen appears.
- After OAuth/session start, hanging remote biometric sync still shows branded `LoadingScreen` briefly then routes from local flags (never blank / never stuck).
- During `SIGNED_IN`, the auth-state callback must return `undefined` immediately even if onboarding/legal reads are still pending.
- Sign out user A, delay final sync, then sign in user B: auth-transition work remains serialized; A's owner-scoped voice cleanup finishes before B initializes and never deletes B's queue/audio. If the voice queue cannot be read, an audio delete fails, or post-delete absence cannot be verified, cleanup is incomplete; A's queue/inbox metadata and stored-owner fence remain for retry.
- Cold start with stored owner A but no session, then sign in B: A's voice boundary and local account data clear before B's route state is resolved; the owner fence changes to B only after cleanup succeeds.
