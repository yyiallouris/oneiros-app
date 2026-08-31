# Jungian AI: reflection, chat, and interpretation storage

> **Adaptive-opening R&D closure (2026-08-30):** three isolated prompt-only shots tested variable one-versus-two Standard/Advanced openings. After the strict Shot 3 review, one explicitly authorized exact-prompt blind confirmation compared frozen v0.3.0 `13eea607…` with production on 20 fresh synthetic dreams / 40 calls. Shot 3 earned cardinality `20/20` but won only `11–9`, was less often independently shippable (`16/20` versus `18/20`), and produced three serious answer menus. It failed the pre-registered gate and is parked for Oneiros v2. No fourth prompt, runtime import, deploy, or flow change is authorized. Production stays v1.0.3 / `f5399a49…`, Quick exactly 1 and Standard/Advanced exactly 2, with streaming and the ~15s partial reveal unchanged. Reviews: [`../docs/ONEIROS_ADAPTIVE_REFLECTIVE_OPENINGS_THREE_SHOT_REVIEW_2026-08-30.md`](../docs/ONEIROS_ADAPTIVE_REFLECTIVE_OPENINGS_THREE_SHOT_REVIEW_2026-08-30.md), [`../docs/ONEIROS_ADAPTIVE_OPENINGS_SHOT3_VS_PRODUCTION_CONFIRMATION_REVIEW_2026-08-30.md`](../docs/ONEIROS_ADAPTIVE_OPENINGS_SHOT3_VS_PRODUCTION_CONFIRMATION_REVIEW_2026-08-30.md).

Primary UX is **`DreamDetailScreen`** (embedded reflection + chat). The stack also registers **`InterpretationChat`** with the same conceptual flow, but **no in-app `navigation.navigate('InterpretationChat')` call** was found in the repo — treat it as a **maintained alternate route** (e.g. future linking or tests).

## Settings that affect AI output

- **Interpretation depth** and **Mythic Resonance** from `userSettingsService` (Account screen).
- Constants in `constants/interpretation.ts` (e.g. `MAX_AI_RESPONSES`).
- Dream reflection, regenerate, and follow-up chat now run through `ai-entitlements-gateway`.

## Locked contract: metadata extraction resilience

**Status: locked engineering contract. Do not ship extraction/prompt/schema edits that reintroduce `structured_schema_invalid` / gateway invoke failures for otherwise valid rich echoes.**

This exists because Interpretive Echo field additions repeatedly caused production `dream_metadata_extract` 502s (example: model omitted `confidence` → `archetypes.N.confidence: Required` / `amplifications.N.confidence: Required`) even when reflection succeeded.

### Required resilience

1. Shared validation lives in `src/ai/structuredTaskValidation.ts` (proxy + gateway). Path: `parse → coerce → full Zod → item-level optional-echo salvage → one repair only if required/core structure is still invalid → validate again`.
2. Soft defaults for common omissions must stay in place (today: `DREAM_EXTRACTION_SOFT_DEFAULTS.missingEchoConfidence = "medium"` via coerce **and** Zod preprocess on archetypal/mythic objects).
3. Canonical mythic key is `divergence` (legacy `difference` accepted on read/coerce only).
4. Optional echo salvage must drop only invalid `archetypes[]` / `amplifications[]` items (unknown ids, namespace crossover, invalid mechanism tags, invalid evidence ids, malformed required fields) while preserving valid Dream Fabric and `display_distillation` unchanged.
5. Full structured repair must be skipped when item-level salvage yields a valid extraction.
6. Prompt example JSON, repair hints, TS types, and Zod must stay aligned when echo shapes change.
7. Bump `extraction_schema_version` / prompt version when the wire shape or pedagogy changes.
8. After changing shared prompt or validation: deploy **`openai-proxy` and `ai-entitlements-gateway`** (not client-only).
9. Contract tests must cover “rich echo without confidence still validates”, namespace crossover, and salvage-without-repair behavior, and must not be weakened to hide regressions.

### Forbidden

- Adding a new **required** echo field without coerce/preprocess fallback (or an intentional optional design + tests).
- Letting one malformed optional echo 502 an otherwise valid metadata extraction.
- Assuming Metro/client reload updates production extract (it does not).
- Marking metadata `ready` with empty garbage to avoid 502s.
- Dropping Interpretive Echoes entirely as a “fix” for schema pain.

### Contract tests / docs

- `__tests__/flows/dreamMetadataExtraction.resilience.contract.flow.test.ts`
- `__tests__/structuredTaskValidation.test.ts`
- `docs/SYMBOLS_FLOW.md`, `documentation/architecture-interpretation.md`, `AGENTS.md`, `.codex/skills/oneiros-repo/SKILL.md`

## Locked contract: reflective-question production deploy hold

