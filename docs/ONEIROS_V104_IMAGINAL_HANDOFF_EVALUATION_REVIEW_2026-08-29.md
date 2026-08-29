# Oneiros v1.0.4 imaginal-handoff evaluation review — 2026-08-29

**Decision: HOLD. Do not deploy. Do not create v1.0.5 automatically.**

The Q2 composition hypothesis is promising and materially improved most of the
packet, but the exact frozen candidate does not clear its pre-registered gate.
Human Q2 review returned `17 PASS / 4 FAIL`; it repaired `2/3` known failures,
preserved `5/6` strong controls, and passed `10/12` unseen holdouts. Q1–Q2
complementarity passed `21/21`. The blocker is not generic flatness: one strong
control suffered a serious invented-fact regression, one holdout also regressed
Q1, and the same meaning-completion failure recurred in three cases.

Production therefore remains the approved v1.0.3 runtime, unchanged.

## Frozen identities

| Field | Value |
|---|---|
| Candidate | `oneiros-same-call-reflective-questions-v1.0.4-candidate` |
| Candidate SHA-256 | `a4f972c00bbde525ad3f39db160afd18e3a1c18f8a92090e0eb7078b137e277d` |
| Candidate Reader | `oneiros-dream-reflection-v3.2.4-candidate` |
| Frozen fixture | `testing/reflective-questions/v1.0.4-imaginal-handoff-evaluation-2026-08-29.json` |
| Fixture SHA-256 | `ec7becc8f382399c1bab1d50edbce4c3568b468e17ab5edd124131987147a211` |
| Production baseline | `oneiros-same-call-reflective-questions-v1.0.3-candidate` / `f5399a49…` |

The exact prompt diff is preserved in
[`ONEIROS_V104_IMAGINAL_HANDOFF_CANDIDATE_2026-08-29.md`](./ONEIROS_V104_IMAGINAL_HANDOFF_CANDIDATE_2026-08-29.md).

## Run facts

| Field | Result |
|---|---:|
| Calls | 21 / 21 |
| Known Q2 failures | 3 |
| Strong Q2 controls | 6 |
| Sealed unseen holdouts | 12 |
| Holdout languages | EN, EL, ES, FR, DE, PT, IT, NL, RU, JA, ZH, PL |
| Provider / model | OpenAI / GPT-5.4, 21 / 21 |
| Operational errors | 0 |
| Quality retries | 0 |
| Semantic-judge calls | 0 |
| Question-only calls | 0 |
| Deployments | 0 |
| Exact cost | `$0.31680500` |
| Hard cap | `$1.00` |
| Latency min / median / mean / max | `5,802 / 8,522 / 10,436 / 23,690 ms` |

Full dreams, production before outputs for every known failure and control,
complete unseen outputs, model/latency/cost records, normalization and validator
objects, and joined human verdicts are preserved in
[`REVIEWED_RESULTS.json`](../testing/reflective-questions/artifacts/v1.0.4-imaginal-handoff-evaluation-2026-08-29/REVIEWED_RESULTS.json).
The readable full-output packet is
[`HUMAN_REVIEW_PACKET.md`](../testing/reflective-questions/artifacts/v1.0.4-imaginal-handoff-evaluation-2026-08-29/HUMAN_REVIEW_PACKET.md).

## Human results

| Dimension | Result |
|---|---:|
| Q2 individual quality | 17 PASS / 4 FAIL |
| Known Q2 failures repaired | 2 / 3 |
| Strong controls at least equivalent | 5 / 6 |
| Sealed holdout Q2 | 10 / 12 |
| Q1–Q2 complementarity | 21 / 21 |
| Q1 regression check | 20 / 21 |
| Structure | 21 / 21 |
| Overall joint verdict | 17 PASS / 4 FAIL |

### Frozen gate

