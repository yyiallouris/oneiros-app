# Complete app journey

This is the end-to-end Oneiros path for agents who need the whole product shape before changing a single feature. For deeper details, follow the linked flow docs.

## 1. Launch and route gate

1. `App.tsx` loads brand fonts, hides the native splash, then shows `LoadingScreen`.
2. Native splash now uses the droplet symbol only on a warm paper field.
3. `LoadingScreen` continues the same paper-first entry moment with the droplet logo plus the `Oneiros` wordmark.
4. `RootNavigator` initializes storage and auth deep links in parallel.
5. Supabase session state decides the first root route:
   - No session: `Auth` plus `LoginSupport`.
   - Pending password reset: `SetPassword`.
   - Biometric lock enabled and not unlocked this foreground: `BiometricLock`.
   - Legal consent missing for current version: `LegalConsent`.
   - Onboarding incomplete: `Onboarding`.
   - Ready user: `MainTabs`.

Related docs: [flows-01-app-entry-session.md](./flows-01-app-entry-session.md), [flows-02-authentication.md](./flows-02-authentication.md), [flows-03-onboarding-account-security.md](./flows-03-onboarding-account-security.md).

## 2. Auth, consent, and onboarding

- `AuthScreen` handles email login, email signup with OTP or magic link confirmation, forgot-password link requests, native Apple sign-in on iOS, and Google/Discord OAuth.
- Recovery links set `PENDING_PASSWORD_RESET_KEY`; `SetPasswordScreen` clears it after `supabase.auth.updateUser`.
- `LegalConsentScreen` must be accepted per user and consent version before entering onboarding or tabs.
- `OnboardingNavigator` runs name, interpretation depth, and optional biometric lock setup.
- `AccountScreen` later lets the user update display name, interpretation depth, mythic resonance, biometric app lock, privacy routes, and account deletion. Subscription entitlement status and purchase linking now also have a backend contract, even though the in-app purchase UI is not wired yet.

Related docs: [flows-02-authentication.md](./flows-02-authentication.md), [flows-03-onboarding-account-security.md](./flows-03-onboarding-account-security.md), [flows-08-support-legal-contact.md](./flows-08-support-legal-contact.md).

## 3. Main tabs and primary work

Main app tabs are `Write`, `Journal`, and `Insights`.

- Bottom navigation now renders as a floating parchment shelf over the paper background with explicit active/inactive PNG icon pairs.

- `WriteScreen`: user records today’s dream, auto-saves a draft, optionally appends voice transcription, saves locally first, clears the draft, then opens `DreamDetail`.
- `DreamDetailScreen`: shows the dream, generates or displays the Jungian reflection, presents `display_distillation`, supports inline follow-up chat, editing, regeneration, deletion/reset paths, and offline guards for AI actions.
- `JournalScreen`: archive/search/filter view of dreams. Filters can come from Insights via `JournalFilterScreen`.
- `CalendarScreen`: day-level dream map; opens existing dreams or creates a dated dream through `DreamEditorScreen`.
- `InsightsScreen`: period overview, recent dream-field reflection, recurring patterns, Pattern Explorer, and entry to category detail screens.
- Backend-only subscription enforcement now exists for reflection, follow-up chat, Recent Dream Field, and period reflections through Supabase Edge Functions and SQL quota ledgers, but current screens still use the legacy client AI path until frontend work switches over.

Related docs: [flows-04-dreams-journal-calendar.md](./flows-04-dreams-journal-calendar.md), [flows-06-jungian-ai-reflection.md](./flows-06-jungian-ai-reflection.md), [flows-07-insights-reports.md](./flows-07-insights-reports.md).

## 4. Storage, sync, and offline behavior

- Screens should use `StorageService` through `src/utils/storage.ts` compatibility helpers or direct service imports where already established.
- Local writes happen first through `LocalStorage`; remote writes are queued and synced by `SyncService`.
- `RootNavigator` preserves the previous session when Supabase reports null while offline, preventing accidental login redirects during token refresh failures.
- Network reconnect syncs unsynced dreams first, then fetches and merges dreams and interpretations.
- Logout attempts a final unsynced dream sync, clears local app data, and keeps biometric preference recoverable from remote settings.

Related docs: [flows-05-sync-offline.md](./flows-05-sync-offline.md), [../ARCHITECTURE.md](../ARCHITECTURE.md).

## 5. Support, legal, and exit paths

- Authenticated contact goes through `ContactScreen` and `sendContactMessage`.
- Signed-out or locked support goes through `LoginSupportScreen` and the `support-request` function.
- Privacy and legal text lives in `PrivacyScreen` and `constants/legal.ts`; hosted Privacy Policy and Terms URLs are configurable for public release.
- Account deletion invokes the `delete-account` Supabase Edge Function, clears local storage, then signs out.
- Write menu is the visible logout entry point.

Related docs: [flows-08-support-legal-contact.md](./flows-08-support-legal-contact.md), [../supabase/functions/support-request/README.md](../supabase/functions/support-request/README.md), [../supabase/functions/delete-account/README.md](../supabase/functions/delete-account/README.md).

## 6. What changes affect

- Navigation gates affect app entry, auth, onboarding, legal consent, biometric lock, and offline session tests.
- Dream save/edit/delete affects Write, Journal, Calendar, DreamDetail, sync queues, remote storage, and Insights aggregations.
- AI reflection changes affect DreamDetail, `InterpretationChatScreen`, metadata extraction, Insights, remote schema, AI proxy config, and offline messaging.
- Insights changes affect period math, filter routes, pattern reports, local caches, remote reports, and flow tests.
- Subscription / billing backend changes affect store purchase binding, quota ledgers, period-reflection archival, account deletion, and future account / paywall UI work.
- UI theme changes affect `src/theme/COLORS.md`, `src/theme/TYPOGRAPHY.md`, shared UI components, design exports, iPhone/iOS and Android visual behavior.

Use [flows-09-regression-edge-cases.md](./flows-09-regression-edge-cases.md) as the checklist before closing behavior work.
