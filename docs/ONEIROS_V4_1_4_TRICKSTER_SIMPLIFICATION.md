# v4.1.4 — Trickster simplification (production)

Patch B work **stopped**. B.2 frozen as non-production experiment (`docs/ONEIROS_V4_1_3_PATCH_B2_FREEZE.md`).

## Production archetype: single Trickster

| Field | Value |
|---|---|
| `archetype_id` | `trickster` |
| `canonical_label` | `Trickster` |

**Function:** Cunning, inversion, deception, or rule-bending that actually changes leverage, exposes false order, or opens a new possibility.

**Required mechanisms:**
```
(deception_or_feigned_belief OR inversion_or_rule_bending) AND power_asymmetry_reversed
```

**Not enough:** lying, shape-shifting, changing promises, humor, chaos/strangeness, rule-breaking without changed leverage.

No carrier subtype (`action` / `figure` / `relationship` / `whole_process`). No `mechanism_actor`, `carrier_evidence_ids`, or `mechanism_evidence_ids`.

## Model-facing archetype object (unchanged from B.2 schema)

```json
{
  "archetype_id": "trickster",
  "expression": "enacted function or movement — not character-as-archetype label",
  "mechanism_tags": ["..."],
  "evidence_ids": ["D1", "D2"],
  "resonance": "...",
  "confidence": "high"
}
```

Prompt guidance: `expression` describes the **enacted function**, not "the giant is the Trickster".

## Versions

| Field | Value |
|---|---|
| `prompt_version` | `4.1.4` |
| `prompt_id` | `dream-field-map-interpretive-v4.1.4` |
| `schema_version` | `9` |
| `archetype_catalog_version` | `1.4.0` |

Retired ids (reject as `unknown_archetype_id`): `trickster.action`, `trickster.figure`.

## Trickster is NOT a release blocker

> One missing optional archetype is better than one confidently wrong archetype.

## Revised Fisherman acceptance (regression only)

| Metric | Target |
|---|---|
| `arabian.fisherman_and_jinni` post | ≥ 4/5 |
| Trickster post | optional / desirable |
| Guide / Psychopomp post | acceptable |
| Wise Old Woman raw | ≤ 1/5 |
| Wrong myth ids | 0 |
| Unknown catalog ids | 0 |

## Frozen (unchanged)

- Patch A `evidence_ids`
- Closed myth catalog v1.1.0 (until Patch C)
- Mechanism tag hard gates (generic)
- Temperature 0, one-call architecture

## Deploy

```bash
supabase functions deploy openai-proxy
supabase functions deploy ai-entitlements-gateway
```

## Next

**Patch C** — myth prompt-index V2 + `matched_feature_ids` validation (`docs/ONEIROS_V4_1_3_POST_PATCH_A_DEV_BRIEF.md`).
