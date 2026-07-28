# Interpretation architecture

This document explains the AI interpretation system: how a dream becomes a reflection, metadata, chat history, DreamDetail display, and Insights material.

## Primary flow

1. User saves or opens a dream in `DreamDetailScreen`.
2. User requests a reflection; screen checks `isOnline()` before any AI call.
3. `ai-entitlements-gateway` reserves quota and starts the user-facing Jungian reflection as a background Edge task for mobile reflection requests.
4. The client receives a pending quota event quickly, polls `dream_reflection_status`, and mirrors the canonical reflection locally once the gateway persists and commits it. For long reflections, the gateway streams OpenAI chunks server-side into the pending quota event as `partial_reflection`; the client starts revealing that partial text after roughly 15 seconds with append-aware phased typing while it keeps polling for the final committed interpretation. **Locked UX:** do not remove/replace that typing reveal without explicit user approval — see `documentation/flows-06-jungian-ai-reflection.md` and `__tests__/flows/dreamDetail.streamingTyping.contract.flow.test.ts`.
5. The client starts `dream_metadata_extract` as a separate post-reflection gateway request; the gateway claims a server-side metadata extraction lease before making the provider call, then updates `display_distillation` plus long-term metadata when ready. DreamDetail refreshes the interpretation as soon as that deduped extraction promise completes, does an immediate remote refresh when it reopens a locally cached `pending` / `failed` interpretation, tries another immediate refresh when the user closes chat, and keeps long-tail delayed polling as fallback instead of stopping after the first short window. If another caller reaches the gateway while the lease is active, it gets a processing response and retries without starting a duplicate OpenAI metadata call. If extraction JSON is malformed, truncated, or empty, the gateway keeps the reflection, marks metadata as failed, and lets the client retry instead of silently storing an empty ready state.
6. The client mirrors the canonical reflection locally immediately; metadata refreshes from remote when post-reflection extraction finishes. Pending metadata rows also restart enrichment on DreamDetail / alternate chat load with in-memory dedupe and short retries.
7. DreamDetail renders:
   - Dream essence and movement from `display_distillation`.
   - Visible anchors from distillation first, fallback model second.
   - Symbolic layers from full metadata.
   - Assistant reflection and inline chat (nested Exploring `ScrollView` — see `src/screens/dreamDetailChatLayout.ts`; never `overflow: 'hidden'` on that nested chat style).

The alternate `InterpretationChatScreen` mirrors this conceptual flow but is not currently a primary in-app navigation path.

## Important boundaries

