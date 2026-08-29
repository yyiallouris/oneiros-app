# Oneiros v1.0.3 enacted-relation evaluation review — 2026-08-29

**Decision: Q1 HYPOTHESIS PASS; PROMPT+NORMALIZER PACKAGE APPROVED BY PO.**
`oneiros-same-call-reflective-questions-v1.0.3-candidate` / SHA
`f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7`.

The candidate repaired all ten known Question-1 failures, preserved all three
strong controls, and passed Q1 human review across all eight sealed unseen
languages and dream families. The enacted-relation grammar therefore looks like
a real quality improvement rather than anchor overfit or prompt luck.

The exact candidate nevertheless misses the pre-registered release gate because
one unseen Chinese output omitted the required `## Reflective Questions`
heading. Its two visible questions remained in prose, so prompt-only structure
failed even though Q1 itself passed. The separately versioned deterministic
normalizer closed that engineering blocker, after which the PO explicitly
approved the frozen prompt+normalizer package. No second prompt iteration.

## Frozen identities

| Field | Value |
|---|---|
| Candidate | `oneiros-same-call-reflective-questions-v1.0.3-candidate` |
| Candidate SHA-256 | `f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7` |
| Candidate Reader | `oneiros-dream-reflection-v3.2.3-candidate` |
| Frozen fixture | `testing/reflective-questions/v1.0.3-enacted-relation-evaluation-2026-08-29.json` |
| Fixture SHA-256 | `cc60ad8ebe6e66a5982a6b20ef995e1c7687a51d9becdb0e2e9165d3672da1ce` |
| Production predecessor | `oneiros-same-call-reflective-questions-v1.0.1` / `e7e4ea4b…` |

The fixture was hashed before the first model call. The candidate remained
byte-frozen throughout the run. The production request builder, task routing,
temperatures, and token limits were retained; the offline builder replaced
exactly one Q1 instruction in one Standard/Advanced system message.

## Run facts

| Field | Result |
|---|---:|
| Calls | 21 / 21 |
| Known failure anchors | 10 |
| Strong controls | 3 |
| Sealed unseen holdouts | 8 |
| Holdout languages | EN, EL, ES, FR, DE, PT, JA, ZH |
| Provider / model | OpenAI / GPT-5.4, 21 / 21 |
| Operational errors | 0 |
| Quality retries | 0 |
| Semantic-judge calls | 0 |
| Question-only calls | 0 |
| Deployments | 0 |
| Exact cost | `$0.33461750` |
| Hard cap | `$1.00` |
| Latency min / median / mean / max | `5,864 / 11,077 / 11,836 / 24,295 ms` |

The first shell attempt could not reach the network sandbox and stopped before
authentication, artifact creation, or any model call. The authorized run then
executed once with external network access. It did not consume a duplicate call
or cost.

Full dreams, complete v1.0.1 before outputs for anchors/controls, complete
v1.0.3 outputs, validator objects, models, latency, cost, and joined human
verdicts are preserved in
[`REVIEWED_RESULTS.json`](../testing/reflective-questions/artifacts/v1.0.3-enacted-relation-evaluation-2026-08-29/REVIEWED_RESULTS.json).
The readable full packet is
[`HUMAN_REVIEW_PACKET.md`](../testing/reflective-questions/artifacts/v1.0.3-enacted-relation-evaluation-2026-08-29/HUMAN_REVIEW_PACKET.md).

## Frozen gate outcome

| Gate | Required | Result | Verdict |
|---|---:|---:|---|
| Known failures repaired by human Q1 review | at least 6 / 10 | 10 / 10 | PASS |
| Strong controls at least equivalent | 3 / 3 | 3 / 3 | PASS |
| Sealed holdout human Q1 | at least 7 / 8 | 8 / 8 | PASS |
| Sealed holdout joint Q1 + structure | generalizes without hard drift | 7 / 8 | **FAIL** |
| Structural hard failures | 0 | 1 | **FAIL** |
| Recurring new Q1 failure family | none at 2+ cases | none | PASS |
| Automatic 2+ control-regression stop | fewer than 2 | 0 | not triggered |

Human Q1 review across the whole packet was `21 PASS / 0 FAIL`. When structure
is included, overall case review was `20 PASS / 1 FAIL`. The single failed
release gate is deterministic structure, not Q1 quality.

