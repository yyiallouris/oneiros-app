# Freeze: Patch B (Trickster carrier/actor) — v4.1.3-B

Patch A (`4.1.2` / schema `7`) remains frozen. Patch B is an isolated archetype taxonomy change.

| Field | Value |
| --- | --- |
| prompt_version | `4.1.3-B` |
| prompt_id | `dream-field-map-interpretive-v4.1.3-b` |
| schema_version | `7` (unchanged) |
| archetype_catalog_version | `1.2.0` |
| Trickster kind | `archetypal_function` |
| New raw fields | `mechanism_actor`, `carrier_evidence_ids`, `mechanism_evidence_ids` |
| Display evidence | `selectDisplayEvidence` — first / middle / last span for UI (validation uses all ids) |

Do not start Patch C (myth prompt-index V2) in the same benchmark batch.
Benchmark: `bash tmp/runPatchBFishermanTrickster.sh` (Fisherman ×7 + 5 negative Trickster cases).
