# Reflective-question production identity

**Updated:** 2026-08-29
**Status:** release `v1.0.3` is PO-approved, production, and deployed through the guarded wrapper on 2026-08-29, with no current production blocker. Canonical release alias `oneiros-same-call-reflective-questions-v1.0.3` maps to the immutable evaluated prompt artifact `oneiros-same-call-reflective-questions-v1.0.3-candidate` / SHA `f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7`; Reader alias `oneiros-dream-reflection-v3.2.3` maps to evaluated artifact `oneiros-dream-reflection-v3.2.3-candidate`. Chat remains `oneiros-followup-chat-v2.0.1`, structure normalizer is `oneiros-reflective-question-structure-normalizer-v1.0.0`, runtime bundle is `oneiros-reflective-questions-runtime-v1.0.3+structure-v1.0.0`, and essays remain `2.0.4-phase1`. Supabase project `xacdawttvtfrdbcwhcqn` reports `ai-entitlements-gateway` ACTIVE at function version `113`, updated `2026-08-29 18:17:32 UTC`. The aliases do not change prompt bytes or runtime telemetry; the deploy wrapper remains fail-closed against the evaluated artifact SHA and runtime wiring. Composer, v1.2 orchestration, Integrity Gate, Repair, and Premise Check are **CLOSED R&D — not production**.

**Local source:** the repository prompt runtime is the exact approved v1.0.3
bundle and SHA above. The normalizer identity remains separate from the prompt
SHA, and runtime identity telemetry records both without duplicating model text.
The failed
`oneiros-same-call-reflective-questions-v1.0.2-candidate` / SHA `94d4a92a…`
prompt delta is archived and explicitly denied. Its independent committed
follow-up replay recovery is deployed in gateway version `112` without changing
Reader, chat, model, cardinality, or streaming identity. Candidate record:
[`ONEIROS_V102_SURGICAL_PATCH_CANDIDATE_2026-08-29.md`](./ONEIROS_V102_SURGICAL_PATCH_CANDIDATE_2026-08-29.md).
Offline root cause:
[`ONEIROS_V102_SURGICAL_ROOT_CAUSE_2026-08-29.md`](./ONEIROS_V102_SURGICAL_ROOT_CAUSE_2026-08-29.md).
The v1.0.3 enacted-relation wording passed its single frozen human Q1 review
`21/21` and received explicit PO production approval on 2026-08-29. The one
Chinese missing-heading failure is repaired by the deterministic normalizer,
with both historical misses repaired and the other 39 frozen outputs
byte-identical. Q2 remains unchanged and is not claimed as solved by this release:
[`ONEIROS_V103_ENACTED_RELATION_CANDIDATE_2026-08-29.md`](./ONEIROS_V103_ENACTED_RELATION_CANDIDATE_2026-08-29.md).

V1 app chrome is English-only. Standard/Advanced and essay structure uses the
exact heading `## Reflective Questions`; the shared CTA is exactly
`Continue the conversation` in every content language. Navigation, shared actions,
structural headings, and metadata section titles are not localized until
Oneiros v2. Generated prose and questions still follow the resolved content
language.

## Approved same-call v1.0.3 + structure v1.0.0

| Field | Value |
|---|---|
| Canonical feature release | `v1.0.3` |
| Canonical method alias | `oneiros-same-call-reflective-questions-v1.0.3` |
| Approved method | `oneiros-same-call-reflective-questions-v1.0.3-candidate` |
| Canonical Reader alias | `oneiros-dream-reflection-v3.2.3` |
| Reader | `oneiros-dream-reflection-v3.2.3-candidate` |
| Chat | `oneiros-followup-chat-v2.0.1` |
| Topology | one Reader/chat/essay call; no second question inference |
| Cardinality | Quick 1; Standard/Advanced 2; chat open 1 / close 0; essays 2 |
| Safeguards | no manufactured either/or; no missing footage; interpretation is not dream fact |
| Observation | resolved 12-language contract + deterministic marker/cardinality/no-answer-menu fail-open shadow validation after completion; contract failures and observer exceptions never block or retry |
| Structure normalizer | `oneiros-reflective-question-structure-normalizer-v1.0.0` |
| Runtime bundle | `oneiros-reflective-questions-runtime-v1.0.3+structure-v1.0.0` |
| Extraction | deterministic markdown parse → `reflectiveQuestions: string[]` |
| Approved prompt SHA-256 | `f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7` |
| Approval | PO-approved for guarded production deployment on 2026-08-29 |
| Deployment | `ai-entitlements-gateway` function version `113`, ACTIVE, updated `2026-08-29 18:17:32 UTC` through `npm run deploy:ai-entitlements-gateway` |

The clean release names above are aliases only. The evaluated/deployed artifact
ids retain `-candidate`; no prompt text was regenerated or renamed, and the
full SHA remains the source of truth.

Canonical source: `src/ai/dreamReflectionPrompt.ts`, `src/ai/reflectiveQuestionExtract.ts`. Closed R&D record: [`ONEIROS_QUESTION_REPAIR_PHASE2_EDITORIAL_FAIL_2026-08-29.md`](./ONEIROS_QUESTION_REPAIR_PHASE2_EDITORIAL_FAIL_2026-08-29.md).

### PO shadow-validation decision — 2026-08-29

