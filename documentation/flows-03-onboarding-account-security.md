# Onboarding, account, and app security

## Post-login onboarding (`OnboardingNavigator`)

Order: **OnboardingName** → **OnboardingDepth** → **OnboardingSecure**.

- **Name:** display name capture; continues to depth.
- **Depth:** interpretation depth preference (journey into app expectations).
- **Secure:** optional **biometric app lock** (enable/disable with device prompt); **Finish** or **Skip** both call `setOnboardingCompleted()` then parent `onComplete()` → `MainTabs`.

Persistence: `hasCompletedOnboarding` / `setOnboardingCompleted` in `onboardingService.ts` — keyed per **user id** in AsyncStorage.

## Regression — onboarding

- New user: must complete or skip all steps before tabs.
- Returning user same device: onboarding skipped if flag true for that user id.
- User A logs out, User B logs in: onboarding state is per user id.

## Account screen (`Account`)

Reachable from **Write** tab → menu → Account.

- **Profile:** “Name or nickname” → `UserService.setDisplayName`; brief “Saved” then navigate to **Write** tab.
- **Dream analysis — level:** `quick` | `standard` | `advanced` (stored via `userSettingsService`).
- **Mythic Resonance:** toggle only relevant when depth is **advanced**; persisted remotely/local settings.
- **Security — Lock app with Face ID / fingerprint:** `enableBiometric` / `disableBiometric`; synced with remote profile (see `biometricAuthService`).

## App lock (`BiometricLockScreen`)

- When session exists, biometric enabled, and user has not unlocked since last background transition: root shows lock screen.
- Auto-prompt ~400ms after mount; manual “Unlock” button.
- Link to **Login support** (does not bypass lock).

## Regression — biometric

- Enable in Account → background app → return → lock appears.
- Enable during onboarding vs Account — both paths.
- Permission denied / unsupported hardware — section visibility and error alerts.
- Logout: biometric preference **not** cleared locally in a way that loses remote toggle; next login restores from remote (`syncBiometricFromRemote` in `RootNavigator`).
