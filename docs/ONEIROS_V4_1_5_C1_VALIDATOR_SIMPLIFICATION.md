# Oneiros v4.1.5-C.1 — Myth validator simplification

> **C.1 validator simplification is frozen.** Namespace enums: [v4.1.5-C.1.1](ONEIROS_V4_1_5_C1_1_NAMESPACE_ENFORCEMENT.md).

Follow-on to Patch C. Removes brittle `matched_feature_ids` self-audit from production validation.

## Versions

| Field | Value |
|---|---|
| `prompt_version` | `4.1.5-C.1` |
| `prompt_id` | `dream-field-map-interpretive-v4.1.5-C.1` |
| `schema_version` | `11` |
| `myth_catalog_version` | `1.2.0` |
| `myth_prompt_index_version` | `2` (unchanged) |

## What changed

**Kept:** V2 myth prompt index (`sig`, `roles`, `req`, `anti`), closed `catalog_id`, `evidence_ids`, server title/tradition resolution.

**Removed from production validation:**
- `matched_feature_ids` gate
- `required_feature_group_unsatisfied`
- `unknown_feature_id`
- `divergence_type` acceptance gate
- hard minimum of 2 evidence spans (min valid = 1; log `evidence_span_count_below_preferred` if <2)

**Model myth object (production):**
```json
{
  "catalog_id": "...",
  "evidence_ids": ["D1"],
  "resonance": "...",
  "divergence": "...",
  "confidence": "high"
}
```

## Benchmark

```bash
bash scripts/run-patch-c1-benchmark.sh
```

Targeted set only (no five-dream suite until acceptance passes).

## Deploy

```bash
supabase functions deploy openai-proxy
supabase functions deploy ai-entitlements-gateway
```