The v1.0.1 runtime candidate preserves the established streaming path and the
client's ~15-second partial reveal. Once each reading/chat/essay response is
complete, `oneiros-same-call-shadow-v1.0.1` records only structured observation
metadata: pass/fail, exact issue codes, surface, actual/expected question count,
detected/expected language, answer-menu flag, and observer-error fields. The
quota result also retains its existing model/cost/latency fields and an
observation timestamp. No raw dream, user turn, prompt, generated response, or
exception message is duplicated into validator telemetry.

The validator is non-blocking and fail-open: a contract violation records
`passed: false`; an exception inside the observer records `passed: null`,
`observation_error: true`, and `observation_error_code: observer_exception`.
The successful generation still saves/returns, with no contract retry,
rejection, buffering, question-only call, or Gate/Repair/Composer/Premise path.
The server warning is limited to validation version, surface, stable code, and
safe error type. The essay whole-response retry remains only for its accepted
operational incomplete or over-limit cases.

The earlier 18-generation smoke reported five retries but serialized only the
post-retry output and final PASS contract. Exact primary issue codes were not
preserved, so no claim is made about which validator rule caused those five
events. The known affected surfaces were Dream 3 Advanced reading, Dream 4
Standard reading, Dream 3 open chat turn 3, and Dream 6 open chat turns 1–2.
Production shadow telemetry exists specifically to close that evidence gap
before any future intervention decision.

### Production post-deploy sanity — 2026-08-29

One synthetic archived Standard Reader request started async, committed in
`14,204 ms`, and produced six distinct server-side partial updates; the first
partial was available at `5,994 ms`. The request completed before the client's
`15,000 ms` partial-reveal threshold, so this run correctly transitioned to the
committed response without a pre-threshold generated-prose reveal. The saved
assistant response matched the delivered response and contained exactly two
reflective questions.

The committed quota result contained
`oneiros-same-call-shadow-v1.0.1` telemetry for `reading_standard` with
`passed: false` and issue `manufactured_answer_menu`. The response was still
delivered and persisted normally, proving on the deployed path that a shadow
contract failure does not reject, rewrite, or retry the generation. The
synthetic dream and interpretation were removed after verification; the normal
quota event and compact observation remain as the production telemetry record.

### Committed follow-up replay production sanity — 2026-08-29

After the guarded version `112` deployment, one synthetic paid-origin
`dream_followup_reply` generated and committed normally in `2,964 ms`. Reusing
the exact idempotency key returned HTTP 200 with `cached: true` in `617 ms`.
The assistant reply and complete response message array were byte-identical to
the first response and matched the persisted user/assistant pair.

Persistence and quota invariants passed: exactly one turn was added, the
persisted message IDs matched the compact committed result, the quota event and
result stayed unchanged, and the event remained committed. The first call's
recorded model cost was `$0.00134025`; the replay made no model call, quota
commit, or persistence write. The synthetic dream and interpretation were
deleted after verification; normal compact quota telemetry remains.

An earlier setup attempt omitted `reflection_origin` and was correctly denied
at preflight with `interpretation_origin_missing`, before any model call or
cost. Its synthetic dream and interpretation were also removed. This was a
test-fixture setup miss, not a product-path failure.

### Frozen 30-dream production diagnostic — 2026-08-29

The explicitly authorized v1.0.1 baseline ran 30 synthetic Readers plus 12
fixed open-to-closing trajectories against the approved deployed gateway for
54 actual generations. Exact aggregate model cost was `$0.42161125`, below the
`$3` hard cap. It made no contract retry, question-only call, semantic-judge
call, Reader rerun, or open-turn rerun. Streaming and shadow delivery semantics
were unchanged; no deployment or database change was made.

Mechanical validation returned `29 PASS / 25 FAIL`. Human review of every flag
classified ten as harmless structural/validator artifacts, eleven as
noticeable but acceptable option-framing, four as real Oneiros answer-menu
quality problems in open Exploring, and zero as hard product failures. The five
flagged open turns and their exact issue codes are preserved in the report.
This evidence supports keeping validation observational; it does not authorize
prompt, validator, buffering, retry, or architecture changes.

### Archived v1.0.2 surgical candidate — 2026-08-29

The archived candidate changed Reader question-writing only: it forbade supplying
candidate answer vocabulary, reconstructing unreported inner footage, and
generic question shells; Deeper depth must come from a relation already
established in the reading, not from widening an answer menu. Follow-up chat
adds one narrow open-question line. Prose stance, models, temperatures,
streaming, ~15-second reveal, `PhasedTypingText`, cardinality, shadow
validation, Essays, Recent Dream Field, and metadata extraction are unchanged.

The independent `dream_followup_reply` repair is deployed in gateway version
`112` and makes already-committed
idempotency replays reconstruct the original reply and messages from persisted
interpretation data plus compact message IDs in quota result context. A replay
does not call the model, reserve/commit quota again, or persist a second turn.
Legacy committed events without message IDs use a constrained adjacent-message
fallback; unreconstructable committed state fails explicitly instead of
generating again.

The frozen evaluation is limited to 20 calls: 10 Reader failure anchors, 4
genuine chat-menu failures, and 6 controls. It has no model retry or semantic
judge and a `$1` hard cap. The authorized run cost `$0.23542850`. Human review
scored 11 PASS / 9 FAIL: 7/14 selected failures were repaired, 7 remained, and
2/6 controls regressed. The candidate is HOLD, explicitly denied, and absent
from runtime prompts. Exact review:
[`ONEIROS_V102_SURGICAL_ANCHOR_REVIEW_2026-08-29.md`](./ONEIROS_V102_SURGICAL_ANCHOR_REVIEW_2026-08-29.md).
Its offline composition diagnosis is recorded in
[`ONEIROS_V102_SURGICAL_ROOT_CAUSE_2026-08-29.md`](./ONEIROS_V102_SURGICAL_ROOT_CAUSE_2026-08-29.md).

