# Auth & email verification (Supabase)

This app uses Supabase Auth with **email/password**, **Sign in with Apple on iOS**, **Google OAuth**, and **Discord OAuth**. For email signup, verification can use either a **6-digit code** (entered in the app) or a **magic link** (tap link in the email). Supabase project name in dashboard: **oneiros-dream-journal**.

**Identity linking:** Supabase automatically links OAuth sign-in to an existing email/password account when the email matches. Users who signed up with email first can later sign in with Apple, Google, or Discord and those identities are linked to the same account. This is enabled by default; the existing email must be verified for linking to work.

## What you need to do in the Supabase Dashboard

### 1. Turn on email confirmation

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Authentication** → **Providers** → **Email**.
3. Enable **Confirm email** (turn it on if you had disabled it).

### 2. Allow the app’s redirect URL for magic links

1. Go to **Authentication** → **URL Configuration**.
2. Under **Redirect URLs**, add:
   - `oneiros-dream-journal://auth/confirm`
   - `oneiros-dream-journal://auth/recovery`
   - `oneiros-dream-journal://auth/callback`
3. Save.

The confirm URL is used when the user taps the “Confirm your email” link. The recovery URL is used by forgot-password links. The callback URL is used after Google or Discord OAuth completes.

### 3. Enable Sign in with Apple, Google, and Discord providers

1. Go to **Authentication** → **Providers**.
2. Enable **Apple** and enter the Apple Services ID / team / key details required by Supabase.
3. Enable **Google** and enter the Google OAuth client credentials.
4. Enable **Discord** and enter the Discord OAuth client credentials.
5. In each external provider console, allow the Supabase callback URL shown in the Supabase provider panel. It usually looks like:
   - `https://<project-ref>.supabase.co/auth/v1/callback`
6. In Supabase, keep these in **Redirect URLs** so completed browser OAuth returns into the app:
   - `oneiros-dream-journal://auth/callback`
   - `oneiros-dream-journal://auth/confirm`
   - `oneiros-dream-journal://auth/recovery`
   - If you test in **Expo Go**, also add the Expo auth proxy URI printed by `AuthSession.makeRedirectUri` in the Metro logs (often `https://auth.expo.io/@…/…`).

The app uses **PKCE** for Google/Discord (`exchangeCodeForSession` on `?code=`). A blank in-app browser page after Google consent usually means the redirect URL is missing from Supabase Redirect URLs, or an older build that only looked for `#access_token` and never exchanged the PKCE code.

The iOS Apple button uses native Apple credentials and sends the Apple identity token to Supabase with `signInWithIdToken`, so it still requires the Apple provider to be enabled in Supabase even though it does not open the browser OAuth flow.

### 4. (Optional) Show the 6-digit code in the confirmation email

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

### 5. Forgot password (reset link in email)

For “Forgot password” to work, the reset email must contain a clickable link that opens the app.

1. **Redirect URL**  
   The recovery redirect URL is used. In **Authentication** → **URL Configuration** → **Redirect URLs**, ensure you have:
   - `oneiros-dream-journal://auth/recovery`
   - `oneiros-dream-journal://auth/confirm` for older reset links that may already be in inboxes
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

After this, the flow is: user taps “Forgot password” → enters email → receives email with link → taps link → app opens through `oneiros-dream-journal://auth/recovery` and shows the “Set new password” screen.
