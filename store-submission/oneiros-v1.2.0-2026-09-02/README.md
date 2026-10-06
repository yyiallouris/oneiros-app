# Oneiros v1.2.0 — Apple App Store & Google Play submission pack

> **Superseded:** do not upload screenshots from this folder. Use `../oneiros-v1.2.0-2026-09-02-clean/`, which was recaptured after removing every visible developer/export label.

Audit date: 2 September 2026

## Status

The screenshot assets in this folder are superseded. Use the clean sibling pack. The app submission itself is **not yet ready to send for review** until the owner-operated deployment and smoke-test items below are closed.

### Blocking before submission

1. **Use only the validated hardened production builds.** Build 5 completed for both platforms but is isolated as `superseded-do-not-submit` after artifact inspection found unnecessary Expo launcher residue. Both build-6 artifacts are complete and validated; their checksums are recorded in the clean pack.
2. **Owner-operated Supabase rollout.** Apple authorization-code exchange, server-only refresh-token custody, and pre-deletion token revocation are implemented and tested locally. The product owner must apply the migration, secrets, and function deployments in the clean pack's `SUPABASE_HANDOFF.md`, then pass the documented production smoke tests.
3. **Public-site rollout.** Deploy the updated Privacy, Terms, and Support pages, then verify the public account-deletion and subscription-cancellation disclosures end to end.
4. **Google Play feature graphic hold.** The product owner's final `1024 × 500` opaque PNG is technically ready in the clean pack, but must not be submitted until the product owner separately authorizes it.

### Console-only items that still require confirmation

- App Store Connect: app record, contracts/tax/banking, primary category, 18+ age rating answers, App Privacy answers, support/privacy URLs, review notes and a working reviewer account, subscription products/prices/localizations, and the submitted build.
- Play Console: app access/reviewer account, Data Safety, ads declaration, content rating, target audience 18+, account-deletion URL, subscription products/base plans/offers, countries/pricing, Play App Signing, testing-track eligibility, and the submitted AAB.
- Test all store products with Apple sandbox/TestFlight and Google license testers, including purchase, restore, upgrade/downgrade, expiry, cancellation and entitlement refresh.

## Delivered assets

### Apple — iPhone 6.9-inch display

Folder: `apple/iphone-6.9/`

- 7 portrait PNG screenshots.
- Every file is exactly `1320 × 2868`, has no alpha channel, and is within Apple's accepted 6.9-inch screenshot sizes.
- Oneiros is configured as iPhone-only (`supportsTablet: false`), so iPad screenshots are not required for this release.
- Apple accepts 1–10 screenshots. App previews are optional.

### Google Play — phone

Folder: `google-play/phone/`

- 7 portrait PNG screenshots.
- Every file is exactly `1080 × 1920`, has no alpha channel, uses the recommended 9:16 portrait ratio, and stays within the 8-phone-screenshot maximum.
- This exceeds Google's minimum of 2 screenshots and satisfies the recommendation-eligibility guidance of at least 4 phone screenshots at 1080 px or greater.
- `google-play/icon-512.png` is a `512 × 512` RGBA PNG under 1 MB, prepared from the Android release icon.

### Recommended upload order

1. `01-write.png` — primary dream entry surface
2. `02-journal.png` — populated private journal
3. `03-dream-detail.png` — dream and symbolic reflection
4. `04-dream-fabric.png` — expanded Dream Fabric inside Dream Details
5. `05-calendar.png` — dream calendar
6. `06-insights.png` — insights overview
7. `07-pattern-explorer.png` — pattern exploration

All captures use synthetic dream data only. They were rendered from the current production Expo bundle in the repository's design-export mode; no personal or production user data is present. The Dream Fabric image is a separate, expanded Dream Details state and contains no development-only controls.

## Apple App Store requirements checked

- Bundle ID: `com.oneirosdreamjournal.app`
- Marketing version: `1.2.0`
- Current configured build number: `6`.
- iPhone-only: yes (`UIDeviceFamily = 1`; `supportsTablet: false`).
- Minimum iOS: `15.1` in the latest finished IPA.
- Encryption declaration: `ITSAppUsesNonExemptEncryption = false`.
- Microphone and Face ID usage descriptions are present.
- Sign in with Apple is configured in the app; account deletion exists in-app.
- Hosted URLs are live and configured in the production EAS environment:
  - Privacy: `https://www.oneirosjournal.com/privacy`
  - Terms: `https://www.oneirosjournal.com/terms`
  - Support: `https://www.oneirosjournal.com/support`
