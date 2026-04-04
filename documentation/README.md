# User & system flows (Oneiros)

This folder catalogs **user journeys and technical flow paths** found in the codebase, grouped for onboarding, QA, and regression planning. It is derived from navigation (`RootNavigator`, tabs, stack routes), auth (`AuthScreen`, Supabase, deep links), storage/sync (`StorageService`, `SyncService`), and feature screens.

**Related technical doc:** symbol extraction and interpretation text are detailed in [`../docs/SYMBOLS_FLOW.md`](../docs/SYMBOLS_FLOW.md).

## Documents in this folder

| File | Scope |
|------|--------|
| [flows-01-app-entry-session.md](./flows-01-app-entry-session.md) | Cold start, splash/loading, session lifecycle, offline token behavior |
| [flows-02-authentication.md](./flows-02-authentication.md) | Sign up, login, email verification, Google OAuth, forgot password, reset link → set password, login support |
| [flows-03-onboarding-account-security.md](./flows-03-onboarding-account-security.md) | Post-login onboarding, Account settings, app biometric lock |
| [flows-04-dreams-journal-calendar.md](./flows-04-dreams-journal-calendar.md) | Write, drafts, voice transcription, save, Journal, Dream detail/editor, Calendar |
| [flows-05-sync-offline.md](./flows-05-sync-offline.md) | Offline-first saves, reconnect sync, logout cleanup, dev offline toggle |
| [flows-06-jungian-ai-reflection.md](./flows-06-jungian-ai-reflection.md) | Initial reflection, follow-up chat, limits, `InterpretationChat` route |
| [flows-07-insights-reports.md](./flows-07-insights-reports.md) | Period presets, Insights journey vs sections, pattern reports, filters → journal |
| [flows-08-support-legal-contact.md](./flows-08-support-legal-contact.md) | Contact, Privacy, support while locked out |
| [flows-09-regression-edge-cases.md](./flows-09-regression-edge-cases.md) | Error paths, empty states, ordering notes for test suites |

## Primary navigation map (simplified)

- **No session:** stack shows `Auth` (+ `LoginSupport`).
- **Session + pending password reset:** `SetPassword`.
- **Session + biometric lock enabled + not unlocked this foreground:** `BiometricLock` (+ `LoginSupport`).
- **Session + onboarding incomplete:** `Onboarding` (name → depth → secure).
- **Otherwise:** `MainTabs` (Write | Journal | Insights).

**Stack screens** (reachable when authenticated, in addition to the above): `DreamEditor`, `InterpretationChat`, `DreamDetail`, `Account`, `Contact`, `Privacy`, `Calendar`, `InsightsSection`, `InsightsJourney`, `JournalFilter`.

## Automated tests

- **Jest (logic / services):** `__tests__/flows/` — see [`__tests__/flows/README.md`](../__tests__/flows/README.md). Run `npm run test:flows` or full `npm test`.
- **Detox (device UI smoke):** `e2e/login.e2e.ts` — auth buttons and forgot-password screen. Requires a dev build (`detox:build:android`, etc.).

## Key source files

- `App.tsx` — initial `LoadingScreen`, then `RootNavigator`.
- `src/navigation/RootNavigator.tsx` — auth gating, sync on reconnect, logout cleanup, deep link init.
- `src/navigation/types.ts` — route param types.
- `src/navigation/MainTabsNavigator.tsx` — Write / Journal / Insights tabs.
- `src/utils/authDeepLink.ts` — magic link, recovery, OAuth tokens in URL.
