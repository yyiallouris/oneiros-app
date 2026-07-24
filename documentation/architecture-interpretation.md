# Interpretation architecture

This document explains the AI interpretation system: how a dream becomes a reflection, metadata, chat history, DreamDetail display, and Insights material.

## Primary flow

1. User saves or opens a dream in `DreamDetailScreen`.
2. User requests a reflection; screen checks `isOnline()` before any AI call.
3. `ai-entitlements-gateway` reserves quota and starts the user-facing Jungian reflection as a background Edge task for mobile reflection requests.
4. The client receives a pending quota event quickly, polls `dream_reflection_status`, and mirrors the canonical reflection locally once the gateway persists and commits it. For long reflections, the gateway streams OpenAI chunks server-side into the pending quota event as `partial_reflection`; the client starts revealing that partial text after roughly 15 seconds with append-aware phased typing while it keeps polling for the final committed interpretation.
5. The client starts `dream_metadata_extract` as a separate post-reflection gateway request; it updates `display_distillation` plus long-term metadata when ready. DreamDetail refreshes the interpretation as soon as that deduped extraction promise completes, tries an immediate refresh when the user closes chat, and uses delayed refresh timers as fallback. If extraction JSON is malformed, truncated, or empty, the gateway keeps the reflection, marks metadata as failed, and lets the client retry instead of silently storing an empty ready state.
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
- Database schema history lives in `supabase/migrations/`, especially the interpretation metadata migrations.
- Backend quota and entitlement history now lives in `subscription_entitlements`, `subscription_transactions`, `quota_buckets`, `quota_events`, and `ai_generation_artifacts`.

If adding a persisted interpretation field, update all of these together: `src/types/dream.ts`, AI parser/prompt, DreamDetail or Insights consumers, `remoteStorage.ts`, `syncService.ts` merge behavior, a Supabase migration, migration README, flow docs, and tests.

## AI proxy and provider routing

- Client config can call OpenAI-compatible APIs directly or the Supabase `openai-proxy`.
- Production `openai-proxy` calls require a valid Supabase user bearer token before the function reads or forwards dream/chat payloads. CORS preflight remains unauthenticated.
- `openai-proxy` forwards OpenAI `response_format` to upstream requests so structured extraction calls can enforce JSON object responses.
- `ai-entitlements-gateway` forwards the caller's user JWT (and anon `apikey`) when it invokes `openai-proxy` server-side; the service-role key must not be used as the proxy `Authorization` bearer.
- The gateway initial reflection prompt must stay in parity with the canonical client `src/services/ai.ts` initial interpretation contract: same constitution / role / format / user-message shape, same-language body text and questions, same depth targets, and the same Standard / Advanced two-question ending.
- Mobile reflection generation uses an async start/status pattern so Advanced depth can keep its full prompt/model contract without blocking one long HTTP request; quota still commits only after the reflection row is saved and releases on generation failure. Pending status responses may include sanitized `partial_reflection` progress for progressive display, but partial text is not treated as a completed interpretation and cannot be used for follow-up chat until commit.
- Reflection and post-reflection metadata extraction log sanitized AI cost observability from real provider `usage` tokens: model/provider, input/cached/output token counts, per-call estimated USD, and combined reflection+metadata estimated USD. These logs never include dream content, prompts, messages, or raw AI output, and they do not affect quota or model routing.
- When using `openai-proxy`, the client sends a task hint; provider and model routing are centralized in `supabase/functions/openai-proxy/task-config.ts`.
- Task names include interpretation, chat follow-up, dream extraction, conversation element update, semantic grouping, pattern insights, and compact retry flows.
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
