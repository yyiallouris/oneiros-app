# Same-call minimal Reader + question — one-shot A/B

**Date:** 2026-08-28  
**Status:** v1.0.0 won the A/B. v1.1.0 (`8e0edada…`) is frozen comparison identity. v1.2.0 (`4506c898…`) won the paired Standard/CORE gate 8/8 and is frozen exactly as tested. The production-mode 24 did not pass the editorial Gate. Prompt R&D on System 4 is STOP. Next layer: Integrity Gate v1 Phase 1 PASS; Phase 2 Repair editorial FAIL. **CLOSED FOR CURRENT ARCHITECTURE.** Not production approval. Production Reader and Composer routing are unchanged. Nothing deployed.  
**Product invariant:** every initial Oneiros reading always has exactly one reflective question.

Previous combined / question-first experiments carried Director, taxonomy, `living_edge`, `no_question`, evidence IDs, or question-first choreography. Those runs let the reading eat the question opening, or let the question need leak into the reading. This A/B is the remaining simple architecture:

```text
RAW DREAM
↓
GPT-5.4
↓
EXISTING READING
+
ONE REFLECTIVE QUESTION
```

---

## v1.0.0 A/B result — WIN

Packet: `tmp/same-call-minimal-gate1-2026-08-28T16-40-35-741Z/`  
SHA `47db808405d8dbb4ec006814337d4946aef6c0d64690ab4fcb6c02eb5ba244ca`  
8/8 GPT-5.4 Standard, `$0.11251750`.

- **Reading: PASS.** No material quality drop vs frozen Standard. The terminal question did not visibly rewrite the Reader to serve the question.
- **Questions:** internal `2 GOLD / 2 SHIP / 3 WEAK / 1 FAIL`, vs separate-call brutal-simple Core `0 GOLD / 1 SHIP / 3 WEAK / 4 FAIL`. Clear win, not production-ready.

Remaining question habits, not an architecture failure:

1. occasional direct dream → waking-life translation (`Πού στη ζωή σου...`)
2. occasional either/or or choose-between-images when the dream did not stage that choice

There is no v3/v4 same-call. Do not add anti-template variety or gold examples to System 4.

---

## Paired Standard/CORE gate — PASS (2026-08-28)

Packet: `tmp/same-call-minimal-v12-paired-2026-08-28T18-09-47-136Z/`  
PO zip: `tmp/same-call-minimal-v12-paired-po-review-2026-08-28/`  
16 fresh Standard/CORE GPT-5.4 (`$0.23593`). Randomized A/B.

PO + user: **v1.2 wins 8/8** on “which would you rather actually answer?” Freeze v1.2 System 4 exactly as tested. No prompt mutation. Do not patch `Πώς αλλάζει…` before the production-mode 24. Surface repetition is only a problem if it causes editorial damage.

---

## Identity — frozen v1.2.0 (production-mode final 24)

| Field | Value |
|---|---|
| Method | `oneiros-same-call-minimal-v1.2.0-candidate` |
| Prompt | `oneiros-same-call-minimal-prompt-v1.2.0-candidate` |
| Version | `1.2.0-candidate` |
| Reader | production `oneiros-dream-reflection-v3.1.0-candidate` (unmodified Systems 1–3) |
| Model | GPT-5.4 |
| Tasks | production `interpretation_quick` / `interpretation_standard` / `interpretation_advanced` |
| Temperature | production `0.68` / `0.55` / `0.6` |
| Token limit | production `500` / `1450` / `2600` + experiment-only `200` question buffer |
| Depth map | Quick→CORE, Standard→CORE, Advanced→DEEPER |
| Wrapper | explicit `<OUTPUT_LANGUAGE>` + `<QUESTION_MODE>` on the user message |
| Calls | 24: 8 anchors × 3 production reading modes |
| Hard cost cap | `$2.00` (conservative preflight ~`$1.14`) |
| Approval env | `ONEIROS_SAME_CALL_MINIMAL_FINAL24_COST_APPROVED=1` |
| Bundle SHA-256 | `4506c8981c1e0f38edcb641bf89e59126bfdafe64a3adff99a94a2d1a12e81f7` |
| Frozen v1.1 SHA | `8e0edada074545954c77b10fa7558a41c40a7529caccfd4dfec5c60fe6cf0dc2` |
| Runner | `npm run benchmark:same-call-minimal-final-24` |
| Gate id | `oneiros-same-call-minimal-v12-final24` |
| This packet | `tmp/same-call-minimal-final24-2026-08-28T18-25-54-602Z/` (`$0.37451350`, 24/24 questions present) |

Canonical source: `src/ai/rd/reflective-questions/sameCallMinimal/sameCallMinimalCandidate.ts`.  
The production Reader file `src/ai/dreamReflectionPrompt.ts` is not edited. System 4 is frozen. No gold examples. No anti-template variety. Scoring language changed after the paired PASS; the prompt did not.