### Promoted v1.0.3 enacted-relation diff — 2026-08-29

Method `oneiros-same-call-reflective-questions-v1.0.3-candidate`, Reader
`oneiros-dream-reflection-v3.2.3-candidate`, bundle SHA `f5399a49…`; Chat stays
`oneiros-followup-chat-v2.0.1`. The candidate replaces only the
Standard/Advanced Q1 observational/somatic job with one explicit-event,
enacted-relation operation. It contains no example dreams or extended verb
menu. Quick, Q2, the three safeguards, chat, Reader prose, cardinality,
streaming, validation, and all other surfaces are unchanged.

The single frozen 21-call evaluation cost `$0.33461750`. Human Q1 passed
`21/21`: `10/10` known failures repaired, `3/3` controls at least equivalent,
and `8/8` sealed multilingual holdouts passed. The product boundary treats
earned, dream-grounded, invitational interpretation as desired vitality; it
still rejects arbitrary certainty, manufactured answer menus, and fabricated
memory. One Chinese output omitted the required heading, so the frozen prompt-
only run initially failed the zero-structural-failure gate. No second prompt
iteration occurred. The deterministic structural implementation below closes
that blocker without changing the frozen prompt.
Exact diff:
[`ONEIROS_V103_ENACTED_RELATION_CANDIDATE_2026-08-29.md`](./ONEIROS_V103_ENACTED_RELATION_CANDIDATE_2026-08-29.md).
Full review:
[`ONEIROS_V103_ENACTED_RELATION_EVALUATION_REVIEW_2026-08-29.md`](./ONEIROS_V103_ENACTED_RELATION_EVALUATION_REVIEW_2026-08-29.md).

### v1.0.3 structural closeout — production package

The PO approved a pure completed-output normalizer under the principle that the
model owns content while runtime may repair an unambiguous formatting contract.
Its only permitted mutation is insertion of exact `## Reflective Questions`
plus the required newline placement. It runs only on completed Standard or
Advanced responses with one end marker, one exact `## Dream Movement`, no later
heading/body bullet ambiguity, exactly two terminal unnumbered bullets, and
exactly two recognized interrogative marks. Every other shape is returned
byte-identically.

The normalizer runs after generation but before observation, extraction, and
persistence. `onProgress`, partial quota-event text, the ~15-second reveal, and
`PhasedTypingText` are untouched. Compact result-context telemetry records only
`applied`, `operation`, and `normalizer_version`; separate
`reflective_question_runtime` telemetry records the approved bundle, method,
prompt SHA, Reader, and normalizer identities. No raw model text is duplicated.

Frozen deterministic replay, with no model calls:

| Packet | Outputs | Applied | Byte-identical no-op |
|---|---:|---:|---:|
| v1.0.2 surgical packet | 20 | 1 | 19 |
| v1.0.3 enacted-relation packet | 21 | 1 | 20 |
| **Total** | **41** | **2** | **39** |

Both real historical missing-heading outputs normalized to two extracted
questions with their original bullet text unchanged. Ambiguous Japanese `。`,
one/three bullets, trailing prose, extra prose questions, missing markers, and
later headings remained no-ops. Q2 supplied-menu/frame findings are unchanged
and explicitly outside this repair.

Approved final production identity:

| Layer | Exact identity |
|---|---|
| Prompt method | `oneiros-same-call-reflective-questions-v1.0.3-candidate` |
| Prompt SHA-256 | `f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7` |
| Reader | `oneiros-dream-reflection-v3.2.3-candidate` |
| Runtime normalizer | `oneiros-reflective-question-structure-normalizer-v1.0.0` |
| Permitted operation | `insert_missing_reflective_questions_heading` |
| Runtime bundle label | `oneiros-reflective-questions-runtime-v1.0.3+structure-v1.0.0` |
| Deployment state | ACTIVE in `ai-entitlements-gateway` function version `113` |

The prompt SHA identifies only the frozen prompt bundle. It is not a SHA for
the complete deployable runtime containing the normalizer. Deployment retains
both identities in docs/telemetry and uses only
`npm run deploy:ai-entitlements-gateway`.

### v1.0.3 production activation sanity — gateway v113

One synthetic archived Standard reflection generated exactly once after the
guarded deployment. The gateway committed normally with one persisted
interpretation id, `reflection_ai_ms: 6486`, `save_reflection_ms: 85`, and
estimated model cost `$0.010445`. Deterministic extraction and shadow telemetry
both reported exactly `2/2` questions. The same idempotency key returned the
already-committed quota result rather than starting another generation.

Committed `reflective_question_runtime` telemetry exactly matched the approved
method, full prompt SHA, Reader, normalizer, and runtime bundle identities.
`question_structure_normalization` reported the correct v1.0.0 normalizer with
`applied: false`, as the normal output already contained its heading. The shadow
observer reported `manufactured_answer_menu` and still delivered/persisted the
reading, which is the intended fail-open behavior and remains part of the known,
unchanged Q2 editorial-quality scope rather than a structural blocker.