### Product editorial calibration

The product owner explicitly clarified during human review that Oneiros values
vitality over sterile zero-risk language. The applied boundary is therefore:

- earned, dream-grounded, invitational interpretation is desirable;
- arbitrary certainty, manufactured A/B answers, and fabricated memory remain
  failures.

This does not weaken the frozen safeguards. It distinguishes a vivid relation
actually enacted by the dream from an answer invented outside it. For example,
a child librarian who gives a candle and a task earns the visitor-to-entrusted
movement; a house that shrinks as friends enter earns the welcome-to-pressure
movement. Failing those questions merely because they carry interpretation
would reward flatness rather than epistemic care.

## Human verdict by case

| Case | Cohort | Q1 | Structure | Control | Overall | Finding |
|---|---|---:|---:|---:|---:|---|
| `en-s-ancestor-coat:reading_standard` | known | PASS | PASS | — | PASS | Coat, rosemary, tickets, grief, and the kind room remain open without a supplied menu. |
| `en-s-conflict-bridge:reading_standard` | known | PASS | PASS | — | PASS | Q1 follows both already-staged voices; Q2 separately contains a real answer menu. |
| `en-a-surreal-whale-library:reading_advanced` | known | PASS | PASS | — | PASS | The visitor-to-entrusted movement is earned by the explicitly given candle, warning, and task. |
| `en-a-complex-city-tide:reading_advanced` | known | PASS | PASS | — | PASS | Uses the planted key and the crowd's reported response without missing footage. |
| `el-s-body-bark:reading_standard` | known | PASS | PASS | — | PASS | Follows writing, bark, and slower/clearer words without candidate answers. |
| `el-s-conflict-house:reading_standard` | known | PASS | PASS | — | PASS | Door-opening plus the shrinking house earns the vivid welcome-to-pressure relation. |
| `el-a-complex-hospital:reading_advanced` | known | PASS | PASS | — | PASS | Strong enacted relation between carried bowl and flowing river. |
| `el-a-ancestor-olive-door:reading_advanced` | known | PASS | PASS | — | PASS | The dream explicitly requires leaving something personal before entry; the relational transition is earned. |
| `pl-a-conflict-stairs:reading_advanced` | known | PASS | PASS | — | PASS | Develops stillness against moving stairs without bodily reconstruction; Q2 separately supplies a frame. |
| `zh-a-ambiguous-ancestor-river:reading_advanced` | known | PASS | PASS | — | PASS | The fish-reaching → room-moving event replaces the earlier spatial binary. |
| `en-s-body-glass-hands:reading_standard` | control | PASS | PASS | equivalent | PASS | Reusable felt language remains tightly bound to needle, shirt, glass hands, fear, and reported steadiness. |
| `el-a-surreal-moon-kitchen:reading_advanced` | control | PASS | PASS | equivalent | PASS | Oven → clouds remains specific, vivid, and at least as strong as the baseline. |
| `pt-s-body-feathers:reading_standard` | control | PASS | PASS | equivalent | PASS | Feather growth and suitcase weight form a clean reported relation. |
| `holdout-en-s-sparse-window-cup:reading_standard` | holdout | PASS | PASS | — | PASS | Sparse event remains grounded in the cup's rotation and covering action. |
| `holdout-el-a-relational-red-thread:reading_advanced` | holdout | PASS | PASS | — | PASS | Strong mutual action; no relation invented from co-presence. |
| `holdout-es-s-body-roots:reading_standard` | holdout | PASS | PASS | — | PASS | Invites fresh imaginal noticing at the explicit root-to-foot transformation without pretending a remembered sensation was reported. |
| `holdout-fr-a-grief-painted-heights:reading_advanced` | holdout | PASS | PASS | — | PASS | Stays with the explicit shoe/height-mark encounter. |
| `holdout-de-s-surreal-moon-scale:reading_standard` | holdout | PASS | PASS | — | PASS | Opens the coin → grass event without supplying alternatives. |
| `holdout-pt-a-conflict-sea-gate:reading_advanced` | holdout | PASS | PASS | — | PASS | Tracks step, bell, and water response without turning conflict into a binary. |
| `holdout-ja-a-complex-name-train:reading_advanced` | holdout | PASS | PASS | — | PASS | Natural Japanese interrogatives stay with the envelope/lake return event; validator punctuation flag is false positive. |
| `holdout-zh-s-copresence-clock-fountain:reading_standard` | holdout | PASS | **FAIL** | — | **FAIL** | Q1 correctly avoids linking the sleeping woman, but the required heading is missing and Q2 adds a three-part menu. |

