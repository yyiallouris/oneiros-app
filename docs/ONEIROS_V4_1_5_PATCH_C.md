# Oneiros v4.1.5-C — Patch C (Myth prompt-index V2)

> **Status: COMPLETE (myth layer frozen).** Production chain: **C → C.1 → C.1.1** (namespace enforcement). Do not reopen myth index, catalog records, or myth validator without a new explicit brief.

> **Superseded for production validation by [v4.1.5-C.1](ONEIROS_V4_1_5_C1_VALIDATOR_SIMPLIFICATION.md).** C.1 keeps the V2 index and removes `matched_feature_ids` gates.

> **Namespace enforcement frozen:** [v4.1.5-C.1.1](ONEIROS_V4_1_5_C1_1_NAMESPACE_ENFORCEMENT.md)

## Accepted myth-layer results (reconciled five-dream + C.1.1 targeted)

| Signal | Result |
|---|---|
| C1 Orpheus | 2/3 |
| C3 Sisyphus | 3/3 |
| C5 Inanna | 3/3 |
| C2 + C4 myth negatives | 6/6 empty |
| Integrity | 100% |
| C.1.1 targeted Sisyphus myth | 5/5, no namespace/bracket leaks |

**Do not modify:** myth prompt index V2, Inanna, Izanagi/Izanami, Psyche/Eros, Orpheus, Sisyphus myth record, C.1 validator simplification, namespace enums, production prompt.

**Open work (separate from Patch C):** archetype precision/recall — Hero on Sisyphus, Guide vs Death–Rebirth on Inanna. See `tmp/ONEIROS_ARCHETYPE_DIAGNOSTIC_PACKET.json` (built from saved runs, no new model calls).

Production follow-on to v4.1.4. Redesigns the **closed myth prompt index** only; no general prompt bloat.

## Versions

| Field | Value |
|---|---|
| `prompt_version` | `4.1.5-C` |
| `prompt_id` | `dream-field-map-interpretive-v4.1.5-C` |
| `schema_version` | `10` |
| `myth_catalog_version` | `1.2.0` |
| `myth_prompt_index_version` | `2` |

## What changed

- **V2 catalog fields** on all 128 records: `prompt_signature`, `signature_features`, `required_feature_groups`, `anti_features`.
- **V2 prompt index** (no title/tradition, no ellipses, no prefix truncation): `sig`, `roles`+`anti` on six curated benchmark records; compact `sig`+`req` for the rest (token budget ~9.2k).
- **Model myth object** uses `matched_feature_ids` + top-level `divergence_type` (schema 10).
- **Server validation** is deterministic on feature IDs + required groups + anti-feature overlap; `matched_dimensions` no longer gates acceptance.

## Build / migrate

```bash
npx tsx scripts/migrate-myth-catalog-v2.ts   # once, if JSON lacks V2 fields
npx tsx scripts/build-mythic-prompt-index.ts
```

## Benchmark (no tuning between runs)

```bash
bash scripts/run-patch-c-benchmark.sh
```

Order: Inanna×7 + competitor contrast → Fisherman/Sisyphus/Orpheus×3 → five-dream suite×3.

## Deploy

After pull:

```bash
supabase functions deploy openai-proxy
supabase functions deploy ai-entitlements-gateway
```

Spec: `docs/ONEIROS_V4_1_3_POST_PATCH_A_DEV_BRIEF.md` § Patch C.
