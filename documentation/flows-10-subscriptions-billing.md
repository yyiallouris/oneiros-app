# Subscriptions, entitlements, and quota-backed AI access

This document describes the subscription, entitlement, quota, and mobile paywall system now active in Oneiros.

## Plan model

- **Free**
  - Unlimited calendar / dream entry access.
  - 1 dream reflection every rolling 7 days.
  - That free reflection keeps its own 5 follow-up assistant replies.
- **Premium monthly (`paid_monthly`)**
  - Base EUR price target: **EUR 4.99 / month**; the customer-facing amount comes from the active App Store / Play storefront.
- **Premium yearly (`paid_yearly`)**
  - Base EUR target: **EUR 47.88 / year** (EUR 3.99 monthly equivalent).
  - Yearly cards make the exact localized annual store price the primary amount. Monthly equivalent and savings are subordinate and are calculated only from the matching monthly/yearly numeric store prices in the same currency.
- **Deeper monthly (`deeper_monthly`)**
  - Base EUR price target: **EUR 8.99 / month**; the customer-facing amount comes from the active storefront.
- **Deeper yearly (`deeper_yearly`)**
  - Base EUR target: **EUR 77.88 / year** (EUR 6.49 monthly equivalent).
  - Uses the same store-localized annual-total treatment as Premium.
- **Premium**
  - 35 dream reflections per paid billing cycle.
  - 5 follow-up assistant replies per reflected dream.
  - 10 Recent Dream Field generations per paid billing cycle.
  - 1 essay per calendar month.
  - 7-day free trial when store eligibility allows it.
- **Deeper**
  - 80 dream reflections per paid billing cycle.
  - 5 follow-up assistant replies per reflected dream.
  - Unlimited Recent Dream Field generations.
  - 1 essay per calendar week.
  - 7-day free trial when store eligibility allows it.
- **Paid grace bundle**
  - The first paid-quota exhaustion grants a one-time lifetime bundle of `+5` dream reflections and `+5` Recent Dream Field reports.
  - The bundle is tracked server-side in `billing_bonus_grants`, surfaced as `bonus_grant` metadata by the gateway, and never granted to free weekly reflections.

## Mobile UX surfaces

- **Onboarding**
  - Plan selection now sits between interpretation depth and security.
  - Free, Premium, and Deeper cards are shown in a reusable horizontal carousel with Premium as the default visible card.
  - Yearly Premium/Deeper cards show the exact localized annual amount most prominently, followed by the calculated monthly equivalent and yearly savings when both matching store products provide compatible numeric prices.
  - The dot/line pagination indicator sits above the cards.
  - The monthly / yearly switch is hidden whenever the free card is the active visible card.
  - The Yearly switch badge shows the current storefront savings for the visible paid card, including when Monthly is selected; it stays hidden when a safe calculation is unavailable.
  - User can continue with Free or start native purchase directly from the Premium or Deeper card.
- **Subscription**
  - Permanent manage-subscription destination.
  - Shows the full plan comparison without usage statistics or quota counters on the screen itself.
  - The introduction and carousel now sit directly on the page instead of inside an extra wrapper card, so only the actual plan cards read as cards.
  - Uses the same top-positioned dot/line pagination indicator as onboarding.
  - Uses one contextual bottom action only: `Manage` for active paid access, `Restore purchases` for free/lapsed, or helper copy when native IAP is unavailable.
- **Account**
  - Profile/settings surface with only a compact subscription summary row that deep-links into `Subscription`.
- **Write menu**
  - Includes a dedicated **Subscription & Billing** entry that routes into `Subscription`.
- **Premium taps**
  - Free-plan taps on Recent Dream Field, Essays, regenerate, and paid follow-up surfaces open the reusable paywall in premium-only mode.
  - Premium is visually recommended; Deeper feels more advanced rather than more promotional.
  - No fake urgency, hidden pricing, or “most popular” framing.
  - The upsell sheet remains fully scrollable to its last card/action above the device bottom inset.
- **Native runtime requirement**
  - Restore / manage subscription actions require a development build or store build.
  - Expo Go / unsupported runtimes show explanatory helper copy instead of broken native IAP actions.

