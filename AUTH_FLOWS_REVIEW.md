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
auth/confirm, auth/callback; error URLs ignored; recovery flag before session. Apple sign-in uses the native iOS identity-token path and does not depend on callback URL token parsing.
