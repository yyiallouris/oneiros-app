# Patch B.2 — Carrier-scoped Trickster (v4.1.3-B.2)

## Problem

Patch B.1 proved schema compliance is not the blocker. The model still attributes Trickster to the wrong actor when carrier scope is a separate field. B.2 encodes carrier scope in closed `archetype_id` variants instead of adding more attribution fields.

## Architecture guard

**Generic carrier-scoped catalog capability** — no Trickster-specific branches in prompt construction, parsing, normalization, validation, persistence, or duplicate handling.

Each catalog record may define:

- `id`, `canonicalLabel`, `carrierKind`, `functionSignature`
- `requiredTagGroups` via `ARCHETYPE_MECHANISM_HARD_GATES[id]`
- `insufficientWhen` / `promptAntiFeatures`
- optional `canonicalVariantPriority` (lower wins on tie-break after confidence)

`trickster.action` and `trickster.figure` are the first two records using this capability.

## Trickster variants

| id | UI label | carrierKind |
|---|---|---|
| `trickster.action` | Trickster | `dream_ego_action` |
| `trickster.figure` | Trickster | `figure` |

Both share mechanism gate: `(deception_or_feigned_belief \| inversion_or_rule_bending) & power_asymmetry_reversed`.

## Model-facing archetype schema (schema 9)

```json
{
  "archetype_id": "shadow",
  "expression": "concrete dream carrier",
  "mechanism_tags": ["..."],
  "evidence_ids": ["D1", "D2"],
  "resonance": "...",
  "confidence": "high"
}
```

Removed from required model output: `canonical_label`, `carrier_kind`, `mechanism_actor`, `carrier_evidence_ids`, `mechanism_evidence_ids`, free-text `evidence`.

Server resolves `canonical_label`, validates mechanisms, resolves `evidence` from `evidence_ids`, persists `archetype_id` + `archetype_catalog_version`.

## Duplicate collapse (generic)

When multiple accepted candidates share `canonicalLabel`:

1. Validate each independently.
2. Keep higher confidence.
3. On tie, lower `canonicalVariantPriority` wins (`trickster.action` = 1, `trickster.figure` = 2).
4. Log `duplicate_canonical_archetype_collapsed`.

## Versions

| Field | Value |
|---|---|
| `prompt_id` | `dream-field-map-interpretive-v4.1.3-b2` |
| `prompt_version` | `4.1.3-B.2` |
| `schema_version` | `9` |
| `archetype_catalog_version` | `1.3.0` |

## Benchmark (no tuning between runs)

- **A** Fisherman ×7: `trickster.action` raw/post ≥5/7; `trickster.figure` post 0/7
- **B** 3 figure positives: `trickster.figure` ≥2/3; `trickster.action` 0/3
- **C** 3 dream-ego positives: `trickster.action` ≥2/3; `trickster.figure` 0/3
- **D** 5 negatives: any Trickster post 0/5

Runner: `tmp/runPatchB2TricksterBenchmark.ts`

Metrics use structured `archetype_id` / post-validation rows — not expression heuristics.

## Deploy

After merge:

```bash
supabase functions deploy openai-proxy
supabase functions deploy ai-entitlements-gateway
```

## Frozen (unchanged)

v4.1.2 evidence IDs, closed myth catalog, Death–Rebirth / Terrible Mother / Guide gates, myth prompt index, temperature 0, one-call architecture. No Fisherman-specific prompt examples.
