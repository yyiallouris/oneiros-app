# Oneiros v1.0.5 source-ownership Q2 candidate — 2026-08-29

**Final status: HUMAN QUALITY HOLD — STOP Q2 PROMPT R&D.**

This was the one explicitly authorized final Q2 prompt experiment. It is an
immutable offline artifact, explicitly denied by the production deploy guard.
Production remains v1.0.3.

## Frozen identity

| Field | Value |
|---|---|
| Question method | `oneiros-same-call-reflective-questions-v1.0.5-candidate` |
| Prompt bundle SHA-256 | `16da1d13fb480dd57ef013a7e8241a8309ec06c67d3e1d071089cb24f54cf67a` |
| Reader artifact | `oneiros-dream-reflection-v3.2.5-candidate` |
| Production identity | `oneiros-same-call-reflective-questions-v1.0.3-candidate` / `f5399a49…` |
| Evaluated predecessor | `oneiros-same-call-reflective-questions-v1.0.4-candidate` / `a4f972c…` |
| Candidate source | `src/ai/rd/reflective-questions/v105SourceOwnershipCandidate.ts` |
| Frozen fixture | `testing/reflective-questions/v1.0.5-source-ownership-evaluation-2026-08-29.json` |
| Fixture SHA-256 | `dd74ae0c3ccf5263b5baba4ceb8960c76ed4ec6890eb459ad19feea88f911da1` |

The candidate and fixture were hashed before the first model call and remained
unchanged throughout the one permitted run.

## Exact Q2 composition block

```text
- Question 2 — imaginal handoff:
  Return to one unresolved imaginal configuration explicitly present in the dream.
  Use the reading only to select the configuration; compose the question from the dream’s reported elements, preserving who or what each action or condition belongs to.
  Keep the question within that configuration and in the dream’s own concrete terms, with its direction still open to the dreamer.
```

The positive ownership hypothesis was:

> Reading chooses. Dream supplies. Dreamer connects.

The offline builder used the exact production Reader request and replaced only
the Standard/Advanced Q2 composition block. Q1, Quick, Reader prose contract,
models, temperatures, cardinality, chat, Essays, Recent Dream Field, structure
normalizer, extraction, validator behavior, and streaming/partial reveal were
unchanged.

No lexical-ban stack, examples, semantic judge, question repair, quality retry,
or second question model was added.

## Frozen packet

The 22 calls were fixed as:

- 4 v1.0.4 failure-recovery anchors;
- 6 protected v1.0.4 PASS controls;
- 12 fresh unseen holdouts, one in every production language.

The Greek hospital case had a second protected requirement: repair v1.0.4's
subject displacement and remain at least equivalent to its strong v1.0.3
production baseline. The fixture fixed recovery at `>=3/4`, controls at `6/6`,
holdout Q2 at `>=10/12`, zero serious control/Q1/structure regressions, and no
failure family recurring in two or more cases. Conservative packet reserve was
`$0.99` under the `$1.00` hard cap.

The completed review is
[`ONEIROS_V105_SOURCE_OWNERSHIP_EVALUATION_REVIEW_2026-08-29.md`](./ONEIROS_V105_SOURCE_OWNERSHIP_EVALUATION_REVIEW_2026-08-29.md).