Conceptual correction: the question creates imaginal movement in attention or relation, not interpretation and not re-description. Change perspective, not dream content. A live point does not require conflict or unresolvedness.

Scoring design principle (docs only, not a prompt line): the question does not explain the image, describe it, or merely look at it — it follows a movement the dream has already begun.

---

## Identity — frozen v1.1.0 (historical comparison / prior Standard/CORE 24)

| Field | Value |
|---|---|
| Method | `oneiros-same-call-minimal-v1.1.0-candidate` |
| Prompt | `oneiros-same-call-minimal-prompt-v1.1.0-candidate` |
| Version | `1.1.0-candidate` |
| Reader | production `oneiros-dream-reflection-v3.1.0-candidate` (unmodified Systems 1–3) |
| Model | GPT-5.4 |
| Tasks | production `interpretation_quick` / `interpretation_standard` / `interpretation_advanced` |
| Temperature | production `0.68` / `0.55` / `0.6` |
| Token limit | production `500` / `1450` / `2600` + experiment-only `200` question buffer |
| Depth map | Quick→CORE, Standard→CORE, Advanced→DEEPER |
| Wrapper | explicit `<OUTPUT_LANGUAGE>` + `<QUESTION_MODE>` on the user message; do not infer language only from dream text |
| Calls | 24: 8 anchors × 3 production reading modes |
| Hard cost cap | `$2.00` (conservative preflight ~`$1.14`) |
| Approval env | `ONEIROS_SAME_CALL_MINIMAL_FINAL24_COST_APPROVED=1` |
| Bundle SHA-256 | `8e0edada074545954c77b10fa7558a41c40a7529caccfd4dfec5c60fe6cf0dc2` |
| Historical packet | `tmp/same-call-minimal-final24-2026-08-28T17-23-48-439Z/` |
| Historical 8-call runner | `npm run benchmark:same-call-minimal-gate1` (v1.0.0/v1.0.1 packets only) |
| Note | The current `npm run benchmark:same-call-minimal-final-24` now runs **v1.2.0**, not this identity. |

Canonical source: `src/ai/rd/reflective-questions/sameCallMinimal/sameCallMinimalCandidate.ts`.  
The production Reader file `src/ai/dreamReflectionPrompt.ts` is not edited. System 4 is an R&D-only extra system message. No anti-repetition / variety instruction. Diagnostic disjunction lint never rewrites output.

Frozen System 4:

```text
After the reading, write exactly one natural reflective question.

Its purpose is not to deepen, extend, summarize, or refine the interpretation
you just wrote. Step back from the reading toward the dream itself.
The question may be simpler than the reading.

Invite the dreamer back into one concrete living moment of the dream: an image,
gesture, relation, bodily position, atmosphere, affect, or unfinished movement.

Prefer direct dream re-entry over conceptual reflection. A simple image-near
question is preferable to a clever, poetic, or conceptually sophisticated one.

Stay with what actually appears in the dream. Do not introduce a new symbolic
meaning, psychological category, abstraction, motive, event, or distinction
that the dream itself does not make.

Revisiting an image, feeling, gesture, or moment already stated in the dream is
allowed and often preferable when it reopens the experience rather than merely
asks for factual repetition.

Do not ask the dreamer to rank, compare, prioritize, select, or choose between
dream elements unless that distinction or choice is explicitly present in the
dream itself.

Do not manufacture a choice through disjunctive forms in any language
(e.g. "or", "ή", "还是", "或者") unless that choice is explicitly posed by
the dream itself.

Keep the question inside the dream whenever possible. Do not translate the
dream directly into waking life. Refer to the dreamer's present relationship
to an image only when direct dream re-entry would feel artificial.

QUESTION MODE:

CORE:
Prefer one clear, concrete image, moment, gesture, atmosphere, or relation.

DEEPER:
You may hold a more complex relation or tension only when it is already present
in the dream. Remain equally image-near, natural, and concise. Do not become
more abstract, interpretive, poetic, or longer merely to feel deeper.

Write exactly one question, only in the requested output language.
Do not explain your choice.
```

Removed from v1.0.1: `beautiful`, `post-Jungian`, `never shallow`. Evidence-based additions kept: rank/compare/prioritize/select protection, and cross-lingual disjunctive protection.

---

## Identity — historical v1.0.1

| Field | Value |
|---|---|
| Method | `oneiros-same-call-minimal-v1.0.1-candidate` |
| Prompt | `oneiros-same-call-minimal-prompt-v1.0.1-candidate` |
| Version | `1.0.1-candidate` |
| Reader | production `oneiros-dream-reflection-v3.1.0-candidate` (unmodified) |
| Model / task | GPT-5.4 / `interpretation_standard` |
| Temperature | production Standard `0.55` |
| Token limit | production `1450` + experiment-only `200` question buffer (`1650`) |
| Calls | 8 frozen Standard anchors only |
| Hard cost cap | `$0.80` |
| Approval env | `ONEIROS_SAME_CALL_MINIMAL_GATE1_COST_APPROVED=1` |
| Historical v1.0.0 SHA | `47db808405d8dbb4ec006814337d4946aef6c0d64690ab4fcb6c02eb5ba244ca` |
| Current bundle SHA-256 | `ff8948531e8749b6a75ac068d313e652a09378ed349447596a7b4e724ce8fe3b` |
| Runner | `npm run benchmark:same-call-minimal-gate1` |