**Status: locked engineering contract. Launch topology is same-call. Canonical release `v1.0.3` / alias `oneiros-same-call-reflective-questions-v1.0.3` maps to immutable evaluated artifact `oneiros-same-call-reflective-questions-v1.0.3-candidate` / SHA `f5399a49…`; Reader alias `oneiros-dream-reflection-v3.2.3` maps to `oneiros-dream-reflection-v3.2.3-candidate`. Gateway function version `113` is live with that artifact, normalizer `oneiros-reflective-question-structure-normalizer-v1.0.0`, and runtime bundle `oneiros-reflective-questions-runtime-v1.0.3+structure-v1.0.0`. Its one frozen 21-call evaluation passed Q1 `21/21`; the separately versioned normalizer closes the one Chinese missing-heading failure without changing model-owned prose/questions or partial streaming. Production Q2 is unchanged. Q2-only `v1.0.4-candidate` / SHA `a4f972c…` and final `v1.0.5-candidate` / SHA `16da1d13…` returned HOLD and are denied; v1.0.5 closes Q2 prompt R&D after failing its strict 22-call gate. Neither has a runtime import. Archived `v1.0.2-candidate` / SHA `94d4a92a…` remains denied. There is no current production blocker.** One Reader/chat/essay call writes the production reading and questions. Composer, v1.2 orchestration, Integrity Gate, Repair, Premise Check, and question fallback are **CLOSED R&D — not production**. Deployment record: [`../docs/REFLECTIVE_QUESTION_PRODUCTION_HOLD.md`](../docs/REFLECTIVE_QUESTION_PRODUCTION_HOLD.md). v1.0.3 evaluation review: [`../docs/ONEIROS_V103_ENACTED_RELATION_EVALUATION_REVIEW_2026-08-29.md`](../docs/ONEIROS_V103_ENACTED_RELATION_EVALUATION_REVIEW_2026-08-29.md). Q2 final HOLD review: [`../docs/ONEIROS_V105_SOURCE_OWNERSHIP_EVALUATION_REVIEW_2026-08-29.md`](../docs/ONEIROS_V105_SOURCE_OWNERSHIP_EVALUATION_REVIEW_2026-08-29.md).

Cardinality: Quick 1 terminal question; Standard/Advanced exactly 2 under `## Reflective Questions`; chat non-final 1 / closing 0; essays exactly 2. Standalone Generator/Gate/Repair/Premise/Composer method IDs remain denied.

### Completed-output structure normalization

Production runtime normalizer identity: `oneiros-reflective-question-structure-normalizer-v1.0.0`; only permitted operation: `insert_missing_reflective_questions_heading`.

- It runs only after a Standard/Advanced response has completed with exactly one required end marker.
- It may insert only exact `## Reflective Questions` plus the required newlines before exactly two unambiguous terminal Markdown question bullets.
- Existing prose and both question bullets remain byte-identical. A second pass is a content no-op.
- Missing marker, Quick/chat/essay, one or three bullets, trailing prose, extra prose questions, later headings, mixed line endings, or ambiguous punctuation are byte-identical no-ops.
- It runs before final observation/extraction/persistence, but never inside `onProgress`; streaming partials, the ~15-second reveal, and `PhasedTypingText` are unchanged.
- Gateway result context stores compact `question_structure_normalization` telemetry (`applied`, `operation`, `normalizer_version`) and separate `reflective_question_runtime` identity telemetry (bundle, method, prompt SHA, Reader, normalizer). Raw model text is not duplicated.
- Frozen replay used the existing v1.0.2 and v1.0.3 packets only: both real heading misses repaired; all other 39 outputs remained byte-identical; no model calls.

Prompt and runtime identity remain distinct. The v1.0.3 prompt SHA stays `f5399a49…`; a deployable bundle that includes this normalizer must also declare the normalizer version and must not be described as byte-identical to the offline prompt-only candidate. Q2 supplied-menu/frame quality is explicitly outside this structural repair.

**Locked v1 chrome identity:** app-owned navigation, shared buttons, structural
headings, and metadata section titles remain English until the Oneiros v2
localization phase. The section heading is exactly `Reflective Questions` and
the shared CTA is exactly `Continue the conversation` for all 12 content languages.
Generated dream reflection prose and questions still use the resolved
dream/conversation language. Do not translate app chrome from model output or a
persisted artifact language code.

**Closed Inviter R&D, not part of this flow:** Post-Jungian Inviter v2.0.1 (`09045bf1…`) failed locked blind review at `0 CLEAR PASS / 1 BORDERLINE / 7 FAIL` against frozen corpus `2a1a8bc3…` (`$0.043675`). Post-reading Inviter v1 (`70c533e5…`) failed at `1 CLEAR PASS / 1 BORDERLINE / 6 FAIL`. Editorial-arc v2 (`6cd304e1…`) failed at internal `2 CLEAR PASS / 6 FAIL`. Orchestration `fc8b6304…` is also denied. All remain denied. No `v2.0.2`, novelty discriminator, Director, Composer-as-judge, or Gate/Repair chase.

**Multilingual:** production keeps the shared 12-language source contract. Initial language is resolved from the dream narrative; follow-up uses a detected substantive user turn or falls back to the established/dream language. The resolved code is placed in the request before generation and audited on output. No runtime translation pass. Architecture: [`../docs/REFLECTIVE_QUESTIONS_V2_ARCHITECTURE.md`](../docs/REFLECTIVE_QUESTIONS_V2_ARCHITECTURE.md), R&D FAIL record [`../docs/ONEIROS_QUESTION_REPAIR_PHASE2_EDITORIAL_FAIL_2026-08-29.md`](../docs/ONEIROS_QUESTION_REPAIR_PHASE2_EDITORIAL_FAIL_2026-08-29.md).