## Composition finding

The enacted-event selector is materially better than the old empty
observational/somatic property slot. It produced strong questions across sparse,
relational, grief, surreal, conflict, and complex unseen dreams, and it resisted
the deliberate Chinese co-presence trap at the Q1 level.

The feared constraint displacement did not recur at the Q1 level. The model
reliably selected complete reported events instead of searching for an omitted
body property, spatial arrangement, or causal detail. Where it named a
transition, the transition was earned by the dream's action-response sequence
and remained invitational rather than becoming an A/B answer menu.

The strongest evidence is not only the `10/10` repair result. All three controls
remained at least equivalent, and all eight unseen Q1s passed across sparse,
relational, grief, body-transformation, surreal, conflict, complex, and
co-presence material. The Chinese co-presence trap was particularly informative:
Q1 followed clock → water and did not invent a relation with the sleeping woman.

The Chinese holdout proves that the event grammar can avoid inventing a
relationship from mere co-presence, but its missing heading is a release-blocking
structural failure under the frozen gate.

## Validator kept separate

The deterministic observer returned `12 PASS / 9 FAIL`:

- `manufactured_answer_menu`: 7
- `question_count_mismatch`: 2
- `missing_reflective_questions_heading`: 1
- `question_not_interrogative`: 1

Five English menu flags are the known language-agnostic Dutch `of` false
positive. The Japanese count/interrogative flag is also a false positive because
natural `でしょうか。` questions need not use `?`. Human review nevertheless
confirmed one real English Q2 menu, one quality-relevant Polish Q2 supplied
frame, and the Chinese missing-heading/count failure. No validator code or score
was changed.

## Recommendation

**Treat the enacted-relation Q1 hypothesis as human-quality PASS. Keep the exact
candidate on deployment HOLD only because the frozen gate allowed zero
structural hard failures and observed one.** Do not mutate the prompt or
automatically create/evaluate v1.0.4. Return this distinction to the PO for an
explicit release decision: Q1 quality generalized; structure missed its strict
gate once.

The production package is `oneiros-same-call-reflective-questions-v1.0.3-candidate`
/ `f5399a49…` with runtime bundle
`oneiros-reflective-questions-runtime-v1.0.3+structure-v1.0.0`. It requires no
database push or `openai-proxy` deployment and changes no model, cardinality,
chat, essay, Recent Dream Field, or streaming behavior.

## Post-review structural implementation closeout

After accepting the Q1 hypothesis as PASS, the PO approved one engineering-only
repair: `oneiros-reflective-question-structure-normalizer-v1.0.0`, operation
`insert_missing_reflective_questions_heading`. The v1.0.3 prompt text and SHA
remain byte-frozen. This is a separate runtime identity, not a prompt revision
or v1.0.4.

The pure normalizer runs only on completed Standard/Advanced output with one
required end marker and an unambiguous terminal pair of question bullets. Its
only mutation is insertion of exact `## Reflective Questions` plus required
newlines. Existing prose and question bytes remain unchanged; every ambiguous
shape is a byte-identical no-op. It runs before final observation/extraction/
persistence and never in the streaming `onProgress` path.

Deterministic replay made no model calls. Across the existing v1.0.2 and v1.0.3
packets, both real heading misses were repaired and all 39 other outputs were
byte-identical. The Chinese holdout now extracts its original two bullets and
passes the heading/cardinality structure. Q2's three-part supplied frame remains
a separate quality finding and is not represented as repaired.

PO-approved deployment tuple:

- prompt: `oneiros-same-call-reflective-questions-v1.0.3-candidate` /
  `f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7`
- Reader: `oneiros-dream-reflection-v3.2.3-candidate`
- runtime normalizer: `oneiros-reflective-question-structure-normalizer-v1.0.0`
- runtime bundle label:
  `oneiros-reflective-questions-runtime-v1.0.3+structure-v1.0.0`

The guarded gateway deployment record is maintained in
`REFLECTIVE_QUESTION_PRODUCTION_HOLD.md`. No database change is required.