- Reflection text is for the individual dream page.
- `display_distillation` is for calm immediate UI presentation on DreamDetail.
- Full metadata powers Insights and pattern reports.
- `metadata_status` tracks whether extraction is `pending`, `ready`, or `failed`; Insights skip only still-pending interpretations so incomplete enrichment does not pollute reports.
- For v1, persisted `archetypes` are extracted once from the raw-dream metadata pass and are not revised by follow-up chat. Conversation-element updates may still revise affects, motifs, relational dynamics, thresholds, central conflicts, core mode, and amplifications.
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
- The metadata path now runs a dedicated two-pass archetype pipeline alongside the shared `dream_extraction` call. `dream_extraction` may still return a compatibility `archetypes` field for schema continuity, but production always discards that monolithic archetype output. The saved DreamDetail / Insights / persistence shape uses only the final `dream_archetype_recognition` → `dream_archetype_adjudication` result (`dream-archetype-recognition-v1.0.0` + `dream-archetype-adjudication-v1.0.0`, both schema `1`, recognition catalog `2.0.0`, boundary catalog `1.0.0`). Discovery proposes broad candidates from raw dream evidence only; adjudication contrastively accepts or rejects only those candidates while preserving discovery wording for accepted rows. Technical / schema / language failure retries once and then marks metadata `failed`; there is no fallback to legacy monolithic archetypes.
- That shared prompt includes a SOURCE BOUNDARY: Dream Fabric fields must be grounded in dream text only; Interpretive Echoes stay provisional. Archetypal Echoes use `archetype_id` selection plus closed `mechanism_tags` with server hard gates (single `trickster` id; B.2 carrier variants are non-production; Hero / Guide / Lover / Death–Rebirth; polarity-neutral `mother` / `father`; Ego excluded; no dream-specific prompt examples). Patch `4.1.10-M2.2` remains narrow and prompt-only plus a minimal `Lover 1.7.1` catalog revision: it preserves sustained-function-over-carrier selection, keeps the general archetypal-field activation rule so calm/organizing states remain eligible, adds an explicit-negation rule so stated non-romantic companionship does not become Lover from nearby imagery alone, and tightens Inner Tensions so complementarity or small practical obstacles are not mistaken for psychic conflict. `display_distillation.main_tension` is also normalized deterministically against `central_conflicts`, so cohesive dreams no longer invent a separate poetic opposition. Trickster is optional — not a release blocker. Persisted archetype rows may also carry optional `legacy_source_id` (`great_mother` / `terrible_mother`) for migration audit when old ontology rows are canonicalized into `mother`. Output language: prompt lock plus **deterministic pre-commit language gate** (`src/ai/dreamOutputLanguage.ts`) — wrong-language user-facing fields never commit; one field-scoped repair attempt; failure → `language_validation_failed` (gateway `outputLanguageCommit` telemetry). Mythic Echo uses the closed narrative catalog v1.2.0 (128 ids, prompt-index V2): build-time index injected into the same call; model returns `catalog_id` + `evidence_ids` or `[]`; provider JSON schema enforces disjoint archetype/myth ID enums (C.1.1); server validates catalog integrity only (C.1), resolves exact dream spans from numbered `[Dn]` body (display spread via `selectDisplayEvidence`) and resolves title/tradition/source_type (`prompt_id` `dream-field-map-interpretive-v4.1.10-M2.2`, `prompt_version` `4.1.10-M2.2`, schema `13`, `temperature` `0`, catalog `1.2.0`). Myth layer frozen per C.1.1. Gateway logs aggregate `heroTelemetry` + `outputLanguageCommit`. Flag `MYTHIC_CLOSED_CATALOG_V1` (default ON; never open-world fallback). Briefs: `docs/ONEIROS_V4_1_5_C1_1_NAMESPACE_ENFORCEMENT.md`, `docs/ONEIROS_V4_1_5_C1_VALIDATOR_SIMPLIFICATION.md`. Optional debug is compact and never auto-promotes into production echoes. Dream Detail Fabric / Inner Tensions UI is unchanged; empty echo subsections are hidden; archetypal cards are now deterministic `displayLabel + expression + resonance` composition, while mythic cards are deterministic `canonical_title + localized tradition + localized catalog core_synopsis + resonance (+ optional divergence)` composition from a presentation-only cache/helper that never mutates persisted metadata. Diagnostic-only myth strictness review now has a dedicated naturalistic benchmark harness and fixture manifest: `docs/ONEIROS_MYTH_NATURALISTIC_CALIBRATION_BENCHMARK.md`, `docs/myth-naturalistic-calibration.v1.0.0.json`, and `bash scripts/run-naturalistic-myth-benchmark.sh`.
- User-facing extraction strings (symbols, affects, motifs, landscapes, display_distillation text, etc.) follow the dream's primary language. Schema enums and whitelisted archetype names stay English for machine consistency.
- Mobile reflection generation uses an async start/status pattern so Advanced depth can keep its full prompt/model contract without blocking one long HTTP request; quota still commits only after the reflection row is saved and releases on generation failure. The client persists the pending `quota_event_id` locally and resumes `dream_reflection_status` polling when DreamDetail regains focus (or attaches a remote interpretation if the job finished while away). Generate uses a stable idempotency key; the gateway stamps `async_background_started` so replays do not start a second Edge worker. Pending status responses may include sanitized `partial_reflection` progress for progressive display, but partial text is not treated as a completed interpretation and cannot be used for follow-up chat until commit.
- Reflection, post-reflection metadata extraction, Recent Dream Field, and Period Reflection log sanitized AI cost observability from real provider `usage` tokens: model/provider, input/cached/output token counts, and per-call estimated USD. Rates come from the monthly-updated table in `src/billing/aiPricing.ts` (OpenAI + Anthropic). These logs never include dream content, prompts, messages, or raw AI output, and they do not affect quota or model routing.
- When using `openai-proxy`, the client sends a task hint; provider and model routing are centralized in `supabase/functions/openai-proxy/task-config.ts`.
- Task names include interpretation, chat follow-up, dream extraction, conversation element update, semantic grouping, pattern insights, and compact retry flows.
- Current cost-tier mapping: mini + Haiku → `dream_extraction` (needs mid-tier judgment for Interpretive Echoes) + chat follow-up; nano + Haiku → conversation element update / semantic candidates; full `gpt-5.4` + Sonnet 5 → all reflection depths + pattern essays. Missing/unknown proxy `task` is rejected (no silent unrouted default). Nano is too weak for reliable archetypal/mythic echo gating on rich dreams.
- Anthropic fallback for reflection must stay usable: `claude-sonnet-5` rejects `temperature`/`top_p`/`top_k` (HTTP 400). The proxy must omit those params for Sonnet 5 (and similarly constrained models). Reflection/essay tasks use an ordered chain `[claude-sonnet-5, claude-haiku-4-5]` so Haiku still rescues if Sonnet fails. Changing only model ids without verifying sampling-param compatibility reintroduces `AI proxy request failed` + quota `released` — see `supabase/functions/openai-proxy/README.md` “Sampling params”.
- Structured tasks (`dream_extraction`, `conversation_element_update`, `semantic_grouping`) pass through shared validation in `src/ai/structuredTaskValidation.ts`. For `dream_extraction` the path is: parse → coerce → full Zod validate → item-level optional-echo salvage (drop only invalid archetype/myth rows) → one same-provider repair attempt only if required/core structure is still invalid. Rejected structured responses return sanitized diagnostics (`failureCode`, `looksTruncated`, `finishReason`, `schemaErrors`, `contentLength`, `model`) through gateway → app logs — never dream/prompt/raw text. Conversation element updates require explicit `status: "no_change"` instead of bare `{}`. Extract calls also log `DREAM_EXTRACTION_PROMPT_VERSION`, `DREAM_EXTRACTION_PROMPT_ID`, `DREAM_EXTRACTION_SCHEMA_VERSION`, plus field counts after normalize.
- **Metadata resilience lock:** `dream_extraction` applies soft defaults for common model omissions (missing echo `confidence` → `medium` via coerce + Zod preprocess), validates each optional echo independently when salvage is needed, and preserves valid Dream Fabric / `display_distillation` instead of failing the whole extraction for one bad optional row. Prompt/schema/normalizer/repair must stay aligned; schema bumps need contract tests; deploy **both** `openai-proxy` and `ai-entitlements-gateway` after shared changes. See flows-06 → Locked contract: metadata extraction resilience.
- Changing provider/model routing requires updating `supabase/functions/openai-proxy/README.md` when behavior changes and deploying with `supabase functions deploy openai-proxy`.

