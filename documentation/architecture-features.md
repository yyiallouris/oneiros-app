# Feature architecture

Use this as the quick impact map for feature work. Each row names entry points, core dependencies, and the docs/tests usually affected.

## Feature map

| Feature | Entry points | Core dependencies | Update when changed |
|---------|--------------|-------------------|---------------------|
| App entry and loading | `App.tsx`, `LoadingScreen`, `WebContentShell` | Expo splash, droplet brand assets, paper background, design export flags, safe area, web content column | flows 00/01, theme docs for visual/web layout changes |
| Auth and recovery | `AuthScreen`, `SetPasswordScreen`, `authDeepLink.ts`, `authOAuth.ts` | Supabase Auth (email + Apple/Google/Discord; PKCE for browser OAuth), deep links, `PENDING_PASSWORD_RESET_KEY` | flows 01/02, `AUTH_SETUP.md`, auth flow tests |
| Legal consent | `LegalConsentScreen`, `legalConsentService.ts` | `LEGAL_CONSENT_VERSION`, per-user AsyncStorage | flows 03/08, legal consent flow test |
| Onboarding | `OnboardingNavigator`, onboarding screens (name, depth, language, subscription, secure) | user settings, pattern insight language, biometric service, onboarding service | flows 03, onboarding flow tests |
| Biometric lock | `BiometricLockScreen`, `biometricAuthService.ts`, `RootNavigator` | Expo LocalAuthentication, AsyncStorage, remote user settings | flows 01/03, iOS/Android behavior notes |
| Write dream | `WriteScreen`, `VoiceRecordButton` | `expo-audio` native error events, 50 MiB + verified-directory capture preflight, generation-fenced async start, backup-excluded `voice_pending/`, size/available-MD5-validated legacy Android migration + legacy iOS exclusion, move-first/partial-salvage finalization, canonical newest snapshots + strict attribution evidence, integrity-aware owner cleanup fence, checksummed queue, owner-bound serialized/revisioned composer delivery with explicit clip-ID/revision acknowledgement and stale-save/hydration guards, visible-before-cleanup handoff, deletion tombstones, lease-aware bounded retry, language-neutral `gpt-transcribe`, hallucination quality gate, strict/rate-limited/fenced Supabase idempotency ledger, `StorageService`, shared `floatingTabBar` Save-dock clearance | flows 04/05/09, transcription reliability doc, voice queue/UI/function/native-backup tests, write save-dock contract, migration + function deploy, iOS/Android microphone/interruption/low-storage/backup checks |
| Journal and filters | `JournalScreen`, `JournalFilterScreen` | local dreams/interpretations, search, Insights filter params | flows 04/07, filter/key tests |
| Dream detail and editor | `DreamDetailScreen`, `DreamEditorScreen` | storage helpers, interpretation services, metadata display, delete/save | flows 04/06, display/offline tests |
| Calendar | `CalendarScreen`, `CircularCalendar` | local dreams by date, editor route params | flows 04, route/flow tests if behavior changes |
| AI interpretation and chat | `DreamDetailScreen`, `InterpretationChatScreen`, `dreamReflectionPrompt.ts`, `reflectiveQuestionExtract.ts`, `reflectiveContractObservation.ts`, `reflectiveEssayPrompt.ts`, `reflectiveLanguage.ts`, `ai.ts` | Same-call Reader writes reading + questions (Quick 1, Standard/Advanced 2). Follow-up chat continues the conversation (open 1 question, closing 0); committed idempotency replay reconstructs the persisted turn without another model/quota call. Approved runtime bundle `oneiros-reflective-questions-runtime-v1.0.3+structure-v1.0.0` uses the frozen enacted-relation Q1 prompt (`f5399a49…`) plus one pure/versioned missing-heading insertion when exactly two terminal question bullets make the structure unambiguous; all other inputs are byte-identical no-ops. Completed outputs then receive fail-open, non-blocking, no-retry shadow validation telemetry. Production Q2 is unchanged; Q2-only v1.0.4 (`a4f972c…`) and final source-ownership v1.0.5 (`16da1d13…`) are offline HOLD/denied, and Q2 prompt R&D is stopped. Composer/Gate/Repair remain closed R&D. | flow 06 (same-call questions, deterministic structure normalization, follow-up chat, metadata resilience, locked streaming, fail-closed rollout), flows 10 (quota/idempotency), architecture interpretation, extract/prompt/shadow/replay contract tests |
| Insights overview | `InsightsScreen`, `insightsService.ts` | local dreams, interpretations, grouping cache, period math | flow 07, insights/key/grouping tests |
| Pattern reports | `InsightsSectionScreen`, `patternInsightsService.ts`, `reflectiveEssayPrompt.ts`, `reflectiveEssayContext.ts`, `remoteStorage.ts` | AI pattern generation, accepted metadata-first context v1, research-only narrative context v2, report keys, languages, remote/local report storage | flow 07, essay context/prompt tests, pattern tests, Supabase notes if persistence changes |
| Subscription and quotas | `supabase/functions/subscription-status`, `billing-register-purchase`, `billing-apple-notifications`, `billing-google-rtdn`, `ai-entitlements-gateway` | store verification, entitlement normalization, SQL quota RPCs, billing artifacts, account deletion | flow 10, billing/quota tests, Supabase deploy notes |
| Account settings | `AccountScreen`, `userSettingsService.ts`, `patternInsightLanguageService.ts` | display name, depth, Insights language, mythic resonance, biometrics, deletion | flows 03/08, user settings/storage tests |
| Contact and support | `ContactScreen`, `LoginSupportScreen`, `FormFeedback`, `site/support`, `api/support.js`, `supportRequest.ts`, `support-request` | Shared Resend Edge Function, same-origin Vercel web proxy, non-blocking service-role `contact_messages` archive for authenticated requests, privacy-safe request/stage logs, inline cross-platform status, server-owned support destination, real mailbox/root MX | flow 08, support-request README, deploy notes |
| Privacy/legal notice | `PrivacyScreen`, `constants/legal.ts` | product legal copy and support routes | flow 08, setup/legal docs if public behavior changes |
| Offline sync | `StorageService`, `SyncService`, `LocalStorage`, `network.ts` | AsyncStorage queues, Supabase CRUD, dev offline toggle | flow 05, `ARCHITECTURE.md`, sync/storage/network tests |
| Design export | `src/designExport/*`, export foreground wrappers | web capture flags, route selection, fixed phone frame | design-export docs/scripts if added, visual QA |