Questions close the reading naturally. `Continue the conversation` remains available with that exact English label. Chat continues the conversation; it is not a second interpretation engine.

Use `npm run deploy:ai-entitlements-gateway` only. The wrapper hashes the same-call bundle and fails closed unless it matches the approved identity. An environment token cannot approve a denied SHA. Client and gateway request paths must not import the hold module, `src/ai/rd/`, or `reflectiveQuestionPipeline.ts`.

## Locked contract: output-language commit gate (E.1.1)

**Status: locked — Patch E + E.1.1 frozen `accepted_with_known_residuals` and deployed.** Prompt language lock alone is not sufficient; the commit gate is mandatory.

Wrong-language user-facing strings must never reach the database or UI. The model may fail language probabilistically; the application must not commit that failure.

### Required gate

1. Resolve `target_output_language` before the AI call (`src/ai/dreamOutputLanguage.ts`).
2. After schema-valid extraction, validate every user-facing free-text field (script + aggregate heuristics for shared Latin scripts).
3. On mismatch: one **field-scoped** repair (same model) that rewrites only mismatched paths; machine IDs / tags / confidence stay frozen. **Never drop** fields, archetypes, myths, or Dream Fabric items.
4. Merge + `semanticFingerprint` assert structure unchanged (excluding repaired text paths).
5. Re-validate language. If still failing or structure changed: `failureCode: language_validation_failed`, `metadata_status: failed` — no commit, no UI exposure, no silent deletion.
6. Telemetry (no full text): `initial_language_match`, `repair_attempted`, `repaired_field_paths`, `repair_language_match`, `semantic_structure_preserved`, `dropped_due_to_language_count` (=0), `full_regeneration_due_to_language_count` (=0), `final_commit_allowed`.

### Acceptance metric

```text
committed output language match: 100%
wrong-language UI exposure: 0
dropped information: 0
semantic structure preserved on repair: 100%
```

### Contract tests / docs

- `__tests__/dreamOutputLanguage.test.ts`
- `__tests__/dreamOutputLanguage.forcedInvalid.e11.test.ts`
- `__tests__/dreamOutputLanguage.faithfulRepair.e11.test.ts`
- `docs/ONEIROS_V4_1_7_E_PATCH.md` (E.1.1 section)
- Gateway validates repair payload locally even when proxy uses `skip_structured_validation` (`validateLanguageRepairFieldMap` → `Record<ExactRequestedFieldPath, NonEmptyString>`).
- Repair faithfully: preserve claims/images/relationships/negations/modality/names/numbers; change only natural language.

## Locked UX contract: reflection streaming typing

**Status: locked. Do not change without the product owner’s explicit approval in the current conversation.**

This contract exists because agents previously “fixed” a layout/streaming visibility bug by **removing the typing effect**. That is not allowed.

### Required behavior

1. After roughly **15 seconds** (`REFLECTION_PARTIAL_REVEAL_AFTER_MS`), if partial reflection text exists, DreamDetail must open the Exploring chat and grow a temporary assistant message with **append-aware phased typing** via `PhasedTypingText`.
2. While `isStreaming` is true, assistant content **must** render through `PhasedTypingText` — same family of reveal as settle typing.
3. Catch-up acceleration inside `PhasedTypingText` is allowed when the gateway buffer outpaces the typewriter.
4. If a stream was shown, commit must not replay the typewriter from the beginning.
5. Layout fixes (no `overflow: 'hidden'` / `flex: 1` on the Exploring card; nested chat `maxHeight`; streaming `minHeight`) must preserve typing — never replace typing to “make text show”.

### Forbidden without explicit user approval

- Replacing streamed `PhasedTypingText` with instant full text (`FormattedMessageText` / raw `Text` dump) for the live partial.
- Removing `isStreaming` typing while keeping only settle typing.
- Weakening or deleting the contract tests below to sneak the change through.
- Any analogous “delete the UX to fix the bug” overcorrection on intentional motion/reveal.

### Contract tests / docs

- `__tests__/flows/dreamDetail.streamingTyping.contract.flow.test.ts`
- Related guards in `__tests__/flows/aiCostLogging.flow.test.ts`, `__tests__/dreamDetailChatLayout.test.ts`
- Agent rules: `AGENTS.md`, `.codex/skills/oneiros-repo/SKILL.md`

## Locked contract: production reflective-question identity

**Status: locked product contract (updated 2026-08-29).** Launch restores pre-week same-call questions with three R&D safeguards only.