## Offline and failure behavior

- Initial reflection, regeneration, update, chat send, pattern generation, and recent dream-field generation require online access.
- Offline attempts should show the shared offline message pattern and avoid sending requests.
- API errors should not erase user-entered chat text unless the screen explicitly completed the send.
- Response limits are enforced by `MAX_AI_RESPONSES`.
- AI logs must avoid dream content, prompts, messages, and raw responses; use `logger.ts` helpers.

## Tests and docs to update

- Flow docs: [flows-06-jungian-ai-reflection.md](./flows-06-jungian-ai-reflection.md), [flows-07-insights-reports.md](./flows-07-insights-reports.md), and [../docs/SYMBOLS_FLOW.md](../docs/SYMBOLS_FLOW.md).
- Flow tests: `dreamDetail.offlineMessage.flow.test.tsx`, `dreamDetail.chatScroll.flow.test.tsx`, `interpretationChat.offlineMessage.flow.test.tsx`, `constants.flow.test.ts`, `dreamMetadataPrefetchService.flow.test.ts`, `entitledAiService.flow.test.ts`, `patternInsightsService.flow.test.ts`, `insightsPeriodsAndKeys.flow.test.ts`, `syncService.flow.test.ts`, `remoteStorage.interpretationMetadata.flow.test.ts`, `symbolGroupingService.flow.test.ts`.
- Unit tests: `__tests__/ai.test.ts`, `__tests__/dreamDetailDisplay.test.ts`, `__tests__/dreamDetailChatLayout.test.ts`, and any new parser/service test needed for metadata shape changes.
- Live smoke: `__tests__/live/aiSupabaseSmoke.live.test.ts` via `npm run test:live-ai` verifies deployed Supabase/proxy reachability, and verifies server AI provider keys only when `LIVE_SUPABASE_ACCESS_TOKEN` or `LIVE_SUPABASE_EMAIL` + `LIVE_SUPABASE_PASSWORD` are set.
- Live quality smoke: `__tests__/live/dreamAnalysisQuality.live.test.ts` via `npm run test:live-ai-quality` sends a crafted dream through live interpretation/extraction and checks post-Jungian reflection quality plus Insights metadata coverage.
