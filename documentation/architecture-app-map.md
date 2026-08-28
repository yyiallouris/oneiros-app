# App architecture map

This is the practical map for agents changing Oneiros. Use it to find the right subsystem, docs, tests, and deploy notes before editing.

## Runtime layers

| Layer | Main files | Responsibility |
|------|------------|----------------|
| App shell | `App.tsx`, `src/components/ui/LoadingScreen.tsx`, `src/components/ui/WebContentShell.tsx` | Font loading, native splash handoff, in-app brand loading state, Expo web centered content column |
| Navigation gate | `src/navigation/RootNavigator.tsx` | Session, password reset, biometric lock, legal consent, onboarding, tabs, authenticated stack |
| Tabs and screens | `src/navigation/MainTabsNavigator.tsx`, `src/screens/*` | Product UI and user journeys |
| Shared UI/theme | `src/components/ui/*`, `src/theme/*`, `src/layout/WebLayoutContext.tsx` | Paper-first visual system, typography, spacing, web content-width tokens, reusable surfaces |
| Local data | `src/services/localStorage.ts` | AsyncStorage-only persistence and queues |
| Orchestration | `src/services/storageService.ts`, `src/services/syncService.ts`, `src/services/userService.ts` | Offline-first reads/writes, user isolation, sync, merge |
| Remote data | `src/services/remoteStorage.ts`, `src/services/supabaseClient.ts` | Supabase tables, RLS-backed CRUD, user settings, pattern reports, and the new billing / quota domain |
| AI | `src/ai/dreamReflectionPrompt.ts`, `src/ai/reflectiveQuestionExtract.ts`, `src/ai/reflectiveEssayPrompt.ts`, `src/ai/reflectiveLanguage.ts`, `src/services/ai.ts`, `src/services/dreamMetadataPrefetchService.ts` | Same-call Reader `oneiros-dream-reflection-v3.2.0` writes reading + questions; follow-up chat `oneiros-followup-chat-v2.0.0`; deterministic question extraction; 12-language continuity; extraction, grouping, pattern essays |
| Edge Functions | `supabase/functions/*` | OpenAI proxy, account deletion, support, contact email, bounded/authenticated transcription, billing verification, store webhooks, subscription status, and AI entitlement gating |

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
- `Interpretation`: AI messages (assistant messages may own a typed Reflective Questions artifact that is restored into the next dialogue turn) plus symbols, archetypes, landscapes, affects, motifs, relational dynamics, thresholds, central conflicts, core mode, amplifications, symbol stances, and `display_distillation`.
- `PatternReportEntry` / recent sequence reflection: Insights reports and caches.
- Reflective essay input ownership: `src/ai/reflectiveEssayContext.ts` builds accepted metadata-heavy production context version `1`; its narrative-first version `2` builder remains research-only. `src/ai/reflectiveEssayPrompt.ts` owns the frozen `2.0.3-phase1` prompt, sections, temperatures, and retry policy. Client and gateway select the metadata-first builder; `src/ai/reflectiveEssayFieldMapSpike.ts` is used only by the rejected offline architecture harness.
- User settings: interpretation depth, Insights report language, mythic resonance, biometric preference, and persisted timezone for calendar-based backend quota logic. Insights report language is currently device-local via `patternInsightLanguageService`.
- Billing domain: `billing_accounts`, `subscription_entitlements`, `subscription_transactions`, `billing_webhook_events`, `quota_buckets`, `quota_events`, and `ai_generation_artifacts`.

Local storage is the first write target. Remote Supabase is best-effort/background unless a feature explicitly needs online access.

## Design system

