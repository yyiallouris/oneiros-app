# Oneiros v4.1.6-D.1 — Hero precision (Patch D.1)

Archetype-only follow-on. **Myth layer remains frozen** (C → C.1 → C.1.1).

## Status (frozen 2026-07-27)

```text
benchmark acceptance: FAIL
engineering / production decision: ACCEPTED WITH KNOWN RESIDUALS
```

Accepted production precision improvement with two known residual model-tagging errors. Further tuning was intentionally stopped to avoid schema and prompt bloat.

**Do not open D.1.1.** No schema fields, semantic text parsing, confidence-only Hero rejection, or further Hero-specific prompt rules.

| Metric | Result |
|---|---|
| Hero-positive (clean) | **5/5** |
| Sisyphus Hero (was ~7/8 pre-D.1) | **1/5** |
| effort-without-outcome Hero | **1/5** leak |
| Sisyphus myth | **5/5** |
| schema/proxy failures | **0** |

**Known residuals:** `sisyphus_r3`, `hero_negative_r3` — model falsely emitted `boon_or_changed_outcome` while resonance denies outcome; deterministic validator cannot detect tag/resonance contradiction without semantic parsing.

**Future regression guardrails** (not retroactive pass claim):

- genuine Hero positives: ≥4/5
- effort-without-outcome negatives: Hero ≤1/5
- Sisyphus: Hero ≤1/5, myth ≥4/5
- schema/proxy failures: 0

Canonical benchmark dir: `tmp/patch-d1-benchmark-2026-07-27T11-29-06-298Z/`. Reviewer packet: `tmp/ONEIROS_V416_D1_REVIEWER_PACKET.json`.

**Next:** global archetype evaluation benchmark — see [`ONEIROS_GLOBAL_ARCHETYPE_BENCHMARK.md`](./ONEIROS_GLOBAL_ARCHETYPE_BENCHMARK.md). Do **not** run Death–Rebirth-only or other one-archetype diagnostic loops.

## Versions

| Field | Value |
|---|---|
| `prompt_version` | `4.1.6-D.1` |
| `prompt_id` | `dream-field-map-interpretive-v4.1.6-D.1` |
| `schema_version` | `12` (unchanged) |
| `archetype_catalog_version` | `1.5.0` |

## What changed

**Hero mechanism hard gate (general, not dream-specific):**

```text
ordeal_or_confrontation
AND purposeful_quest_movement
AND boon_or_changed_outcome
```

**Hero catalog `insufficientWhen` expanded** (catalog-only; prompt line generated from catalog):

- ordeal without an achieved crossing, rescue, boon, or changed outcome
- effort or persistence alone
- ascent without completion or transformation
- repeated struggle that restores the starting condition
- courage without a structurally changed outcome

**Not changed:** Guide / Psychopomp, Death–Rebirth, myth index, myth catalog records, namespace enums, C.1 myth validator, production prompt bloat / examples.

## C5 acceptance fixture (benchmark only)

| Archetype | Expectation |
|---|---|
| Death–Rebirth | required ≥2/3 (target 3/3) |
| Guide / Psychopomp | acceptable optional secondary |
| Terrible Mother, Ruler, Hero, Self | forbidden |

This is an acceptance correction — not a production Guide change.

## Benchmark

```bash
bash scripts/run-patch-d1-benchmark.sh
```

| Arm | Expectation |
|---|---|
| A — Sisyphus ×5 | Hero post **0/5**; Sisyphus myth **≥4/5** |
| B — Hero-positive ×5 | Hero post **≥4/5** |
| C — effort-without-outcome ×5 | Hero post **0/5** |

No tuning between runs. If one Sisyphus run still passes Hero because the model falsely emits `boon_or_changed_outcome`, return the raw object — do not add schema fields.

Reviewer packet (self-contained JSON):

```bash
npx tsx scripts/build-d1-reviewer-packet.ts tmp/patch-d1-benchmark-<stamp>
```

Writes `tmp/ONEIROS_V416_D1_REVIEWER_PACKET.json` and `<stamp>/reviewer_packet.json`. The benchmark runner generates this automatically at the end.

## Deploy

```bash
supabase functions deploy openai-proxy
supabase functions deploy ai-entitlements-gateway
```

Metro reload alone is not enough for production extract.

## Telemetry

Production gateway logs aggregate Hero counters under `interpretive_echo_validators.heroTelemetry` (no dream text):

- `hero_raw_count`, `hero_post_count`, `hero_rejected_mechanism_count`
- `accepted_confidence_high`, `accepted_confidence_medium`
- `accepted_mechanism_tags`

Do not reject medium-confidence Hero candidates based only on confidence.

## Frozen / deferred

- **D.1 frozen** — production Hero baseline; do not reopen without explicit approval
- Death–Rebirth recall benchmark before any D.2 change (next chapter)
- Guide gatekeeper vs escort distinction — no production change in D.1
- No medium-confidence-only Hero rejection (research hypothesis only; no benchmark for genuine medium Hero positives)
