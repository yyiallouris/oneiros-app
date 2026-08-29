# Oneiros v1.0.3 enacted-relation candidate — 2026-08-29

**Status:** PO-APPROVED PRODUCTION PROMPT. The one
authorized 21-call Standard/Advanced-only evaluation cost `$0.33461750` under
the `$1.00` cap. Human Q1 review passed `21/21`, including `10/10` known
failures, `3/3` equivalent controls, and `8/8` sealed multilingual holdouts.
One Chinese holdout omitted the required heading, so the prompt-only candidate
missed the frozen zero-structural-failure release gate. The separate deterministic
normalizer v1.0.0 closed that engineering blocker without changing the prompt.
The PO approved the exact prompt plus normalizer package for production on
2026-08-29. Chat remains `oneiros-followup-chat-v2.0.1`; Q2 is unchanged.

| Field | Value |
|---|---|
| Candidate method | `oneiros-same-call-reflective-questions-v1.0.3-candidate` |
| Candidate bundle SHA-256 | `f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7` |
| Candidate Reader | `oneiros-dream-reflection-v3.2.3-candidate` |
| Chat | unchanged `oneiros-followup-chat-v2.0.1` |
| Production predecessor | `v1.0.1` / `e7e4ea4b…` |
| Source | `src/ai/rd/reflective-questions/v103EnactedRelationCandidate.ts` |
| Frozen fixture | `testing/reflective-questions/v1.0.3-enacted-relation-evaluation-2026-08-29.json` |
| Fixture SHA-256 | `cc60ad8ebe6e66a5982a6b20ef995e1c7687a51d9becdb0e2e9165d3672da1ce` |
| Packet | 10 known failures + 3 strong controls + 8 sealed unseen holdouts |
| Budget | `$1.00` hard cap; `$0.945` conservative reserved packet cost |
| Exact run cost | `$0.33461750` |
| Human result | Q1 `21 PASS / 0 FAIL`; overall Q1 + structure `20 PASS / 1 FAIL` |
| Release result | Q1 hypothesis PASS; deployment HOLD on one missing heading |

Full review:
[`ONEIROS_V103_ENACTED_RELATION_EVALUATION_REVIEW_2026-08-29.md`](./ONEIROS_V103_ENACTED_RELATION_EVALUATION_REVIEW_2026-08-29.md).

## Composition hypothesis

The v1.0.2 diagnosis found that the observational/somatic Q1 job creates an
empty property slot. When answer-menu and missing-footage language is
prohibited, the model often fills that same slot with invented spatial,
temporal, causal, or developmental possibilities. The intervention therefore
replaces the Q1 composition job instead of adding another global prohibition.

The replacement uses a general event grammar rather than dream-specific
examples:

```text
Question 1 — enacted relation:
Begin from one complete event explicitly reported in the dream, where an action, response, or change connects two dream elements.
Ask one open question that stays with the change or movement already shown in that event.
Mere co-presence or an inferred connection does not qualify.
```

No example dream, symbol, case-specific noun, or extended verb list is included
in the candidate prompt. Examples discussed during review remain diagnostic
evidence only.

## Exact prompt delta

Only the Standard/Advanced Q1 job changes:

```diff
-- Question 1 — observational / somatic: prefer a concrete observational or remembered dream-body question when the dream supports it. Somatic means the body inside the remembered dream, never a present-time exercise. If a somatic question would be forced or uninteresting, use another concrete observational question instead.
+- Question 1 — enacted relation:
+  Begin from one complete event explicitly reported in the dream, where an action, response, or change connects two dream elements.
+  Ask one open question that stays with the change or movement already shown in that event.
+  Mere co-presence or an inferred connection does not qualify.
```

The candidate identity bumps the Reader and same-call method ids only. It makes
no other prompt-text change.

## Frozen scope

- Quick remains exactly one terminal question with its current wording.
- Standard and Advanced remain exactly two bullets under
  `## Reflective Questions`.
- Question 2 is byte-for-byte unchanged.
- The three production safeguards are byte-for-byte unchanged.
- Follow-up chat is byte-for-byte unchanged at `v2.0.1`.
- Reader constitution, interpretive prose, depth semantics, output language,
  model, temperature, token limits, cardinality, extraction, streaming, the
  ~15-second reveal, and `PhasedTypingText` are unchanged.
- Essays and Recent Dream Field are unchanged.
- No validator, semantic judge, retry, repair, Composer, Gate, Premise Check,
  second question call, or fallback is added.

## Evaluation and deployment boundary

The PO approved exactly one frozen evaluation. It covers only Standard and
Advanced Reader Q1: 10 known v1.0.1 failure anchors, the 3 prior strong Reader
controls that are in scope, and 8 sealed unseen holdouts spanning English,
Greek, Spanish, French, German, Portuguese, Japanese, and Chinese. Holdout
families cover sparse, relational, body transformation, grief/ancestor,
surreal, conflict/threshold, complex multi-scene, and a deliberate co-presence
trap. The fixture hash above was recorded before any model call.

The runner uses the production request builder, task routing, temperatures, and
token limits, replacing exactly one Q1 instruction in one system message. It
allows no quality retry, semantic judge, question-only repair, Gate, Composer,
Premise Check, prompt edit, or deployment. Operational errors are recorded and
are not rerun. The runner refuses to repeat a persisted partial or completed
packet.

Frozen SHIP gate: at least 6/10 known failures repaired; all 3 controls at least
equivalent with zero serious regression; at least 7/8 holdouts pass; zero
structural hard failures; and no recurring failure family (two or more cases).
Two or more clear control regressions force HOLD. Deterministic validator output
is recorded separately and never substitutes for human review.

The frozen v1.0.2 packet must not be rerun. No second v1.0.3 prompt iteration is
authorized after this report.

The guarded gateway wrapper now pins this exact prompt SHA plus runtime bundle
`oneiros-reflective-questions-runtime-v1.0.3+structure-v1.0.0`. The independent
committed-follow-up replay repair remains unchanged.

No database migration or `openai-proxy` deployment is required.
