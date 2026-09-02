# Complete app journey

This is the end-to-end Oneiros path for agents who need the whole product shape before changing a single feature. For deeper details, follow the linked flow docs.

**V1 design lock:** the complete journey described here is the final approved
Oneiros v1 visual and UX baseline, versioned as `oneiros-design-v1.0.1` on
2026-09-02. See [oneiros-v1-design-release.md](./oneiros-v1-design-release.md)
for the immutable source fingerprint, platform boundary and change policy.

## 1. Launch and route gate

1. `App.tsx` loads brand fonts, hides the native splash, then shows `LoadingScreen` inside `WebContentShell` (Expo web centers a phone-scale column; native is unchanged).
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

- `AuthScreen` handles email login, email signup with OTP or magic link confirmation, forgot-password link requests, and social continue-with icons (Google, Apple on iOS, Discord).
- `AuthScreen` keeps only a short privacy/boundaries note with a path into `PrivacyScreen`, rather than front-loading full agreement language there.
- Recovery links set `PENDING_PASSWORD_RESET_KEY`; `SetPasswordScreen` clears it after `supabase.auth.updateUser`.
- `LegalConsentScreen` must be accepted per user and consent version before entering onboarding or tabs, but now opens with a calm plain-language summary before the explicit confirmations.
- `OnboardingNavigator` runs name, interpretation depth, Insights language, subscription choice, and optional biometric lock setup.
- `SubscriptionScreen` later becomes the permanent manage-subscription destination for restore, renewal, pricing, and quota state.
- `AccountScreen` later lets the user update display name, interpretation depth, Insights language, mythic resonance, biometric app lock, privacy routes, and account deletion, while keeping only a compact link into Subscription.

Related docs: [flows-02-authentication.md](./flows-02-authentication.md), [flows-03-onboarding-account-security.md](./flows-03-onboarding-account-security.md), [flows-08-support-legal-contact.md](./flows-08-support-legal-contact.md).

## 3. Main tabs and primary work

Main app tabs are `Write`, `Journal`, and `Insights`.

- Bottom navigation renders as a fully opaque warm parchment shelf (`#FFFDF9`) over the paper background. Its three marks form one expressive hand-ink family: Write preserves the authored open dry-brush feather, cropped into a compact `30 × 28dp` frame with a restrained low-opacity pressure copy so its visible ink stays in the same vertical band as the other tabs; Journal keeps the open-page drawing with stronger unequal outer pressure, a wandering spine, and faint edge echoes; Insights uses a dedicated crop of the authored brush eye as a seeing mark. The eye crop removes the two detached dots that became badge-like at navigation size while preserving the uneven lids and dense off-centre pupil. Images inside Insights uses a separate half-lidded imaginal eye with a vertical organic presence and one witness dot, so it remains related to the navigation mark without duplicating its fully open, round-pupil silhouette. Focus uses Night Plum (`#4B3158`) at `0.98`; inactive marks use Muted Tab Ink at `0.58`, while label weight and the existing one-pixel lift reinforce state. No tab gains a pill, badge, moon, star, glow, or separate selection dot. Tab screens share `floatingTabBar` tokens so primary CTAs (Write **Save dream**) sit in the layout above the shelf instead of slipping underneath it.

- `WriteScreen`: user records today’s dream, auto-saves a draft, optionally captures up to five minutes of voice offline-first after a device-storage preflight, and receives a quality-gated transcript through a backup-excluded, move-first/partial-salvage durable inbox + owner-scoped bounded retry queue. Delivery commits a per-user composer snapshot with clip-ID dedupe before queue/audio acknowledgement, so process death cannot lose or double-append the result; suspicious caption boilerplate or repetition is never appended as speech.
- `DreamDetailScreen`: shows the dream, streamed reflection, `display_distillation`, and same-call reflective questions inside the reading (Quick: 1 terminal question; Standard/Advanced: 2 under exact English `Reflective Questions`). A versioned completed-output normalizer may insert only that missing heading when two terminal question bullets are structurally unambiguous; otherwise it is a byte-identical no-op. It never changes partial streaming or generated prose/questions. Exact English `Continue the conversation` remains available in every content language. Follow-up chat `oneiros-followup-chat-v2.0.1` continues the conversation with one trailing question on open turns and none when closing. Initial/chat language is resolved from the 12-language conversation contract before generation; generated prose/questions follow that language, while v1 navigation, structural headings, shared buttons, and metadata titles remain English. Post-completion marker/language/cardinality/no-answer-menu validation is fail-open shadow telemetry only. Neither a failed contract nor an observer exception blocks or retries the visible response.
- `JournalScreen`: archive/search/filter view of dreams. Filters can come from Insights via `JournalFilterScreen`.
- `CalendarScreen`: day-level dream map; opens existing dreams or creates a dated dream through `DreamEditorScreen`.
- `InsightsScreen`: current-month overview, recent dream-field reflection, grouped insight categories, the Period Reflection card, locked premium cards, and entry to category detail screens.
- Subscription enforcement is now live for reflection, follow-up chat, Recent Dream Field, and period reflections through Supabase Edge Functions and SQL quota ledgers.

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
- AI reflection changes affect DreamDetail, `InterpretationChatScreen`, metadata extraction, Insights, remote schema, AI proxy config, and offline messaging. Metadata extract edits must keep the resilience lock in flows-06 (soft defaults + deploy both `openai-proxy` and `ai-entitlements-gateway`) so `structured_schema_invalid` does not recur.
- Insights changes affect period math, filter routes, pattern reports, local caches, remote reports, and flow tests.
- Subscription / billing changes affect store purchase binding, quota ledgers, live onboarding/account/paywall UX, period-reflection archival, account deletion, and store-management flows.
- UI theme changes affect `src/theme/COLORS.md`, `src/theme/TYPOGRAPHY.md`, shared UI components, design exports, iPhone/iOS and Android visual behavior.

Across the complete journey, the visual grammar is semantic rather than decorative: serif belongs to dream titles, short inward voice, and emotionally important silence; sans belongs to navigation, controls, metadata, settings, and system information. Shared paper cards use one faint contour and restrained depth, while Insights section empty states keep their authored black-ink marks at the quiet shared optical frame. These rules apply to the whole app, not only the three main tabs.

Use [flows-09-regression-edge-cases.md](./flows-09-regression-edge-cases.md) as the checklist before closing behavior work.