The generation completed well before the app's 15-second partial-reveal
threshold; no generated prose needed a pre-threshold UI reveal. The `onProgress`
path and locked `PhasedTypingText` contract remain unchanged and covered by the
full contract suite. A first verifier comparison treated JSONB key order as
meaningful; read-only inspection proved the values were exact and the verifier
was corrected to compare fields. No second model call was made. The synthetic
interpretation and dream were deleted successfully; compact quota telemetry
remains as the audit record.

Report and artifact index:
[`ONEIROS_V101_PRODUCTION_DIAGNOSTIC_BASELINE_2026-08-29.md`](./ONEIROS_V101_PRODUCTION_DIAGNOSTIC_BASELINE_2026-08-29.md).

## Historical production orchestration v1.0.0 — CLOSED R&D

| Field | Value |
|---|---|
| Method | `oneiros-reflective-question-production-v1.0.0` |
| Artifact schema | `11` (`1–10` read-compatible) |
| Generator | `oneiros-same-call-minimal-v1.2.0-candidate` / SHA `4506c898…` |
| Integrity Gate | `oneiros-question-integrity-gate-v1.0.0-candidate` / SHA `c1d8090f…` |
| Premise Check | `oneiros-question-premise-check-v1.0.0-candidate` / SHA `ceca4568…` |
| Repair | `oneiros-question-repair-v1.0.0-candidate` / SHA `0859fd54…` |
| Fallback | `reflective-question-fallback-v1` (localized; no LLM) |
| Cardinality | always exactly one question (kill switch is emergency omit) |
| Depth map | `quick→core`, `standard→core`, `advanced→deeper` |
| Reader | frozen `oneiros-dream-reflection-v3.1.0-candidate` |
| Bundle SHA-256 | `fc8b6304fc2e8bc108242113299f7073cfbcc80d3f8df41cf747d218540d00ea` |
| Status | denied for launch; not runtime |

Canonical museum source: `src/ai/reflectiveQuestionPipeline.ts`. Premise Check: `src/ai/questionPremiseCheck.ts`.

## Historical Composer v1.1 — not production

| Field | Value |
|---|---|
| Method | `oneiros-reflective-question-composer-v1.1.0-candidate` |
| Prompt | `oneiros-reflective-question-composer-prompt-v1.1.0-candidate` |
| Artifact schema | `10` |
| Bundle SHA-256 | `a42e79dfcf43bf171ac5f2a6fa73b61e2444b7c4582bba24fb80afa2d35ab7c8` |
| Status | historical; not the production writer |

Canonical museum source: `src/ai/reflectiveQuestionComposer.ts`. Record: [`ONEIROS_REFLECTIVE_QUESTION_COMPOSER_V1_RD_2026-08-28.md`](./ONEIROS_REFLECTIVE_QUESTION_COMPOSER_V1_RD_2026-08-28.md).

## Frozen same-call Generator + Integrity Gate + Repair — CLOSED R&D

v1.0.0 SHA `47db8084…` won the 2026-08-28 A/B: reading PASS, questions `2 GOLD / 2 SHIP / 3 WEAK / 1 FAIL` vs separate-call brutal-simple Core. v1.1.0 SHA `8e0edada…` is the frozen comparison identity. v1.2.0 (`oneiros-same-call-minimal-v1.2.0-candidate`, SHA `4506c8981c1e0f38edcb641bf89e59126bfdafe64a3adff99a94a2d1a12e81f7`) won the paired Standard/CORE gate 8/8 and is frozen exactly as tested. Prompt R&D on System 4 is STOP. Integrity Gate v1 (`oneiros-question-integrity-gate-v1.0.0-candidate`, SHA `c1d8090f…`) plus one Repair (`oneiros-question-repair-v1.0.0-candidate`, SHA `0859fd54…`) remain frozen after mechanical Phase 2 PASS 7/7 and editorial FAIL 16/24 GOLD+SHIP. Do not mutate Repair, Gate, or v1.2 System 4. They ship only as frozen R&D evidence, never as standalone or launch deploy identities. Records: [`ONEIROS_SAME_CALL_MINIMAL_GATE1_RD_2026-08-28.md`](./ONEIROS_SAME_CALL_MINIMAL_GATE1_RD_2026-08-28.md), [`ONEIROS_QUESTION_INTEGRITY_GATE_V1_RD_2026-08-28.md`](./ONEIROS_QUESTION_INTEGRITY_GATE_V1_RD_2026-08-28.md), [`ONEIROS_QUESTION_REPAIR_PHASE2_EDITORIAL_FAIL_2026-08-29.md`](./ONEIROS_QUESTION_REPAIR_PHASE2_EDITORIAL_FAIL_2026-08-29.md).

## Denied Post-Jungian Inviter v2 — live Gate 1 failed

The now-closed offline hypothesis is
`oneiros-post-jungian-inviter-v2.0.1-candidate`, prompt
`oneiros-post-jungian-inviter-prompt-v2.0.1-candidate`, schema `1`, bundle SHA
`09045bf1860b2a2a6325e468cc19de019c351f0162cfa17c3f0a6153f3f3f35e`.
It freezes the eight exact persisted GPT-5.4 readings in
`oneiros-frozen-anchor-readings-v1` (file SHA `2a1a8bc3…`) and changes the
Inviter task definition from information retrieval to imaginal re-entry. Model
`gpt-5.4`, temperature `0.35`, token limit `360`, one-call topology, and the
minimal four-field schema remain fixed. No runtime prompt examples were added.