- Approved prompts: Reader `oneiros-dream-reflection-v3.2.3-candidate`; method `oneiros-same-call-reflective-questions-v1.0.3-candidate` / SHA `f5399a49…`; follow-up chat `oneiros-followup-chat-v2.0.1`; normalizer `oneiros-reflective-question-structure-normalizer-v1.0.0`; runtime bundle `oneiros-reflective-questions-runtime-v1.0.3+structure-v1.0.0`. Archived denied candidate: Reader `oneiros-dream-reflection-v3.2.2-candidate`; method `oneiros-same-call-reflective-questions-v1.0.2-candidate` / SHA `94d4a92a…`; chat `oneiros-followup-chat-v2.0.2-candidate`. Frozen fixture SHA `cc60ad8e…`; human Q1 `21/21`; structural replay PASS.
- Quick: exactly 1 terminal question, no heading. Standard / Advanced: exactly 2 bullets under `## Reflective Questions`. Question 1 observational/somatic (remembered dream-body, not a present-time exercise). Question 2 symbolic/relational/imaginal.
- The approved v1.0.3 diff changes only the Standard/Advanced Q1 job from observational/somatic to an enacted relation grounded in one explicitly reported event. Its editorial boundary preserves vitality: earned, dream-grounded, invitational interpretation is desirable; arbitrary certainty, manufactured answer menus, and fabricated memory fail. Q2 is unchanged.
- Safeguards only: no manufactured either/or; no missing dream footage; do not state inferred meaning as dream fact. Do not encode v1.2 live-edge / discovery-test / Gate taxonomies into the Reader.
- Chat non-final: exactly 1 trailing question. Chat closing/final: 0. Chat continues the existing conversation; it is not Gate/Repair/Composer.
- Pipeline: one `interpretation_*` call writes reading + questions and streams through the existing partial path. After the response completes, the narrow structure normalizer may insert only the missing heading for an unambiguous Standard/Advanced tail. `safeObserveReflectiveContract` then records marker/language/cardinality/no-answer-menu results in `quota_events.result_context.contract_validation`, while the normalizer records its separate compact telemetry. Shadow observation remains fail-open: a normal contract failure records `passed: false`; an observer exception records `passed: null`, `observation_error: true`, and a stable error code. Neither state can block delivery or trigger a retry. Partial streamed text is never normalized or buffered. The server warning contains only version/surface/error type, never raw dream/generated text. There is no question-only call, semantic judge, or hidden Gate/Repair path. Deterministic markdown extraction may still store `reflectiveQuestions`.
- Exact English `Continue the conversation` stays available in every content language. Questions appear in the typed reading, not as a high-salience card.
- Essays: `2.0.4-phase1`, exactly 2 same-call questions in the prompt contract. This retains the accepted `2.0.3` topology, metadata context version `1`, model routing, temperatures, sections, length policy, and one-shot whole-essay retry for incomplete/over-limit output only. Question validation is shadow-only.
- Deploy only through `npm run deploy:ai-entitlements-gateway`. Closed experiments stay out of selectable production routing.
- Contract tests: `__tests__/sameCallReflectiveQuestions.contract.test.ts`, `__tests__/flows/reflectiveQuestions.productionSurfaces.contract.flow.test.ts`. Records: `docs/REFLECTIVE_QUESTIONS_V2_ARCHITECTURE.md`, `docs/REFLECTIVE_QUESTION_PRODUCTION_HOLD.md`. Composer/Gate/Repair remain frozen R&D evidence.

## Happy path — first reflection

1. User opens dream with no interpretation (or stale handling per screen logic).
2. User triggers **generate** / initial reflection (online required — see below).
3. Client sends `dream_reflection_generate` with a **stable** idempotency key (`dream_reflection_generate:{dreamId}`) and async start enabled. Regenerate uses `dream_reflection_regenerate:{dreamId}:{dream.updatedAt}` so an edit starts a new job while re-tap during the same edit rejoins.
4. `ai-entitlements-gateway` reserves quota and returns a pending `quota_event_id` quickly, then continues the full-depth reflection in a background Edge task. It stamps `result_context.async_background_started` so a later reserve with the same key returns `pending` without starting a second worker.
5. Client persists `{ dreamId, quotaEventId, action, depth, startedAt }` locally, keeps a calm loading state, explains longer Deeper Dive work after the wait becomes noticeable, and polls `dream_reflection_status` for the quota event. Leaving the screen or killing the app does **not** cancel the server job; reopening DreamDetail resumes the poll (or attaches a remote interpretation if the job already committed). Soft poll timeout keeps the local handle so focus can resume instead of forcing Reflect again. If the user returns after the ~15s partial-reveal threshold (or already had streaming text), DreamDetail keeps the Exploring chat surface instead of snapping back to the calm skeleton loader.
6. If the reflection is still running after roughly 15 seconds and the gateway has streamed partial text into the quota event, DreamDetail opens the Exploring chat with a temporary assistant message that grows through append-aware phased typing (same treatment as settled assistant reflections; catch-up accelerates when the stream outpaces the typewriter). The chat panel must not use `overflow: 'hidden'` / `flex: 1` on the card wrapper (those collapse/clip the nested scroll). The chat input remains disabled because the reflection is not persisted or quota-committed yet.
7. One GPT-5.4 Reader call writes a complete reading that already includes the required reflective question(s). The gateway streams visible reading bytes, including those questions. Historical `BEGIN_DREAM_READING` envelopes remain salvageable. There is no second question inference. Only after completion, the narrow structure normalizer may insert a missing heading before an already-complete terminal question pair.
8. When the background task saves the canonical interpretation with `metadata_status: pending` and commits quota, the status poll returns the interpretation payload and the client replaces the temporary partial message with the persisted interpretation without a second immediate remote fetch. If normalization applied, the committed message contains the exact heading and its `reflectiveQuestions` array contains the original two question texts. Questions remain in the typed reading. Continue the conversation is available without answering.
9. Client starts a separate `dream_metadata_extract` gateway request after the reflection response, then the gateway takes a server-side lease for that interpretation before any metadata AI call. Only the lease holder updates the same interpretation with `display_distillation`, long-term metadata, and `metadata_status: ready` (or `failed` if the enrichment request fails, returns malformed JSON, or returns no usable metadata); concurrent callers receive a processing response and retry without duplicate OpenAI spend. DreamDetail refreshes from remote as soon as the deduped metadata extraction promise completes, does an immediate remote refresh when reopening a local `pending` / `failed` interpretation, tries another immediate refresh when the user closes chat, and keeps long-tail fallback polling instead of stopping after the first short timer window. While metadata is still pending, DreamDetail shows a small pending state instead of an empty metadata area. Pending rows restart enrichment on later DreamDetail / alternate chat loads without blocking the reflection UI.

