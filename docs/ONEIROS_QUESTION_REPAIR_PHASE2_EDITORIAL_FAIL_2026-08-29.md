# Integrity Gate + Repair Phase 2 — editorial FAIL / STOP

**Date:** 2026-08-29  
**Decision:** **MECHANICAL PASS / EDITORIAL FAIL. STOP.**  
**Line status:** **CLOSED FOR CURRENT ARCHITECTURE — product grammar solved, production reliability unresolved.**  
**Component status:** `frozen_rnd_reference` — not approved, not production-selectable  
**Production approval (R&D closeout):** `APPROVED_REFLECTIVE_QUESTION_PRODUCTION = null`

The R&D record below is frozen history. Prompt grammar on Generator, Integrity Gate, and Repair remains STOP. A later product launch addendum at the end records the 2026-08-29 production orchestration that wraps these frozen components plus a new Premise Check — without mutating their prompts.

These identities are frozen R&D references. They are not approved production components. Do not deploy them. Do not wire Generator / Integrity Gate / Repair into production routing. Do not mutate their prompt contents. Do not reopen this architecture while cleaning the repo.

Canonical product principle:

> A good Oneiros reflective question follows an imaginal movement already begun by the dream. It does not interpret the image and it does not merely redescribe it. It changes the dreamer's angle of attention without changing the dream.

---

## Frozen identities

| Layer | Method | SHA-256 | Status |
|---|---|---|---|
| Generator | `oneiros-same-call-minimal-v1.2.0-candidate` | `4506c8981c1e0f38edcb641bf89e59126bfdafe64a3adff99a94a2d1a12e81f7` | `frozen_rnd_reference` |
| Integrity Gate | `oneiros-question-integrity-gate-v1.0.0-candidate` | `c1d8090fec6149adf492d1319657ba02bf5ae28ddfa5ce28114ef8a0df6629b2` | `frozen_rnd_reference` |
| Repair | `oneiros-question-repair-v1.0.0-candidate` | `0859fd5474124613b7c5cd610d4f48e65ccee6f0ea05b8d4ca382ddd5a53d53b` | `frozen_rnd_reference` |

Production Reader remains `oneiros-dream-reflection-v3.1.0-candidate`. Exploring `chat_followup` stays `gpt-5.4-mini`.

Sources (offline only, never a client/gateway import):

- `src/ai/rd/reflective-questions/sameCallMinimal/sameCallMinimalCandidate.ts`
- `src/ai/rd/reflective-questions/questionIntegrityGate/questionIntegrityGateCandidate.ts`
- `src/ai/rd/reflective-questions/questionIntegrityGate/questionRepairCandidate.ts`

Regression corpus (raw dream + mode + original candidate question + known semantic issue; no gold repair wording):

- `testing/live-scenarios/question-integrity-gate-phase1.v1.json`
- `testing/live-scenarios/reflective-question-frozen-anchor-readings.v1.json`

---

## Final24 / Phase 1 / Phase 2

**v1.2 generator final24:** paired Standard/CORE gate PASS 8/8 versus frozen v1.1.0 (`8e0edada…`). Production-mode 24 did not pass the editorial Gate. Prompt R&D on System 4 is STOP.

**Phase 1 Integrity Gate:** hard-FAIL recall 5/5 on the labelled regression set. GOLD/SHIP false positives 1/17 (Bark Standard). Spend `$0.07349750`. SHA `c1d8090f…`. Packet was a temporary run artifact; the frozen corpus above is the retained evidence.

**Phase 2 mechanical:** Repair → frozen Gate **7/7 PASS**. `final_drop_count = 0`. No loops, no second Repair, no unsafe fallback. Spend `$0.03567000`. SHA `0859fd54…`.

**Phase 2 editorial (PO blind composite 24):**

| Mode              | GOLD | SHIP | WEAK | FAIL |
| ----------------- | ---: | ---: | ---: | ---: |
| Quick → Core      |    2 |    5 |    1 |    0 |
| Standard → Core   |    3 |    1 |    3 |    1 |
| Advanced → Deeper |    3 |    2 |    3 |    0 |
| TOTAL             |    8 |    8 |    7 |    1 |

GOLD+SHIP = **16/24**, below the required 21/24. Quick 7/8 PASS. Standard 4/8 FAIL. Advanced 5/8 FAIL.

Repair-specific ≈ **1/7 GOLD+SHIP** (Scarf Quick SHIP; Camille Q/S/A, Sunrise Standard, Bark Standard, HOME Advanced WEAK). Systematic failure: semantic safety by flattening into generic phenomenology. Repair is a safety paraphraser, not a Oneiros-preserving surgeon.

Mechanical 7/7 was a prerequisite, not the Phase 2 success criterion.

---

## Known regression cases

Keep these as future behavior tests, not gold sentences:

| Case | Mode | Known issue |
|---|---|---|
| `zh-faguo-mingzi` Camille | Quick | `forced_choice` |
| `zh-faguo-mingzi` Camille | Standard | `ranking_or_comparison`, `invented_dream_content` |
| `zh-faguo-mingzi` Camille | Advanced | `ranking_or_comparison`, `invented_dream_content` |
| `shared-scarf-at-harbor` | Quick | `forced_choice`, `ranking_or_comparison` |
| `ja-neon-home` HOME | Advanced | `ranking_or_comparison`, `interpretation_as_premise` |
    | `ja-neon-home:standard` HOME | Standard | inspection: human interpretation-as-premise on “movement maintains distance”; Gate Phase 1 PASS. Phase-1 “0 false negatives” is against the labelled set, not universal coverage. Do not tune the Gate. |
| `sunrise-on-quiet-ridge` | Standard | `interpretation_as_premise`; Repair flattened to generic phenomenology |
| `skin-turns-to-bark` | Standard | `interpretation_as_premise`; Repair dropped live point with `φυτεύεσαι` |

Strong controls retained in the same corpus: Words, Dinner, Scarf Standard/Advanced, Sunrise Quick.

Do not encode expected Repair wording as a gold answer.

---

## Why this R&D line closed

Three jobs are now distinct:

1. Generator can produce excellent Oneiros material, not with sufficient single-shot semantic reliability.
2. Integrity Gate is strong at known semantic boundary failures, not a proof of perfect coverage.
3. Repair v1.0 removes violations reliably and systematically sacrifices reflective quality.

More rules collapse the generator. More freedom produces semantic failures. Repair flattens. A judge/best-of-N loop is an architecture spiral.

**CLOSED FOR CURRENT ARCHITECTURE — product grammar solved, production reliability unresolved.**

Do not deploy Generator + Gate + Repair. Do not run another end-to-end. Do not mutate Repair, Gate, or v1.2 System 4. Do not create another prompt candidate. Do not automatically open another architecture iteration.

`APPROVED_REFLECTIVE_QUESTION_PRODUCTION` remains **null**. Keep the current production Reader untouched. No DB push. No gateway/proxy activation of this stack. No mobile UI activation of v1.2 questions.

---

## Product launch addendum — 2026-08-29

The R&D closeout above is unchanged. Do not mutate Generator, Repair, or Integrity Gate prompts. Do not reopen question-grammar R&D.

A later product decision overrode “do not ship” **without** another editorial 21/24 gate:

**Every successful Oneiros reading must end with exactly one reflective question.**

Quality hierarchy:

1. excellent dream-specific original
2. safe repaired question
3. generic deterministic fallback
4. no question — not allowed
5. known semantically corrupted question — not allowed

The frozen Integrity Gate is not sufficient by itself: `ja-neon-home:standard` passed Gate #1 while human review found an unsupported relational/causal premise (HOME’s small movement **maintains the distance**).

Production therefore adds one narrow Premise Check after Gate PASS, before final surface. This is not an editorial judge.

| Layer | Identity | SHA-256 |
|---|---|---|
| Reader | `oneiros-dream-reflection-v3.1.0-candidate` | constitution unchanged |
| Generator | `oneiros-same-call-minimal-v1.2.0-candidate` | `4506c8981c1e0f38edcb641bf89e59126bfdafe64a3adff99a94a2d1a12e81f7` |
| Integrity Gate | `oneiros-question-integrity-gate-v1.0.0-candidate` | `c1d8090fec6149adf492d1319657ba02bf5ae28ddfa5ce28114ef8a0df6629b2` |
| Repair | `oneiros-question-repair-v1.0.0-candidate` | `0859fd5474124613b7c5cd610d4f48e65ccee6f0ea05b8d4ca382ddd5a53d53b` |
| Premise Check | `oneiros-question-premise-check-v1.0.0-candidate` | `ceca45684d24ab1a0de374373b2c705e4eb75f7d18001a615246551289368130` |
| Orchestration | `oneiros-reflective-question-production-v1.0.0` | `fc8b6304fc2e8bc108242113299f7073cfbcc80d3f8df41cf747d218540d00ea` |
| Fallback | `reflective-question-fallback-v1` | localized strings; no LLM |

Maximum: one Generator question, one Repair, no semantic regeneration loop, no second Repair. Deterministic fallback guarantees exactly one final question. Kill switch `ONEIROS_REFLECTIVE_QUESTION_KILL_SWITCH` (default off) is the emergency omit path.

Bounded corpus validation `2026-08-28T21-54-49-463Z`: original_pass 17/24, repair 6/24, fallback 1/24, premise_check_fail 1/24. HOME Standard did **not** reach final output unchanged.

`APPROVED_REFLECTIVE_QUESTION_PRODUCTION` is the orchestration identity above. Standalone Generator / Gate / Repair / Premise Check method IDs remain denied for deploy-as-the-production-method.

Canonical runtime: `src/ai/reflectiveQuestionPipeline.ts`, `src/ai/questionPremiseCheck.ts`. No further prompt R&D.