The approved Inviter-only Gate made exactly eight sequential calls and cost
`$0.043675` under its `$0.30` hard ceiling. Mechanics passed `8/8`, with no
provider/schema failure or language mismatch. Blind judgments were hashed
before diagnostics were opened; the internal result was `0 CLEAR PASS / 1
BORDERLINE / 7 FAIL`. Repeated generic reaction/somatic interview and missing
footage/unstaged-response families fail the human Gate. Fluent JA/ZH review is
still pending but cannot rescue the aggregate hard failure. The additional
sixteen did not run. The candidate is denied, remains outside production
runtime, and unlocks no deploy or further paid run. Full review:
[`ONEIROS_POST_JUNGIAN_INVITER_V2_GATE1_REVIEW_2026-08-28.md`](./ONEIROS_POST_JUNGIAN_INVITER_V2_GATE1_REVIEW_2026-08-28.md).

Pre-gate SHA `14b742db…` made no paid calls and is superseded, not a human-gate
failure. V2.0.1 narrows the reading veto: the reading's recognition of a
relation does not close that relation; only questions that mainly request
repetition, confirmation, endorsement, selection, or paraphrase are rejected.

## Denied editorial-arc v2 candidate — anchor gate failed

| Field | Value |
|---|---|
| Initial architecture | one GPT-5.4 private decision + complete reading |
| Method | `oneiros-reflection-editorial-arc-v2.0.0-candidate` |
| Reading prompt | `oneiros-dream-reflection-v3.1.0-candidate` |
| Protocol | `v2`: private opening → `BEGIN_DREAM_READING` → reading → end marker |
| Artifact schema | `8` (`1–7` read-compatible) |
| Candidate bundle SHA-256 | `6cd304e1c246f237f21743232de32723e81656f9c8cb3c4f51ee49fe26249b49` |
| Initial AI calls | one existing `interpretation_*` call; no question/repair/judge call |
| Initial cardinality | `0–1`; `no_question` is a valid editorial ending |
| Human review | **FAILED — DENIED** (`2 CLEAR PASS / 6 FAIL`) |

The model decides the aperture before prose but must write a complete reading and
must never reserve a deliberate gap. A question is carried by an already-staged
relation, paradox, verb, gesture, threshold, or image-logic; felt response remains
available but is not the default shell. The pruned prompt keeps four explicit
boundaries: no invented premise, no missing footage, no already-supplied answer,
and exact preservation of polarity/agency/evidence logic.

Malformed private JSON is never repaired or guessed. When the required reading
start exists, the reading is saved and the opening becomes `rejected`. A valid
`question:null` becomes `no_question` and keeps a quiet localized continuation
affordance without a question card.

The authorized v2 gate is Standard-only and phased: the frozen eight anchors
first, followed only on an acceptable anchor audit by sixteen frozen stratified
cases. The 24-case authorization has a `$1.00` hard ceiling, not a spending
target. The runner reserves a conservative maximum cost before each request and
carries observed anchor cost into phase two. Both phases keep the same SHA and
use no retries, repairs, judges, cache reads, or prompt mutation. Gold Checkpoints
were opened only after internal whole-journey scores and rationales were locked.
The anchors cost `$0.1287325`; phase two was not run. No production deploy or
database change was made. Full review:
[`ONEIROS_REFLECTION_EDITORIAL_ARC_V2_ANCHOR_GATE_REVIEW_2026-08-28.md`](./ONEIROS_REFLECTION_EDITORIAL_ARC_V2_ANCHOR_GATE_REVIEW_2026-08-28.md).

## Revoked mechanical baseline

| Field | Value |
|---|---|
| Architecture | `2.0.0` |
| Method ID | `oneiros-reflective-question-v2.0.1` |
| Generator prompt | `oneiros-reflective-question-generator-v2.0.0` |
| Validator prompt | `oneiros-reflective-question-validator-v2.0.1` |
| Artifact schema | `1` |
| Pinned bundle SHA-256 | `2e412879a2bd79cb57dbadfac7a4bafc04114131199cf2ac9bd4c974fa507896` |
| Current status | `human_quality_failed_sterile_literalism` — revoked |

The hash covers method/version/schema identities, the complete generator and validator prompts, and the post-candidate validator commit reminder. It is preserved for provenance only. The deployment guard rejects this method or SHA even when an environment override is supplied.

Frozen synthetic Greek benchmark (`20` dreams, Standard reading → generator → validator): `20/20` questions, `16` accepts, `4` repairs, `0` abstentions, `0` technical failures. Human review then found recurrent dream continuation, missing-event reconstruction, generic remainder shells, and safe-but-lifeless relation abstraction. The lesson is explicit: structural success is not release approval.

## Failed dialogue candidate

| Field | Value |
|---|---|
| Architecture | `2.2.0` |
| Dialogue prompt | `oneiros-reflective-dialogue-v1.1.0` |
| Question method | `oneiros-reflective-question-v2.2.0` |
| Generator prompt | `oneiros-reflective-question-generator-v2.2.0` |
| Validator prompt | `oneiros-reflective-question-validator-v2.2.0` |
| Artifact schema | `1` |
| Candidate bundle SHA-256 | `295a65ef040e3e4eb367ab0674ac5244bfb737b7c3d60b41927d24d27783cf68` |
| Human review | `FAILED — HOLD` (`10 PASS / 7 WEAK / 3 FAIL` initial; `3 PASS / 3 WEAK / 2 FAIL` dialogue) |

The candidate bundle hash includes dialogue identity/text plus question method/version/schema, generator, validator, and commit reminder. It repairs the missing conversational link in four places:

