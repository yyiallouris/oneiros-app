# Oneiros naturalistic myth calibration benchmark

Diagnostic-only phase for the frozen Mythic Echo layer.

## Baseline

The current repository runtime on **July 27, 2026** is:

| Field | Value |
|---|---|
| `prompt_id` | `dream-field-map-interpretive-v4.1.9-M1` |
| `prompt_version` | `4.1.9-M1` |
| `schema_version` | `13` |
| `archetype_catalog_version` | `1.7.0` |
| `myth_catalog_version` | `1.2.0` |
| myth layer | C.1.1 frozen |
| model target | `gpt-5.4-mini-2026-03-17` |
| fallback | disabled |

The benchmark records the actual returned model and fails packet integrity if any completed run is not `gpt-5.4-mini-2026-03-17` or if fallback appears.

## Dataset

- Source manifest: `docs/myth-naturalistic-calibration.v1.0.0.json`
- JSONL view: `docs/ONEIROS_MYTH_NATURALISTIC_CALIBRATION_BENCHMARK.jsonl`
- Leakage report: `docs/ONEIROS_MYTH_NATURALISTIC_CALIBRATION_BENCHMARK_LEAKAGE.json`

Composition:

| Arm | Count |
|---|---|
| `strong_positive` | 8 |
| `incomplete_positive` | 6 |
| `thematic_negative` | 6 |
| `competitor` | 4 |

Language split: `en=18`, `el=6`

## Commands

```bash
npm run sync:myth-naturalistic-benchmark
npm run review:myth-naturalistic-dataset
bash scripts/run-naturalistic-myth-benchmark.sh
```

The live runner executes `24 fixtures × 3 repeats = 72 runs`, concurrency `2`, with exponential backoff + jitter on `429`.
If `MYTH_BENCHMARK_OUT_DIR` points at an existing benchmark directory, the runner resumes in place:

- existing successful canonical run records are preserved
- missing runs are appended
- failed/incomplete artifacts are retried
- the packet is rebuilt from the combined canonical set

## Artifacts

Every live run directory writes:

- `acceptance_runs.json`
- `summary.json`
- `ONEIROS_MYTH_NATURALISTIC_V1_REVIEWER_PACKET.json`
- `ONEIROS_MYTH_NATURALISTIC_V1_COPY_PASTE.txt`
- `myth-naturalistic-calibration.v1.0.0.json`
- `benchmark_manifest.json`
- `failed_runs.json` always, using `[]` when recovery reaches 72/72

Primary metrics:

- overall contract pass
- exact catalog precision / recall
- strong-positive recall
- incomplete-positive recall
- thematic-negative empty accuracy
- competitor exact-ID accuracy
- wrong-competitor rate
- high-confidence false positives
- raw-to-post retention
- raw candidate omission count
- raw correct-post removed count
- evidence resolution failure count
- validator rejection count
- language-match rate
- repeat consistency

Reviewer failure packets also include exact per-arm numerators/denominators plus primary/secondary review hypotheses for each failed contract run.

## Decision rule

Use this benchmark to decide whether the frozen myth layer is already selective, too strict on incomplete-but-distinctive parallels, catalog-specific, or already too generous. Do not tune production prompts, routing, or catalog records before the packet is reviewed.
