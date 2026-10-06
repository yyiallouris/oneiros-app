# Oneiros v1.2.0 — clean store screenshot pack

Use this folder for App Store Connect and Google Play. It supersedes the earlier `oneiros-v1.2.0-2026-09-02` capture folder.

## Visual QA

- Recaptured from a production Expo export (`__DEV__ = false`).
- Checked all 14 images in contact sheets and individually checked the Dream Fabric and Pattern Explorer screens.
- No debugger button, `Re-extract echoes (debug packet)`, `Design export`, development menu, browser chrome, or personal user data is visible.
- Dream Fabric is expanded inside Dream Details in `04-dream-fabric.png` for both platforms.
- Pattern Explorer uses the realistic `Last 5 dreams` period and synthetic pattern data.

## Assets

Production binary metadata and checksums are recorded in `builds/ARTIFACTS.md`.
The exact owner-operated release sequence is in `OWNER_RELEASE_CHECKLIST.md`.

### Apple

`apple/iphone-6.9/`

- 7 portrait PNG files
- `1320 × 2868`
- no alpha

### Google Play

`google-play/phone/`

- 7 portrait PNG files
- `1080 × 1920`
- no alpha

Additional assets:

- `google-play/icon-512.png` (`512 × 512`, RGBA, under 1 MB)
- `google-play/feature-graphic-1024x500.png` (`1024 × 500`, opaque PNG, 665,282 bytes) is the product-owner-provided final artwork, technically ready for Play Console. **Prepared only; do not submit it until the product owner explicitly authorizes submission.**
- `google-play/drafts/feature-graphic-reference-do-not-submit.png` (`1024 × 500`, opaque PNG) is the superseded generated reference. **Do not upload or submit it.**

## Upload order

1. `01-write.png`
2. `02-journal.png`
3. `03-dream-detail.png`
4. `04-dream-fabric.png`
5. `05-calendar.png`
6. `06-insights.png`
7. `07-pattern-explorer.png`

## Suggested Google Play alt text

Each line stays below Google's 140-character recommendation:

1. `01-write.png` — Write a remembered dream in Oneiros by text or optional voice journaling.
2. `02-journal.png` — Browse a private journal of saved dreams and their reflection status.
3. `03-dream-detail.png` — Read a saved dream beside its AI-assisted symbolic reflection.
4. `04-dream-fabric.png` — Explore Dream Fabric details such as atmosphere, landscapes, relationships, thresholds, and motifs.
5. `05-calendar.png` — See recorded dreams arranged in a quiet monthly calendar.
6. `06-insights.png` — Review recurring images, patterns, thresholds, tensions, archetypal echoes, and dream places.
7. `07-pattern-explorer.png` — Explore the strongest patterns across recent dreams with grounded examples.

## Compliance implementation status

Implemented in the source release prepared with this pack:

- discreet in-app AI-response reporting on Dream Details, Exploring, Recent Dream Field, and Period Reflection;
- narrow client/server prevention for explicit prohibited free-form generation requests;
- automatic-renewal, cancellation, trial-conversion, Free-alternative, Privacy, and Terms disclosure before paid CTAs;
- active-subscription warning and store-management choice before account deletion;
- Sign in with Apple authorization-code exchange, server-only refresh-token custody, and pre-deletion Apple token revocation;
- iOS build number and Android version code incremented to `6` after artifact-level release hardening;
- production/preview native config removes the generated Expo launcher scheme, optional Android overlay/legacy-storage permissions, and development-only Android activities;
- the product owner's final Google Play feature graphic was prepared at the exact required dimensions and remains explicitly held from submission pending authorization.

Build 5 completed for both platforms but was superseded after manifest inspection exposed unnecessary development-launcher residue. Those binaries are isolated under `builds/superseded-do-not-submit/`. Build 6 is the only submission line: both the iOS IPA and Android AAB are complete and locally validated, including identifier/version, signature, production-bundle content, developer-residue, permissions/entitlements, and platform-specific artifact checks. The Android AAB also passes `bundletool` validation and reports 16 KB page alignment.

External release operations still require successful credentials and store-console access: push the Apple-token migration, configure its Apple secrets, deploy the three affected functions, complete device smoke tests, deploy the updated public legal/support pages, and upload/complete the declarations in App Store Connect and Play Console. The final feature graphic must remain unsubmitted until separately authorized.

Supabase is owner-operated only. Follow `SUPABASE_HANDOFF.md`; Codex must not execute those production changes.

Full requirements audit and official source links remain in the sibling pack's `README.md`.
