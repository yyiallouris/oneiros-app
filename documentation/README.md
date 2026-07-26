# User & system flows (Oneiros)

This folder catalogs **user journeys, technical flow paths, and practical architecture maps** found in the codebase, grouped for onboarding, QA, regression planning, and AI-agent change impact analysis. It is derived from navigation (`RootNavigator`, tabs, stack routes), auth (`AuthScreen`, Supabase, deep links), storage/sync (`StorageService`, `SyncService`), AI interpretation services, theme docs, and feature screens.

**Related technical docs:** symbol extraction and interpretation text are detailed in [`../docs/SYMBOLS_FLOW.md`](../docs/SYMBOLS_FLOW.md). Full dumped AI prompt texts (reflection, chat, extraction, essays, repair) live in [`../docs/AI_PROMPTS_INVENTORY.md`](../docs/AI_PROMPTS_INVENTORY.md). Archetypal/Mythic Echo prompt sections + operational catalog: [`../docs/ECHOES_PROMPTS_AND_CATALOG.md`](../docs/ECHOES_PROMPTS_AND_CATALOG.md).

## Documents in this folder

| File | Scope |
|------|--------|
| [flows-00-complete-app-journey.md](./flows-00-complete-app-journey.md) | End-to-end journey from launch/login through consent, onboarding, dreams, AI, Insights, support, and logout |
| [flows-01-app-entry-session.md](./flows-01-app-entry-session.md) | Cold start, splash/loading, session lifecycle, offline token behavior |
| [flows-02-authentication.md](./flows-02-authentication.md) | Sign up, login, email verification, Apple/Google/Discord sign-in, forgot password, reset link → set password, login support |
| [flows-03-onboarding-account-security.md](./flows-03-onboarding-account-security.md) | Post-login onboarding, subscription choice, Account settings, app biometric lock |
| [flows-04-dreams-journal-calendar.md](./flows-04-dreams-journal-calendar.md) | Write, drafts, voice transcription, save, Journal, Dream detail/editor, Calendar |
| [flows-05-sync-offline.md](./flows-05-sync-offline.md) | Offline-first saves, reconnect sync, logout cleanup, dev offline toggle |
| [flows-06-jungian-ai-reflection.md](./flows-06-jungian-ai-reflection.md) | Entitlement-gated reflection, follow-up chat, limits, `InterpretationChat` route. **Locked contracts:** (1) DreamDetail ~15s streamed reflection keeps `PhasedTypingText` (user approval to change); (2) metadata extraction resilience — soft defaults + dual deploy so `structured_schema_invalid` does not recur after echo/schema edits. |
| [flows-07-insights-reports.md](./flows-07-insights-reports.md) | Period presets, Recent Dream Field, premium paywalls, pattern reports, filters → journal |
| [flows-08-support-legal-contact.md](./flows-08-support-legal-contact.md) | Contact, Privacy, support while locked out |
| [flows-09-regression-edge-cases.md](./flows-09-regression-edge-cases.md) | Error paths, empty states, ordering notes for test suites |
| [flows-10-subscriptions-billing.md](./flows-10-subscriptions-billing.md) | Subscription UX, yearly/monthly plans, entitlement source of truth, quota rules, and AI gateway contract |
| [architecture-app-map.md](./architecture-app-map.md) | Practical subsystem map for navigation, screens, services, storage, Supabase, AI, theme, and impact analysis |
| [architecture-features.md](./architecture-features.md) | Feature-by-feature map of entry points, dependencies, docs/tests, platform, and deploy considerations |
| [architecture-interpretation.md](./architecture-interpretation.md) | AI interpretation architecture: reflection, chat, extraction (shared canonical prompt in `src/ai/dreamExtractionPrompt.ts`), `display_distillation`, metadata, proxy routing, sync, and tests |

## Primary navigation map (simplified)

- **No session:** stack shows `Auth` (+ `LoginSupport`).
- **Session + pending password reset:** `SetPassword`.
- **Session + biometric lock enabled + not unlocked this foreground:** `BiometricLock` (+ `LoginSupport`).
- **Session + onboarding incomplete:** `Onboarding` (name → depth → language → subscription → secure).
- **Otherwise:** `MainTabs` (Write | Journal | Insights).

**Stack screens** (reachable when authenticated, in addition to the above): `DreamEditor`, `InterpretationChat`, `DreamDetail`, `Account`, `Subscription`, `Contact`, `Privacy`, `Calendar`, `InsightsSection`, `PatternExplorer`, `InsightsJourney`, `JournalFilter`.

## Automated tests

- **Jest (logic / services):** `__tests__/flows/` — see [`__tests__/flows/README.md`](../__tests__/flows/README.md). Run `npm run test:flows` or full `npm test`.
- **Detox (device UI smoke):** `e2e/login.e2e.ts` — auth buttons and forgot-password screen. Requires a dev build (`detox:build:android`, etc.).

## Key source files

- `App.tsx` — initial `LoadingScreen`, then `RootNavigator`.
- `src/navigation/RootNavigator.tsx` — auth gating, sync on reconnect, logout cleanup, deep link init.
- `src/navigation/types.ts` — route param types.
- `src/navigation/MainTabsNavigator.tsx` — Write / Journal / Insights tabs.
- `src/utils/authDeepLink.ts` — magic link, recovery, OAuth tokens in URL.

## AI agent onboarding

Repo-local skill: [`../.codex/skills/oneiros-repo/SKILL.md`](../.codex/skills/oneiros-repo/SKILL.md).

Before changing behavior, future agents should read `AGENTS.md`, this index, and the architecture map that matches the task. UI work should also check [`../src/theme/COLORS.md`](../src/theme/COLORS.md) and [`../src/theme/TYPOGRAPHY.md`](../src/theme/TYPOGRAPHY.md).
