# Auth & email verification (Supabase)

This app uses Supabase Auth with **email/password** and **Google OAuth**. For email signup, verification can use either a **6-digit code** (entered in the app) or a **magic link** (tap link in the email). Supabase project name in dashboard: **oneiros-dream-journal**.

**Identity linking:** Supabase automatically links Google sign-in to an existing email/password account when the email matches. Users who signed up with email first can later sign in with Google and both identities are linked to the same account. This is enabled by default; the existing email must be verified for linking to work.

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

### 4. Forgot password (reset link in email)

For “Forgot password” to work, the reset email must contain a clickable link that opens the app.

1. **Redirect URL**  
   The same redirect URL is used. In **Authentication** → **URL Configuration** → **Redirect URLs**, ensure you have:
   - `oneiros-dream-journal://auth/confirm`  
   (If you added it in step 2, you’re done.)

2. **Reset Password email template**  
   In **Authentication** → **Email Templates**, open the **Reset Password** template.  
   The body **must** include the confirmation link. For example:
   ```
   Reset your password

   Click the link below to set a new password:

   {{ .ConfirmationURL }}
   ```
   If you customize the template, do **not** remove `{{ .ConfirmationURL }}` — that is the link Supabase generates. Without it, the user gets an email with no link.

After this, the flow is: user taps “Forgot password” → enters email → receives email with link → taps link → app opens and shows the “Set new password” screen.
