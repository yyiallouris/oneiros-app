# Oneiros v1.0.5 source-ownership evaluation review — 2026-08-29

**Decision: HOLD. Stop Q2 prompt R&D. Do not deploy and do not create v1.0.6.**

The ownership hypothesis produced real repairs but did not reach production
reliability. It corrected `3/4` v1.0.4 failures, including the hospital subject
displacement, and source ownership passed `20/22`. Q1–Q2 complementarity was
again perfect at `22/22`. But only `4/6` protected controls remained at least
equivalent, unseen Q2 reached only `9/12`, two serious Q1 regressions appeared,
and multiple failure families recurred.

The agreed final-candidate stop condition therefore applies. Production remains
the approved v1.0.3 runtime and its existing Q2.

## Frozen identities

| Field | Value |
|---|---|
| Candidate | `oneiros-same-call-reflective-questions-v1.0.5-candidate` |
| Candidate SHA-256 | `16da1d13fb480dd57ef013a7e8241a8309ec06c67d3e1d071089cb24f54cf67a` |
| Candidate Reader | `oneiros-dream-reflection-v3.2.5-candidate` |
| Fixture | `testing/reflective-questions/v1.0.5-source-ownership-evaluation-2026-08-29.json` |
| Fixture SHA-256 | `dd74ae0c3ccf5263b5baba4ceb8960c76ed4ec6890eb459ad19feea88f911da1` |
| Evaluated predecessor | v1.0.4 / `a4f972c…` |
| Production identity | v1.0.3 / `f5399a49…` |

Exact wording and scope:
[`ONEIROS_V105_SOURCE_OWNERSHIP_CANDIDATE_2026-08-29.md`](./ONEIROS_V105_SOURCE_OWNERSHIP_CANDIDATE_2026-08-29.md).

## Run facts

| Field | Result |
|---|---:|
| Calls | 22 / 22 |
| v1.0.4 failure-recovery anchors | 4 |
| Protected v1.0.4 PASS controls | 6 |
| Fresh sealed unseen holdouts | 12 |
| Holdout languages | EN, EL, ES, FR, DE, PT, IT, NL, RU, JA, ZH, PL |
| Provider / model | OpenAI / GPT-5.4, 22 / 22 |
| Operational errors | 0 |
| Quality retries | 0 |
| Semantic-judge calls | 0 |
| Question-only calls | 0 |
| Deployments | 0 |
| Exact cost | `$0.33537750` |
| Hard cap | `$1.00` |
| Latency min / median / mean / max | `6,141 / 9,163 / 10,052 / 21,926 ms` |

Full dreams, v1.0.4 before outputs, the protected hospital v1.0.3 baseline,
complete candidate outputs, model/latency/cost data, normalizer/validator data,
and joined verdicts are preserved in
[`REVIEWED_RESULTS.json`](../testing/reflective-questions/artifacts/v1.0.5-source-ownership-evaluation-2026-08-29/REVIEWED_RESULTS.json).
The readable packet is
[`HUMAN_REVIEW_PACKET.md`](../testing/reflective-questions/artifacts/v1.0.5-source-ownership-evaluation-2026-08-29/HUMAN_REVIEW_PACKET.md).

## Human results

| Dimension | Result |
|---|---:|
| Q2 individual quality | 17 PASS / 5 FAIL |
| Source ownership | 20 PASS / 2 FAIL |
| v1.0.4 failures repaired | 3 / 4 |
| Protected controls at least equivalent | 4 / 6 |
| Serious control regressions | 1 |
| Hospital v1.0.4 fact error repaired | PASS |
| Hospital at least equivalent to v1.0.3 | PASS |
| Fresh unseen Q2 | 9 / 12 |
| Fresh unseen pair complementarity | 12 / 12 |
| Q1 regression check | 20 PASS / 2 FAIL |
| Whole-packet pair complementarity | 22 / 22 |
| Structure | 22 / 22 |
| Overall joint verdict | 15 PASS / 7 FAIL |

