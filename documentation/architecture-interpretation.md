# Interpretation architecture

This document explains the AI interpretation system: how a dream becomes a reflection, metadata, chat history, DreamDetail display, and Insights material.

## Primary flow

1. User saves or opens a dream in `DreamDetailScreen`.
2. User requests a reflection; screen checks `isOnline()` before any AI call.
3. `ai-entitlements-gateway` reserves quota and starts the user-facing Jungian reflection as a background Edge task for mobile reflection requests.
4. The client receives a pending quota event quickly, polls `dream_reflection_status`, and mirrors the canonical reflection locally once the gateway persists and commits it. For long reflections, the gateway streams OpenAI chunks server-side into the pending quota event as `partial_reflection`; the client starts revealing that partial text after roughly 15 seconds with append-aware phased typing while it keeps polling for the final committed interpretation.
5. The client starts `dream_metadata_extract` as a separate post-reflection gateway request; the gateway claims a server-side metadata extraction lease before making the provider call, then updates `display_distillation` plus long-term metadata when ready. DreamDetail refreshes the interpretation as soon as that deduped extraction promise completes, tries an immediate refresh when the user closes chat, and uses delayed refresh timers as fallback. If another caller reaches the gateway while the lease is active, it gets a processing response and retries without starting a duplicate OpenAI metadata call. If extraction JSON is malformed, truncated, or empty, the gateway keeps the reflection, marks metadata as failed, and lets the client retry instead of silently storing an empty ready state.
6. The client mirrors the canonical reflection locally immediately; metadata refreshes from remote when post-reflection extraction finishes. Pending metadata rows also restart enrichment on DreamDetail / alternate chat load with in-memory dedupe and short retries.
7. DreamDetail renders:
   - Dream essence and movement from `display_distillation`.
   - Visible anchors from distillation first, fallback model second.
   - Symbolic layers from full metadata.
   - Assistant reflection and inline chat.

The alternate `InterpretationChatScreen` mirrors this conceptual flow but is not currently a primary in-app navigation path.

## Important boundaries

- Reflection text is for the individual dream page.
- `display_distillation` is for calm immediate UI presentation on DreamDetail.
- Full metadata powers Insights and pattern reports.
- `metadata_status` tracks whether extraction is `pending`, `ready`, or `failed`; Insights skip only still-pending interpretations so incomplete enrichment does not pollute reports.
- If `display_distillation` is partial (for example missing `visible_anchors`), DreamDetail must fall back to metadata anchors instead of crashing.
- Dream-level legacy `dream.symbols` / `dream.archetypes` are fallback material, not the primary DreamDetail display.
- AI copy must stay reflective, hypothetical, and non-clinical. Legal and wellness boundaries live in `constants/legal.ts`.

## AI service responsibilities

`src/services/ai.ts` owns:

- Model capability detection and token parameter selection.
- Request headers, timeouts, response parsing, cost/usage logging, and safe logging.
- Initial interpretation generation.
- Follow-up chat response generation with `MAX_AI_RESPONSES`.
- Structured extraction into symbols, archetypes, landscapes, affects, motifs, relationships, thresholds, conflicts, core mode, amplifications, symbol stances, and `display_distillation`.
- Conversation metadata update after follow-up chat where used.
- Pattern insight and recent dream-field essay generation.
- Semantic grouping for symbols, motifs, and landscapes.

## Backend entitlement gateway

The repository now also contains a backend-first AI entitlement layer in Supabase Edge Functions:

- `subscription-status`
- `billing-register-purchase`
- `ai-entitlements-gateway`
- store webhook ingestion via Apple + Google

Important rollout boundary:

- Current mobile reflection, follow-up, Recent Dream Field, and period reflection flows call the backend gateway for quota-controlled generation.
- Gateway Recent Dream Field and period reflection prompts must stay in parity with the canonical June 9 `src/services/ai.ts` essay contracts, including full synthesis principles, section shape, language rules, reflective-question constraints, and hidden essay completion marker stripping.
- The backend gateway persists:
  - reflection origin (`free_weekly` / `paid_cycle`)
  - follow-up reply counters
  - premium cached artifacts for Recent Dream Field and period reflections

