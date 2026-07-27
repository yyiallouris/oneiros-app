# Subscriptions, entitlements, and quota-backed AI access

This document describes the subscription, entitlement, quota, and mobile paywall system now active in Oneiros.

## Plan model

- **Free**
  - Unlimited calendar / dream entry access.
  - 1 dream reflection every rolling 7 days.
  - That free reflection keeps its own 5 follow-up assistant replies.
- **Paid monthly (`paid_monthly`)**
  - Price target: **EUR 4.99 / month** through store subscriptions.
- **Paid yearly (`paid_yearly`)**
  - Price target: **EUR 47.88 / year** shown as **EUR 3.99 / month equivalent** with a simple **Save EUR 12 / year** badge.
- **Both paid plans**
  - 60 dream reflections per paid billing cycle.
  - 5 follow-up assistant replies per reflected dream.
  - 10 Recent Dream Field generations per paid billing cycle.
  - Period reflections are paid-only and cadence-gated rather than counted against the 60 or 10 quotas.
  - Same entitlements and quota rules; only the billing period differs.

## Mobile UX surfaces

- **Onboarding**
  - Plan selection now sits between interpretation depth and security.
  - Free and Premium cards are shown in a reusable horizontal carousel with Premium as the default visible card.
  - The dot/line pagination indicator sits above the cards.
  - The monthly / yearly switch is hidden whenever the free card is the active visible card.
  - User can continue with Free or start native purchase directly from the Premium card.
- **Subscription**
  - Permanent manage-subscription destination.
  - Shows the full plan comparison without usage statistics or quota counters on the screen itself.
  - Uses the same top-positioned dot/line pagination indicator as onboarding.
  - Uses one contextual bottom action only: `Manage` for active paid access, `Restore purchases` for free/lapsed, or helper copy when native IAP is unavailable.
- **Account**
  - Profile/settings surface with only a compact subscription summary row that deep-links into `Subscription`.
- **Write menu**
  - Includes a dedicated **Subscription & Billing** entry that routes into `Subscription`.
- **Premium taps**
  - Free-plan taps on Recent Dream Field, Period Reflection, premium regenerate, and premium follow-up surfaces open the reusable paywall in premium-only mode.
  - No fake urgency, hidden pricing, or “most popular” framing.
- **Native runtime requirement**
  - Restore / manage subscription actions require a development build or store build.
  - Expo Go / unsupported runtimes show explanatory helper copy instead of broken native IAP actions.

## Source of truth

- Store ownership is normalized in Supabase:
  - `billing_accounts`
  - `subscription_entitlements`
  - `subscription_transactions`
  - `billing_webhook_events`
  - `quota_buckets`
  - `quota_events`
  - `ai_generation_artifacts`
- Apple and Google are the active launch authorities.
- The backend is provider-agnostic at the interface level, but the concrete v1 adapters verify directly against:
  - Apple App Store Server API
  - Google Play Developer API + RTDN

## App-facing backend contract

### `subscription-status`

- Authenticated function.
- Returns:
  - `plan_code`
  - `entitlement_state`
  - `current_period_start`
  - `current_period_end`
  - stable purchase-linking identifiers:
    - `app_account_token`
    - `google_obfuscated_account_id`
  - feature quota summaries for dream reflections and Recent Dream Field.

### `billing-register-purchase`

- Authenticated function.
- Accepts:
  - Apple signed transaction info
  - Google purchase token payload
- Verifies with the store, binds the purchase to the user-linked store identifier, writes transaction history, and upserts the normalized entitlement snapshot immediately.

### `ai-entitlements-gateway`

- Authenticated function.
- Supported actions:
  - `dream_reflection_generate`
  - `dream_reflection_regenerate`
  - `dream_reflection_status` (status-only polling for async reflection jobs)
  - `dream_metadata_extract`
  - `dream_followup_reply`
  - `recent_dream_field_generate`
  - `period_reflection_generate`
