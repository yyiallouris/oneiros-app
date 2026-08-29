# Oneiros reflective intelligence architecture

Status: canonical release `v1.0.3` / alias `oneiros-same-call-reflective-questions-v1.0.3`, PO-approved and production with no current blocker
Evaluated prompt artifact: `oneiros-same-call-reflective-questions-v1.0.3-candidate` / `f5399a49…`
Reader alias: `oneiros-dream-reflection-v3.2.3`
Evaluated Reader artifact: `oneiros-dream-reflection-v3.2.3-candidate`
Chat: `oneiros-followup-chat-v2.0.1`
Approved prompt SHA: `f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7`
Production completed-output normalizer: `oneiros-reflective-question-structure-normalizer-v1.0.0`
Runtime bundle: `oneiros-reflective-questions-runtime-v1.0.3+structure-v1.0.0`
Production deployment: `ai-entitlements-gateway` function version `113`, ACTIVE since `2026-08-29 18:17:32 UTC`

## Product boundary

Launch restores the older same-call rhythm. Questions are generated in the same response as the reading. Composer, Integrity Gate, Repair, Premise Check, and v1.2 single-question orchestration are **CLOSED R&D — not production**.

```text
RAW DREAM
   ↓
ONE READER CALL
   ↓
READING + REFLECTIVE QUESTION(S)
   ↓
USER ANSWER / CONTINUE EXPLORING
   ↓
FOLLOW-UP CHAT
```

Cardinality: Quick 1 terminal question; Standard/Advanced exactly 2; chat open 1 / close 0; essays 2.

Three safeguards only: no manufactured either/or; no missing dream footage; do not treat interpretation as dream fact.

Chat continues the existing conversation. It is not a second interpretation engine.

Before generation, `src/ai/reflectiveLanguage.ts` resolves the 12-language contract from the initial dream or the latest detectable/established conversation language. After generation completes, `src/ai/reflectiveQuestionExtract.ts` may first insert exact `## Reflective Questions` only when a Standard/Advanced response has one end marker and exactly two unambiguous terminal question bullets. `oneiros-reflective-question-structure-normalizer-v1.0.0` is pure, idempotent at the content boundary, and fail-safe; ambiguity is a byte-identical no-op, and it never enters streaming `onProgress`. `src/ai/reflectiveContractObservation.ts` then observes the completion marker where required, exact question cardinality, detected language, and a conservative lexical/syntax firewall against manufactured answer menus in all 12 languages. `safeObserveReflectiveContract` makes the versioned telemetry fail-open: a validator exception becomes `passed: null` plus compact observer-error metadata and a safe log. Observation never delays streaming, blocks delivery, rejects output, or triggers a contract retry. There is no question-only regeneration, semantic judge, Gate, Repair, or Premise Check.

Exploring's no-manufactured-choice safeguard remains a prompt contract because deciding whether an `or` is a legitimate dream-staged choice is semantic. Runtime enforcement does not smuggle a new semantic judge into chat. The post-patch smoke is the release check for that feel behavior.

Extraction, `display_distillation`, Archetypal Echoes, Mythic Echoes, `archetypes`, `amplifications`, quota semantics, and the locked ~15-second partial reveal / `PhasedTypingText` experience are unchanged. `quota_events.result_context.contract_validation` contains no duplicate raw user/model text or exception messages; separate `question_structure_normalization` records only `applied`, `operation`, and `normalizer_version`, while `reflective_question_runtime` records compact approved identities.

V1 app chrome remains English-only until the Oneiros v2 localization phase.
Standard/Advanced and essays use exact `## Reflective Questions`; the shared
DreamDetail action is exact `Continue the conversation` for every content language;
navigation, structural headings, and metadata titles are not translated.
Generated reading and question content still follows the resolved dream language.

Closed historical R&D (Director/Composer, v1.2 orchestration, Gate/Repair, v5 initial, editorial arc, Inviter v1/v2.0.1) and the failed v1.0.2 surgical prompt are not selectable production identities. The promoted v1.0.3 enacted-relation prompt (`f5399a49…`) completed one frozen Q1 evaluation with human Q1 `21/21`; its one missing-heading failure is repaired by deterministic frozen replay and production normalizer v1.0.0. Q2 quality remains separate. Records: [`ONEIROS_QUESTION_REPAIR_PHASE2_EDITORIAL_FAIL_2026-08-29.md`](./ONEIROS_QUESTION_REPAIR_PHASE2_EDITORIAL_FAIL_2026-08-29.md), [`REFLECTIVE_QUESTION_PRODUCTION_HOLD.md`](./REFLECTIVE_QUESTION_PRODUCTION_HOLD.md), [`ONEIROS_V102_SURGICAL_ROOT_CAUSE_2026-08-29.md`](./ONEIROS_V102_SURGICAL_ROOT_CAUSE_2026-08-29.md), [`ONEIROS_V103_ENACTED_RELATION_CANDIDATE_2026-08-29.md`](./ONEIROS_V103_ENACTED_RELATION_CANDIDATE_2026-08-29.md), [`ONEIROS_V103_ENACTED_RELATION_EVALUATION_REVIEW_2026-08-29.md`](./ONEIROS_V103_ENACTED_RELATION_EVALUATION_REVIEW_2026-08-29.md).

## Combined initial flow (historical, denied)

The former editorial-arc combined call is retained only as denied evidence (`6cd304e1…`). Live initial reading no longer injects that protocol.

