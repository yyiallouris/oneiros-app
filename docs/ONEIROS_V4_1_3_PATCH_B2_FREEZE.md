# Freeze: Patch B.2 — NON-PRODUCTION experiment only

**Status:** Research artifact. **Do not deploy** as production archetype architecture.

## Verdict (2026-07-27 benchmark)

Carrier-scoped `trickster.action` / `trickster.figure` did **not** generalize:

| Signal | Result |
|---|---|
| Fisherman `trickster.action` post | 5/7 (improved vs B.1) |
| Figure-positive dreams → `trickster.action` | 3/3 (wrong id) |
| Negative dream → `trickster.figure` | 1/5 false positive |
| Semantic carrier truth | **Not reliable** |

The validator cannot fix invented `power_asymmetry_reversed` tags — it only sees model claims.

## What we kept from B.2 research

- `archetype_id` model contract (schema 9)
- Generic catalog infrastructure (`carrierKind`, `canonicalVariantPriority`) for future use — **not** used for Trickster in production
- Benchmark logs: `tmp/v413b2-trickster-benchmark-2026-07-27T09-53-28-326Z/`
- Reviewer packet: `tmp/ONEIROS_V413_PATCH_B2_REVIEWER_PACKET.json`

## Production path after B.2 stop

See `docs/ONEIROS_V4_1_4_TRICKSTER_SIMPLIFICATION.md` — single `trickster` id, optional archetype, no release blocker.

## Do not

- Deploy `trickster.action` / `trickster.figure` as authoritative ids
- Add validator tightening, lexical rules, or dream-specific branches for Trickster
- Spend another iteration tuning Trickster recall under the current mini model

## Next

Patch C — myth prompt-index V2 (`docs/ONEIROS_V4_1_3_POST_PATCH_A_DEV_BRIEF.md` § Patch C).