## Frozen gate

| Gate | Required | Result | Verdict |
|---|---:|---:|---|
| Recovery anchors repaired | at least 3 / 4 | 3 / 4 | PASS |
| Protected controls equivalent | 6 / 6 | 4 / 6 | **FAIL** |
| Serious control regressions | 0 | 1 | **FAIL** |
| Hospital factual recovery | required | repaired | PASS |
| Hospital v1.0.3 equivalence | required | equivalent | PASS |
| Fresh unseen Q2 | at least 10 / 12 | 9 / 12 | **FAIL** |
| Fresh unseen complementarity | at least 10 / 12 | 12 / 12 | PASS |
| Serious Q1 regressions | 0 | 2 | **FAIL** |
| Structural hard failures | 0 | 0 | PASS |
| Recurring failure family at 2+ | none | 5 families | **FAIL** |

## Verdict by case

| Case | Cohort | Q2 | Source | Pair | Q1 | Control | Finding |
|---|---|---:|---:|---:|---:|---:|---|
| `holdout-zh-s-copresence-clock-fountain` | recovery | **FAIL** | PASS | PASS | PASS | — | Removed the old meaning frame but supplied “atmosphere or position” categories. |
| `el-a-complex-hospital` | recovery | PASS | PASS | PASS | PASS | v1.0.3 PASS | Correctly keeps forgetting with the dreamer; restores strong baseline quality. |
| `q2-holdout-de-s-ambiguous-post-office` | recovery | PASS | PASS | PASS | PASS | — | Removes standing/going frame and stays with snow covering the child's shoes. |
| `q2-holdout-zh-s-underwater-banquet` | recovery | PASS | PASS | PASS | PASS | — | Removes the supplied causal direction; shell, ear, and unheard song stay open. |
| `en-s-body-glass-hands` | control | PASS | PASS | PASS | PASS | PASS | Preserves torn shirt, inner red threads, and mending relation. |
| `el-a-surreal-moon-kitchen` | control | PASS | PASS | PASS | PASS | PASS | Keeps father/hand/floating pomegranate/absent support alive. |
| `pt-s-body-feathers` | control | PASS | PASS | PASS | PASS | PASS | Uses both explicitly reported fears without manufacturing a choice. |
| `en-a-surreal-whale-library` | control | PASS | PASS | PASS | PASS | **FAIL** | Grounded but loses the whale/sleeper/candle scale of the stronger control. |
| `q2-holdout-ja-a-page-stairs` | control | PASS | PASS | PASS | PASS | PASS | Preserves cat, book, and arrested open staircase. |
| `q2-holdout-pl-s-sparse-door-snow` | control | **FAIL** | PASS | PASS | PASS | **FAIL** | Collapses a rich configuration into generic “What are these footprints for you?” |
| `q2-ownership-holdout-en-s-upward-rain-moth` | unseen | PASS | PASS | PASS | PASS | — | Strong glass/moth/upward-rain configuration. |
| `q2-ownership-holdout-el-a-brothers-bell-voice` | unseen | PASS | PASS | PASS | PASS | — | Passes a difficult voice/subject-attribution trap. |
| `q2-ownership-holdout-es-s-museum-shadow-tree` | unseen | PASS | PASS | PASS | PASS | — | Holds visible growth with absent shadow. |
| `q2-ownership-holdout-fr-a-grandfather-map-bowl` | unseen | PASS | PASS | PASS | PASS | — | Leaves the impossible train route open. |
| `q2-ownership-holdout-de-s-finger-keys-coat` | unseen | PASS | PASS | PASS | PASS | — | Preserves whose fingers, coat, holding hand, and received stone. |
| `q2-ownership-holdout-pt-a-half-gate-shadow` | unseen | PASS | PASS | PASS | PASS | — | Separates completed passage from the shadow left outside. |
| `q2-ownership-holdout-it-a-blue-bowl-rooms` | unseen | PASS | PASS | PASS | **FAIL** | Q2 passes; Q1 invents earth becoming tickets across a scene cut. |
| `q2-ownership-holdout-nl-s-blank-newspaper-print` | unseen | **FAIL** | PASS | PASS | PASS | — | Drops the configuration into a generic phenomenological shell. |
| `q2-ownership-holdout-ru-a-brother-mirror-cloth` | unseen | PASS | PASS | PASS | PASS | — | Strongly preserves brother/body/reflection ownership. |
| `q2-ownership-holdout-ja-s-garden-umbrella-fox` | unseen | **FAIL** | **FAIL** | PASS | PASS | — | Supplies “atmosphere or relation” and creates relation from co-presence. |
| `q2-ownership-holdout-zh-a-feather-stairs-lantern` | unseen | **FAIL** | **FAIL** | PASS | **FAIL** | Q2 offers three targets including an invented place; Q1 invents mutual influence. |
| `q2-ownership-holdout-pl-a-drawer-lake` | unseen | PASS | PASS | PASS | PASS | — | Keeps the self-opening drawer and whole lake unresolved. |

