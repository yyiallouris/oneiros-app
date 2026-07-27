# Oneiros v4.1.5-C.1.1 — Catalog namespace enforcement

Follow-on to C.1 (frozen). Fixes structured-contract namespace leakage (`greek.sisyphus` in `archetype_id`, bracket-wrapped ids).

## Versions

| Field | Value |
|---|---|
| `prompt_version` | `4.1.5-C.1.1` |
| `prompt_id` | `dream-field-map-interpretive-v4.1.5-C.1.1` |
| `schema_version` | `12` |
| `myth_prompt_index_version` | `2` (unchanged) |

## What changed

**Provider JSON schema (`response_format: json_schema`):**
- `archetypes[].archetype_id.enum` = selectable archetype catalog IDs only (19)
- `amplifications[].catalog_id.enum` = closed myth catalog IDs only (128)
- Enums generated at build time — `npm run build:catalog-id-enums`

**Prompt catalog formatting (not bloat):**
- `[wise_old_woman]` → `id=wise_old_woman`
- Myth index: `[greek.sisyphus]` → `id=greek.sisyphus`

**Zod validation:** same enums + bracket strip preprocess (backward compat only).

**Not changed:** C.1 validator simplification, myth index V2 sig/req/anti, evidence_ids, one call, temp 0, no cross-layer salvage, no Sisyphus signature edits.

## Token / size report

Regenerate after catalog edits:

```bash
npm run build:interpretive-catalogs
```

Outputs in `src/ai/catalogs/generated/catalogIdEnums.v1.ts`:
- `DREAM_EXTRACTION_JSON_SCHEMA_TOKEN_COUNT`
- `MYTHIC_PROMPT_INDEX_TOKEN_COUNT` (myth index builder)

## Benchmark (after deploy)

```bash
bash scripts/run-patch-c11-benchmark.sh
```

Order: Sisyphus×5 → smoke (generic negative×1, Inanna×1, Fisherman×1).

If Sisyphus passes → run five-dream suite once (`bash scripts/run-5-dream-acceptance.sh`).

## Five-dream reviewer packet (harness)

The acceptance runner writes reconciled artifacts under one output directory only:

- `acceptance_runs.json` — canonical per-run myth/archetype fields
- `reviewer_packet.json` — summary + `five_dream_runs` from those records only
- exits non-zero when reconciliation fails (`packet_valid: false`)

Summary exposes four layer flags (observability only — tests unchanged):

```json
{
  "integrity_pass": true,
  "myth_layer_pass": true,
  "archetype_layer_pass": false,
  "overall_pass": false
}
```

Helpers: `scripts/lib/acceptanceRunRecord.ts`, `scripts/rebuild-acceptance-packet.ts`, `scripts/build-c11-reviewer-packet.ts`, `scripts/build-archetype-diagnostic-packet.ts`.

Do **not** build reviewer packets from stale summaries or wrong field names (`required_myth` vs `expected_myth_catalog_id`).

## Permanent freeze

C.1.1 namespace enforcement is **accepted and frozen**. Patch C myth layer is **complete**. No further myth catalog or index work without a new brief.

## Deploy

```bash
supabase functions deploy openai-proxy
supabase functions deploy ai-entitlements-gateway
```

Metro reload alone is not enough for production extract.
