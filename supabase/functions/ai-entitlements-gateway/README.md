# ai-entitlements-gateway

Authenticated Edge Function for quota-controlled AI generation.

Supported actions:

- `dream_reflection_generate`
- `dream_reflection_regenerate`
- `dream_reflection_status`
- `dream_metadata_extract`
- `dream_followup_reply`
- `recent_dream_field_generate`
- `period_reflection_generate`

Every request must include an idempotency key.

Behavior:

- reserves quota through SQL RPCs
- calls `openai-proxy` server-side using the **caller's user JWT** (not the service-role key) plus the anon `apikey`
- persists interpretations or premium artifacts
- commits quota on success
- releases quota on failure
- `dream_followup_reply` commits via `billing_commit_quota` with **text** `interpretation_id` (never uuid cast); chat messages persist only after commit succeeds so a commit failure does not leave orphan turns. New commits retain compact user/assistant message IDs in result context. An already-committed idempotency replay reconstructs the same reply/messages from persisted interpretation data and the committed result, with a constrained adjacent-message fallback for legacy rows; it never calls the model, commits quota, or persists again. If committed evidence cannot be reconstructed, the gateway returns HTTP 409 instead of generating a second reply. This replay repair is deployed in guarded function version `112`; its live production sanity returned byte-identical reply/messages with no second model, quota, or persistence action.
- synchronous dream reflection calls return after the reflection is generated, saved with `metadata_status: pending`, and quota is committed
- mobile reflection calls may pass `async: true`; the gateway reserves quota, returns `status: pending` plus `quota_event_id`, and continues generation through `EdgeRuntime.waitUntil`
- before starting the background worker, the gateway sets `result_context.async_background_started`; a later reserve with the same stable idempotency key returns `pending` without starting a second Edge worker (client rejoins via `dream_reflection_status`)
- while async reflection is pending, the gateway streams model chunks into `quota_events.result_context.partial_reflection`; status polling can return this partial text for progressive display, but quota still commits only after the final reflection row is saved
- `dream_reflection_status` reads the quota event and returns the committed interpretation payload once available, or `pending` / `released` / `denied` status while preserving quota semantics
- guarded function version `113` matches the canonical production initial reading (`oneiros-dream-reflection-v3.2.3-candidate`) and follow-up chat (`oneiros-followup-chat-v2.0.1`) builders. Failed `oneiros-dream-reflection-v3.2.2-candidate` / `oneiros-followup-chat-v2.0.2-candidate` are archived evidence only. Quick remains a glimpse; Standard stops when the central movement is illuminated; Advanced earns length through resolution rather than a word minimum. The gateway streams reading bytes, including same-call questions. Historical `BEGIN_DREAM_READING` envelopes remain salvageable.
- canonical release `v1.0.3` / alias `oneiros-same-call-reflective-questions-v1.0.3` maps to the immutable evaluated artifact carried by function version `113`: `oneiros-same-call-reflective-questions-v1.0.3-candidate` / `f5399a49…`. Reader alias `oneiros-dream-reflection-v3.2.3` maps to evaluated artifact `oneiros-dream-reflection-v3.2.3-candidate`. Runtime telemetry retains the artifact ids; no prompt bytes were renamed. Structure normalizer is `oneiros-reflective-question-structure-normalizer-v1.0.0`; runtime bundle is `oneiros-reflective-questions-runtime-v1.0.3+structure-v1.0.0`: one Reader/chat/essay call writes the questions. Q1 uses enacted-relation composition; Q2 is unchanged. Quick 1; Standard/Advanced 2; chat open 1 / close 0; essays 2. After completion, compact `reflective_question_runtime`, `question_structure_normalization`, and fail-open `contract_validation` telemetry are stored beside existing model/cost/latency fields. No validator or normalizer can retry, reject, rewrite model-owned content, buffer, or change the existing stream/~15s reveal. No Composer, semantic judge, Gate, Repair, or Premise Check. Exploring `chat_followup` stays `gpt-5.4-mini`. Closed Inviter/editorial/orchestration SHAs remain denied.
- production runtime includes `oneiros-reflective-question-structure-normalizer-v1.0.0`. After a Standard/Advanced response completes, it may insert only exact `## Reflective Questions` before exactly two unambiguous terminal question bullets; otherwise it returns the original bytes. It runs before final observation/extraction/persistence and never touches `onProgress` or `partial_reflection`. Result context records separate `question_structure_normalization` telemetry (`applied`, `operation`, `normalizer_version`). The prompt SHA does not identify this runtime code; the runtime bundle identity names both prompt and normalizer versions. Frozen 41-output replay repaired 2 real misses and left 39 outputs byte-identical. Q2 quality is outside this structural repair.
- production question identity is approved `oneiros-same-call-reflective-questions-v1.0.3-candidate` / `f5399a49…`. Failed `v1.0.2-candidate` / `94d4a92a…` is explicitly denied after regressing 2/6 controls. Its committed-replay engineering repair remains isolated from question prompts.
- Q2-only `oneiros-same-call-reflective-questions-v1.0.4-candidate` / `a4f972c…` is also explicitly denied after its single frozen imaginal-handoff evaluation returned HOLD. It remains under `src/ai/rd/` and is not bundled into this function. Gateway v113, production Q2, streaming, model calls, extraction, chat, essays, and RDF are unchanged; no deployment followed the evaluation.
- Final Q2-only `oneiros-same-call-reflective-questions-v1.0.5-candidate` / `16da1d13…` is explicitly denied after its single frozen source-ownership evaluation also returned HOLD. It remains under `src/ai/rd/`, is not bundled into this function, and closes Q2 prompt R&D with no automatic v1.0.6. Gateway v113 and every production surface remain unchanged; no deployment followed the evaluation.
- Recent Dream Field and period reflection keep shared prompt ids `oneiros-recent-dream-field-v2` / `oneiros-period-reflection-v2` at `2.0.4-phase1`. This preserves the accepted `2.0.3-phase1` topology, metadata-heavy context version `1`, provider/model routing, temperatures, sections, length handling, and one-shot compact retry for incomplete/over-limit output only. Missing/extra two-question structure is observed without retry or rejection. Narrative-first context version `2` and the Field Map pre-pass are evaluation-only and are not imported into gateway generation. Phase 2 R&D is closed; deploying ships Phase 1 intelligence plus the narrow question-contract prompt patch and shadow observation.
- incomplete or initially over-limit essays receive one compact full rewrite; the retry has a small measured tolerance and is never string-truncated. Sanitized telemetry may include word counts and thresholds but never dream content, prompts, messages, or essay output
- gateway-to-proxy reflection timeouts release the quota reservation before the client sees an error
- `dream_metadata_extract` runs as a separate post-reflection enrichment action and updates the same interpretation with display/Insights metadata
- dream metadata extraction prompts use the shared canonical contract in `src/ai/dreamExtractionPrompt.ts` (same system/user pedagogy as `src/services/ai.ts`) — no thin gateway-only stub
- persisted `interpretation.archetypes` now come only from the dedicated two-pass production line `dream_archetype_recognition` → `dream_archetype_adjudication` (`prompt_version` `1.0.0` / schema `1` / recognition catalog `2.0.0` / boundary catalog `1.0.0`). The monolithic `dream_extraction.archetypes` field may still exist for schema compatibility, but the gateway always discards it before save
- dedicated archetype production behavior: retry once on technical / schema / language failure, never fall back to legacy monolithic archetypes, successful adjudicated `[]` still commits as metadata `ready`, and exhausted two-pass failure marks `metadata_status: failed`
- metadata extraction resilience: shared Zod coerce/preprocess soft-defaults common omissions (e.g. missing echo `confidence` → `medium`), and optional-echo salvage drops only invalid archetype/myth rows before any full structured repair; after prompt/validation edits deploy this gateway **and** `openai-proxy` so production does not keep failing with `structured_schema_invalid`
- **output-language commit gate (E.1.1):** after schema-valid extract, validate all user-facing free-text against `target_output_language`; one field-scoped repair attempt; failure → `language_validation_failed` / `metadata_status: failed` — never commit wrong-language strings. Telemetry: `outputLanguageCommit` (no full text). See `documentation/flows-06-jungian-ai-reflection.md` → Locked contract: output-language commit gate.
- that contract includes a SOURCE BOUNDARY (Dream Fabric vs Interpretive Echoes), compact Dream Motif `motifs`, felt-tone-only `affects`, pattern-label `relational_dynamics`, short `thresholds`, compatibility-only monolithic `archetypes` in `dream_extraction` (discarded before persistence in favor of the dedicated two-pass result), and closed-catalog Mythic Echo (0–1) as a direct `amplifications` output of the same extraction call (model returns `catalog_id` only; server resolves title/tradition; no open-world fallback; flag `MYTHIC_CLOSED_CATALOG_V1`). Current ids: `dream-field-map-interpretive-v4.1.10-M2.2` / `prompt_version` `4.1.10-M2.2` / schema `13` / `temperature` `0`.
- optional `debug_interpretive_echoes: true` on `dream_metadata_extract` **forces a fresh extraction** (bypasses ready-cache) and returns `debug_interpretive_echoes` with `interpretive_diagnostics`, `post_validation_archetypes`, `post_validation_amplifications`, staged `mythic_echo_pipeline` (`summary.raw_model_produced_amplification_object` / `audit_only_selection_without_production_object`, plus stages raw → parsed → normalized → `validator_decisions` → post-validation → selected-audit vs production invariant), plus prompt/model metadata; on invariant failure debug clears mismatched production amps without rewriting titles and without auto-promoting selected audit into production; diagnostics are never written into the interpretation row and must never render in Dream Detail UI
- callers may retry `dream_metadata_extract`; rows that are already `ready` on the current prompt/schema version return as cached; versioned ready rows on an older prompt/schema reopen for re-extraction; legacy null versions stay cached
- pending metadata extraction uses a server-side lease in `interpretation_metadata_extraction_jobs`; overlapping retries return a processing response instead of starting duplicate OpenAI metadata calls
- if post-reflection extraction JSON is invalid or returns no usable metadata, keeps the reflection, marks `metadata_status: failed`, and returns an error so the client retry loop can recover instead of caching an empty ready state
- if post-reflection extraction fails, quota remains committed because the reflection was delivered
- emits safe timing logs for gateway auth/body parsing, quota DB steps, proxy AI calls, persistence, metadata retries, and total request duration; logs never include dream content, prompts, messages, or raw model output
- metadata extraction failures return sanitized diagnostics to the client (`failureCode`, `looksTruncated`, `finishReason`, `schemaErrors`, `model`, lengths) so Metro/app logs can show the real failure mode instead of a bare "AI proxy request failed"
- emits safe AI cost logs from real provider usage tokens: reflection cost, metadata extraction cost, combined reflection+metadata estimated USD when both calls are available, plus Recent Dream Field and Period Reflection generation costs. Cost payloads include `model` / provider / token fields alongside USD. Estimates use the shared monthly pricing table in `src/billing/aiPricing.ts` (OpenAI Standard short-context + Anthropic standard rates, checked on 2026-07-24); unknown providers/models are logged with `pricingSource: unknown_provider_or_model` instead of a guessed cost.

Important note:

- Mobile reflection / follow-up / Insights generation screens call this gateway.

Required env:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Deploy:

The local same-call question bundle must match an explicitly approved identity before this function can ship. Do not run raw `supabase functions deploy ai-entitlements-gateway`. Use the fail-closed wrapper:

```bash
npm run deploy:ai-entitlements-gateway
```

That runs the fail-closed guard first. It verifies both the approved prompt bundle and the versioned completed-output normalizer wiring/telemetry. Composer / Gate / Repair / orchestration SHAs remain blocked. Record: [`docs/REFLECTIVE_QUESTION_PRODUCTION_HOLD.md`](../../../docs/REFLECTIVE_QUESTION_PRODUCTION_HOLD.md).

`openai-proxy` must also be deployed and reachable; gateway AI calls fail with `Unauthorized` if the proxy receives a non-user Bearer token.