1. The exact typed question the user saw is restored into model-visible history.
2. Reflective Dialogue v1 interprets the latest turn as an answer, resistance, correction, complication, or move away and develops one thread without redoing the reading.
3. Request-local `U#` evidence is built from user-authored turns only; assistant interpretation remains provisional and unnumbered.
4. The next question must deepen that live `U#` thread. The short shared method selects one evidence-staged living hinge and applies a psychic-aperture test: an answer must be capable of changing how the dreamer sees, inhabits, or relates to an existing image.
5. Narrow deterministic guards annotate only structurally recognizable reviewed failures: missing/next footage, invented motive, forced choice, and explicit plot projection. Genericity and imaginal depth remain semantic and human judgments because wording alone cannot determine them.

Previous v2.0 typed artifacts remain readable. The initial reading prompt, locked typing/streaming reveal, metadata extraction, `archetypes`, `amplifications`, and reflective essays are unchanged.

## Denied v2.4 diagnosis

| Field | Value |
|---|---|
| Architecture | `2.4.0` |
| Dialogue prompt | `oneiros-reflective-dialogue-v1.4.0` |
| Question method | `oneiros-reflective-question-v2.4.0` |
| Generator prompt | `oneiros-reflective-question-generator-v2.4.0` |
| Validator prompt | `oneiros-reflective-question-validator-v2.4.0` |
| Artifact schema | `3` (schemas `2` and `1` read-compatible) |
| Candidate bundle SHA-256 | `046c22a679e06ad210db36466516e971eb2ecd8152da37cdb72a3e744dca39de` |
| Human review | `FAILED — DENIED` |

V2.4 retained the 12-language source contract, CJK-safe validation, strict Structured Outputs, persisted `languageCode`, and localized card chrome. Its architecture still failed human quality: initial generation received the full reading, the validator was allowed to become a second copywriter, and dialogue carried a minimum length pressure.

The final cached-reading run produced 28 questions and 7 abstentions with zero technical failures. The validator rewrote `12/28` questions (`42.857%` dependency). Human review found `12 PASS / 12 WEAK / 11 FAIL`; only `5/16` untouched accepts were clear PASS. The dialogue packet produced `6 PASS / 6 WEAK / 4 FAIL` answers, while all six continued questions missed clear PASS (`0 PASS / 3 WEAK / 3 FAIL`). It repeated the forbidden moves “nothing → hidden significance” and “no pain → bodily acceptance/integration”. Mechanical health therefore did not imply Oneiros quality.

Full evidence, cost, and case-level severity: [`ONEIROS_REFLECTIVE_V2_4_ROOT_CAUSE_REVIEW_2026-08-28.md`](./ONEIROS_REFLECTIVE_V2_4_ROOT_CAUSE_REVIEW_2026-08-28.md).

## Implemented v2.5 simplification — human gate not run

| Field | Value |
|---|---|
| Architecture | `2.5.0` |
| Dialogue prompt | `oneiros-reflective-dialogue-v1.5.0` |
| Question method | `oneiros-reflective-question-v2.5.0` |
| Generator prompt | `oneiros-reflective-question-generator-v2.5.0` |
| Validator prompt | `oneiros-reflective-question-validator-v2.5.0` |
| Artifact schema | `4` (schemas `3`, `2`, and `1` read-compatible) |
| Candidate bundle SHA-256 | `ca2ac55bc93d6603bddbfb2e9d6981b7fe4e1355c30369323805a55a79a499bc` |
| Human review | `NOT RUN — HOLD` |

V2.5 removes the failed causes without adding another interpretive framework. Initial question generation receives only numbered raw-dream evidence; the reading remains a separate user-visible artifact. The generator asks into one genuinely unknown relation already staged by the dream and may not assign wanting, keeping, allowing, changing, accepting, or meaning without evidence. The validator is judge-only: byte-identical accept or abstain, never rewrite. Dialogue length follows evidence and may be one sentence. Ambiguous brevity stays ambiguous, and absence of pain cannot establish harmlessness, integration, distance, acceptance, or bodily knowledge.

The 35 + 16 frozen packets remain the later acceptance assets. A new paid run needs explicit authorization; no v2.5 external calls have been made. The metadata extraction/Echo contract is unchanged.

## Combined editorial-arc candidate — Gate 1 failed

| Field | Value |
|---|---|
| Initial architecture | one GPT-5.4 reading + question editorial act |
| Method | `oneiros-reflection-editorial-arc-v1.0.0-candidate` |
| Reading prompt | `oneiros-dream-reflection-v3.0.0-candidate` |
| Trailer protocol | `v1`: `question`, `question_evidence_ids`, `output_language` |
| Artifact schema | `7` (`1–6` read-compatible) |
| Candidate bundle SHA-256 | `57a066e5a6a5414de80cb2ad54309b67a9ce0b74f22afbdf2aa72dab920f013a` |
| Initial question AI calls | `0` additional; included in `interpretation_*` |
| Chat | Dialogue `1.9.1` + optional v5 single-pass question |
| Live Gate 1 | `2026-08-28T11:41:35.960Z`; `$0.1371655`; `8/8` mechanical; no retries/failures |
| Human review | **FAILED — STOP**; EL `2 CLEAR PASS / 1 BORDERLINE / 3 FAIL`; JA/ZH provisional only |

The complete dream is presented once as D# spans. Before writing, the model decides what the reading illuminates and which one already-staged raw-dream relation remains available for the user. It writes reading prose, the hidden reading marker, and a minimal private trailer. The gateway streams only bytes before the marker; split markers are withheld across chunks, and the question trailer never reaches `PhasedTypingText`. A missing/malformed/wrong-language trailer creates a schema-7 abstained artifact while preserving the completed reading.