- Every request must carry an idempotency key.
- The gateway owns:
  - quota reservation
  - quota commit / release
  - paid-access checks
  - cache reuse via `ai_generation_artifacts`
  - server-side calls into `openai-proxy` using the caller's user JWT + anon `apikey` (not the service-role bearer)
  - reflection-first persistence: dream reflections can start asynchronously, commit only after the reflection row is saved, and fill extraction metadata separately
  - safe AI cost observability for reflection, metadata, Recent Dream Field, and Period Reflection calls, using provider `usage` tokens plus the shared monthly pricing table in `src/billing/aiPricing.ts` (OpenAI + Anthropic) to log estimated USD totals without storing dream content, prompts, or model output

## Native store setup

- **Apple**
  - One subscription group.
  - Two auto-renewables:
    - `oneiros_premium_monthly`
    - `oneiros_premium_yearly`
- **Google**
  - One subscription product: `oneiros_premium`
  - Two base plans:
    - `monthly`
    - `yearly`

## Store webhook ingestion

### `billing-apple-notifications`

- Public webhook endpoint for App Store Server Notifications.
- Dedupes by notification id in `billing_webhook_events`.
- Re-fetches authoritative purchase state from Apple before updating entitlement rows.

### `billing-google-rtdn`

- Public webhook endpoint for Google Play RTDN push deliveries.
- Dedupes by Pub/Sub `messageId` in `billing_webhook_events`.
- Re-fetches authoritative subscription state from Google Play before updating entitlement rows.

## Quota rules

### Dream reflections

- Free users get 1 rolling-7-day bucket.
- Paid users get a 60-use billing-cycle bucket by default.
- Manual/test overrides may raise that cycle limit via `subscription_entitlements.raw.dream_reflection_limit` (see `billing_paid_dream_reflection_limit` and `scripts/sql/grant-test-user-200-dreams.sql`).
- A new initial reflection or a full regenerate/update consumes 1 dream-reflection slot.
- Follow-up assistant replies do **not** consume the paid dream-reflection bucket.
- Reflection quota is committed once the user-facing reflection is generated and persisted. Post-reflection metadata extraction failure does not release quota because the reflection was delivered.
- Reflection timeout/error before persistence releases the quota reservation.
- Cost logs are observability-only and do not affect quota: the gateway logs reflection cost when the reflection call completes, metadata cost when extraction completes, and a combined reflection+metadata estimated USD when both are available.

### Dream follow-up chat

- Each reflection stores:
  - `reflection_origin`
  - `chat_replies_used`
  - `chat_replies_limit`
  - origin quota / entitlement references
- Free-origin reflections keep their 5 replies even after the weekly free gate closes.
- Paid-origin reflections become read-only if paid access lapses.
- `billing_commit_quota` must treat follow-up `interpretation_id` as **text** (same as `interpretations.id`). Casting to `uuid` breaks `dream_followup_reply` with `Failed to commit quota` after the AI reply runs. Contract: `__tests__/flows/billingCommitQuota.interpretationIdText.contract.flow.test.ts`.

### Recent Dream Field

- Paid-only.
- 10 generations per paid billing cycle.
- Exact same dream-sequence scope + language reuses the cached artifact instead of spending quota again.

### Period reflection

- Paid-only.
- Minimum 2 reflected dreams in the requested scope.
- **Current month**
  - month-to-date only
  - max 1 generation per calendar week
  - require at least 1 new reflected dream since the last current-month generation
- **Finished months**
  - immutable once generated for that month scope
  - same-language reruns reuse the cached artifact

## Persistence notes

- Premium outputs remain readable after lapse through `ai_generation_artifacts`.
- Period reflections are mirrored to `pattern_reports` for compatibility with existing Insights storage.
- `user_settings.time_zone` is the persisted timezone used for calendar-based quota and current-month cadence logic. Fallback is `UTC`.

## Live cutover notes

- Gated mobile AI actions now call `ai-entitlements-gateway`:
  - `dream_reflection_generate`
  - `dream_reflection_regenerate`
  - `dream_followup_reply`
  - `recent_dream_field_generate`
  - `period_reflection_generate`
- Premium artifacts remain readable after lapse, but paid-origin chat and paid generation paths become read-only until renewal.
