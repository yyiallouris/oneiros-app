# Oneiros v1.0.2 surgical question root cause — 2026-08-29

**Status:** offline analysis complete. No model call, semantic judge, prompt
candidate, deployment, or database change was made for this analysis. Runtime
question-writing has been restored to approved v1.0.1; the independent committed
follow-up replay repair remains in the gateway code.

Source evidence:

- frozen before/after packet:
  `testing/reflective-questions/artifacts/v1.0.2-surgical-anchor-evaluation-2026-08-29/RAW_BEFORE_AFTER.json`
- locked evaluation verdict:
  [`ONEIROS_V102_SURGICAL_ANCHOR_REVIEW_2026-08-29.md`](./ONEIROS_V102_SURGICAL_ANCHOR_REVIEW_2026-08-29.md)
- exact failed prompt delta:
  [`ONEIROS_V102_SURGICAL_PATCH_CANDIDATE_2026-08-29.md`](./ONEIROS_V102_SURGICAL_PATCH_CANDIDATE_2026-08-29.md)

The locked human totals remain `11 PASS / 9 FAIL`. This root-cause pass does not
relabel that review. It distinguishes the composition mechanism underneath the
verdicts and notes where an official PASS still contains residual epistemic risk.

## Finding

The common failure is **slot pressure followed by constraint displacement**.

For Standard and Advanced, Question 1 is still assigned an
`observational / somatic` job. That job naturally asks the model to recover an
unknown property: how the body felt, what an object looked like, what changed
first, or why a scene had a quality. V1.0.2 prohibited several bodily and
feeling vocabularies without replacing that underlying question act. The model
therefore moved the same answer-menu scaffold into spatial, temporal, causal,
or developmental vocabulary.

This is why the patch could remove `heavy / steady / rigid` yet produce
`near the door / in the centre / ready to receive the watch`. The prohibited
words changed; the interview structure did not.

Three additional mechanisms matter:

1. **Co-presence was mistaken for relation.** “Already connected elements” was
   broad enough for the model to treat two things in the same scene as a
   relation, then invent the missing connection.
2. **The chat exception reopened the defect.** Allowing a menu when the dream
   explicitly staged a choice let the Polish stairs turn restate the exact
   family-versus-own-voice binary the user had already named.
3. **Extra constraints competed with structure.** One Reader lost the required
   heading and another added a prose question. A single 20-call packet cannot
   prove direct causation, but the added instruction load did not improve
   structural reliability.

## Case map

Legend:

- `A` — supplied answer vocabulary
- `B` — omitted or reconstructed dream footage
- `C` — option framing displaced into spatial, causal, temporal, or other terms
- `D` — structural drift

| Case | Official result | Root-cause reading |
|---|---|---|
| `en-s-ancestor-coat:reading_standard` | FAIL | `A + D`: the menu moved to weight/age/purpose and the heading disappeared. |
| `en-s-conflict-bridge:reading_standard` | FAIL | `A + C`: bodily explanations became size/drop/opposite-bank explanations. |
| `en-a-surreal-whale-library:reading_advanced` | PASS | `B` was avoided by changing memory retrieval into present imaginal noticing; the second question followed an enacted return relation. |
| `en-a-complex-city-tide:reading_advanced` | PASS | Official repair, but residual `B` risk remains: the first question asks for unreported features that made each childhood room recognizable. |
| `el-s-body-bark:reading_standard` | FAIL | `A + C`: bodily states became rhythm/hand-weight/act-of-writing dimensions. |
| `el-s-conflict-house:reading_standard` | FAIL | `A + C`: bodily pressure became room/distance/position alternatives. |
| `el-a-complex-hospital:reading_advanced` | PASS | Cleanest repair: both questions use changes or relations already enacted by the dream. |
| `el-a-ancestor-olive-door:reading_advanced` | FAIL | `B + C`: the model invented possible table placements after bodily options were forbidden. |
| `pl-a-conflict-stairs:reading_advanced` | PASS | Official repair, but residual `B` risk remains: “what did the stairs look like?” requests unreported visual footage; the second question is clean. |
| `zh-a-ambiguous-ancestor-river:reading_advanced` | FAIL | `A + C + D`: a spatial binary replaced the bodily menu and a prose question created a real count mismatch. |
| `el-q-relational-brother:chat_followup` | PASS | The menu was replaced by one user-confirmed relation: silent care through gesture. |
| `el-a-surreal-moon-kitchen:chat_followup` | PASS | The question followed the user's own “present but cannot stabilize” relation. |
| `es-q-relational-balcony:chat_followup` | PASS | The question stayed with the user's shared-care relation, although its affect wording is less precise than the strongest repairs. |
| `pl-a-conflict-stairs:chat_followup` | FAIL | `A`: the explicit-choice exception licensed a restatement of the existing binary. |

The two control regressions have the same Question-1 signature:

- `el-a-surreal-moon-kitchen:reading_advanced` changed a clean invitation into
  kitchen-versus-sky.
- `pt-s-body-feathers:reading_standard` changed a clean bodily observation into
  three stages of feather development.

The other four controls stayed sound because their questions already used an
enacted relation or movement rather than searching for an omitted attribute.

## Assessment of the proposed positive instruction

The proposed direction is **substantively right but underspecified**:

> Compose the question from a relation or movement explicitly present in the
> dream. Ask what changes, develops, or becomes visible within that relation.

It explains the strongest repairs: hospital, brother, moon-chat, balcony, and
the relational second questions in whale, city-tide, and stairs. It would also
discourage both control regressions.

It does not yet distinguish an enacted relation from mere co-presence, and
“becomes visible” can still invite omitted visual footage. Added as another
global rule, it would also leave the conflicting observational/somatic Question
1 slot intact.

## Recommendation

Keep production at v1.0.1. Do not append more prohibitions and do not create a
new candidate from this report alone.

If a later candidate receives explicit PO approval, use one composition rule as
a **replacement for the Question 1 job**, not as an additional safeguard:

> Build each question from one complete relation already enacted in the dream
> or latest user turn—one element acts on, changes, or directly contrasts with
> another—and ask what that enacted relation opens. Leave answer vocabulary and
> unstated scene detail with the dreamer.

For chat, replace the failed exception with the same operation anchored first to
the latest user turn. Do not preserve a dream binary merely because the dream
contains it; the follow-up should develop what the user has added rather than
ask them to select between already-stated poles.

This is a candidate hypothesis only. It has not been inserted into any prompt,
hashed as a new identity, evaluated, approved, or deployed.

## Approved follow-up: offline v1.0.3 diff

After explicit review of this diagnosis, a narrower wording was approved for an
offline diff only. It removes the example-like verb list and `directly
contrasts`, and replaces only the Standard/Advanced Q1 job with a general
explicit-event operation. The runtime prompt remains v1.0.1; no call or deploy
was authorized by preparing the artifact. Exact wording and SHA:
[`ONEIROS_V103_ENACTED_RELATION_CANDIDATE_2026-08-29.md`](./ONEIROS_V103_ENACTED_RELATION_CANDIDATE_2026-08-29.md).
