# Oneiros v1.0.1 production diagnostic baseline — 2026-08-29

## Decision summary

The frozen approved production candidate was exercised for **54 actual user-facing generations**: 30 Readers and 12 two-turn Exploring trajectories. The exact total model cost was **$0.42161125**, below the approved $3 hard cap. No prompt, model, runtime, database schema, or production deployment changed.

The mechanical validator reported **29/54 PASS (53.7%)** and **25/54 FAIL (46.3%)**. Human review shows that raw FAIL rate is not a product-failure rate:

| Human classification of the 25 flags | Count |
|---|---:|
| harmless_structural_flag | 10 |
| noticeable_but_acceptable | 11 |
| real_oneiros_quality_problem | 4 |

There were **0 hard product failures**. Four open Exploring turns had genuine binary/ternary answer-menu behavior. Eleven Reader flags were noticeable but usable option-framing. Ten flags were harmless validator/structure artifacts. A representative sample of 12 mechanical PASS outputs was reviewed and showed no obvious false-negative contract defect.

**Engineering conclusion:** keep shadow validation observational. The data does not justify buffering, retry, or loss of the ~15s reveal. The next investigation should target validator precision (especially the generic no-language menu pass and short-text language detection) and the specific answer-menu patterns in open Exploring, without changing prompts or architecture in this baseline task.

## Frozen identity and method

- Method: `oneiros-same-call-reflective-questions-v1.0.1`
- Bundle SHA-256: `e7e4ea4b8bfbb253912771f163f692980bbc677f051c72df4b49e5034f6fe8c7`
- Fixture SHA-256: `5e821d2578e5e0f7e688b20b16755b56cabe73590d361429dbff9a0c2af7bbcc`
- Reader prompt: `oneiros-dream-reflection-v3.2.1`
- Chat prompt: `oneiros-followup-chat-v2.0.1`
- Shadow validator: `oneiros-same-call-shadow-v1.0.1`
- Production gateway/builders/models: actual deployed candidate paths
- Contract retry / question-only generation / semantic judge calls: **0**
- Reader/open reruns during recovery: **0 / 0**
- Closing generations: exactly 12, one per frozen trajectory

The first harness pass successfully generated all 30 Readers and all 12 open turns. A committed-idempotency gateway replay then exposed an engineering defect: `dream_followup_reply` replay dereferenced missing `result.value.next_messages`. Recovery read the already committed quota telemetry directly and executed only the 12 closings that had never run. The recovery manifest preserves this audit trail.

## Mechanical validator results

| Surface | n | PASS | FAIL | FAIL rate |
|---|---:|---:|---:|---:|
| chat_followup | 12 | 7 | 5 | 41.7% |
| chat_followup_close | 12 | 10 | 2 | 16.7% |
| reading_advanced | 10 | 1 | 9 | 90.0% |
| reading_quick | 10 | 9 | 1 | 10.0% |
| reading_standard | 10 | 2 | 8 | 80.0% |

| Issue code | Occurrences |
|---|---:|
| manufactured_answer_menu | 22 |
| question_count_mismatch | 2 |
| question_not_interrogative | 1 |
| wrong_output_language:unknown | 2 |

Five open Exploring outputs were mechanically flagged:

| Generation | Exact primary validation reason | Human assessment |
|---|---|---|
| en-s-conflict-bridge | manufactured_answer_menu | harmless_structural_flag — Generic no-language menu pass matched “of”; the open question does not offer selectable answers. |
| el-q-relational-brother | manufactured_answer_menu | real_oneiros_quality_problem — The open turn ends with a binary either/or choice between the hand and the silence. |
| el-a-surreal-moon-kitchen | manufactured_answer_menu | real_oneiros_quality_problem — The open turn directly offers three candidate attributes of the pomegranate. |
| es-q-relational-balcony | manufactured_answer_menu | real_oneiros_quality_problem — The open turn presents a direct binary choice between watering and holding the pot. |
| pl-a-conflict-stairs | manufactured_answer_menu | real_oneiros_quality_problem — The open turn is explicitly binary: leaving versus becoming recognized. |

These were shadow observations, **not retries**. The prior smoke's “5 retries” cannot be retroactively assigned exact reasons from this run; this baseline records exact reasons for its own five flagged open turns.

## Breakdown

### Mode

| Mode | n | PASS | FAIL | FAIL rate |
|---|---:|---:|---:|---:|
| advanced | 18 | 6 | 12 | 66.7% |
| quick | 18 | 15 | 3 | 16.7% |
| standard | 18 | 8 | 10 | 55.6% |

### Language group

| Group | n | PASS | FAIL | FAIL rate |
|---|---:|---:|---:|---:|
| english | 18 | 11 | 7 | 38.9% |
| greek | 18 | 10 | 8 | 44.4% |
| other | 18 | 8 | 10 | 55.6% |

### Individual language

| Language | n | PASS | FAIL | FAIL rate |
|---|---:|---:|---:|---:|
| de | 3 | 3 | 0 | 0.0% |
| el | 18 | 10 | 8 | 44.4% |
| en | 18 | 11 | 7 | 38.9% |
| es | 3 | 2 | 1 | 33.3% |
| fr | 1 | 1 | 0 | 0.0% |
| it | 1 | 0 | 1 | 100.0% |
| ja | 1 | 0 | 1 | 100.0% |
| nl | 1 | 0 | 1 | 100.0% |
| pl | 3 | 0 | 3 | 100.0% |
| pt | 3 | 2 | 1 | 33.3% |
| ru | 1 | 0 | 1 | 100.0% |
| zh | 1 | 0 | 1 | 100.0% |

## Latency and reveal

| Measurement | n | Median | p75 | Max |
|---|---:|---:|---:|---:|
| Reader completion | 30 | 10109 ms | 13928 ms | 27448 ms |
| Reader first visible | 30 | 10109 ms | 13928 ms | 15676 ms |
| Exploring open model | 12 | 2564 ms | 2832 ms | 3881 ms |
| Exploring closing request | 12 | 1828 ms | 1956 ms | 2422 ms |

- Reader generations completing before 15s: 24/30.
- Reader generations reaching the partial-reveal threshold: 4/30.
- Partial streaming remained enabled; validation ran after completion and did not alter delivery.

## Cost

| Surface group | Generations | Exact estimated cost |
|---|---:|---:|
| Reader | 30 | $0.37257250 |
| Exploring open | 12 | $0.02905500 |
| Exploring closing | 12 | $0.01998375 |
| **Total** | **54** | **$0.42161125** |

## Artifacts

- Frozen fixture: `testing/reflective-questions/v1.0.1-production-diagnostic-30.json`
- Raw JSON / JSONL: `testing/reflective-questions/artifacts/v1.0.1-production-diagnostic-2026-08-29/`
- Human review packet: `HUMAN_REVIEW_PACKET.md` in the artifact directory
- Recovery audit: `RECOVERY_MANIFEST.json`
- Machine summary: `ANALYSIS_SUMMARY.json`

No deploy and no database push are required for these benchmark/report artifacts.
