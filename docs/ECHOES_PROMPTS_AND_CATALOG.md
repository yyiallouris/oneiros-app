# Archetypal / Mythic Echo prompts & catalog (v4.1.10-M2.2)

> **2026-08-29 production orchestration boundary:** approved `oneiros-reflective-question-production-v1.0.0` / SHA `fc8b6304…` always returns one schema-11 question after the frozen Reader + v1.2 Generator, Integrity Gate, Premise Check, and at most one Repair. Depth maps `quick→core`, `standard→core`, `advanced→deeper`. Prompt R&D on System 4 / Gate / Repair is STOP. This changes **no** extraction prompt id/version/schema, Archetype/Mythic catalog, Echo selection, Echo validation, `display_distillation`, or metadata language gate. Record: [`ONEIROS_QUESTION_REPAIR_PHASE2_EDITORIAL_FAIL_2026-08-29.md`](./ONEIROS_QUESTION_REPAIR_PHASE2_EDITORIAL_FAIL_2026-08-29.md).

> **2026-08-28 Composer v1.1.0 boundary (historical):** `oneiros-reflective-question-composer-v1.1.0-candidate` is not the production writer. Same-call v1.2.0 (`oneiros-same-call-minimal-v1.2.0-candidate`, SHA `4506c898…`) won the paired Standard/CORE gate 8/8 versus frozen v1.1.0 (`8e0edada…`) and is frozen exactly as tested.

> **2026-08-28 Post-reading Inviter R&D boundary:** offline SHA `70c533e5…` separated a frozen reading-only GPT-5.4 Reader from a second GPT-5.4 `question | no_question` Inviter. Gate 1 failed at `1 CLEAR PASS / 1 BORDERLINE / 6 FAIL`; the candidate is denied and no continuation ran. It was never a runtime import and changed no extraction prompt, schema, Echo selection, catalog, `display_distillation`, archetype, amplification, persistence, or metadata-language behavior.

> **2026-08-28 Reflective Dialogue / Questions boundary:** the fail-closed local candidate `oneiros-reflection-editorial-arc-v2.0.0-candidate` uses one GPT-5.4 `interpretation_*` call for a private `question | no_question` decision followed by complete `oneiros-dream-reflection-v3.1.0-candidate` prose (protocol `v2`, artifact schema `8`, SHA `6cd304e1…`). Reading and optional card remain separate user-facing artifacts; chat stays Dialogue `1.9.1` plus optional v5 questions. Its anchor Gate failed at internal `2 CLEAR PASS / 6 FAIL`; the exact SHA is denied. This changes **no** extraction prompt id/version/schema, Archetype/Mythic catalog, Echo selection, Echo validation, `display_distillation`, or metadata language gate. `archetypes` and `amplifications` remain frozen from raw-dream extraction in the lower Dream Detail experience and cannot be revised by chat. Records: [`REFLECTIVE_QUESTIONS_V2_ARCHITECTURE.md`](./REFLECTIVE_QUESTIONS_V2_ARCHITECTURE.md), [`REFLECTIVE_QUESTION_PRODUCTION_HOLD.md`](./REFLECTIVE_QUESTION_PRODUCTION_HOLD.md). Historical v1 failure evidence remains in [`ONEIROS_REFLECTION_EDITORIAL_ARC_GATE1_REVIEW_2026-08-28.md`](./ONEIROS_REFLECTION_EDITORIAL_ARC_GATE1_REVIEW_2026-08-28.md).

> **2026-08-28 offline Inviter v2 note:** `oneiros-post-jungian-inviter-v2.0.1-candidate` (`09045bf1…`) ran its exact eight frozen Inviter-only calls for `$0.043675`. Mechanics passed `8/8`, but blind human review failed at `0 CLEAR PASS / 1 BORDERLINE / 7 FAIL`; the sixteen-case continuation did not run and the SHA is denied. This experiment changed no reading, extraction, Echo, Archetype, Mythic, `archetypes`, `amplifications`, or `display_distillation` prompt/catalog/schema. Its review record is [`ONEIROS_POST_JUNGIAN_INVITER_V2_GATE1_REVIEW_2026-08-28.md`](./ONEIROS_POST_JUNGIAN_INVITER_V2_GATE1_REVIEW_2026-08-28.md).