## What the experiment established

The ownership diagnosis was materially correct. The candidate:

- repaired the hospital's transferred forgetting;
- removed the German reading-summary premise;
- removed the underwater-banquet causal direction;
- preserved source attribution across difficult Greek, German, and Russian
  subject traps;
- retained perfect Q1–Q2 role complementarity.

So `Reading chooses. Dream supplies. Dreamer connects.` is a useful editorial
description of the desired operation.

It is not a sufficiently reliable same-call prompt control. Three questions
still manufactured category spaces. Two outputs crossed the source boundary.
The stronger concrete-source constraint also overcorrected toward flattening:
two questions lost imaginal configuration and became generic prompts. Two
protected controls were no longer equivalent, and the Polish regression was
serious.

The two Q1 regressions demonstrate the non-local reliability limit of this
topology. Although Q1 bytes were unchanged, the Q2 instruction altered the
sampled whole Reader response. The Italian Q1 turned a scene cut into a
transformation; the Chinese Q1 invented mutual influence between simultaneous
events. A Q2-only semantic edit cannot guarantee Q1 invariance in one call.

Recurring families at the pre-registered threshold were:

- `manufactured_category_space`: 3;
- `control_vitality_regression`: 2;
- `generic_or_flattened_q2`: 2;
- `serious_q1_regression`: 2;
- `source_boundary_drift`: 2.

This is the reliability ceiling anticipated by the final experiment agreement:
further prompt clauses would trade one failure family for another and resume
prompt drift.

## Structure and validator kept separate

All 22 outputs had the exact heading, two extracted questions, correct output
language, and no extra prose question. The production normalizer applied zero
times because every structure was already valid. Streaming and partial reveal
were untouched.

The deterministic observer returned `17 PASS / 5 FAIL`:

- two English `manufactured_answer_menu` flags were Dutch-`of` false positives;
- two Japanese count/interrogative failures were valid `か。` punctuation;
- the Chinese answer-menu flag was a true positive.

Human review additionally detected category-space and co-presence failures that
the lexical observer is not designed to judge. Validator behavior was not
changed.

## Recommendation

**HOLD and close the current Q2 prompt-iteration line.** The v1.0.5 candidate
is explicitly denied. Do not create v1.0.6, add another prompt rule, or
introduce a semantic judge/repair pipeline. The current production Q2 is
intentionally retained; only a future architecture/product decision may reopen
this line.

Production remains:

- method `oneiros-same-call-reflective-questions-v1.0.3-candidate` / SHA
  `f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7`;
- Reader `oneiros-dream-reflection-v3.2.3-candidate`;
- normalizer `oneiros-reflective-question-structure-normalizer-v1.0.0`;
- runtime bundle `oneiros-reflective-questions-runtime-v1.0.3+structure-v1.0.0`;
- gateway version `113`.

No deploy, database push, `openai-proxy`, mobile/UI, extraction, chat, essay,
RDF, model, or streaming change was made.
