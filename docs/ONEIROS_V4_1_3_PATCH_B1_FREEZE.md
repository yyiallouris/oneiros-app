# Freeze: Patch B.1 (schema compliance) — v4.1.3-B.1

Patch B (`4.1.3-B` / schema `7`) frozen. B.1 is schema-compliance only — no Trickster meaning change, no inference.

| Field | Value |
| --- | --- |
| prompt_version | `4.1.3-B.1` |
| prompt_id | `dream-field-map-interpretive-v4.1.3-b1` |
| schema_version | `8` |
| Required archetype fields | `carrier_kind`, `mechanism_actor`, `mechanism_tags`, `evidence_ids`, `carrier_evidence_ids`, `mechanism_evidence_ids` |
| Forbidden | infer `mechanism_actor` from `carrier_kind`; copy `evidence_ids` into carrier/mechanism arrays |
| Myth transport | `evidence_ids` max 10 → server clamp 6 |

Benchmark: `bash tmp/runPatchBFishermanTrickster.sh`
