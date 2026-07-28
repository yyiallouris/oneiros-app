# Archetypal / Mythic Echo prompts & catalog (v4.1.9-M1)

Canonical sources:
- Prompt: `src/ai/dreamExtractionPrompt.ts` (`prompt_version` `4.1.9-M1`)
- Prompt id: `dream-field-map-interpretive-v4.1.9-M1` / schema `13`
- Current production notes: `documentation/architecture-interpretation.md`, `documentation/flows-06-jungian-ai-reflection.md`, `docs/SYMBOLS_FLOW.md`
- Mythic closed-catalog brief: `docs/ONEIROS_CLOSED_MYTH_CATALOG_INTEGRATION_BRIEF.md`
- Full catalog JSON: `src/ai/catalogs/mythic_narrative_catalog.v1.json` (build-time; version `1.7.0`, 128 entries)
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
Prompt:            v4.1.9-M1 / schema 13 / temperature 0
Archetype catalog: closed `archetype_id` selection, polarity-neutral Mother/Father ids
Myth catalog:      closed `catalog_id` selection, version 1.7.0, namespace-safe enums
Server validator:  deterministic mechanism hard gates + evidence_ids resolve + integrity-only myth validation
Language gate:     deterministic output-language commit gate with field-scoped repair
Tests/benchmarks:  benchmark docs and live scenarios versioned against the current line
```

## Mythic Echo

Closed catalog only. Model returns `catalog_id` + `evidence_ids` (`Dn`) or `[]`.
Server resolves title/tradition/source_type and exact evidence spans from the numbered dream body.

## Archetypal Echoes

Current production line uses closed `archetype_id` selection with mechanism-tag hard gates, namespace-safe validation, and polarity-neutral Mother/Father ids. Output is still constrained to 0–2 echoes, with evidence selected from the raw dream only and wording allowed to use reflection only after selection is fixed.

## Maintenance rule

Whenever `src/ai/dreamExtractionPrompt.ts`, `src/ai/dreamExtractionJsonSchema.ts`, `src/ai/structuredTaskValidation.ts`, `src/ai/dreamOutputLanguage.ts`, `src/ai/catalogs/*`, or connected gateway extraction wiring changes, update this document and `docs/AI_PROMPTS_INVENTORY.md` in the same commit. Keep prompt id, prompt version, schema version, and surfaced catalog version aligned with code.

## Independent pipelines

Myth selection must not force an archetype; archetype selection must not force a myth.