The initial prompt contains no Director/Composer handoff, answer target, opening mode, model self-check booleans, selector, judge, repair, or second question call. Deterministic validation checks only protocol shape, supported evidence ids, output language, length, and one-question form. It does not claim universal semantic proof.

Gate 1 used the same frozen eight and generated fresh reading/question pairs—never cached readings—because the hypothesis was joint composition. The run stayed below its `$0.80` hard cap and made no retries. It proved protocol reliability but failed the psychological gates: elevator returned a non-native portable felt shell; words and sunrise re-asked already supplied experience; the scarf positive control fell to BORDERLINE. No larger packet is unlocked. Full review: [`ONEIROS_REFLECTION_EDITORIAL_ARC_GATE1_REVIEW_2026-08-28.md`](./ONEIROS_REFLECTION_EDITORIAL_ARC_GATE1_REVIEW_2026-08-28.md).

## Post-reading Inviter v1 — offline candidate

The next approved R&D hypothesis is deliberately outside runtime. A frozen
pre-editorial Reader first completes the reading; a separate GPT-5.4 Inviter
then sees the complete raw D# dream and read-only final reading and returns only
`question | no_question`. Reader method
`oneiros-frozen-reader-ceiling-v1.0.0-candidate` retains the baseline at
`d5f68e6…:src/services/ai.ts`, removes question ownership, and replaces the
Standard word target with no minimum and a `520`-word ceiling. Inviter method is
`oneiros-post-reading-inviter-v1.0.0-candidate`, schema `1`; complete bundle SHA
is `70c533e59b56693d5ade15a5234d2a7457ef194ba157750f67e884e13bb42cfa`.

The candidate has no intermediate psychological payload, retry, repair,
fallback, or judge. Its frozen eight ran for `$0.1824175`: six questions, one
valid `no_question`, one Reader ceiling rejection, and no provider or Inviter
schema failure. Blind internal review was `1 CLEAR PASS / 1 BORDERLINE / 6
FAIL`, with repeated missing-footage and already-closed-material families. The
sixteen-case continuation did not run. SHA `70c533e5…` is denied and cannot
unlock production. Contract and review:
[`ONEIROS_POST_READING_INVITER_V1_RD_2026-08-28.md`](./ONEIROS_POST_READING_INVITER_V1_RD_2026-08-28.md),
[`ONEIROS_POST_READING_INVITER_GATE1_REVIEW_2026-08-28.md`](./ONEIROS_POST_READING_INVITER_GATE1_REVIEW_2026-08-28.md).

## Historical v5 single-pass initial candidate — human Gate 1 failed

| Field | Value |
|---|---|
| Architecture | `5.0.0` single-pass candidate |
| Dialogue prompt | `oneiros-reflective-dialogue-v1.9.1` |
| Question method | `oneiros-reflective-question-v5.0.0` |
| Prompt | `reflective-question-single-pass-v5.0.0` |
| Artifact schema | `6` (`5`, `4`, `3`, `2`, and `1` read-compatible) |
| Structured response schema | `5` |
| Candidate bundle SHA-256 | `759b4726a666ea12ac087c7fae61c9a7681def2f7ecadbf04e08a3bb36555472` |
| First live packet | `2026-08-28T11:02:54.099Z`; `$0.06433`; six false Greek `compound_question` rejections exposed the parser omission |
| Corrected rerun | `2026-08-28T11:07:44.293Z`; `$0.04891`; `8/8` committed; no retries/provider/validation failures |
| Human review | `FAILED — HOLD`; internal screen `2 PASS / 6 FAIL`, with JA/ZH still needing fluent confirmation |

Independent review of v4.1 found that correct rules were present but did not become reliable semantic behavior; the two-call handoff could reverse polarity, and structural failures were misreported as abstentions. V5 performs evidence selection, `living_edge`, exact `answer_target`, opening mode, composition, and five operational self-checks in one inference. It has no selector, repair loop, second question call, or third judge. Reading prose remains orientation only; D#/user-only U# remain the evidence.

V4.1 evidence and cost ledger remain historical: [`ONEIROS_REFLECTIVE_QUESTIONS_V4_1_RD_REVIEW_2026-08-28.md`](./ONEIROS_REFLECTIVE_QUESTIONS_V4_1_RD_REVIEW_2026-08-28.md).

Gate 1 is the frozen adversarial eight. It requires 8/8 mechanical artifacts, zero hard failures, at least 7/8 clear PASS, fluent JA/ZH review, no retries, and explicit cost approval. Failure stops paid expansion and reopens topology diagnosis. Only a pass unlocks `18` initial + `8` dialogue; full `35 + 16` is reserved for a proven release candidate.

The first run is not evidence that six Greek questions psychologically abstained: all six model responses declared `decision: question`, used one evidence id, and had one interrogative movement. The cross-language parser accepted `?`, `？`, `؟`, and Japanese `か。`, but not the natural Greek question mark `;`, so it mislabeled them `compound_question` and discarded their candidate text. The local infrastructure now recognizes exactly one terminal Greek `;`; no Greek-specific psychological instruction was added, and the prompt bundle SHA is unchanged. Benchmark diagnostics now retain a structurally rejected candidate only in the post-blind evidence audit.

