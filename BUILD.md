# Getting the app on your phone (standalone build)

You can build an **installable app** so you don’t need to run `npx expo start` and so you can share it with others.

## Security (do this first)

- **Never commit secrets.** All API keys and Supabase keys live in **environment variables**, not in `app.json` or any tracked file.
- **Local dev:** Copy `.env.example` to `.env`, fill in values, and run the app. `.env` is gitignored.
- **Pre-commit guard (optional):** To block commits that contain secret-like strings (e.g. `sk-proj-...`), enable the repo hook:  
  `git config core.hooksPath .githooks` (run once from repo root).
- **EAS builds:** Set secrets in EAS so builds get the right config (Supabase project: **oneiros-dream-journal**; project ref from Dashboard → Settings → API):
  ```bash
  eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://YOUR_PROJECT_REF.supabase.co"
  eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key"
  eas secret:create --name EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT --value "https://YOUR_PROJECT_REF.supabase.co/functions/v1/openai-proxy"
  eas secret:create --name EXPO_PUBLIC_PRIVACY_POLICY_URL --value "https://YOUR_DOMAIN/privacy"
  eas secret:create --name EXPO_PUBLIC_TERMS_URL --value "https://YOUR_DOMAIN/terms"
  ```
  For production, use a Supabase Edge Function as the OpenAI proxy and do **not** put an OpenAI API key in the app.

## Public website and hosted legal pages

This repo includes a small static website under `site/` for store-review
requirements and public legal URLs:

- Landing page: `https://oneirosjournal.com/`
- Privacy Policy: `https://oneirosjournal.com/privacy`
- Terms of Use: `https://oneirosjournal.com/terms`
- Support URL: `https://oneirosjournal.com/support`

Vercel is configured by `vercel.json` to serve the static `site/` directory.
The static site is intentionally separate from the Expo app shell so Privacy
Policy and Terms pages load quickly in any browser without authentication,
JavaScript app state, or mobile navigation.

Preview locally:

```bash
npm run site:preview
```

### Vercel setup

1. Import this GitHub repo into Vercel.
2. Keep the project root as the repo root.
3. Vercel reads `vercel.json`:
   - build command: `echo "Oneiros static site ready"`
   - output directory: `site`
4. Add domains:
   - `oneirosjournal.com`
   - `www.oneirosjournal.com`

### Namecheap DNS

In Namecheap → `oneirosjournal.com` → **Advanced DNS**, keep existing records
for `api`, `_acme-challenge`, `_dmarc`, `resend_domain`, `send`, and MX.

Add/update the records Vercel asks for. At the time of setup Vercel requested:

```text
Type: A Record
Host: @
Value: 216.198.79.1
TTL: Automatic
```

For `www`, use the exact CNAME target Vercel shows for
`www.oneirosjournal.com` in the project domain settings.

After DNS verifies and the pages load, set EAS production env values:

```bash
eas env:create production --name EXPO_PUBLIC_PRIVACY_POLICY_URL --value "https://oneirosjournal.com/privacy" --visibility plaintext
eas env:create production --name EXPO_PUBLIC_TERMS_URL --value "https://oneirosjournal.com/terms" --visibility plaintext
```

## Option 1: EAS Build (recommended — no Android Studio/Xcode needed)

EAS Build runs in the cloud and gives you a download link (APK on Android, or TestFlight on iOS).