## Backend quota model (live screen path)

- `ai-entitlements-gateway` supports:
  - `dream_reflection_generate`
  - `dream_reflection_regenerate`
  - `dream_reflection_status` (no quota spend; polls async reflection quota event)
  - `dream_metadata_extract` (post-reflection enrichment; no user quota spend)
  - `dream_followup_reply`
- Interpretation rows can now store:
  - metadata extraction state (`metadata_status`, `metadata_generated_at`, `metadata_error_code`)
  - `reflection_origin`
  - `chat_replies_used`
  - `chat_replies_limit`
  - origin quota / entitlement references
- Free-origin reflections stay eligible for their own 5 follow-up replies.
- Paid-origin reflections become read-only when paid entitlement lapses.
- Reflection AI calls have a gateway timeout; timeout/error releases the quota reservation and leaves the existing UI/input intact.
- Client and gateway import the same shared initial/follow-up builders. Local runtime is pinned to production `oneiros-dream-reflection-v3.2.3-candidate` / `oneiros-followup-chat-v2.0.1`; archived failed versions `3.2.2-candidate` / `2.0.2-candidate` are evidence only. Body and questions use the resolved 12-language contract; required headings stay English.
- Reflective Questions owns presentation cardinality inside the generated markdown: Quick 1; Standard/Advanced 2; chat non-final 1; chat final 0. `validateSameCallQuestionContract` checks structure plus the deterministic 12-language no-answer-menu firewall after the response completes. The result is stored as versioned shadow telemetry (`passed`, exact `issues`, surface, actual/expected question count, detected/expected language, answer-menu flag, observer-error fields, observation time) beside existing model/cost/latency metadata. Observer exceptions are isolated fail-open and use nullable unobserved fields. Telemetry stores no duplicate raw dream, user, or generated text and never changes the response.
- Essays remain on the QA-approved Phase-1 architecture as `2.0.4-phase1`: accepted `2.0.3` topology and metadata context version `1`, exactly two questions. Essay cardinality is owned by this surface and does not import the closed question R&D pipeline. Record: `docs/REFLECTIVE_QUESTION_PRODUCTION_HOLD.md`. Deploy the gateway only through `npm run deploy:ai-entitlements-gateway`.
- Progressive reflection display is status-poll based: the Edge task streams model chunks into `quota_events.result_context.partial_reflection`, while mobile reveals partial text only after the 15-second threshold and keeps polling until final commit. Streamed partials use append-aware phased typing with the same markdown formatter as the settled reflection (`formatInterpretationMarkdown`), with catch-up when the gateway buffer grows faster than the typewriter. If partial text was shown, the final committed reflection replaces it without replaying the typewriter from the beginning.
- Metadata extraction requests use the shared canonical prompt in `src/ai/dreamExtractionPrompt.ts` (client and gateway), enforce OpenAI JSON response format through `openai-proxy`, then Zod domain validation with one same-provider repair attempt; invalid or empty extraction output fails fast (502) so the client retry loop can recover instead of saving an empty ready metadata state.
- Metadata extraction is protected by `interpretation_metadata_extraction_jobs` and SQL claim/finish RPCs, so retries and overlapping app calls cannot start two provider metadata requests for the same pending interpretation unless the previous lease expires.
- Gateway and app logs include sanitized cost observability fields for committed reflections and metadata extraction (`reflectionCostUsd`, `metadataCostUsd`, `totalAiCostUsd`, plus flattened `costModel` / `costProvider` / token fields — and on metadata done, `reflectionCostModel` when the reflection leg is known), plus Recent Dream Field / Period Reflection generation costs, derived from provider usage tokens and the shared monthly pricing table in `src/billing/aiPricing.ts` without logging dream content or AI output.

Advanced mode means “linger longer, not explain more.” Length is earned by transformations, contradictions, and psychic resolution; `250–400` and `650–800` are telemetry bands, never minimum/maximum quality constraints. Its two required questions remain inside the same markdown reading.

## DreamDetail presentation

After reflection exists, DreamDetail presents the dream as a quiet reflection space:

