# Oneiros — Global archetype evaluation benchmark

Observability phase for the **entire selectable archetype catalog**. Replaces one-archetype-at-a-time diagnostic loops.

**Do not run until dataset v1.1.0 is reviewed and frozen.** No production changes in this phase.

## Frozen production baseline

| Field | Value |
|---|---|
| `prompt_version` | `4.1.9-M1` |
| `schema_version` | `13` |
| `archetype_catalog_version` | `1.7.0` |
| myth layer | C.1.1 frozen |
| Hero layer | D.1 `accepted_with_known_residuals` |
| Patch E / E.1.1 | `accepted_with_known_residuals` |

Current M1 baseline uses the polarity-neutral `mother` catalog id plus new `father` id. Legacy `great_mother` / `terrible_mother` fixtures are superseded by the v1.2.0 dataset and should not be reintroduced into the live runner.

## Dataset versions

| Version | File | Role |
|---|---|---|
| **1.1.0** (current) | `ONEIROS_GLOBAL_ARCHETYPE_BENCHMARK.jsonl` | Sanitized + naturalistic — **run this** |
| 1.0.0 (archived) | `ONEIROS_GLOBAL_ARCHETYPE_CATALOG_CONFORMANCE_V1.jsonl` | White-box catalog-paraphrase suite — **do not delete** |

Source of truth (TypeScript): `scripts/lib/globalArchetypeBenchmarkFixtures.ts`  
Archived v1.0.0: `scripts/lib/globalArchetypeBenchmarkFixtures.v1.0.0.ts`

### v1.2.0 composition (74 fixtures)

| Arm | Count | `evaluation_style` |
|---|---|---|
| A — single-primary positives | 45 | `catalog_conformance` + `naturalistic` |
| B — mixed | 11 | `catalog_conformance` |
| C — contrast / negative | 18 | `catalog_conformance` + `naturalistic` |

v1.2.0 adds `NAT_lover_sea_mattress_en` (Patch E Lover regression — benchmark only).

| Version | File | Role |
|---|---|---|
| **1.2.0** (current) | `ONEIROS_GLOBAL_ARCHETYPE_BENCHMARK.jsonl` | + Lover naturalistic regression |
| **1.1.0** (frozen) | archived in fixtures v1.1.0 export | pre–Patch E baseline |

**Two score buckets, one run:**

```text
catalog_conformance_score         (61 fixtures)
naturalistic_generalization_score (13 fixtures)
global                            (74 fixtures)
```

If catalog conformance is ~90% but naturalistic is ~40%, the catalog is learnable but real extraction does not generalize.

### Fixture contract

```json
{
  "evaluation_style": "catalog_conformance",
  "required_archetype_ids": ["death_rebirth"],
  "acceptable_secondary_ids": ["guide_psychopomp"],
  "forbidden_archetype_ids": ["hero", "mother"],
  "expected_cardinality": { "min": 1, "max": 2 }
}
```

### Anima / Animus convention

**Carrier-function labels independent of dreamer gender** (`soul_image_convention: carrier_function_independent_of_dreamer_gender` on anima/animus fixtures).

Gold labels reflect mediating soul-image function in the dream narrative, not assumed dreamer sex/gender.

### Sanitation rules (v1.1.0)

Dream text must **not**:

- explain its own interpretation (`the dream turns on`, `structural function`, `not merely`, …)
- use catalog/archetype terminology (`psychopomp`, `hieros gamos`, `anima`, `persona`, …)
- state negatives via gate vocabulary (`no escort`, `no boon`, …)

Absence is shown through images and actions only.

### Scoring invariant

Any post-validation archetype ID outside `required_archetype_ids ∪ acceptable_secondary_ids` counts as an **unexpected false positive** and fails the fixture contract — even when the ID is not listed in `forbidden_archetype_ids`. Forbidden IDs name high-value named confusions, not an exhaustive complement of wrong answers.

### Leakage validator

```bash
npm run sync:global-archetype-benchmark
```

