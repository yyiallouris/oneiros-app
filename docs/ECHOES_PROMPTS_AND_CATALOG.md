# Archetypal / Mythic Echo prompts & catalog (v4.1.10-M2.2)

Canonical sources:
- Prompt: `src/ai/dreamExtractionPrompt.ts` (`prompt_version` `4.1.10-M2.2`)
- Prompt id: `dream-field-map-interpretive-v4.1.10-M2.2` / schema `13`
- Current production notes: `documentation/architecture-interpretation.md`, `documentation/flows-06-jungian-ai-reflection.md`, `docs/SYMBOLS_FLOW.md`
> **2026-08-27 reflective-question production hold:** recovered remote `ai-entitlements-gateway` v105 is `reflective-question-psychological-aliveness-v1.4.0` SHA `4885e351…`, not a verified `v1.5.0` method id. Deploy only through `npm run deploy:ai-entitlements-gateway`. Record: [`REFLECTIVE_QUESTION_PRODUCTION_HOLD.md`](./REFLECTIVE_QUESTION_PRODUCTION_HOLD.md). No Echo prompt, extraction, catalog, or runtime question prompt changed.
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
