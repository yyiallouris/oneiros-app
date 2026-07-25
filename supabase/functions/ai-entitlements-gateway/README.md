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
- `dream_followup_reply` commits via `billing_commit_quota` with **text** `interpretation_id` (never uuid cast); chat messages persist only after commit succeeds so a commit failure does not leave orphan turns
- synchronous dream reflection calls return after the reflection is generated, saved with `metadata_status: pending`, and quota is committed
- mobile reflection calls may pass `async: true`; the gateway reserves quota, returns `status: pending` plus `quota_event_id`, and continues generation through `EdgeRuntime.waitUntil`
- before starting the background worker, the gateway sets `result_context.async_background_started`; a later reserve with the same stable idempotency key returns `pending` without starting a second Edge worker (client rejoins via `dream_reflection_status`)
- while async reflection is pending, the gateway streams model chunks into `quota_events.result_context.partial_reflection`; status polling can return this partial text for progressive display, but quota still commits only after the final reflection row is saved
- `dream_reflection_status` reads the quota event and returns the committed interpretation payload once available, or `pending` / `released` / `denied` status while preserving quota semantics
- dream reflection prompts mirror the canonical initial interpretation contract in `src/services/ai.ts` for structure, depth, same-language body/questions, and Standard/Advanced two-question endings; Advanced keeps the 550–800 word target with a looser token headroom (2800) so completions are less likely to truncate mid-response; the hidden completion marker is stripped before persistence/response
- Recent Dream Field and period reflection prompts mirror the canonical June 9 essay contracts from `src/services/ai.ts` for role, synthesis depth, section shape, language rules, reflective-question constraints, and hidden essay completion marker stripping
- gateway-to-proxy reflection timeouts release the quota reservation before the client sees an error
- `dream_metadata_extract` runs as a separate post-reflection enrichment action and updates the same interpretation with display/Insights metadata
- dream metadata extraction prompts use the shared canonical contract in `src/ai/dreamExtractionPrompt.ts` (same system/user pedagogy as `src/services/ai.ts`) — no thin gateway-only stub
- metadata extraction resilience: shared Zod coerce/preprocess soft-defaults common omissions (e.g. missing echo `confidence` → `medium`); after prompt/validation edits deploy this gateway **and** `openai-proxy` so production does not keep failing with `structured_schema_invalid`
- that contract includes a SOURCE BOUNDARY (Dream Fabric vs Interpretive Echoes), compact Dream Motif `motifs`, felt-tone-only `affects`, pattern-label `relational_dynamics`, short `thresholds`, closed-whitelist Archetypal Echoes in `archetypes` (0–2; no production `evaluation` bag), and open-world Mythic Echo (0–1) as a direct `amplifications` output of the same extraction call (narrative/episode titles only, not bare figures), with a lightweight post-validator. Current ids: `dream-field-map-interpretive-v3.6` / `prompt_version` `3.6.3` / schema `4`.
- optional `debug_interpretive_echoes: true` on `dream_metadata_extract` returns `debug_interpretive_echoes` with `interpretive_diagnostics` + prompt/model metadata for feedback loops; diagnostics are never written into the interpretation row and must never render in Dream Detail UI
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

```bash
supabase functions deploy ai-entitlements-gateway
```

`openai-proxy` must also be deployed and reachable; gateway AI calls fail with `Unauthorized` if the proxy receives a non-user Bearer token.
