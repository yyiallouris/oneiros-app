# Oneiros v4.1.2 — Targeted Fix Dev Brief

**Status:** Active. Freeze v4.1.1 first. Implement patches in order. Do **not** batch all changes.

Source: product / pro-reviewer packet review of Phase 0 + Phase 1 (`tmp/ONEIROS_PRO_REVIEWER_PACKET_V411.json`).

## What is already working (do not touch)

- Closed-catalog architecture (integrity clean)
- Death–Rebirth / Terrible Mother archetype gates (C5 archetypes 3/3 / 0/3)
- No open-world myths, no second AI call, no dream-specific prompt examples

## Root causes (confirmed)

1. **Fisherman / often Sisyphus:** model selects correct `catalog_id`; post fails on `evidence_not_traceable_to_dream` (paraphrase vs substring).
2. **Inanna:** real selection miss / wrong close neighbors (Hero Twins, Psyche) — needs candidate-specific signature features (Patch C, later).
3. **Trickster:** usually absent from raw (not validator kill); likely figure-biased carrier taxonomy (Patch B, after logs).
4. **Orpheus C1:** Guide expected; Lover optional — do not force Lover 3/3.

## ORDER (locked)

1. Freeze v4.1.1
2. **Patch A** — deterministic `evidence_ids`
3. Run only Fisherman ×5 + Sisyphus ×3 (parallel, no mid-run tuning)
4. Return raw/post myth IDs, evidence IDs, resolved evidence, validator decisions
5. Return Phase 1 Trickster stage fields (Patch B logs)
6. Only then correct Trickster carrier taxonomy if confirmed
7. Dump exact compact myth records for Inanna / Hero Twins / Psyche / Orpheus / Fisherman / Sisyphus
8. Implement candidate-specific signature features (Patch C)
9. Run Inanna ×5 + Hero Twins / Psyche regression
10. Full suite once

## DO NOT

- Add dream-specific examples to the production prompt
- Change Death–Rebirth or Terrible Mother
- Restore open-world myths
- Add a second AI call
- Loosen all validation
- Force Lover in the Orpheus test
- Tune between individual runs

## Patch A — Evidence IDs (implement now)

Send the dream once as numbered spans:

```text
[D1] …
[D2] …
```

Model returns for Mythic Echo:

```json
{
  "catalog_id": "arabian.fisherman_and_jinni",
  "evidence_ids": ["D3", "D4", "D5", "D6", "D7"]
}
```

Not free-text evidence.

Server:

- validates IDs exist
- rejects unknown IDs
- resolves to exact original spans
- persists app-facing `evidence: string[]`

Bump prompt → `4.1.2` / schema → `7`. Soft-default resilience: missing `evidence_ids` → `[]` (fail closed), never invent spans.

## Patch B — Trickster (logs first, then maybe taxonomy)

Need before changing:

- full raw archetype objects + `carrier_kind` + `mechanism_tags` + validator decisions for Fisherman T1–T5
- exact live Trickster catalog record, prompt-facing line, allowed carriers, required tag groups, validator gate

Proposed direction (after confirmation only):

```ts
kind: "archetypal_function"
allowedCarrierKinds: ["dream_ego_action", "figure", "relationship"]
```

## Patch C — Myth-specific signatures (later)

Add to catalog records (not general prompt):

- `prompt_signature`
- `signature_features`
- `required_feature_groups`
- `anti_features`

Model returns `matched_feature_ids` + `evidence_ids`. Hard-gate per candidate.