| Gate | Required | Result | Verdict |
|---|---:|---:|---|
| Known Q2 failures repaired | at least 2 / 3 | 2 / 3 | PASS |
| Strong controls at least equivalent | 6 / 6 | 5 / 6 | **FAIL** |
| Serious control regressions | 0 | 1 | **FAIL** |
| Sealed holdout Q2 | at least 10 / 12 | 10 / 12 | PASS |
| Sealed holdout pair complementarity | at least 10 / 12 | 12 / 12 | PASS |
| Q1 serious regressions | 0 | 1 | **FAIL** |
| Structural hard failures | 0 | 0 | PASS |
| Recurring new failure family at 2+ | none | 3 cases | **FAIL** |
| Automatic HOLD at 2+ control regressions | fewer than 2 | 1 | not triggered |

The automatic two-control stop was not triggered, but the stricter SHIP rule
required zero serious control regressions and zero Q1 regressions. The candidate
therefore remains HOLD.

## Verdict by case

| Case | Cohort | Q2 | Pair | Q1 | Control | Finding |
|---|---|---:|---:|---:|---:|---|
| `en-s-conflict-bridge` | known | PASS | PASS | PASS | — | Replaced the threat/concealment/ripening menu with an open orchard–town–river configuration. |
| `pl-a-conflict-stairs` | known | PASS | PASS | PASS | — | Removed the pre-supplied “forming place” frame and returned the explicit family/voice arrangement. |
| `holdout-zh-s-copresence-clock-fountain` | known | **FAIL** | PASS | PASS | — | The option menu disappeared, but became an abstract “untouched yet already closed” answer frame. |
| `en-s-body-glass-hands` | control | PASS | PASS | PASS | PASS | Preserved red thread and unfinished mending with equivalent vitality. |
| `el-a-surreal-moon-kitchen` | control | PASS | PASS | PASS | PASS | Q1 follows transformation; Q2 holds father, hand, fruit, and absent landing. |
| `pt-s-body-feathers` | control | PASS | PASS | PASS | PASS | The two fears are explicit dream material; the threshold remains open. |
| `en-a-surreal-whale-library` | control | PASS | PASS | PASS | PASS | Preserved the breathing-title/book/whale configuration without closure. |
| `el-a-complex-hospital` | control | **FAIL** | PASS | PASS | **FAIL** | Invented that the patient forgot who he was; the dreamer had forgotten whom they sought. |
| `holdout-fr-a-grief-painted-heights` | control | PASS | PASS | PASS | PASS | Preserved the opening window, moths, and empty apartment without assigning meaning. |
| `q2-holdout-en-s-sparse-theatre-chair` | holdout | PASS | PASS | PASS | — | Near-overlap remained distinct: Q1 follows the turn; Q2 hands back blackout and relation. |
| `q2-holdout-el-a-relational-glass-pane` | holdout | PASS | PASS | PASS | — | Kept the pane between the pair before the unturned corner. |
| `q2-holdout-es-s-overlap-shadow-well` | holdout | PASS | PASS | PASS | — | Held the dry-well/wet-ground proximity without answering it. |
| `q2-holdout-fr-a-multiscene-red-gloves` | holdout | PASS | PASS | PASS | — | Compressed the multi-scene glove configuration without symbolic closure. |
| `q2-holdout-de-s-ambiguous-post-office` | holdout | **FAIL** | PASS | PASS | — | Repeated the reading's already-completed standing/going/next-step frame. |
| `q2-holdout-pt-a-body-ladder-arms` | holdout | PASS | PASS | PASS | — | Returned the surviving child-on-shoulder image after transformation. |
| `q2-holdout-it-s-grief-photographs` | holdout | PASS | PASS | PASS | — | Kept fading faces and names appearing on glass open. |
| `q2-holdout-nl-a-conflict-burning-door` | holdout | PASS | PASS | PASS | — | Held the jointly carried door becoming paper-light. |
| `q2-holdout-ru-s-relational-echo-dinner` | holdout | PASS | PASS | PASS | — | Returned the first silence left at the table. |
| `q2-holdout-ja-a-page-stairs` | holdout | PASS | PASS | PASS | — | Preserved the looping ascent, descending cat, and open book; validator punctuation miss only. |
| `q2-holdout-zh-s-underwater-banquet` | holdout | **FAIL** | PASS | **FAIL** | — | Q2 invented the unheard song's effect and supplied a category frame; Q1 also requested an unseen separating layer. |
| `q2-holdout-pl-s-sparse-door-snow` | holdout | PASS | PASS | PASS | — | Kept knocker, flat door, footprints, and absent figure unresolved. |