- **Dream essence:** a short display distillation title and line when available.
- **Key anchors:** up to five visible anchors, sourced from `display_distillation.visible_anchors` first and metadata fallback second. Missing/empty `visible_anchors` must fall back to metadata (never crash).
- **Inner movement:** one compact tension or movement line.
- **Explore symbolic layers:** collapsed secondary metadata presented as a full-width 60dp editorial disclosure row with a right-aligned, optically centered chevron, explicit expanded/collapsed accessibility state, and a 280ms chevron/content reveal. The chevron preserves its existing path but now uses the same rounded functional stroke as search, edit, send, and copy. The full row is tappable. The resting header is transparent and has no border, elevation, fill, rounded card shape, or decorative leading icon; without the chevron it should read as ordinary page typography, not UI. It follows the closing hairline of **Inner movement** without an orphaned spacer, while the existing **Symbolic reflection** hairline completes the transition below. Its downward disclosure motion remains distinct from the **Continue the conversation** chat action. Content is grouped as:
  - **Dream Fabric** (grounded in dream text): Emotional Atmosphere (`affects`), Dream Landscapes (`landscapes`), Relationship Field (`relational_dynamics`), Thresholds (`thresholds`), Motifs (`motifs`). On a single dream, motifs are still single-dream pattern candidates rather than a confirmed cross-dream repetition.
  - **Interpretive Echoes** (provisional): Inner Tensions (`central_conflicts`), Archetypal Echoes (`archetypes`), Mythic Echoes (`amplifications`).
- **A deeper reading:** preview of the assistant reflection, using the first meaningful prose excerpt rather than stopping on a bare heading like `Core Tension`; this preview sits below **Explore symbolic layers** and uses this local label to avoid repeating the parent **Symbolic reflection** heading.
- **Same-call reflective questions:** questions stay inside the reading markdown and share its locked typing/streaming reveal. New writes do not render a separate high-salience question card. Continue the conversation remains available without requiring an answer; historical typed question artifacts remain readable.
- **Earlier-version state:** when the dream body has changed since the reflection, a quiet paper-toned note states `This reflection belongs to an earlier version of the dream.` and `Update it to include your latest changes.` before the existing **Update reflection** action. Title-only changes do not trigger it, and billing/quota behavior is unchanged.
- **Conversation action:** the locked English `Continue the conversation` label remains exact, but its 52dp quiet outlined treatment makes the action clearly tappable without becoming a filled primary CTA.
- Mythic Echoes are rare optional interpretive enrichment (0–1 closed-catalog parallel `{ catalog_id, title, tradition, source_type, resonance, divergence, evidence, confidence, catalog_myth_version }`), not Dream Fabric. Selected **from the closed Mythic narrative catalog in the same `dream_extraction` call** (compact prompt index of 128 ids; no second AI/embedding call). Model returns only `catalog_id` (or `[]`); server resolves title/tradition/source_type and rejects unknown ids with **no open-world fallback**. Flag `MYTHIC_CLOSED_CATALOG_V1` (default ON; off → `[]`). Candidate generation from **raw dream only** (reflection may help wording after `catalog_id` is locked). DreamDetail renders a compact literary card: localized `tradition_display`, localized `core_synopsis` as the first paragraph when available, then one deterministic comparison paragraph composed from stored `resonance` and optional stored `divergence` without visible subsection headings. If synopsis localization fails, DreamDetail hides only that synopsis paragraph; if `resonance` is missing, the myth card is omitted. Field: `amplifications`. Not in Forming Patterns. Legacy `difference` → `divergence` on read.
- Archetypal Echoes return 0–2 objects `{ canonical_label, expression, resonance, evidence, confidence }` with closed whitelist + concise hard gates for Double, Guide/Psychopomp, Divine Child, Terrible Mother, and Ruler (`evaluation` optional; explicit failed signals reject; missing evaluation must not empty the section; stripped before UI). Zero or one echo is normal; two is exceptional. Candidate generation from raw dream only. For v1, persisted `archetypes` are frozen from that raw-dream metadata pass and are **not** revised by follow-up chat. Resonance is shortened at generation (~20–35 words, hard max 45). DreamDetail keeps the prior accordion structure but renders each card as title + one natural paragraph: `resonance` when present, otherwise normalized `expression`. There are no visible subsection headings. Insights aggregates `canonical_label`.
- Successful extractions store `extraction_prompt_version` (`dream-field-map-interpretive-v4.1.10-M2.2`) and `extraction_schema_version` (`13`) (`prompt_version` `4.1.10-M2.2`, `temperature` `0`). Single-call architecture: Fabric + Archetypal Echoes + closed-catalog Mythic Echo with `evidence_ids` or `[]` → validators resolve exact dream spans (display spread: first/middle/last) → persist (`catalog_id` + `catalog_myth_version` on amplifications). Current repo line includes polarity-neutral Mother/Father archetype ids, output-language commit gate repair, disjoint archetype/myth namespace enforcement, a sustained-function-over-carrier archetype preference, a general archetypal-field activation rule for calm/organizing states, an explicit-negation rule so directly non-romantic companionship does not become Lover from adjacent imagery alone, a minimal `Lover 1.7.1` calm-beloved wording revision, distinctive-convergence myth ranking, and a stricter Inner Tensions rule that separates conflict from complementarity or ordinary resolved obstacles while normalizing `main_tension` against `central_conflicts`. No dream-specific prompt examples. Empty echo arrays hide Dream Detail subsections. Versioned ready rows that no longer match reopen for re-extraction; legacy null versions stay cached.
- Dream Fabric / Inner Tensions Dream Detail rendering, counts, and formatting are unchanged from the pre-copy-reduction behaviour. Echo presentation is now a deterministic composition layer only: no Show more, line clamps, Fabric redesign, prompt/schema/catalog mutation, or metadata rewrite.
- **Dev/test diagnostics:** `debug_interpretive_echoes: true` (auto in `__DEV__`) appends an additive suffix only — must not change selection. Gateway **bypasses ready-cache** when debug is set so a fresh packet is returned. Dream Detail `__DEV__` exposes “Re-extract echoes (debug packet)”; console logs `[APP][DEBUG] interpretive_echoes_packet_json` with `interpretive_diagnostics`, `post_validation_archetypes`, `post_validation_amplifications`, `mythic_echo_pipeline` (`summary` + stages: raw → parsed → normalized → `validator_decisions` → post-validation → audit/production invariant; never auto-promotes selected audit into production), and `cached:false`. Diagnostics never persist / never UI.
- **Debug path (v4.1.10-M2.2):** production benchmarks keep `debug_interpretive_echoes` OFF. Optional debug may return compact `selection_notes` only — never persist/UI, never auto-promote diagnostics into production echoes. Legacy `mythic_echo_pipeline` staging remains available in code for investigating normalize/validate drift when debug is explicitly enabled.
- Fabric fields must map compactly: affects = felt tones only (never images); relational dynamics = pattern labels (not plot summary); thresholds/motifs = short canonical phrases.
- Metadata extraction uses the shared canonical prompt in `src/ai/dreamExtractionPrompt.ts` with an explicit SOURCE BOUNDARY between Dream Fabric and Interpretive Echoes. User-facing extraction strings follow the dream's primary language; schema enums and whitelisted archetype `canonical_label` values stay English.
- Server-side archetype normalization must accept raw extraction rows that carry only `archetype_id` plus `mechanism_tags` / `evidence_ids`; `canonical_label` is resolved from the closed catalog before validation/persistence so valid Guide / Divine Child echoes do not disappear between debug packet and DreamDetail render.
- The production extraction path must also recover archetype candidates directly from the raw model object before validation when the first parsed archetype list is unexpectedly empty; otherwise valid `archetype_id` rows can vanish before persistence and DreamDetail will never receive them on the initial save.