- App Privacy must cover actual production collection/processing, including account contact information/identifier, dream journal content, optional voice/transcription data, purchases/entitlements, support messages, operational data, and processing by relevant third parties such as Supabase, the AI provider, and Apple/Google billing.
- In review notes, explain that Oneiros is an adult wellness/self-inquiry journal, not therapy or medical care; disclose where paid features appear; supply a stable reviewer account and exact steps to reach subscription, voice, Dream Details, Dream Fabric, Insights, restore purchases, and account deletion.

Official references:

- Screenshot sizes and formats: https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/
- Uploading screenshots: https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots
- App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- App Privacy: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/
- Account deletion: https://developer.apple.com/support/offering-account-deletion-in-your-app/
- Uploading builds: https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/

## Google Play requirements checked

- Application ID: `com.oneirosdreamjournal.app`
- Marketing version: `1.2.0`
- Current configured version code: `6`.
- Production EAS profile creates an Android App Bundle (`.aab`).
- Expo SDK 54 / React Native 0.81 targets Android API 36, meeting the current new-app/update target requirement.
- The latest finished production AAB was built with Android Gradle Plugin `8.11.0`.
- All `arm64-v8a` native libraries in that AAB have ELF `LOAD` alignment of at least `2**14` (16 KB). Reconfirm the new AAB in Play Console because the next submission must be rebuilt from the current commit.
- Sensitive/user-facing permissions are limited to biometric/fingerprint and optional microphone/audio support: `USE_BIOMETRIC`, `USE_FINGERPRINT`, `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`. Normal app-operation permissions cover networking, foreground audio service and Play Billing. Build 6 must contain no overlay or legacy shared-storage permission.
- Public deletion-request page: `https://www.oneirosjournal.com/support`. It prominently names account/data deletion and provides a form plus email route. Verify one end-to-end support submission before release.
- Data Safety must match the production app and every included SDK. Do not rely only on the privacy policy; declare actual collection, sharing, security, deletion and optional processing behavior in Play Console.
- Personal developer accounts created after 13 November 2023 may need a closed test with at least 12 opted-in testers for 14 continuous days before production-access eligibility.

Official references:

- Store listing preview assets: https://support.google.com/googleplay/android-developer/answer/9866151?hl=en
- Data Safety: https://support.google.com/googleplay/android-developer/answer/10787469?hl=en
- Account deletion: https://support.google.com/googleplay/android-developer/answer/13327111?hl=en
- Personal-account testing requirement: https://support.google.com/googleplay/android-developer/answer/14151465?hl=en-GB
- Target API requirements: https://support.google.com/googleplay/android-developer/answer/11926878?hl=en-AU
- 16 KB page-size guidance: https://developer.android.com/guide/practices/page-sizes
- Expo SDK 54 platform versions: https://docs.expo.dev/versions/v54.0.0/

## Checks completed

- `npm run typecheck` — passed.
- `npm test -- --runInBand` — passed: 161 suites / 982 tests; 2 suites and 5 tests skipped by the existing test configuration.
- `npx expo-doctor` — 17/17 checks passed.
- `npx expo install --check` — dependencies are up to date.
- `npx expo export --platform web` — production export passed and was used for the screenshot capture.
- Image validation — all screenshots have the required dimensions and no alpha; Google icon is 512 × 512 RGBA and under 1 MB; the owner-provided feature graphic is 1024 × 500, 8-bit RGB and opaque.
- Live URL checks — privacy, terms, support and root pages respond successfully after their canonical `www` redirect.
- EAS production build — build 5 completed for both platforms and was archived as non-submittable after manifest inspection; hardened build 6 is complete and artifact-validated for both iOS and Android.

## Final release sequence

1. The product owner applies the Supabase migration, Apple secrets, and three function deployments listed in the clean pack's `SUPABASE_HANDOFF.md`.
2. Deploy the updated public Privacy, Terms, and Support pages and verify the deletion-request route.
3. Use only the validated iOS and Android `1.2.0 (6)` artifacts from the clean pack; never upload the isolated build 5 archive.
4. Run physical iPhone/TestFlight and Android closed-track smoke tests for auth, legal consent, voice permissions, save/edit/delete, reflection streaming, Dream Fabric, subscriptions/restore, support, offline recovery and account deletion.
5. Complete the console declarations and subscription configuration. Upload the final feature graphic only after separate product-owner authorization.
6. Upload the matching builds and screenshots, complete reviewer notes/access, and submit for review only after every blocker above passes.