- Colors: `src/theme/colors.ts`; docs: `src/theme/COLORS.md`.
- Typography: `src/theme/typography.ts`; docs: `src/theme/TYPOGRAPHY.md`.
- Shared surfaces: `Button`, `Card`, `Chip`, `MysticHeader`, `PaperBackground`, `WebContentShell`, `BreathingLine`, `LinoSkeletonCard`, `SymbolInfoModal`.
- Web layout tokens: `src/theme/layout.ts` + `useContentWidth()` for shell-aware widths.
- Legacy visuals: `LegacyWaveBackground` and `LegacyMountainWaveBackground` remain in the repo for fallback/reference only and should not be used for active screens.
- Visual direction: textured warm paper base, Deep Ink text, Night/Ritual Plum actions, and a floating parchment bottom nav. Avoid hardcoded colors in components unless truly local.
- UI changes must consider both iPhone/iOS and Android safe areas, keyboard behavior, native permissions, and the absolute bottom tab bar.

## Supabase and deployment map

- Tables touched by app code now include `dreams`, `interpretations`, `pattern_reports`, `user_settings`, `contact_messages`, and the backend-owned billing / quota tables.
- Schema changes require a migration under `supabase/migrations/`, README updates, and a final `supabase db push` note.
- Edge Function behavior changes require the relevant `supabase/functions/<name>/README.md` update and a final deploy command note.
- AI provider/model routing lives in `supabase/functions/openai-proxy/task-config.ts`; after changing it, deploy `openai-proxy`.

## Change impact guide

- Auth/session changes: update flows 01/02/03, auth/deep-link tests, and iOS/Android deep-link considerations.
- Dream write/journal/calendar changes: update flow 04, storage/sync tests if persistence changes, and offline behavior notes.
- Sync/storage changes: update flow 05, `ARCHITECTURE.md`, storage/sync flow tests, and Supabase notes when remote shape changes.
- AI interpretation changes: update flow 06, `docs/SYMBOLS_FLOW.md`, [architecture-interpretation.md](./architecture-interpretation.md), AI tests, and schema/function docs if persistence or routing changes.
- Insights changes: update flow 07, feature architecture docs, period/key/pattern tests, and report storage docs.
- Subscription / quota backend changes: update flow 10, account deletion behavior, billing function READMEs, quota tests, and deployment notes for Apple / Google store integration.
- Support/legal/account changes: update flow 08, setup docs or function READMEs when backend behavior changes.
- Shared UI/theme changes: update `src/theme/COLORS.md` or `src/theme/TYPOGRAPHY.md`; run relevant UI tests or note why E2E was skipped.
- Voice transcription changes: update flows 04/05/06/09, [`docs/TRANSCRIPTION_RELIABILITY.md`](../docs/TRANSCRIPTION_RELIABILITY.md), the `whisper-transcription` README, voice unit/flow coverage, and iOS/Android physical-device checks. Capture uses `expo-audio` with a 50 MiB free-space preflight, verified pending-directory creation, generation-fenced async start, and a native error listener. Finalized audio moves into backup-excluded `Documents/voice_pending/`, enters a dual-manifest inbox, then a checksummed/revisioned queue. The newest intact snapshot is canonical; older copies are deletion evidence only. Strict owner cleanup rejects corrupt/partial/conflicting attribution and unverifiable audio/sidecar deletion while retaining the fence. Completed delivery is `peek → owner-bound serialized/revisioned composer commit → immediate visible apply → explicit clip-ID/revision integration acknowledgement`, followed independently by queue/audio cleanup. Hydration is edit-revision guarded; cleanup failure leaves a durable `deletion_pending` tombstone without hiding committed text. Logout/account switch invalidates queued composer commands and drains writes already inside storage before clearing owner data. Readable clips still return to live UI salvage if both manifest writes fail. Audio paths/content must never be logged.
- Durable voice idempotency uses strict client keys, `voice_transcription_requests`, the rolling `voice_transcription_attempts` ledger, and service-role-only `reserve_voice_transcription` with per-user advisory locking plus fenced `lease_id`. Completion conflicts return lease-expiry-aware `Retry-After` and schedule durable retries. Upload auth, logout cleanup, active aborts, composer state, and circuit state are owner-scoped; model output passes the shared hallucination/quality commit gate before caching and again before UI delivery. Schema changes require `supabase db push`; function changes require `supabase functions deploy whisper-transcription`.
