# Archetypal / Mythic Echo prompts & catalog (v4.1.3-B)

Canonical sources:
- Prompt: `src/ai/dreamExtractionPrompt.ts` (`prompt_version` `4.1.3-B`)
- Prompt id: `dream-field-map-interpretive-v4.1.3-b` / schema `7`
- Patch B brief: `docs/ONEIROS_V4_1_3_POST_PATCH_A_DEV_BRIEF.md`
- Patch B freeze: `docs/ONEIROS_V4_1_3_PATCH_B_FREEZE.md`
- Patch A brief/freeze: `docs/ONEIROS_V4_1_2_TARGETED_FIX_DEV_BRIEF.md` + `docs/ONEIROS_V4_1_2_PATCH_A_FREEZE.md`
- Mythic closed-catalog brief: `docs/ONEIROS_CLOSED_MYTH_CATALOG_INTEGRATION_BRIEF.md`
- Full catalog JSON: `src/ai/catalogs/mythic_narrative_catalog.v1.json` (build-time; version `1.1.0`, 128 entries)
- Compact prompt index: `src/ai/catalogs/generated/mythicPromptIndex.v1.ts` (`npm run build:mythic-prompt-index`)
- Evidence spans: `src/ai/dreamEvidenceSpans.ts` (Patch A — model returns `evidence_ids`, server resolves exact spans)
- Mechanism tags + hard gates: `src/ai/archetypeMechanisms.ts` + `src/ai/validators/archetypalEchoValidator.ts`
- Feature flag: `MYTHIC_CLOSED_CATALOG_V1` (default ON; never open-world)
- Runtime: `temperature: 0`
- Acceptance suite (always parallel by default): `bash scripts/run-5-dream-acceptance.sh`
- Naturalistic myth calibration benchmark (diagnostic-only, 24 fixtures × 3 repeats): `bash scripts/run-naturalistic-myth-benchmark.sh`
- Tracked live-test scenarios: `testing/live-scenarios/` (generated live artifacts stay under `tmp/`)
- Closed copper-vessel (always parallel by default): `bash tmp/runClosedMythCatalogBenchmark.sh`
- Pro-reviewer Phase 0 logs: `tmp/phase0-v411-diagnostics-2026-07-26T23-14-00-608Z/PHASE0_PACKAGE.json`
- Patch B/C reviewer logs: `tmp/v412-reviewer-logs/`

## Direction

```text
Prompt:            small general selection rule (no dream-specific examples)
Archetype catalog: function signatures + compact require-mechanisms lines
Server validator:  deterministic mechanism hard gates + evidence_ids resolve
Tests/benchmarks:  concrete dreams and expected catalog_ids
```

## Mythic Echo

Closed catalog only. Model returns `catalog_id` + `evidence_ids` (`Dn`) or `[]`.
Server resolves title/tradition/source_type and exact evidence spans from the numbered dream body.

## Archetypal Echoes

v4.1.3-B (Patch B): Trickster is `archetypal_function` with `allowedCarrierKinds`, `mechanism_actor` alignment, and `carrier_evidence_ids` / `mechanism_evidence_ids` for ownership validation. Other gated labels unchanged from v4.1.1.

## Independent pipelines

Myth selection must not force an archetype; archetype selection must not force a myth.