## Failure-family analysis

The central hypothesis is partly validated: `imaginal handoff` is a better Q2
job than generic “deepen or reopen.” It preserves vitality, produces a distinct
second psychological operation in every case, and generalizes across all 12
languages. It is not merely safer wording.

The exact instruction does not yet impose a reliable stopping boundary. In
three failed Q2s the model reaches the explicit configuration and then converts
the reading's salience into a ready conceptual relation:

- Chinese clock/fountain: “untouched yet already closed”;
- German post office: standing/going/next step, already supplied by the reading;
- Chinese underwater banquet: the song moves the dreamer toward an underwater
  position or relationship.

This recurring family is `meaning_completion_past_handoff`. Its mechanism is
not a literal A/B menu; it is a subtler completion of the symbolic connection
inside the question premise. That recurrence at `3` exceeds the frozen threshold
of `2`.

The Greek hospital control exposes a separate grounding risk. The model moved
the dreamer's forgetting onto the patient and thereby created dream footage.
Because the baseline Q2 was already excellent, this is a serious regression,
not an acceptable exchange for general safety.

The Chinese underwater holdout also produced the packet's only Q1 regression.
Q1's prompt bytes were unchanged, but single-call generation is coupled: a
Q2-only instruction can still alter the sampled whole response. The release
gate correctly evaluates the complete pair rather than assuming untouched text
must produce byte-identical Q1.

## Controls and unseen generalization

Five of six strong controls remained at least equivalent. They retained
imaginal life rather than collapsing into generic therapy prompts. The one
hospital regression is serious and prevents SHIP under the zero-regression
rule.

Ten of twelve unseen Q2s passed. Strong results appeared in sparse, relational,
multi-scene, grief, body-transformation, conflict, and syntactically varied
languages. Pair complementarity passed all twelve holdouts and all 21 total
cases: Q1 consistently followed what happened, while Q2 returned a different
unfinished configuration. The grammar therefore generalizes as a role
distinction, but not yet as a fully reliable epistemic stopping boundary.

## Structure and validator kept separate

All 21 outputs contained exact `## Reflective Questions`, exactly two extracted
questions, and the correct output language. The production structure normalizer
was present in the exact runtime-parity path but applied `0` times because every
output was already valid. No streaming or partial-output path changed.

The deterministic shadow observer returned `15 PASS / 6 FAIL`:

- four English `manufactured_answer_menu` flags were false positives caused by
  the language-agnostic scanner reading English `of` as Dutch disjunction;
- the Japanese count/interrogative flags were false positives for valid `か。`
  punctuation;
- the Polish menu flag came from `albo`/`lub` in Reader prose, not either
  reflective question.

Validator PASS was not treated as human PASS and validator FAIL was not treated
as human FAIL. No validator code or prompt tuning was performed.

## Recommendation

**HOLD the exact v1.0.4 candidate.** Preserve it as evidence that imaginal
handoff is a strong Q2 direction, but do not deploy this SHA and do not iterate
automatically. Any future Q2 candidate requires a new explicit product decision
and must address the recurrent meaning-completion mechanism without flattening
the `17/21` successful questions.

Production remains:

- method `oneiros-same-call-reflective-questions-v1.0.3-candidate` / SHA
  `f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7`;
- Reader `oneiros-dream-reflection-v3.2.3-candidate`;
- normalizer `oneiros-reflective-question-structure-normalizer-v1.0.0`;
- runtime bundle `oneiros-reflective-questions-runtime-v1.0.3+structure-v1.0.0`;
- gateway function version `113`.

No deployment, database push, `openai-proxy` deployment, UI change, or runtime
production prompt change was made.
