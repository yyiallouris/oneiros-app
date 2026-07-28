# User & system flows (Oneiros)

This folder catalogs **user journeys, technical flow paths, and practical architecture maps** found in the codebase, grouped for onboarding, QA, regression planning, and AI-agent change impact analysis. It is derived from navigation (`RootNavigator`, tabs, stack routes), auth (`AuthScreen`, Supabase, deep links), storage/sync (`StorageService`, `SyncService`), AI interpretation services, theme docs, and feature screens.

**Related technical docs:** symbol extraction and interpretation text are detailed in [`../docs/SYMBOLS_FLOW.md`](../docs/SYMBOLS_FLOW.md). Full dumped AI prompt texts (reflection, chat, extraction, essays, repair) live in [`../docs/AI_PROMPTS_INVENTORY.md`](../docs/AI_PROMPTS_INVENTORY.md). Archetypal/Mythic Echo prompt sections + operational catalog: [`../docs/ECHOES_PROMPTS_AND_CATALOG.md`](../docs/ECHOES_PROMPTS_AND_CATALOG.md) (current extraction line: `prompt_id` `dream-field-map-interpretive-v4.1.9-M1`, `prompt_version` `4.1.9-M1`, schema `13`, myth catalog `1.7.0`). No-prompt-bloat brief: [`../docs/ONEIROS_V4_1_1_NO_PROMPT_BLOAT_DEV_BRIEF.md`](../docs/ONEIROS_V4_1_1_NO_PROMPT_BLOAT_DEV_BRIEF.md). Closed Mythic integration brief: [`../docs/ONEIROS_CLOSED_MYTH_CATALOG_INTEGRATION_BRIEF.md`](../docs/ONEIROS_CLOSED_MYTH_CATALOG_INTEGRATION_BRIEF.md). Live production-only echo baseline (paste a dream → real proxy runs): [`../docs/LIVE_ECHOES_BASELINE_RUNNER.md`](../docs/LIVE_ECHOES_BASELINE_RUNNER.md), with tracked scenarios under [`../testing/live-scenarios/README.md`](../testing/live-scenarios/README.md). Closed-catalog 5-dream acceptance suite: [`../docs/ONEIROS_5_DREAM_ACCEPTANCE_SET.md`](../docs/ONEIROS_5_DREAM_ACCEPTANCE_SET.md) (`bash scripts/run-5-dream-acceptance.sh`). Global archetype evaluation benchmark (59 fixtures, full-catalog confusion matrix): [`../docs/ONEIROS_GLOBAL_ARCHETYPE_BENCHMARK.md`](../docs/ONEIROS_GLOBAL_ARCHETYPE_BENCHMARK.md) (`bash scripts/run-global-archetype-benchmark.sh`). Naturalistic myth calibration benchmark (24 fixtures × 3 repeats, diagnostic-only): [`../docs/ONEIROS_MYTH_NATURALISTIC_CALIBRATION_BENCHMARK.md`](../docs/ONEIROS_MYTH_NATURALISTIC_CALIBRATION_BENCHMARK.md) (`bash scripts/run-naturalistic-myth-benchmark.sh`). Patch F selection-stability diagnostic (no production changes): [`../docs/ONEIROS_V4_1_8_F_DIAGNOSTIC.md`](../docs/ONEIROS_V4_1_8_F_DIAGNOSTIC.md) (`bash scripts/run-patch-f-stability.sh`). v4.1.1 no-prompt-bloat brief + Phase 0 diagnostics: [`../docs/ONEIROS_V4_1_1_NO_PROMPT_BLOAT_DEV_BRIEF.md`](../docs/ONEIROS_V4_1_1_NO_PROMPT_BLOAT_DEV_BRIEF.md) (`bash scripts/phase0-v411-diagnostics.sh`).

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
