# Oneiros v4.1.1 — No Prompt Bloat Dev Brief

**Status:** Phase 0 complete; Phase 1 patch implemented in-repo (`prompt_version` `4.1.1`, myth catalog `1.1.0`).

Source intent (product): avoid stuffing Trickster / Inanna / Orpheus / Fisherman examples into the production prompt. Examples belong in unit tests and benchmarks only.

## Direction (locked)

```text
Prompt:            small, general selection rule
Archetype catalog: short function signatures + closed mechanism tags (later)
Server validator:  deterministic hard gates
Tests/benchmarks:  concrete dreams and expected IDs
```

## Do not

- Grow the production prompt with Fisherman / Inanna / Orpheus / timetable examples
- Add a second AI / embedding call
- Restore open-world myths
- Tune mid-batch after a single run
- Use myth catalog evidence to force archetype selection (or vice versa)

## Phase 0 — targeted diagnostics (required before patch)

Collect artifacts for:

- Fisherman target T1–T5
- C1 Orpheus (all 3 runs)
- C5 Inanna (all 3 runs)

Per run:

```json
{
  "run_id": "...",
  "raw_archetypes": [],
  "parsed_archetypes": [],
  "normalized_archetypes": [],
  "validator_decisions": [
    {
      "canonical_label": "...",
      "accepted": true,
      "rejection_codes": [],
      "rejection_reason": null
    }
  ],
  "post_validation_archetypes": []
}
```

Also return exact prompt-facing definitions + current validator rules for:

Trickster, Guide / Psychopomp, Lover, Persona, Death–Rebirth, Terrible Mother, Wise Old Woman, Wise Old Man, Hero.

Myth packs:

- full source + compact prompt record for `greek.orpheus_eurydice`, `sumerian.inanna_descent`
- confirm missing: `arabian.fisherman_and_jinni`, `greek.sisyphus`

Metrics:

```json
{
  "prompt_version": "...",
  "catalog_version": "...",
  "model": "...",
  "temperature": 0,
  "archetype_prompt_tokens": 0,
  "myth_index_tokens": 0,
  "total_system_prompt_tokens": 0,
  "average_input_tokens": 0,
  "average_output_tokens": 0,
  "average_cost_usd": 0,
  "average_latency_ms": 0
}
```

Runner:

```bash
bash scripts/phase0-v411-diagnostics.sh
```

## Phase 1 — planned patch (after Phase 0 review)

1. Complete myth catalog with `arabian.fisherman_and_jinni` and `greek.sisyphus`
2. Strengthen only `greek.orpheus_eurydice` and `sumerian.inanna_descent` records
3. Compact closed `mechanism_tags` for Archetypal Echoes
4. Archetype-specific hard gates in catalog metadata / server validator
5. Keep a small general archetype prompt **without** concrete examples
6. Independent myth/archetype pipelines

### Proposed general archetype prompt (target shape)

```text
ARCHETYPAL ECHOES

Return 0–2 optional archetypal functions from the supplied closed catalog.

Use only the raw dream for selection, carrier, mechanism tags, and evidence.
Treat reflection as absent until selections are final.

Select an archetype only when:
- its function is enacted, not merely suggested by appearance or convention;
- the carrier is causally or relationally important;
- the required mechanism is visible in the dream;
- ordinary relational or situational language would be less precise.

Prefer the action or process that changes what can happen next over a visually
striking figure.

A carrier may be a figure, relationship, dream-ego action, whole-dream process,
or collective/setting pattern when allowed by the catalog.

Return [] when no catalog function is sufficiently enacted.
Never infer from age, gender, occupation, authority, darkness, beauty, danger,
or familiar symbolism alone.
```

### Proposed closed mechanism tags (general, not test-specific)

See product brief discussion: `deception_or_feigned_belief`, `power_asymmetry_reversed`, `dissolution_or_symbolic_death`, `revival_or_return`, `identity_or_status_transformed`, `engulfing_or_devouring`, `possessive_anti_separation`, `bond_organizes_dream`, `devotion_or_longing`, `union_separation_or_loss`, `active_threshold_guidance`, `crossing_between_domains`, etc.

### Example hard gates (server)

- Trickster: `(deception_or_feigned_belief OR inversion_or_rule_bending) AND power_asymmetry_reversed`
- Death–Rebirth: `dissolution_or_symbolic_death AND revival_or_return AND identity_or_status_transformed`
- Terrible Mother: `engulfing_or_devouring OR possessive_anti_separation`
- Lover: `bond_organizes_dream AND (devotion_or_longing OR union_separation_or_loss)`
- Guide / Psychopomp: `active_threshold_guidance AND crossing_between_domains`

Validator drops rejected candidates; it does not invent replacements.

## After patch

Run the full closed-catalog + 5-dream acceptance benchmarks **without mid-run tuning**.

**Always parallel by default** (do not serialize live extracts):

```bash
bash tmp/runClosedMythCatalogBenchmark.sh
bash scripts/run-5-dream-acceptance.sh
# throttle only if needed: ACCEPTANCE_CONCURRENCY=5 ...
```

### Pro-reviewer log locations

- Phase 0 package: `tmp/phase0-v411-diagnostics-2026-07-26T23-14-00-608Z/PHASE0_PACKAGE.json`
- Stage files: same dir (`fisherman_T*.json`, `C1_*.stages.json`, `C5_*.stages.json`, `archetype_defs_and_validator_rules.json`, `myth_pack.json`, `metrics.json`)
- Phase 1 acceptance: `tmp/5-dream-acceptance-<stamp>/` (`*.stages.json` + `summary.json`)
- Phase 1 closed: `tmp/v4.1.1-closed-myth-benchmark/`
