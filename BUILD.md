# Getting the app on your phone (standalone build)

You can build an **installable app** so you don’t need to run `npx expo start` and so you can share it with others.

## Security (do this first)

- **Never commit secrets.** All API keys and Supabase keys live in **environment variables**, not in `app.json` or any tracked file.
- **Local dev:** Copy `.env.example` to `.env`, fill in values, and run the app. `.env` is gitignored.
- **Pre-commit guard (optional):** To block commits that contain secret-like strings (e.g. `sk-proj-...`), enable the repo hook:  
  `git config core.hooksPath .githooks` (run once from repo root).
- **EAS builds:** Set secrets in EAS so builds get the right config:
  ```bash
  eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co"
  eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key"
  eas secret:create --name EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT --value "https://your-project.supabase.co/functions/v1/openai-proxy"
  eas secret:create --name EXPO_PUBLIC_GPT_MODEL --value "gpt-4o"
  ```
  For production, use a Supabase Edge Function as the OpenAI proxy and do **not** put an OpenAI API key in the app.

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

3. **Linking:** This project is already linked via `projectId` in `app.config.js`. You can skip `eas build:configure` and run a build directly. If you ever see "EAS project not configured", the link is still valid — just run the build command below.

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
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co"
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key"
# etc.
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