Writes `docs/ONEIROS_GLOBAL_ARCHETYPE_BENCHMARK_LEAKAGE.json` — flags catalog IDs, labels, `selectWhen`/`insufficientWhen` phrases, mechanism tags, and interpretive meta-language. **Review before first run.**

### Pre-run review packet (no API calls)

```bash
npm run review:global-archetype-dataset
```

Writes:

- `tmp/ONEIROS_GLOBAL_ARCHETYPE_DATASET_REVIEW_PACKET.json` — all 71 fixtures + contracts + leakage + stats
- `tmp/ONEIROS_GLOBAL_ARCHETYPE_DATASET_REVIEW_PACKET.md` — human-readable summary for pro-reviewer freeze pass

### Defensible overlaps

`acceptable_secondary_ids` used where a second interpretation is genuinely supported (e.g. Shadow/Double, Wise Old / Guide, Self/Sacred Marriage). Not every overlap is acceptable — reviewed per fixture.

## How to run (after freeze)

```bash
bash scripts/run-global-archetype-benchmark.sh
# default concurrency 2 (TPM-safe); raise only if needed:
GLOBAL_BENCHMARK_CONCURRENCY=4 bash scripts/run-global-archetype-benchmark.sh
```

429s retry with exponential backoff + jitter inside the runner.

Protocol:

1. Review + freeze dataset v1.1.0.
2. **One run per fixture** — no tuning, no per-archetype reruns.
3. One reconciled reviewer packet.
4. **No production fixes** until full packet reviewed.

## Metrics

Reported globally and per `evaluation_style`:

- contract pass (primary metric when `acceptable_secondary_ids` present)
- exact-set accuracy (required IDs only; acceptable secondaries may be omitted)
- unambiguous exact-set accuracy (fixtures with empty `acceptable_secondary_ids` only)
- required-label recall, forbidden FP rate
- per-archetype precision / recall, macro P/R
- empty-dream accuracy, cardinality, raw→post retention
- confusion pairs, slot competition (mixed arm — legacy strict both-required count)
- mixed adjudication (`distinct_functions_or_carriers` vs `same_carrier_dual_reading`)
- model routing (`primary_model_runs`, `fallback_model_runs`, metrics grouped by actual model)
- myth regression telemetry only

Cost summary uses structured `cost.estimatedUsd` — never concatenates objects; reports `total_estimated_usd: null` when unavailable.

Incomplete suites (`completed_runs < total_fixtures`) must set `packet_complete: false` and include `failed_run_records`.

## Reconciliation pass (after first routing-inclusive run)

Preserve the original 70-run routing-system packet, then reconcile reporting:

```bash
npx tsx scripts/reconcile-global-archetype-benchmark.ts tmp/global-archetype-benchmark-<stamp>
```

Writes preserved copy: `tmp/ONEIROS_GLOBAL_ARCHETYPE_ROUTING_SYSTEM_PACKET.json`

Primary-only rerun (43 fallback + missing fixtures only; merge with 27 existing primary runs):

```bash
GLOBAL_BENCHMARK_CONCURRENCY=2 npx tsx scripts/run-global-archetype-primary-rerun.ts tmp/global-archetype-benchmark-<stamp>
```

Uses `disable_anthropic_fallback: true` on proxy requests. Deploy `openai-proxy` after pulling that flag if not yet live.

Output: `tmp/ONEIROS_GLOBAL_ARCHETYPE_PRIMARY_ONLY_PACKET.json`

## Decision policy

```text
global baseline → confusion matrix → 2–3 systemic fixes → full regression → freeze
```

Rank failures by **frequency and cross-dream impact**. No dream-specific examples or isolated one-off patches.

## Related

- D.1 Hero freeze: [`ONEIROS_V4_1_6_D1_HERO_PRECISION.md`](./ONEIROS_V4_1_6_D1_HERO_PRECISION.md)
- 5-dream acceptance: [`ONEIROS_5_DREAM_ACCEPTANCE_SET.md`](./ONEIROS_5_DREAM_ACCEPTANCE_SET.md)