## Cross-feature rules

- New route: update `src/navigation/types.ts`, `RootNavigator` or tab navigator, flow docs, and tests for route params or gating.
- New persisted field: update type definitions, local storage defaulting, remote mapping, sync merge, migrations, docs, and tests.
- New AI task: update `ai.ts`, `openai-proxy` routing docs/config, failure/offline behavior, and AI tests.
- New screen state that can fail offline: use existing offline message patterns and update flow 05 plus the feature flow.
- New visual pattern: reuse shared UI/theme first, prefer `PaperBackground` over legacy waves, and update theme docs when tokens or rules change.

## Platform considerations

- iOS and Android can differ for safe areas, keyboard behavior, biometrics, voice permissions, deep links, and network reachability.
- Any mobile UI, native permission, auth redirect, biometrics, voice, storage, or networking change must consider both platforms before closing.
- Expo web uses a centered phone-scale `WebContentShell` (`src/components/ui/WebContentShell.tsx`, tokens in `src/theme/layout.ts`) so the same mobile UI stays readable on tablet/desktop browsers. Prefer `useContentWidth()` for width-bound UI. Design-export capture mode keeps its fixed phone frame and bypasses the shell. Tab-screen CTAs use `floatingTabBar` / `resolveFloatingTabBarContentInset` so they stay above the overlay nav on short web and native viewports.
- Detox exists today for Android auth smoke. Add iOS config/tests when a cross-platform visible flow cannot be covered well by Jest.

## Deployment considerations

- Docs-only or local UI-only changes need no Supabase push.
- Supabase schema/RLS/storage changes require a migration and `supabase db push`.
- Edge Function changes require `supabase functions deploy <function-name>`.
- AI model routing changes in `openai-proxy` require `supabase functions deploy openai-proxy`.
