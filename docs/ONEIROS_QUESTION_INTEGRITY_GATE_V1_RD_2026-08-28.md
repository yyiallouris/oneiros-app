# Question Integrity Gate v1 — CLOSED FOR CURRENT ARCHITECTURE

**Date:** 2026-08-28  
**Status:** **CLOSED FOR CURRENT ARCHITECTURE — MECHANICAL PASS / EDITORIAL FAIL.** Do not mutate Repair, Integrity Gate, or v1.2 System 4. Do not run a final end-to-end. Not production. Nothing deployed.  
**Verdict:** [`ONEIROS_QUESTION_REPAIR_PHASE2_EDITORIAL_FAIL_2026-08-29.md`](./ONEIROS_QUESTION_REPAIR_PHASE2_EDITORIAL_FAIL_2026-08-29.md)  
**Product invariant:** every initial Oneiros reading always has exactly one reflective question. Do not introduce DROP / hide-question UI. If a repaired question fails the second Integrity Gate, Phase 2 fails and we STOP. Do not fall back to the unsafe original.

Same-call v1.2.0 (`4506c898…`) remains the frozen creative generator after the paired Standard/CORE PASS 8/8. The production-mode 24 did not pass the editorial Gate. Prompt R&D on System 4 is **STOP**. Do not create v1.2.1 / v1.3. Do not edit Reader Systems 1–3.

```text
DREAM
  ↓
existing production Reader + frozen v1.2 System 4
  ↓
READING + CANDIDATE QUESTION
                ↓
        QUESTION INTEGRITY GATE
                ↓
         PASS ─────────────→ FINAL QUESTION
          │
         FAIL
          ↓
      ONE NARROW REPAIR
          ↓
   same frozen Integrity Gate
          ├── PASS → repaired question
          └── FAIL → PHASE 2 FAIL / STOP
                     (no original fallback, no DROP)
```

---

## Identity — Phase 1 Gate

| Field | Value |
|---|---|
| Method | `oneiros-question-integrity-gate-v1.0.0-candidate` |
| Prompt | `oneiros-question-integrity-gate-prompt-v1.0.0-candidate` |
| Version | `1.0.0-candidate` |
| Model / task | GPT-5.4 / `reflective_question_validate` (predecessor task, not a production billing import) |
| Temperature / tokens | `0` / `180` |
| Schema | `{ "pass": boolean, "violations": ViolationId[] }` |
| Inputs | RAW_DREAM + candidate question + OUTPUT_LANGUAGE + QUESTION_MODE |
| Forbidden input | generated reading / interpretation |
| Calls | 24 frozen historical questions from the v1.2 production-mode 24 |
| Hard cost cap | `$1.00` |
| Approval env | `ONEIROS_QUESTION_INTEGRITY_GATE_PHASE1_COST_APPROVED=1` |
| Bundle SHA-256 | `c1d8090fec6149adf492d1319657ba02bf5ae28ddfa5ce28114ef8a0df6629b2` |
| Corpus SHA-256 | `aa91e8e64f707100d1e39fb8aa35405d93d1b134461196630ffb2617d7b95d3a` |
| Runner | `npm run benchmark:question-integrity-gate-phase1` |

Canonical source: `src/ai/rd/reflective-questions/questionIntegrityGate/questionIntegrityGateCandidate.ts`.  
Not a runtime, client, or gateway import. Not added to the archived mega-runner.

---

## What the Gate is not

- Not a second Composer
- Not a quality editor
- Not a GOLD/SHIP judge
- Not a rewrite / generate-another-question call
- Not a `flat_no_live_point` editorial filter
- Not a DROP / hide-question product change

---

## Phase 1 metric

Do **not** generate new Reader outputs. Use the frozen scored corpus.

Hard-FAIL recall should be effectively 100% on:

- Camille final24 Quick / Standard / Advanced
- Scarf final24 Quick
- HOME final24 Advanced

Also report false-positive rate on GOLD/SHIP controls, results by violation family, and results by language. Inspect Sunrise Standard, Bark Standard, and HOME Standard without treating them as the primary metric.

If the Gate cannot reliably detect the known semantic failures without rejecting many good questions: **STOP and report. Do not build Repair.**

---

## Phase 1 result — 2026-08-28T21:08:51Z

Packet: `tmp/question-integrity-gate-phase1-2026-08-28T21-08-51-574Z/`  
24 GPT-5.4 calls, `$0.07349750` / `$1.00`. SHA `c1d8090f…`. No new Reader outputs. No Repair.

| Metric | Result |
|---|---|
| Hard-FAIL recall | **5/5** (Camille Q/S/A, Scarf Quick, HOME Advanced) |
| False negatives | 0 |
| GOLD/SHIP false positives | **1/17** — Bark Standard (`interpretation_as_premise`) |
| Sunrise Standard (inspect / WEAK) | FAIL `interpretation_as_premise` |
| Bark Advanced / HOME Standard (inspect) | PASS |

Primary metric held. PO: Phase 1 PASS. Proceed to Phase 2.

Phase 2 repairs only these seven Gate FAILs:

