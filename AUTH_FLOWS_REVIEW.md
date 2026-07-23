# Auth Flows Review

Summary of auth flows and implemented practices.

## Login
AuthScreen sign-in: email/password, unverified-email handling, 25s timeout, clear error messages, forgot-password link, native Apple sign-in on iOS, Google and Discord OAuth.

## Sign Up
Password min 8 chars, match confirmation, OTP or magic link, 60s resend cooldown, deep-link deduplication, error-URL handling.

## Forgot Password
Email form, 60s cooldown, Resend link button, PENDING_PASSWORD_RESET_KEY set before verifyOtp/setSession for correct routing.

## SetPasswordScreen
Min 8 chars, 15s timeout, accessibility labels, clears recovery flag on success.

## Deep Links
auth/confirm, auth/callback; error URLs ignored; recovery flag before session. Google/Discord OAuth complete via PKCE `code` exchange or implicit tokens, with in-flight Promise serialization per callback URL. Apple sign-in uses the native iOS identity-token path and does not depend on callback URL token parsing.

## Post-auth route gate
After session start, RootNavigator shows branded `LoadingScreen` while resolving local biometric/onboarding/legal flags. Remote biometric sync runs in the background (never gates routing) so OAuth never lands on a blank paper view or hangs on `user_settings`. Public stack is only Auth / LoginSupport / Privacy; authenticated app screens register only with a session. Cold-start auth deep links are owned by RootNavigator; AuthScreen only handles live Linking events.
