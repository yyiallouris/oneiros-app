# Feature architecture

Use this as the quick impact map for feature work. Each row names entry points, core dependencies, and the docs/tests usually affected.

## Feature map

| Feature | Entry points | Core dependencies | Update when changed |
|---------|--------------|-------------------|---------------------|
| App entry and loading | `App.tsx`, `LoadingScreen` | Expo splash, fonts, design export flags, safe area | flows 00/01, theme docs for visual changes |
| Auth and recovery | `AuthScreen`, `SetPasswordScreen`, `authDeepLink.ts` | Supabase Auth, deep links, `PENDING_PASSWORD_RESET_KEY` | flows 01/02, `AUTH_SETUP.md`, `authDeepLink.flow.test.ts` |
| Legal consent | `LegalConsentScreen`, `legalConsentService.ts` | `LEGAL_CONSENT_VERSION`, per-user AsyncStorage | flows 03/08, legal consent flow test |
| Onboarding | `OnboardingNavigator`, onboarding screens | user settings, biometric service, onboarding service | flows 03, onboarding flow test |
| Biometric lock | `BiometricLockScreen`, `biometricAuthService.ts`, `RootNavigator` | Expo LocalAuthentication, AsyncStorage, remote user settings | flows 01/03, iOS/Android behavior notes |
| Write dream | `WriteScreen`, `VoiceRecordButton` | drafts, voice recording/transcription, `StorageService`, Supabase session | flows 04/05, storage tests, voice tests |
| Journal and filters | `JournalScreen`, `JournalFilterScreen` | local dreams/interpretations, search, Insights filter params | flows 04/07, filter/key tests |
| Dream detail and editor | `DreamDetailScreen`, `DreamEditorScreen` | storage helpers, interpretation services, metadata display, delete/save | flows 04/06, display/offline tests |
| Calendar | `CalendarScreen`, `CircularCalendar` | local dreams by date, editor route params | flows 04, route/flow tests if behavior changes |
| AI interpretation and chat | `DreamDetailScreen`, `InterpretationChatScreen`, `ai.ts` | OpenAI/proxy, extraction, metadata cache, interpretation sync | flow 06, architecture interpretation, AI/display tests |
| Insights overview | `InsightsScreen`, `insightsService.ts` | local dreams, interpretations, grouping cache, period math | flow 07, insights/key/grouping tests |
| Pattern reports | `InsightsSectionScreen`, `patternInsightsService.ts`, `remoteStorage.ts` | AI pattern generation, report keys, languages, remote/local report storage | flow 07, pattern tests, Supabase notes if persistence changes |
| Account settings | `AccountScreen`, `userSettingsService.ts` | display name, depth, mythic resonance, biometrics, deletion | flows 03/08, user settings/storage tests |
| Contact and support | `ContactScreen`, `LoginSupportScreen`, support/contact services | Supabase functions/tables, Postmark/Resend configuration | flow 08, function READMEs, deploy notes |
| Privacy/legal notice | `PrivacyScreen`, `constants/legal.ts` | product legal copy and support routes | flow 08, setup/legal docs if public behavior changes |
| Offline sync | `StorageService`, `SyncService`, `LocalStorage`, `network.ts` | AsyncStorage queues, Supabase CRUD, dev offline toggle | flow 05, `ARCHITECTURE.md`, sync/storage/network tests |
| Design export | `src/designExport/*`, export foreground wrappers | web capture flags, route selection, fixed phone frame | design-export docs/scripts if added, visual QA |

## Cross-feature rules

- New route: update `src/navigation/types.ts`, `RootNavigator` or tab navigator, flow docs, and tests for route params or gating.
- New persisted field: update type definitions, local storage defaulting, remote mapping, sync merge, migrations, docs, and tests.
- New AI task: update `ai.ts`, `openai-proxy` routing docs/config, failure/offline behavior, and AI tests.
- New screen state that can fail offline: use existing offline message patterns and update flow 05 plus the feature flow.
- New visual pattern: reuse shared UI/theme first and update theme docs when tokens or rules change.

## Platform considerations

- iOS and Android can differ for safe areas, keyboard behavior, biometrics, voice permissions, deep links, and network reachability.
- Any mobile UI, native permission, auth redirect, biometrics, voice, storage, or networking change must consider both platforms before closing.
- Detox exists today for Android auth smoke. Add iOS config/tests when a cross-platform visible flow cannot be covered well by Jest.

## Deployment considerations

- Docs-only or local UI-only changes need no Supabase push.
- Supabase schema/RLS/storage changes require a migration and `supabase db push`.
- Edge Function changes require `supabase functions deploy <function-name>`.
- AI model routing changes in `openai-proxy` require `supabase functions deploy openai-proxy`.