### One-time setup

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Log in to Expo**
   ```bash
   eas login
   ```
   (Create a free account at [expo.dev](https://expo.dev) if needed.)

3. **Linking:** This project is linked through `extra.eas.projectId` in `app.config.js`. You can skip `eas build:configure` and run a build directly. If you ever see "EAS project not configured", confirm `extra.eas.projectId` still matches the Expo project.

### Build for your phone / to share

**Android (easiest to share)**

- Build an APK (single file you can install or send):
  ```bash
  eas build --profile preview --platform android
  ```
- When the build finishes, you get a **link to download the .apk**.
- On your phone: open the link, download the APK, allow “Install from unknown sources” if asked, then install.
- To share with friends: send them the same link; they download and install the APK.

**iOS**

- You need an **Apple Developer account** ($99/year) for real devices.
  ```bash
  eas build --profile preview --platform ios
  ```
- Install via the link EAS gives you (or add testers in App Store Connect and use TestFlight).

**Both platforms**

```bash
eas build --profile preview --platform all
```

### Environment variables (API keys, Supabase, etc.)

For preview/production builds, set secrets in EAS so they’re baked into the app (or use a server/proxy and only put the proxy URL in the app):

```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://YOUR_PROJECT_REF.supabase.co"
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key"
eas secret:create --name EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT --value "https://YOUR_PROJECT_REF.supabase.co/functions/v1/openai-proxy"
eas secret:create --name EXPO_PUBLIC_PRIVACY_POLICY_URL --value "https://YOUR_DOMAIN/privacy"
eas secret:create --name EXPO_PUBLIC_TERMS_URL --value "https://YOUR_DOMAIN/terms"
```

Or use a `.env` file and run:

```bash
eas build --profile preview --platform android
```

EAS can use env from your project; for sensitive values, prefer `eas secret:create`.

---

## Option 2: Local build (Android only, with Android Studio)

If you prefer to build on your machine:

1. Install [Android Studio](https://developer.android.com/studio) and the Android SDK.
2. Run:
   ```bash
   npx expo run:android
   ```
3. Connect your phone (USB debugging) or pick an emulator. The first run will build an APK and install it. The APK is in `android/app/build/outputs/apk/` (path may vary); you can copy that file to share.

---

## Summary

| Goal                         | Command / step                                              |
|-----------------------------|-------------------------------------------------------------|
| Install on your Android     | `eas build --profile preview --platform android` → use link |
| Share APK with friends      | Send them the same Android build link                       |
| Use app without `npx expo`  | Install the built APK (or iOS build) and open like any app  |
| Production / store later   | `eas build --profile production --platform all`             |

After the first EAS build, the app runs **standalone** on the device; no dev server or laptop needed.

## Android Google Play readiness checklist

Before uploading an Android production build, run the local gates:

```bash
npm run typecheck
npm run test:flows
npx expo config --type public
npx expo-doctor
npx expo install --check
```

Production Android config expectations:

- `android.package`: `com.oneirosdreamjournal.app`.
- `android.versionCode`: increment for every Google Play upload.
- `production.android.buildType`: `app-bundle` in `eas.json`.
- Hosted legal URLs: set `EXPO_PUBLIC_PRIVACY_POLICY_URL` and `EXPO_PUBLIC_TERMS_URL`.
- Microphone permission copy describes optional dream voice journaling and transcription.
- Supabase Auth redirect allowlist includes `oneiros-dream-journal://auth/confirm` and `oneiros-dream-journal://auth/callback`.

Before Google Play review, complete these manual steps:

- Create the Play Console app, enable Play App Signing, and confirm EAS Android credentials with `eas credentials`.
- Complete Data Safety for account data, dream/user content, voice audio/transcription, support messages, AI processing, and processors such as Supabase, OpenAI/Anthropic, Google, Resend, and Postmark.
- Add the hosted Privacy Policy URL, support/contact details, age rating consistent with 18+ consent, screenshots, store listing copy, and content declarations.
- Confirm Google OAuth release SHA-1 / Play App Signing certificate is registered wherever the OAuth client requires it.
- Deploy `openai-proxy` before production builds if the function changed:
  ```bash
  supabase functions deploy openai-proxy
  ```
- Upload the AAB to an internal testing track first and review the Play pre-launch report for permission, crash, startup, and device compatibility issues.
- Smoke test on Android: email login/signup/reset, Google/Discord sign-in, voice recording permission/transcription, AI reflection/chat, offline guards, sync, account deletion, and hosted legal links.

Build and submit after the checks pass:

```bash
eas build --profile production --platform android
eas submit --profile production --platform android
```

The first Play release does not include subscription UI. Keep the existing subscription backend disabled from the mobile purchase flow until Play Billing FE is implemented and reviewed separately.

## iOS TestFlight / App Store readiness checklist

Before uploading an iOS build, run the local gates:

```bash
npm run typecheck
npm test -- --runInBand
npm run test:flows
npx expo config --type public
npx expo-doctor
npx expo install --check
```

Production iOS config expectations:

- `ios.bundleIdentifier`: `com.oneirosdreamjournal.app`
- `ios.buildNumber`: increment for every App Store upload.
- `ios.usesAppleSignIn`: enabled, because the app offers Google/Discord social sign-in.
- Microphone purpose string: describes optional dream voice journaling and transcription.
- Hosted legal URLs: set `EXPO_PUBLIC_PRIVACY_POLICY_URL` and `EXPO_PUBLIC_TERMS_URL`.

Before TestFlight/App Review, complete these manual steps:

- App Store Connect app record, category, support URL (`https://oneirosjournal.com/support`), Privacy Policy URL, Terms URL, age rating, and screenshots. Because `ios.supportsTablet` is true, prepare iPad screenshots or disable tablet support before release.
- App Privacy nutrition labels for account data, dream/user content, voice audio/transcription, support messages, diagnostics if collected, and AI subprocessors.
- Export compliance answers consistent with `ITSAppUsesNonExemptEncryption: false`.
- Supabase Auth redirect allowlist includes `oneiros-dream-journal://auth/confirm` and `oneiros-dream-journal://auth/callback`.
- Supabase providers are configured for Apple, Google, and Discord.
- `openai-proxy` changes are deployed before production builds:
  ```bash
  supabase functions deploy openai-proxy
  ```
- Physical iPhone TestFlight smoke: email login/signup/reset, Apple sign-in, Google/Discord sign-in, voice recording permission/transcription, AI reflection/chat, offline guards, sync, account deletion, and hosted legal links.

Build and submit after the checks pass:

```bash
eas build --profile production --platform ios
eas submit --profile production --platform ios
```