> **2026-08-26 transcription note:** voice transcription uses server-owned, language-neutral strategy `voice-transcription-v3.0.0-language-neutral` and `gpt-transcribe` (no primary prose prompt; detected-language hints only on bounded recovery). This is an independent pre-dream-input path; no Echo prompt, extraction id/version, schema, catalog, evidence, or validation behavior changed.

> **2026-08-26 reflective-essay Phase 2 final note:** Period Reflection and Recent Dream Field keep the frozen prompt ids `oneiros-period-reflection-v2` / `oneiros-recent-dream-field-v2` at `2.0.3-phase1`. Production returns to metadata-heavy context version `1`, which includes bounded Archetypal and Mythic Echo summaries. Narrative-first context version `2` and the Field Map pre-pass are offline research artifacts only. Echo extraction, catalog, validation, persistence, Insights aggregation, and Dream Detail behavior are unchanged.

> Phase 2 scored `7 PASS / 2 FAIL`; the one permitted Field Map spike then failed its stop rule at manual `2 PASS / 7 FAIL`. Phase 2 R&D is closed and neither context-v2 nor Field Map is approved for deployment. No Echo extraction, catalog, schema, persistence, or UI change is authorized.

> **2026-08-26 reflective-essay topology-first calibration:** essay prompt version `2.0.3-phase1` chooses one supported field, parallel/local clusters, or a loose field before interpretation and must preserve that topology through every section and question. Generic interpretive qualities and prior interpretation language cannot serve as the sole bridge; quoting one anchor per dream is still insufficient when distinct actions become similar only through an umbrella paraphrase. That prompt is frozen for the Phase 2 context-only evaluation. No Echo prompt, extraction id/version, schema, catalog, validator, persistence, or Dream Detail behavior changed.

Canonical sources:
- Prompt: `src/ai/dreamExtractionPrompt.ts` (`prompt_version` `4.1.10-M2.2`)
- Prompt id: `dream-field-map-interpretive-v4.1.10-M2.2` / schema `13`
- Current production notes: `documentation/architecture-interpretation.md`, `documentation/flows-06-jungian-ai-reflection.md`, `docs/SYMBOLS_FLOW.md`
- Mythic closed-catalog brief: `docs/ONEIROS_CLOSED_MYTH_CATALOG_INTEGRATION_BRIEF.md`
- Full catalog JSON: `src/ai/catalogs/mythic_narrative_catalog.v1.json` (build-time; version `1.2.0`, 128 entries)
- Compact prompt index: `src/ai/catalogs/generated/mythicPromptIndex.v1.ts` (`npm run build:mythic-prompt-index`)
- Evidence spans: `src/ai/dreamEvidenceSpans.ts` (Patch A — model returns `evidence_ids`, server resolves exact spans)
- Mechanism tags + hard gates: `src/ai/archetypeMechanisms.ts` + `src/ai/validators/archetypalEchoValidator.ts`
- Feature flag: `MYTHIC_CLOSED_CATALOG_V1` (default ON; never open-world)
- Runtime: `temperature: 0`
- Output-language gate: `src/ai/dreamOutputLanguage.ts` (field-scoped repair only for wrong-language user-facing strings)
- Acceptance suite (always parallel by default): `bash scripts/run-5-dream-acceptance.sh`
- Naturalistic myth calibration benchmark (diagnostic-only, 24 fixtures × 3 repeats): `bash scripts/run-naturalistic-myth-benchmark.sh`
- Tracked live-test scenarios: `testing/live-scenarios/` (generated live artifacts stay under `tmp/`)
- Closed copper-vessel (always parallel by default): `bash tmp/runClosedMythCatalogBenchmark.sh`
- Pro-reviewer Phase 0 logs: `tmp/phase0-v411-diagnostics-2026-07-26T23-14-00-608Z/PHASE0_PACKAGE.json`
- Patch B/C reviewer logs: `tmp/v412-reviewer-logs/`

## Current line

