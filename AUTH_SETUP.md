# Auth & email verification (Supabase)

This app uses Supabase Auth with **email/password** and **Google OAuth**. For email signup, verification can use either a **6-digit code** (entered in the app) or a **magic link** (tap link in the email). Supabase project name in dashboard: **oneiros-dream-journal**.

## What you need to do in the Supabase Dashboard

### 1. Turn on email confirmation

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Authentication** → **Providers** → **Email**.
3. Enable **Confirm email** (turn it on if you had disabled it).

### 2. Allow the app’s redirect URL for magic links

1. Go to **Authentication** → **URL Configuration**.
2. Under **Redirect URLs**, add:
   - `oneiros-dream-journal://auth/confirm`
3. Save.

This URL is used when the user taps the “Confirm your email” link in the signup email; Supabase will redirect back to the app after verification.

### 3. (Optional) Show the 6-digit code in the confirmation email

By default, the “Confirm signup” email only contains a link. To also show the 6-digit OTP so users can type it in the app:

1. Go to **Authentication** → **Email Templates**.
2. Open the **Confirm signup** template.
3. In the body, include the token so the user sees the code, for example:

   ```
   Confirm your signup

   Your verification code is: {{ .Token }}

   Or open this link to verify: {{ .ConfirmationURL }}
   ```

4. Save.

Variables you can use:

- `{{ .Token }}` – 6-digit code.
- `{{ .ConfirmationURL }}` – magic link (must stay for link verification).

After this, the app will support both:

- **Code:** user gets the 6-digit code in the email and enters it on the “Verify your email” screen.
- **Magic link:** user taps the link in the email; the app opens and completes verification via the `oneiros-dream-journal://auth/confirm` redirect.

No code changes are required for (3); the app already has the verification screen and deep-link handling.
