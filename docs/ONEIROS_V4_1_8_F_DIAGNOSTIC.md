# Oneiros Patch F — DIAGNOSTIC ONLY (archetype selection stability)

**Status:** open diagnostic — **no production changes**.  
Frozen production remains `4.1.7-E.1` / catalog `1.6.0` / schema `12`.

## Confirmed issue (seed)

Greek sea-mattress dream ×5 under `4.1.7-E.1`:

| Outcome | Count |
|---|---|
| Lover present (raw+post) | 2/5 |
| raw `[]` (model omission) | 3/5 |

Missing runs were **not** validator rejections. Expected reliability for this clear primary: Lover ≥4/5 (ideally 5/5).

## Hard constraints (do not violate)

- Do **not** change the language gate.
- Do **not** add Lover-specific production rules.
- Do **not** add dream-specific examples to the prompt.
- Do **not** add server heuristics.
- Do **not** solve by multiple production calls + unioning outputs.
- Do **not** add the candidate global calibration sentence until reviewer inspection of this packet.

## Phase 1 — Exact repeat diagnostic

Same Greek sea-mattress fixture ×20:

- primary-only, Anthropic fallback disabled
- identical dream / context / assembled prompt hashes / catalog / schema / generation settings
- persist raw/post IDs, confidence, mechanisms, evidence, candidate counts, hashes, model, latency
- include exact compact Lover catalog record injected into the request (catalog `1.6.0`)

## Phase 2 — Repeatability suite

Naturalistic stability set:

- 12 clear-but-subtle single-primary positives ×5
- 8 true negatives ×5
- cover Lover, Anima, Animus, Guide/Psychopomp, Shadow, Orphan, Great Mother, Persona, Death–Rebirth (+ second Lover EN)

Fixture dreams must **not** paste production prompt wording.

### Primary stability targets (diagnostic gates)

- every clear single-primary positive: required archetype ≥4/5
- no clear positive below 3/5
- true negatives remain empty ≥4/5
- no broad precision collapse

## Potential Patch F candidate (NOT applied)

Only if instability appears across multiple unrelated positives, test one compact global calibration:

> Return an empty archetype list only after considering the full archetype catalog and finding no supported function. Prefer fewer strong echoes, but do not omit a central, sustained, or image-bearing function merely because it is quiet or medium-confidence.

If one compact change does not stabilize recall, compare the suite against the stronger approved model before expanding the prompt.

## Runner

```bash
bash scripts/run-patch-f-stability.sh
# optional: PATCH_F_CONCURRENCY=8 (default; 429 backoff retained — avoid 24+ TPM storms)
```

Artifacts: `tmp/patch-f-stability-<stamp>/`  
Canonical first diagnostic: `tmp/patch-f-stability-2026-07-27T16-00-49-424Z/`  
Reviewer packet: `PHASE_F_REPORT.json` + `PHASE_F_REVIEWER_COPY_PASTE.txt`  
Also: `tmp/ONEIROS_V418F_DIAGNOSTIC_REVIEWER_COPY_PASTE.txt`

### Canonical snapshot (after serial cleanup of 429 leftovers)

| Gate | Result |
|---|---|
| Phase 1 Lover EL ×20 | **20/20** (0 empty) — seed omission **not** reproduced |
| Phase 2 positives ≥4/5 | **11/12** |
| Phase 2 positives <3/5 | **1/12** (`shadow` stays `double`) |
| Phase 2 negatives empty ≥4/5 | **6/8** |

Serial retry (`PATCH_F_CONCURRENCY=1`) cleared the remaining 7 failed jobs, so the final packet has **0 failed runs**. Residual misses are now true selection-stability outcomes inside the frozen packet, not transport or 429 noise. No production change applied.

## Phase 3 — Old vs New reconciliation

Reviewer follow-up packet:

- `tmp/patch-f-phase3-2026-07-27T16-42-55-938Z/PHASE3_RECONCILIATION.json`
- `tmp/patch-f-phase3-2026-07-27T16-42-55-938Z/PHASE3_RECONCILIATION.md`
- `tmp/patch-f-phase3-2026-07-27T16-42-55-938Z/PATCH_F_TARGETED_ADJUDICATION.json`

Key finding: the old `2/5` sea-mattress harness request was **not** byte-identical to the Patch F `20/20` request before model execution.

- old user-prompt hash: `49004a46c3532951`
- Patch F user-prompt hash: `d5684600eea5e149`
- stable-builder verification passed against the frozen Phase 1 hash, so this delta is real
- old harness title was `sea_mattress_el`; Patch F phase1 title was `F_phase1_lover_sea_mattress_el`
- old harness also used a different nonce-bearing run-tag shape

Because the original old request bodies were not persisted, exact per-run request-body hashes and exact old-payload replay remained unavailable. Replaying with the current live builders would have violated the reviewer instruction to avoid reconstructing from the current runtime when the original payload is missing.

Phase 3 therefore lands on **request/harness-difference reconciliation**, not evidence for a global empty-selection calibration patch.

### Scoring correction applied

- negatives now report `required_label_hit_count = N/A`
- `exact_set_consistency` renamed to `repeat_set_consistency`
- negatives additionally report `gold_exact_match_count` and `gold_exact_match_rate`

### Adjudication note

The targeted adjudication packet uses the frozen Patch F run artifacts plus **current catalog provenance** for any live catalog lookups. If the live worktree catalog has moved since the diagnostic run, that drift is recorded as provenance rather than treated as a hidden Patch F mutation.