Dream-level `dream.symbols` / `dream.archetypes` are not shown as primary chips on DreamDetail.

## Follow-up chat (same screen)

- Inline chat after initial assistant message.
- The follow-up chat keeps its existing Exploring presentation; the exact `Continue the conversation` trigger lives lower in the Dream Details flow, after the **Explore symbolic layers** inline disclosure, and remains the clearly separate chat action.
- The **Exploring the dream** panel should read as a distinct surface when opened: one raised paper-glass vessel for the full-width assistant reflection/chat prose, without a nested glass bubble. Section titles sit tight above body copy; scroll content keeps bottom padding clear of the Ask composer. User follow-ups stay as distinct chat chips.
- While a follow-up reply is in flight, the shared six-line reflection loader appears as an inline assistant pending row inside the chat surface instead of replacing the send button. Follow-up metadata updates may revise affects, motifs, relational dynamics, thresholds, central conflicts, and core mode, but they must not rewrite persisted `archetypes` or closed-catalog `amplifications`.
- The follow-up answer uses `oneiros-reflective-dialogue-v1.9.1`: role-preserving history restores the exact typed question artifact the user saw. `reply_mode` gives explicit stopping priority, allows brief acknowledgment, and distinguishes correction, not-knowing, meaning request, grief, and positive coherence without adding hidden material. A strict `{ answer, output_language, reply_mode }` envelope is validated before prose is persisted. Absence/non-event is not converted into defense, numbness, hidden lack, latent significance, integration, acceptance, harmlessness, or absence of injury. A user-led waking association may be followed; assistant-led biography is forbidden.
- After the answer succeeds, the gateway creates request-local `U#` spans from user messages only, combines them with raw-dream `D#`, and may add zero or one question artifact. Assistant prose remains provisional orientation and never receives an evidence id. The next question must arise from a relation changed or opened by `U#`; it may deepen the same image but must not restate the answered visible question, force an answer menu, or ask for invented plot continuation. Natural completion should abstain. The final allowed reply skips the question subsystem.
- Defense in depth: if the answer model appends an isolated closing question paragraph despite the prose-only contract, client and gateway remove only that isolated paragraph before persistence/question generation. Earlier answer prose is not truncated or rewritten.
- **Nested scroll contract (do not regress):** the Exploring chat is a nested `ScrollView` inside the page `ScrollView`, with a bounded `maxHeight` (`src/screens/dreamDetailChatLayout.ts`) and `nestedScrollEnabled`. Never put `overflow: 'hidden'` on that chat scroll style, and avoid forcing `width: '100%'` on assistant `Text` inside it — those clip or under-measure long reflections so users only see the first section (e.g. Core Shift + one paragraph) and cannot reach later body or Reflective Questions. Covered by `__tests__/dreamDetailChatLayout.test.ts` and `__tests__/flows/dreamDetail.chatScroll.flow.test.tsx`.
- Follow-up replies must not force-scroll the nested chat to the bottom once the assistant answer lands; after the user sends, the chat can reveal the pending row, but reading position remains user-controlled while the assistant response appears and settles.
- Follow-ups send `dream_followup_reply` through the entitlement gateway. Quota commit increments `chat_replies_used` via `billing_commit_quota` using **text** `interpretation_id` (same type as `interpretations.id` — never cast to uuid). Chat turns persist only after a successful commit so a commit failure does not leave orphan messages. New commits also retain compact user/assistant message IDs in quota result context. Replaying an already-committed idempotency key reconstructs the original reply/messages from the persisted interpretation and committed quota result; it never calls the model, commits quota, or writes the turn again. Legacy committed results without IDs use only a constrained adjacent-message match, and an unreconstructable commit returns an explicit conflict rather than spending again.
- Limit comes from `chat_replies_used` and `chat_replies_limit`, with a 5-reply fallback.
- Paid-origin reflections become read-only after lapse and route to renewal / premium upsell messaging.