## Storefront pricing contract

- iOS pricing follows the App Store storefront attached to the customer's Apple Account; Android follows the active Play storefront. The app does not infer billing currency from GPS, SIM, IP address, device region, or UI language.
- Paid cards are populated from a fresh native product lookup at store connection and whenever the app returns to the foreground, so an in-session storefront change cannot keep an earlier currency on screen.
- Store-provided `displayPrice` is the source of truth for the amount charged. Numeric `price` + ISO currency are used only for optional monthly-equivalent and savings arithmetic; localized display strings are never parsed.
- Product loading is fail-closed. Missing, partial, malformed, mismatched-currency, offline, or unsupported-runtime responses never fall back to a hardcoded purchasable EUR price.
- A paid CTA is enabled only for the exact product returned by the current store. Missing SKUs show a checking/unavailable state; other successfully returned plans remain usable.
- For annual plans, the exact annual billing total is the primary price. Equivalent monthly cost and savings are subordinate and disappear safely if either paired price is missing, non-numeric, non-positive, or in another currency.
- Google trial offers display the recurring renewal phase rather than a zero-cost introductory phase as the plan price.
- Free-trial copy is shown only when the current store payload contains a free introductory phase; its duration comes from that offer metadata and remains qualified with eligibility. The native store sheet is authoritative for the offer and final charge.

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
  - `plan_tier`
  - `entitlement_state`
  - `current_period_start`
  - `current_period_end`
  - `essay_cadence`
  - `bonus_grace_bundle_used`
  - `bonus_grace_bundle_granted_at`
  - stable purchase-linking identifiers:
    - `app_account_token`
    - `google_obfuscated_account_id`
  - feature quota summaries for dream reflections, Recent Dream Field, and essays.

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
  - Four auto-renewables:
    - `oneiros_premium_monthly`
    - `oneiros_premium_yearly`
    - `oneiros_deeper_monthly`
    - `oneiros_deeper_yearly`
- **Google**
  - Two subscription products:
    - `oneiros_premium`
    - `oneiros_deeper`
  - Shared base plans:
    - `monthly`
    - `yearly`
  - Both paid tiers must expose a 7-day free trial offer in store configuration.

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
- Premium users get a 35-use billing-cycle bucket by default.
- Deeper users get an 80-use billing-cycle bucket by default.
- Manual/test overrides may raise that cycle limit via `subscription_entitlements.raw.dream_reflection_limit`; use `scripts/sql/grant-test-user-200-dreams.sql` for the documented test grant.
- A new initial reflection or a full regenerate/update consumes 1 dream-reflection slot.
- Follow-up assistant replies do **not** consume the paid dream-reflection bucket.
- First paid exhaustion attempts the one-time server-side grace bundle before denial.
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
- Premium: 10 generations per paid billing cycle.
- Deeper: unlimited, so count denials do not apply.
- First paid exhaustion attempts the same one-time grace bundle before denial.
- Exact same dream-sequence scope + language reuses the cached artifact instead of spending quota again.

### Essays (`period_reflection_generate`)

- Paid-only.
- Minimum 2 reflected dreams in the requested scope.
- **Premium**
  - 1 essay per calendar month.
  - Current month uses month-to-date scope with a month-level cache/report key.
- **Deeper**
  - 1 essay per calendar week.
  - Current month uses week-level scope keys inside the month.
- **Finished months**
  - immutable once generated for that month scope
  - same-language reruns reuse the cached artifact

## Persistence notes

- Paid outputs remain readable after lapse through `ai_generation_artifacts`.
- Essays are mirrored to `pattern_reports` for compatibility with existing Insights storage.
- `user_settings.time_zone` is the persisted timezone used for calendar-based quota and current-month cadence logic. Fallback is `UTC`.

## Live cutover notes

- Gated mobile AI actions now call `ai-entitlements-gateway`:
  - `dream_reflection_generate`
  - `dream_reflection_regenerate`
  - `dream_followup_reply`
  - `recent_dream_field_generate`
  - `period_reflection_generate`
- Paid artifacts remain readable after lapse, but paid-origin chat and paid generation paths become read-only until renewal.