`src/services/dreamMetadataPrefetchService.ts` adds extraction caching keyed by dream content hash so repeated metadata work can be avoided when the dream has not changed.

## Persistence and sync

- Local interpretation storage: `LocalStorage.INTERPRETATIONS_KEY`.
- Unsynced queue: `LocalStorage.UNSYNCED_INTERPRETATIONS_KEY`.
- Remote mapping: `remoteStorage.ts` maps `display_distillation`, `metadata_status`, and all metadata to/from Supabase rows.
- Merge behavior: `SyncService.fetchAndMergeInterpretations()` preserves local display distillation/metadata when remote rows are missing newer optional fields or extraction is still pending.
- Database schema history lives in `supabase/migrations/`, especially the interpretation metadata migrations and `interpretation_metadata_extraction_jobs` lease table. Interpretation and dream ids are app-generated `text` ids; metadata-related foreign keys and RPC arguments must match those types instead of assuming UUIDs.
- Backend quota and entitlement history now lives in `subscription_entitlements`, `subscription_transactions`, `quota_buckets`, `quota_events`, and `ai_generation_artifacts`.

If adding a persisted interpretation field, update all of these together: `src/types/dream.ts`, AI parser/prompt, DreamDetail or Insights consumers, `remoteStorage.ts`, `syncService.ts` merge behavior, a Supabase migration, migration README, flow docs, and tests.

## AI proxy and provider routing

- Client config can call OpenAI-compatible APIs directly or the Supabase `openai-proxy`.
- Production `openai-proxy` calls require a valid Supabase user bearer token before the function reads or forwards dream/chat payloads. CORS preflight remains unauthenticated.
- `openai-proxy` forwards OpenAI `response_format` to upstream requests so structured extraction calls can enforce JSON object responses.
- `ai-entitlements-gateway` forwards the caller's user JWT (and anon `apikey`) when it invokes `openai-proxy` server-side; the service-role key must not be used as the proxy `Authorization` bearer.
- The gateway initial reflection prompt must stay in parity with the canonical client `src/services/ai.ts` initial interpretation contract: same constitution / role / format / user-message shape, same-language body text and questions, same depth targets, and the same Standard / Advanced two-question ending.
- Gateway `dream_metadata_extract` must use the shared canonical extraction contract in `src/ai/dreamExtractionPrompt.ts` (imported by both `src/services/ai.ts` and `supabase/functions/_shared/billing-ai.ts`). Do not keep a thinner gateway-only extraction stub; DreamDetail distillation and Insights metadata semantics live in that one module.
- That shared prompt includes a SOURCE BOUNDARY: Dream Fabric fields (`affects`, `landscapes`, `relational_dynamics`, `thresholds`, `motifs`, `symbols`) must be grounded in dream text only; Interpretive Echoes (`central_conflicts`, `archetypes`, `amplifications` / Mythic Echoes) may use dream + reflection and stay provisional. Motifs are Dream Motifs on a single dream and Recurring Scenes only after Insights aggregation. Affects are felt-tone labels only (never sensory images). Relational dynamics are compact pattern labels, not plot summaries. Archetypes return 0–2 objects `{ canonical_label, expression, resonance, evidence }` on converging structural evidence (classical whitelist label first; dream-specific `expression` secondary). Amplifications return 0–1 named mythic parallel `{ title, tradition, resonance, difference, evidence }` on structural correspondence (not mythology roulette / not invented generic titles), and stay UI-only under Mythic Echoes — not Forming Patterns aggregation.
- User-facing extraction strings (symbols, affects, motifs, landscapes, display_distillation text, etc.) follow the dream's primary language. Schema enums and whitelisted archetype names stay English for machine consistency.
- Mobile reflection generation uses an async start/status pattern so Advanced depth can keep its full prompt/model contract without blocking one long HTTP request; quota still commits only after the reflection row is saved and releases on generation failure. Pending status responses may include sanitized `partial_reflection` progress for progressive display, but partial text is not treated as a completed interpretation and cannot be used for follow-up chat until commit.
- Reflection, post-reflection metadata extraction, Recent Dream Field, and Period Reflection log sanitized AI cost observability from real provider `usage` tokens: model/provider, input/cached/output token counts, and per-call estimated USD. Rates come from the monthly-updated table in `src/billing/aiPricing.ts` (OpenAI + Anthropic). These logs never include dream content, prompts, messages, or raw AI output, and they do not affect quota or model routing.
- When using `openai-proxy`, the client sends a task hint; provider and model routing are centralized in `supabase/functions/openai-proxy/task-config.ts`.
- Task names include interpretation, chat follow-up, dream extraction, conversation element update, semantic grouping, pattern insights, and compact retry flows.
- Current cost-tier mapping: mini + Haiku → `dream_extraction` (needs mid-tier judgment for Interpretive Echoes) + chat follow-up; nano + Haiku → conversation element update / semantic candidates; full `gpt-5.4` + Sonnet 5 → all reflection depths + pattern essays. Missing/unknown proxy `task` is rejected (no silent unrouted default). Nano is too weak for reliable archetypal/mythic echo gating on rich dreams.
- Structured tasks (`dream_extraction`, `conversation_element_update`, `semantic_grouping`) pass through Zod validation in `src/ai/structuredTaskValidation.ts`, with one same-provider repair attempt in `openai-proxy` before hard reject (502). Rejected structured responses return sanitized diagnostics (`failureCode`, `looksTruncated`, `finishReason`, `schemaErrors`, `contentLength`, `model`) through gateway → app logs — never dream/prompt/raw text. Conversation element updates require explicit `status: "no_change"` instead of bare `{}`. Extract calls also log `DREAM_EXTRACTION_PROMPT_VERSION` plus field counts after normalize.
- Changing provider/model routing requires updating `supabase/functions/openai-proxy/README.md` when behavior changes and deploying with `supabase functions deploy openai-proxy`.