```text
complete raw dream -> numbered D# spans
  -> one GPT-5.4 interpretation_* call
       decide question | no_question before prose
       emit private minimal JSON opening
       emit <!--BEGIN_DREAM_READING-->
       write a complete reading; withhold nothing for the question
       emit <!--END_DREAM_READING-->
  -> stream projection exposes nothing before BEGIN and only reading bytes after it
  -> parse opening; validate evidence/language/form when a question exists
  -> schema-8 artifact: question | no_question | rejected
  -> question card after locked typing settles, or neutral continuation for no_question
```

There is no separate initial `reflective_question_generate` call, Director /
Composer handoff, selector, self-certification, repair, or judge. The v5 call
remains only for optional chat questions.

## Question contract

The positive craft identity is relation-first: one already-staged relation,
paradox, verb, gesture, position, threshold, reversal, or image-logic carries the
opening. Felt or bodily experience is allowed when central to the dream but is
not the reusable default shell.

Four epistemic boundaries remain explicit in the pruned prompt:

1. No invented premise. Reading interpretation never becomes dream evidence.
2. No missing footage, imagined continuation, unstaged reaction, or hidden cause.
3. No question whose shortest honest answer was already supplied.
4. Preserve subject, agency, negation, direction, temporality, and polarity.

The reading remains complete and honest. It never strategically withholds an
interpretation to create an opening. The model asks only where the next honest
answer belongs to the dreamer rather than to the interpreter.

Automated validation proves protocol shape, supported D# ids, output-language
compatibility, length, punctuation, and one-question form only. It does not
claim universal semantic validation. Blind human review is release authority.

## Reading density

- Quick: a glimpse—one image, atmosphere, and movement; end early.
- Standard: a focused path; stop when the central movement is illuminated.
- Advanced: linger longer, not explain more. Length is earned by transformations,
  contradictions, and psychic resolution rather than by detail count.

Word bands are telemetry/guidance, never quality gates. A small numinous dream
may need less space than a long multi-scene dream.

## Protocol and failure isolation

```text
<!--ONEIROS_REFLECTION_OPENING_V2-->
{"question":"...","question_evidence_ids":["D1"],"output_language":"en"}
<!--END_ONEIROS_REFLECTION_OPENING_V2-->
<!--BEGIN_DREAM_READING-->
<reading markdown>
<!--END_DREAM_READING-->
```

An honest silence uses `question:null`, `question_evidence_ids:[]`, and a valid
`output_language`. If the opening JSON is malformed but the reading-start marker
exists, the whole opening is ignored, the complete reading is saved, and schema
8 records `rejected`. There is no heuristic JSON repair, retry, guessed question,
or fake fallback question. Without a valid reading-start marker, content is not
heuristically exposed as a reading.

Schemas `1–7` remain readable. No database migration or backfill is required;
artifacts already live in message JSON.

## Evaluation gates

The authorized Standard-only gate is a phased 24-case packet under a `$1.00`
hard ceiling, never a spending target. Phase 1 uses the same frozen eight
adversarial anchors. Only after those journeys show no hard or repeating failure
family may Phase 2 run sixteen frozen stratified cases: four minimal/calm, four
relational/ambivalent, four rich multi-scene, and four strange or transformational
dreams. The same method id and prompt SHA remain frozen through both phases.
There are no retries, repairs, judges, cache reads, or prompt mutations inside
the run. Quick and Advanced remain outside this packet.

Review order is mandatory:

1. Blind reviewer sees only Dream + Reading + optional Question and scores the
   complete journey with an independent rationale.
2. Scores are locked.
3. Gold Checkpoints are revealed for diagnostic comparison.
4. Raw evidence, mechanics, latency, and cost are inspected last.

Anchor continuation requires at least `7/8` convincing complete journeys, zero
hard psychological or mechanical failures, and no repeating failure family.
Final acceptance requires at least `85%` CLEAR PASS across 24 whole journeys,
zero hard failures, no repeated phenotype hidden by the aggregate, natural
language, no conspicuous withholding, and no forced symbolic over-coverage.
`sunrise-on-quiet-ridge` is the positive `no_question` expectation.
`skin-turns-to-bark` is an acceptable baseline, not a gold exemplar.

The 2026-08-28 anchor phase cost `$0.1287325` and failed this gate at internal
`2 CLEAR PASS / 6 FAIL`, including repeated already-supplied questions, repeated
felt-shell syntax, one forced binary premise, and one Japanese structural
rejection. The sixteen stratified cases were not run. The exact SHA is denied.
See
[`ONEIROS_REFLECTION_EDITORIAL_ARC_V2_ANCHOR_GATE_REVIEW_2026-08-28.md`](./ONEIROS_REFLECTION_EDITORIAL_ARC_V2_ANCHOR_GATE_REVIEW_2026-08-28.md).

Only a pass unlocks a separately approved small mode-stress gate. Larger
multilingual/dialogue/release packets remain locked until those smaller gates
provide evidence.

## Deployment boundary

`APPROVED_REFLECTIVE_QUESTION_PRODUCTION` is pinned to the PO-approved
`v1.0.3-candidate` / `f5399a49…` prompt, with separately pinned runtime bundle
`oneiros-reflective-questions-runtime-v1.0.3+structure-v1.0.0`. Gateway
deployments must use only:

```bash
npm run deploy:ai-entitlements-gateway
```

No `supabase db push` is required. `openai-proxy` routing is unchanged, so it does
not require deployment for the replay-only gateway patch.

Historical v1 failure evidence remains in
[`ONEIROS_REFLECTION_EDITORIAL_ARC_GATE1_REVIEW_2026-08-28.md`](./ONEIROS_REFLECTION_EDITORIAL_ARC_GATE1_REVIEW_2026-08-28.md).
