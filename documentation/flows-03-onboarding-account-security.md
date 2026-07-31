# Onboarding, account, and app security

## Post-login onboarding (`OnboardingNavigator`)

Order: **OnboardingName** → **OnboardingDepth** → **OnboardingLanguage** → **OnboardingSubscription** → **OnboardingSecure**.

Quiet progress chrome (`OnboardingProgress`) shows step N of 5 on every screen.

- **Name:** optional display name; Continue requires a value, Skip continues without one. Copy clarifies later editability in Account.
- **Depth:** interpretation depth preference with Core Reflection preselected. Continue persists the selection. No Skip — with a default already chosen, Skip would be a false choice.
- **Language:** Insights language for Recent Dream Field and Period Reflection. Device language is preferred/preselected when supported; Continue persists via `patternInsightLanguageService`. No Skip for the same reason as Depth.
- **Subscription:** explicit plan choice before security.
  - Free remains explicit: unlimited entries, 1 reflection every 7 days, and 5 follow-up replies on that free reflection.
  - Premium offers monthly and yearly billing with 35 reflections, 10 Recent Dream Field reports, 1 monthly essay, and a 7-day free trial.
  - Deeper offers monthly and yearly billing with 80 reflections, unlimited Recent Dream Field reports, weekly essays, and a 7-day free trial.
  - Plan cards are presented in a horizontal carousel rather than a stacked comparison block, with Premium shown first and Free available by swiping left.
  - Yearly cards show the monthly list price struck through, the discounted monthly equivalent, the yearly billed total, and the savings line.
  - The Yearly switch badge follows the visible paid card (`Save €12` on Premium, `Save €30` on Deeper).
  - The dot/line pagination indicator sits above the cards.
  - The monthly / yearly pricing switch is hidden whenever the free card is the active visible card.
  - Native purchase starts directly from the Premium or Deeper card, while `Continue with Free` proceeds directly.
  - “Decide later in Subscription” remains the only deferral path on this step.
- **Secure:** optional biometric app lock. Single primary CTA **Get started** completes onboarding (`setOnboardingCompleted` → `onComplete` → `MainTabs`). No duplicate Skip, because biometrics are already optional via the toggle.

Persistence: `hasCompletedOnboarding` / `setOnboardingCompleted` in `onboardingService.ts` — keyed per **user id** in AsyncStorage.

## Regression — onboarding

- New user: must complete or skip all steps before tabs.
- Returning user same device: onboarding skipped if flag true for that user id.
- User A logs out, User B logs in: onboarding state is per user id.

## Subscription screen (`Subscription`)

Reachable from **Write** tab → menu → **Subscription & Billing** or from the compact subscription row inside **Account**.

- Permanent manage-subscription destination.
- Shows the full plan comparison without usage statistics or quota counters on the screen itself.
- The dot/line pagination indicator sits above the cards.
- Monthly / yearly switch appears only when the premium card is the active visible card.
- Bottom action is contextual:
  - active paid access → `Manage`
  - free or lapsed → `Restore purchases`
  - unsupported runtime (for example Expo Go) → helper message instead of broken native actions
- Free, Premium, and Deeper cards use the same comparison carousel as onboarding, with Premium visible first by default.

## Account screen (`Account`)

Reachable from **Write** tab → menu → **Account**.

- **Subscription:** compact status row only.
  - Shows current plan state and renewal / lapse messaging.
  - Tapping the row deep-links into **Subscription**.
  - No plan cards, quota grids, restore buttons, or purchase CTAs live inside Account anymore.

- **Profile:** “Name or nickname” is the only draft field. Sticky nav **Save** text appears top-right only while the nickname is dirty (then brief **Saved**), then redirects to the **Write** tab. Depth, Insights language, and Security still commit immediately on tap/toggle — Save intentionally does **not** activate for those.
- **Dream analysis — level:** `quick` | `standard` | `advanced` (stored via `userSettingsService` on select).
- **Insights language:** selects the language for Recent Dream Field and Period Reflection; persisted on select and applied by both Insights flows.
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

## Regression — subscription surfaces

- New onboarding path is name → depth → language → subscription → secure.
- Paid users who already have access are pushed onward instead of lingering on the subscription step.
- Subscription is the long-term restore / manage / renew destination.
- Account stays a settings surface with only a compact subscription entry.