## Offline and failure behavior

- Initial reflection, regeneration, update, chat send, pattern generation, and recent dream-field generation require online access.
- Offline attempts should show the shared offline message pattern and avoid sending requests.
- API errors should not erase user-entered chat text unless the screen explicitly completed the send.
- Response limits are enforced by `MAX_AI_RESPONSES`.
- AI logs must avoid dream content, prompts, messages, and raw responses; use `logger.ts` helpers.

## Tests and docs to update

- Flow docs: [flows-06-jungian-ai-reflection.md](./flows-06-jungian-ai-reflection.md), [flows-07-insights-reports.md](./flows-07-insights-reports.md), and [../docs/SYMBOLS_FLOW.md](../docs/SYMBOLS_FLOW.md).
- Flow tests: `dreamDetail.offlineMessage.flow.test.tsx`, `interpretationChat.offlineMessage.flow.test.tsx`, `constants.flow.test.ts`, `dreamMetadataPrefetchService.flow.test.ts`, `entitledAiService.flow.test.ts`, `patternInsightsService.flow.test.ts`, `insightsPeriodsAndKeys.flow.test.ts`, `syncService.flow.test.ts`, `remoteStorage.interpretationMetadata.flow.test.ts`, `symbolGroupingService.flow.test.ts`.
- Unit tests: `__tests__/ai.test.ts`, `__tests__/dreamDetailDisplay.test.ts`, and any new parser/service test needed for metadata shape changes.
- Live smoke: `__tests__/live/aiSupabaseSmoke.live.test.ts` via `npm run test:live-ai` verifies deployed Supabase/proxy reachability, and verifies server AI provider keys only when `LIVE_SUPABASE_ACCESS_TOKEN` or `LIVE_SUPABASE_EMAIL` + `LIVE_SUPABASE_PASSWORD` are set.
- Live quality smoke: `__tests__/live/dreamAnalysisQuality.live.test.ts` via `npm run test:live-ai-quality` sends a crafted dream through live interpretation/extraction and checks post-Jungian reflection quality plus Insights metadata coverage.