Canonical source: `src/ai/rd/reflective-questions/sameCallMinimal/sameCallMinimalCandidate.ts`.  
The production Reader file `src/ai/dreamReflectionPrompt.ts` is not edited. The extra instruction is an R&D-only extra system message.

---

## Exact appended instruction

No extra theory. The production constitution, role, Standard format, Core headings, and user dream wrapper stay exactly as live. v1.0.1 adds only the two constraint lines after the stay-close sentence.

```text
After the reading, write exactly one natural, beautiful post-Jungian reflective question.

Treat the dream as a living symbolic experience. Let the question invite the dreamer back into the dream rather than explain it further.

Stay close to what actually appears in the dream. Do not invent missing events or simply ask the dreamer to repeat something already stated.

Keep the question inside the dream or the dreamer's present relationship to its image; do not jump directly to a waking-life equivalent.

Avoid either/or questions or asking the dreamer to choose between images unless that choice is itself explicitly part of the dream.

CORE: clear, alive and immediately understandable, but never shallow.

DEEPER: allow greater relational or psychological depth when the dream genuinely supports it.

Write the question only in the requested output language.
```

Absent from this experiment: Director, question-first, taxonomy, evidence ids, `no_question`, `living_edge`, `kind`, repair, retry, judge, Quick, Advanced, separate Composer.

---

## What the v1.0.1 rerun must judge together

Success requires both:

1. Generated Standard reading quality is not materially worse than the frozen Standard reading in `testing/live-scenarios/reflective-question-frozen-anchor-readings.v1.json` (file SHA `2a1a8bc3…`).
2. The two remaining question habits are gone: no direct waking-life translation, and no either/or or choose-between-images unless that choice is itself in the dream.

That 8-call packet ran. The v1.1.0 Standard/CORE 24 also ran. The v1.2.0 production-mode 24 ran (`tmp/same-call-minimal-final24-2026-08-28T18-25-54-602Z/`, `$0.37451350`). Prompt R&D on System 4 is STOP. Next offline layer: Integrity Gate v1 Phase 1 PASS; Phase 2 Repair editorial FAIL. **CLOSED FOR CURRENT ARCHITECTURE.**

---

## v1.2 production-mode 24 — what to judge

Use the same 8 frozen anchors across all three production reading modes. Score readings and questions separately. Do not self-score in the runner.

Track GOLD/SHIP/WEAK/FAIL by mode; hard semantic; missing-footage; forced choice/ranking; interpretation continuation; waking-life; LIVE POINT / DISCOVERY; syntactic/template convergence; multilingual naturalness; Core vs Deeper; reading degradation by mode.

Template gate: **no systematic syntactic family that materially flattens Oneiros voice or makes questions feel generated.** Do not mechanical-FAIL `Πώς αλλάζει…` if questions stay dream-specific. Surface repetition is only a problem if it causes editorial damage.

DEEPER is judged by **operation**, not length or number of elements. If the dream does not support more complexity, a simple Deeper question is better than manufactured depth.

A live point does not require conflict. In restorative dreams it may be arrival, settling, atmosphere, or presence.

Lexical disjunction lint is diagnostic only. Human review remains ground truth.

Final gate after scoring: 0 hard FAIL; ≥21/24 GOLD+SHIP; each mode ≥6/8; no systematic missing-footage / forced-choice / interpretation-continuation / flattening-template families; DEEPER differentiates where the dream supports it; all three reading modes production-worthy; no systematic same-call reading degradation. Narrow miss → STOP, no auto-mutate. Material miss → STOP R&D, no new architecture. PASS → freeze SHA and close reflective-question prompt R&D (docs only after scoring).

---

## Isolation

- Not a runtime, client, or gateway import.
- Not added to the archived mega-runner.
- Not a deny-list SHA until a failed human Gate.
- Composer v1.1.0 remains the pending production-oriented runtime candidate until same-call is approved.
- `APPROVED_REFLECTIVE_QUESTION_PRODUCTION` stays null.
- No `openai-proxy` or `ai-entitlements-gateway` deploy.

---

## Blind packet

The runner writes `tmp/same-call-minimal-gate1-<stamp>/BLIND_REVIEW.md` with, per case:

- dream
- frozen Standard reading
- generated reading
- generated question

Do not score in the runner. Historical stop after 8.

The v1.2 production-mode 24 runner writes `tmp/same-call-minimal-final24-<stamp>/` with per-dream Quick/Standard/Advanced blocks, `HUMAN_SCORING.md`, mechanical `MODE_SUMMARY.md`, and diagnostics hidden until after scoring. Question field is the terminal interrogative only. Stop after 24. Do not self-score.