1. `zh-faguo-mingzi:quick` — `forced_choice`
2. `zh-faguo-mingzi:standard` — `ranking_or_comparison`, `invented_dream_content`
3. `zh-faguo-mingzi:advanced` — `ranking_or_comparison`, `invented_dream_content`
4. `ja-neon-home:advanced` — `ranking_or_comparison`, `interpretation_as_premise`
5. `shared-scarf-at-harbor:quick` — `forced_choice`, `ranking_or_comparison`
6. `sunrise-on-quiet-ridge:standard` — `interpretation_as_premise`
7. `skin-turns-to-bark:standard` — `interpretation_as_premise`

---

## Identity — Phase 2 Repair

| Field | Value |
|---|---|
| Method | `oneiros-question-repair-v1.0.0-candidate` |
| Prompt | `oneiros-question-repair-prompt-v1.0.0-candidate` |
| Version | `1.0.0-candidate` |
| Model / task | GPT-5.4 / `reflective_question_generate` |
| Temperature / tokens | `0.35` / `220` |
| Schema | `{ "question" }` only |
| Inputs | RAW_DREAM + rejected candidate question + Integrity Gate violation IDs + OUTPUT_LANGUAGE + QUESTION_MODE |
| Forbidden input | generated reading / interpretation |
| Frozen Gate (unchanged) | `oneiros-question-integrity-gate-v1.0.0-candidate` SHA `c1d8090fec6149adf492d1319657ba02bf5ae28ddfa5ce28114ef8a0df6629b2` |
| Frozen v1.2 generator | SHA `4506c8981c1e0f38edcb641bf89e59126bfdafe64a3adff99a94a2d1a12e81f7` |
| Calls | 7 Repair + 7 post-repair frozen Gate. Maximum one Repair, one post-repair Gate. No second Repair, no regeneration loop, no best-of-N, no reranking, no Composer/judge |
| Hard cost cap | `$1.00` |
| Approval env | `ONEIROS_QUESTION_REPAIR_PHASE2_COST_APPROVED=1` |
| Bundle SHA-256 | `0859fd5474124613b7c5cd610d4f48e65ccee6f0ea05b8d4ca382ddd5a53d53b` |
| Runner | `npm run benchmark:question-repair-phase2` |

Canonical source: `src/ai/rd/reflective-questions/questionIntegrityGate/questionRepairCandidate.ts`.  
Not a runtime, client, or gateway import. Do not mutate the Integrity Gate prompt, Reader Systems 1–3, Reader configs, v1.2 System 4, v1.2 generator SHA, or the splitter.

Human composite 24: original Gate PASS stays the original v1.2 question; original Gate FAIL + repaired PASS uses the repaired question. Blind reviewer sees DREAM / MODE / FINAL QUESTION only.

Mechanical 7/7 passed. Editorial GOLD/SHIP failed. Repair SHA stays frozen as tested. Do not mutate any prompt.

---

## Phase 2 result — 2026-08-28T21:21:12Z

Packet: `tmp/question-repair-phase2-2026-08-28T21-21-12-126Z/`  
PO zip: `tmp/question-repair-phase2-po-review-2026-08-28/`  
14 GPT-5.4 calls (7 Repair + 7 frozen Gate), `$0.03567000` / `$1.00`. Repair SHA `0859fd54…`. Gate SHA unchanged `c1d8090f…`. v1.2 generator SHA unchanged `4506c898…`. No new Reader outputs. No second Repair. No DROP. Nothing deployed.

| Metric | Result |
|---|---|
| Repaired then re-gated | **7/7 PASS** |
| final_drop_count | **0** |
| Phase 2 mechanical | **PASS** |
| Fallback to unsafe originals | none |

Repair SHA is frozen exactly as tested: `0859fd5474124613b7c5cd610d4f48e65ccee6f0ea05b8d4ca382ddd5a53d53b`.

## Phase 2 editorial FAIL — 2026-08-29

**MECHANICAL PASS / EDITORIAL FAIL. STOP.**

PO blind composite 24: **8 GOLD / 8 SHIP / 7 WEAK / 1 FAIL** = **16/24** GOLD+SHIP. Required ≥21/24. Quick 7/8 PASS. Standard 4/8 FAIL. Advanced 5/8 FAIL. Repaired questions ≈ **1/7 GOLD+SHIP** (Scarf Quick SHIP; the other six WEAK). Systematic failure: semantic safety by flattening into generic phenomenology. Repair is a safety paraphraser, not a Oneiros-preserving surgeon.

`ja-neon-home:standard` is an explicit inspection regression: human review treats “HOME's small movement maintains the distance” as interpretation-as-premise. Phase-1 “0 false negatives” means 0 against the labelled set, not universal coverage. Do not tune the Gate.

Do not deploy Generator + Gate + Repair. Do not run a final end-to-end. Do not mutate Repair, Gate, or v1.2 System 4. Do not create another prompt candidate.

**CLOSED FOR CURRENT ARCHITECTURE — product grammar solved, production reliability unresolved.**

Canonical verdict: [`ONEIROS_QUESTION_REPAIR_PHASE2_EDITORIAL_FAIL_2026-08-29.md`](./ONEIROS_QUESTION_REPAIR_PHASE2_EDITORIAL_FAIL_2026-08-29.md).

---

## Isolation

- `APPROVED_REFLECTIVE_QUESTION_PRODUCTION` stays null
- Production Composer v1.1 remains the pending runtime candidate
- Exploring `chat_followup` stays `gpt-5.4-mini`
- No `openai-proxy` or `ai-entitlements-gateway` deploy
- Keep the deterministic terminal-question splitter; no LLM parsing
