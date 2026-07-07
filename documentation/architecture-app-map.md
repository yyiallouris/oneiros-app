# App architecture map

This is the practical map for agents changing Oneiros. Use it to find the right subsystem, docs, tests, and deploy notes before editing.

## Runtime layers

| Layer | Main files | Responsibility |
|------|------------|----------------|
| App shell | `App.tsx`, `src/components/ui/LoadingScreen.tsx` | Font loading, native splash handoff, in-app brand loading state |
| Navigation gate | `src/navigation/RootNavigator.tsx` | Session, password reset, biometric lock, legal consent, onboarding, tabs, authenticated stack |
| Tabs and screens | `src/navigation/MainTabsNavigator.tsx`, `src/screens/*` | Product UI and user journeys |
| Shared UI/theme | `src/components/ui/*`, `src/theme/*` | Paper-first visual system, typography, spacing, reusable surfaces |
| Local data | `src/services/localStorage.ts` | AsyncStorage-only persistence and queues |
| Orchestration | `src/services/storageService.ts`, `src/services/syncService.ts`, `src/services/userService.ts` | Offline-first reads/writes, user isolation, sync, merge |
| Remote data | `src/services/remoteStorage.ts`, `src/services/supabaseClient.ts` | Supabase tables, RLS-backed CRUD, user settings, pattern reports |
| AI | `src/services/ai.ts`, `src/services/dreamMetadataPrefetchService.ts` | Reflection, chat, extraction, grouping, pattern essays |
| Edge Functions | `supabase/functions/*` | OpenAI proxy, account deletion, support, contact email, transcription |

## Navigation contract

`RootNavigator` owns route eligibility. Do not bypass it from screens.

- Signed out: `Auth`, `LoginSupport`.
- Authenticated but resetting password: `SetPassword`.
- Authenticated and locked: `BiometricLock`, `LoginSupport`.
- Authenticated but missing legal consent: `LegalConsent`.
- Authenticated but not onboarded: `Onboarding`.
- Ready app: `MainTabs` plus stack screens for editor, detail, account, contact, privacy, calendar, insights sections, pattern explorer, journey, and journal filters.

Route params live in `src/navigation/types.ts`. Update this file, flow docs, and tests together when adding or changing route params.

## Data model and persistence

- `Dream`: saved locally and remotely; app UI treats dream content as sensitive.
- `Interpretation`: AI messages plus symbols, archetypes, landscapes, affects, motifs, relational dynamics, thresholds, central conflicts, core mode, amplifications, symbol stances, and `display_distillation`.
- `PatternReportEntry` / recent sequence reflection: Insights reports and caches.
- User settings: interpretation depth, mythic resonance, biometric preference.

Local storage is the first write target. Remote Supabase is best-effort/background unless a feature explicitly needs online access.

## Design system

- Colors: `src/theme/colors.ts`; docs: `src/theme/COLORS.md`.
- Typography: `src/theme/typography.ts`; docs: `src/theme/TYPOGRAPHY.md`.
- Shared surfaces: `Button`, `Card`, `Chip`, `MysticHeader`, `PaperBackground`, `BreathingLine`, `LinoSkeletonCard`, `SymbolInfoModal`.
- Legacy visuals: `LegacyWaveBackground` and `LegacyMountainWaveBackground` remain in the repo for fallback/reference only and should not be used for active screens.
- Visual direction: textured warm paper base, Deep Ink text, Night/Ritual Plum actions, and a floating parchment bottom nav. Avoid hardcoded colors in components unless truly local.
- UI changes must consider both iPhone/iOS and Android safe areas, keyboard behavior, native permissions, and the absolute bottom tab bar.

## Supabase and deployment map

- Tables touched by app code include `dreams`, `interpretations`, `pattern_reports`, `user_settings`, and `contact_messages`.
- Schema changes require a migration under `supabase/migrations/`, README updates, and a final `supabase db push` note.
- Edge Function behavior changes require the relevant `supabase/functions/<name>/README.md` update and a final deploy command note.
- AI provider/model routing lives in `supabase/functions/openai-proxy/task-config.ts`; after changing it, deploy `openai-proxy`.

## Change impact guide

- Auth/session changes: update flows 01/02/03, auth/deep-link tests, and iOS/Android deep-link considerations.
- Dream write/journal/calendar changes: update flow 04, storage/sync tests if persistence changes, and offline behavior notes.
- Sync/storage changes: update flow 05, `ARCHITECTURE.md`, storage/sync flow tests, and Supabase notes when remote shape changes.
- AI interpretation changes: update flow 06, `docs/SYMBOLS_FLOW.md`, [architecture-interpretation.md](./architecture-interpretation.md), AI tests, and schema/function docs if persistence or routing changes.
- Insights changes: update flow 07, feature architecture docs, period/key/pattern tests, and report storage docs.
- Support/legal/account changes: update flow 08, setup docs or function READMEs when backend behavior changes.
- Shared UI/theme changes: update `src/theme/COLORS.md` or `src/theme/TYPOGRAPHY.md`; run relevant UI tests or note why E2E was skipped.