```text
Prompt:            v4.1.10-M2.2 / schema 13 / temperature 0
Archetype catalog: closed `archetype_id` selection, polarity-neutral Mother/Father ids, Lover 1.7.1 wording
Myth catalog:      closed `catalog_id` selection, version 1.2.0, namespace-safe enums
Server validator:  deterministic mechanism hard gates + evidence_ids resolve + integrity-only myth validation
Language gate:     deterministic output-language commit gate with field-scoped repair
Tests/benchmarks:  benchmark docs and live scenarios versioned against the current line
```

## Mythic Echo

Closed catalog only. Model returns `catalog_id` + `evidence_ids` (`Dn`) or `[]`.
Server resolves title/tradition/source_type and exact evidence spans from the numbered dream body.

## Archetypal Echoes

Current repo line uses closed `archetype_id` selection with mechanism-tag hard gates, namespace-safe validation, and polarity-neutral Mother/Father ids. Patch `4.1.10-M2.2` keeps the M2.1 calm-field activation layer, adds a general explicit-negation rule so directly denied archetypal functions do not overfire from neighboring imagery, applies a minimal `Lover 1.7.1` catalog wording revision for calm beloved intimacy vs warm companionship, and tightens Inner Tensions so layered/cohesive contrasts or ordinary resolved obstacles do not become false conflict. Output is still constrained to 0–2 echoes, with evidence selected from the raw dream only and wording allowed to use reflection only after selection is fixed.

## Maintenance rule

Whenever `src/ai/dreamExtractionPrompt.ts`, `src/ai/dreamExtractionJsonSchema.ts`, `src/ai/structuredTaskValidation.ts`, `src/ai/dreamOutputLanguage.ts`, `src/ai/catalogs/*`, or connected gateway extraction wiring changes, update this document and `docs/AI_PROMPTS_INVENTORY.md` in the same commit. Keep prompt id, prompt version, schema version, and surfaced catalog version aligned with code.

## Independent pipelines

Myth selection must not force an archetype; archetype selection must not force a myth.

## Standalone Archetype Recognition Spike

Separate from the monolithic extraction line, the repo now contains an isolated 2-pass archetype spike:

```text
task: dream_archetype_recognition
prompt_id: dream-archetype-recognition-v1.0.0
prompt_version: 1.0.0
response_schema_version: 1
recognition_catalog_version: 2.0.0
default spike model: gpt-5.4-mini-2026-03-17
temperature: 0

task: dream_archetype_adjudication
prompt_id: dream-archetype-adjudication-v1.0.0
prompt_version: 1.0.0
response_schema_version: 1
boundary_catalog_version: 1.0.0
```

Files:

```text
src/ai/archetypeRecognitionPrompt.ts
src/ai/catalogs/archetypeRecognitionCatalog.v2.ts
src/ai/schemas/archetypeRecognitionSchema.ts
src/ai/archetypeRecognitionMapper.ts
src/ai/archetypeAdjudicationPrompt.ts
src/ai/catalogs/archetypeBoundaryCatalog.v1.ts
src/ai/schemas/archetypeAdjudicationSchema.ts
src/ai/archetypeRecognitionPipeline.ts
tmp/run-archetype-recognition-v2-regression.ts
tmp/run-archetype-recognition-adjudication-regression.ts
```

Contract:

```text
discovery input:
- raw dream
- numbered raw-dream evidence spans
- target language
- compact closed recognition catalog

adjudication input:
- raw dream
- numbered raw-dream evidence spans
- discovery candidates
- candidate-specific boundary records
- target language

excluded from both:
- final interpretation
- Dream Fabric fields
- central_conflicts
- core_mode
- myth catalog / myth instructions
- mechanism tags
- legacy mechanism gates
- reflection
```

Validation on the discovery path is intentionally narrow:

```text
- valid closed catalog id
- max 2
- no duplicate ids
- valid evidence ids
- non-empty quality/expression/resonance
- high|medium confidence
- correct output language
```

Validation on the adjudication path checks candidate-only accept/reject decisions, evidence ids, accepted-id alignment, and output language. The adjudicator cannot add new archetypes or rewrite discovery `quality` / `expression` / `resonance`; accepted rows preserve discovery wording exactly.

This path does **not** use the legacy mechanism-tag semantic gate. It exists only as a standalone spike for live evaluation and reviewer inspection.