## Offline behavior

- Before **initial** generation or **update** reflection: `isOnline()` check; if offline → **OfflineMessage** (timed).
- **Send chat message** while offline: same offline message pattern; no request sent.

## Regenerate / update interpretation

- User can request an updated reflection after editing the dream.
- Regenerate maps to `dream_reflection_regenerate`.
- Regenerate is treated as a premium action, so free users and lapsed paid users are routed to the premium upsell / renewal state.

## Delete interpretation

- Possible from detail flow (e.g. reset / delete path) via `deleteInterpretation` — local + remote best-effort.

## `InterpretationChatScreen`

- Parallel implementation: dream load, interpretation load, gateway-based generate/chat, offline checks, voice button, and premium lapse read-only handling.
- Voice transcription follows the shared offline-first contract: capture works without connectivity but preflights the 50 MiB device-storage safety floor and verifies `voice_pending/` before native recording; generation-fenced start prevents unmount or navigation from orphaning a recorder; background/navigation/interruption/native-error and dual-manifest-failure paths return a live salvage candidate; checksummed queue snapshots expose saved/transcribing/retrying state. Logout cleanup is integrity-aware and retains metadata/fence on corrupt or partial snapshots, attribution conflicts, sidecar scan/parse failure, or unverifiable deletion. A server+client quality-gated transcript is durably committed to an owner-bound per-user chat composer with clip-ID dedupe, immediately applied to the visible input, and explicitly acknowledged by clip ID plus composer revision. Queue/audio cleanup follows independently; a failure leaves `deletion_pending` without hiding the committed text. Owner-and-revision capture at command creation, invalidation/draining across auth cleanup, identity-based delivery rebasing, and edit-revision-guarded hydration prevent cross-account writes, repeated-phrase loss, stale saves, or stale reads. Caption-credit hallucinations such as `Υπότιτλοι AUTHORWAVE` must never reach the composer. The mic remains disabled while the chat is loading or read-only.
- In DreamDetail and InterpretationChat composers, the mic stays visually compact: queue/transcription status copy and recovery actions must not expand upward into the chat transcript area.
- For regression: if product wires navigation here later, mirror tests from DreamDetail.

## Regression ideas

- DreamDetail Exploring chat: open a long multi-section reflection (Core Shift + later body + Reflective Questions) and confirm the nested chat scrolls; do not reintroduce `overflow: 'hidden'` on `dreamDetailChatLayout` / `chatScrollView`.
- Reflection with each depth level + mythic on/off (advanced only).
- Gateway reflection success: committed response can carry the canonical interpretation directly, mirrors it locally, and avoids an immediate second fetch.
- Leave/kill mid-loading: reopen DreamDetail → loading resumes from the persisted `quota_event_id` (or remote attach if already committed); Reflect is not required again. Soft client poll timeout keeps the handle. After partial reveal, reopen keeps the Exploring stream UI (no skeleton flash).
- Double-tap Reflect / stable idempotency replay: gateway returns the same pending event without a second background worker.
- Async metadata: pending rows render the reflection/chat immediately, a separate metadata action fills `display_distillation` and metadata, pending rows restart enrichment on later loads, and remote refresh brings the completed fields local without changing quota usage.
- Reflection timeout (server failure): quota is released and no pending interpretation row is shown as completed; client clears the local job handle on `released` / `denied`.
- If `openai-proxy` fails OpenAI, it tries ordered Anthropic fallbacks (`claude-sonnet-5` then `claude-haiku-4-5` for reflection). Misconfigured sampling (e.g. sending `temperature` to Sonnet 5) used to kill the whole rescue; the proxy must omit forbidden params and continue to Haiku. See `supabase/functions/openai-proxy/README.md` “Sampling params”. After `task-config` fallback changes, redeploy `openai-proxy` and smoke-test Advanced reflection.
- Metadata prefetch: unchanged dream content reuses cached extraction, changed content re-extracts, and in-flight prefetches are deduped.
- Hit follow-up limit → send disabled / messaging.
- Paid-origin reflection after lapse → read-only messaging + premium upsell.
- Network drop mid-request → error alert, input restored where implemented.
- Interpretation sync: create on device A, login device B → merge `display_distillation`, `symbol_stances`, and long-term metadata without dropping local-only optional fields.