The corrected rerun proves mechanical reliability but fails the human gate. The strongest questions were `dinner-for-absent-host` and, more narrowly, the positive-control `shared-scarf-at-harbor`. Elevator, words, sunrise, and bark reuse felt-quality/aliveness shells or ask for already-supplied experience; JA adds an unstaged standing posture; ZH appears non-native and remains pending fluent confirmation. The model's self-audit marked these failures clean, so self-reported checks are not semantic guarantees. Full findings: [`ONEIROS_REFLECTIVE_QUESTIONS_V5_GATE1_REVIEW_2026-08-28.md`](./ONEIROS_REFLECTIVE_QUESTIONS_V5_GATE1_REVIEW_2026-08-28.md).

## Historical v5 product contracts — denied

| Surface | Contract |
|---|---|
| Initial Quick / Standard / Advanced | zero or one evidence-bound conversation opening; complete reading always |
| Initial no-question | valid editorial ending with neutral localized continuation affordance |
| Initial rejection | malformed/unsupported/wrong-language opening is rejected without losing the reading |
| Chat non-final | answer first through Dialogue v1.9.1, then zero or one question that continues the latest user-confirmed thread |
| Chat final | no question; records `final_chat_reply` abstention without model calls |
| Essays | QA-approved `2.0.3-phase1`, exactly one; essay surface owns it and does not import v2 |

The initial model now composes reading and question together but presents them separately. Initial questions use numbered raw-dream `D#` only. Follow-up dialogue restores the visible question and may add only user-authored `U#` to the v5 chat-question call. An invalid initial trailer never fails a completed reading; a chat-question failure never fails a completed answer. The typed artifact is persisted on its assistant message and rendered only after locked typing/streaming settles.

## Recovered remote predecessor

Recovered from remote `ai-entitlements-gateway` version 105 on 2026-08-27:

| Field | Value |
|---|---|
| Project | `xacdawttvtfrdbcwhcqn` |
| Updated at (UTC) | `2026-08-26T11:50:26Z` |
| Method ID | `reflective-question-psychological-aliveness-v1.4.0` |
| Prompt SHA-256 | `4885e351ff6a20ceb8257c004aacd66e390e4c0902455a1cf5ff4d0df5a0238d` |

This is historical/deployed provenance, not the approved local v2 bundle.

## Denied and closed candidates

Local Oneiros Reader v1.4.0 SHA `0ea4b9a2364681124bdf582822c683754e28ae52ca6d7e7e7427e39f528b08b7` remains `DO NOT DEPLOY`. V2.2 / SHA `295a65ef…`, v2.3.0 / SHA `caf27856…`, v2.3.1 / SHA `5e83f187…`, and v2.4 / SHA `046c22a6…` are denied. Candidate B SHA `08cd3eaf…` is the frozen research base. Candidate C SHA `c2b0f766…` and remainder-first SHA `a37426d1…` are closed `MIXED — STOP` experiments. None are runtime imports.

Post-reading Inviter v1 SHA `70c533e5…` is also denied after Gate 1 failed at
`1 CLEAR PASS / 1 BORDERLINE / 6 FAIL`. It remains offline evidence only.

Post-Jungian Inviter v2.0.1 SHA `09045bf1…` is denied after its exact frozen
Gate 1 passed mechanics but failed blind human quality at `0 CLEAR PASS / 1
BORDERLINE / 7 FAIL`. It remains offline evidence only; no continuation ran.

## Deploy guard

Use only:

```bash
npm run deploy:ai-entitlements-gateway
```

The wrapper hashes the same-call bundle (`oneiros-same-call-reflective-questions-v1.0.3-candidate` / SHA `f5399a49…`) and fails closed unless it matches `APPROVED_REFLECTIVE_QUESTION_PRODUCTION` and finds the separately approved runtime-normalizer wiring. An environment token cannot approve a denied or revoked SHA. Client and gateway request paths must not import the hold module or any R&D module. Historical artifact normalization keeps schema 1–11 readable without importing `src/ai/reflectiveQuestionPipeline.ts`; frozen Generator/Gate/Repair remain offline only.

The exact frozen combined Gate 1 has already run once and failed human quality:

```bash
ONEIROS_EDITORIAL_ARC_GATE1_COST_APPROVED=1 \
npm run benchmark:reflection-editorial-arc-gate1
```

The full frozen assets remain 35 initial dreams and 16 trajectories, but they are release gates rather than iteration defaults. They are not unlocked by the failed combined candidate. Fixtures must declare `source: synthetic`; any other source fails before authentication. The reading cache fails closed on a missing case, duplicate id, changed full dream text, or empty reading before any paid call. Outputs remain under `tmp/`.

Earlier authorizations and results remain historical and do not authorize another full run. The exact v4.1 bundle made one explicitly authorized 35-dream call packet on 2026-08-28; another full run requires new explicit authorization.

Raw `supabase functions deploy ai-entitlements-gateway` is unsupported. Same-call reading keeps existing GPT-5.4 `interpretation_*` routing and Exploring stays on `chat_followup` / `gpt-5.4-mini`; compatibility task routes remain only for archived R&D scripts. No `openai-proxy` deployment is required for this patch. Deploy the gateway only with `npm run deploy:ai-entitlements-gateway`.

No database migration is required; the artifact lives inside the existing `interpretations.messages` JSONB value.

## R&D isolation

Research lives under `src/ai/rd/reflective-questions/`. The active runner exists for replay/review only. The historical multiplexer remains archived at `scripts/live/archive/reflective-questions/run-reflective-question-golden-set.ts`; do not add experiment flags or import it into production.
