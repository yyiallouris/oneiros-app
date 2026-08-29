# Reflective-question R&D boundary

**OFFLINE ONLY — not production.**

Offline research plus frozen experimental sources. Client, gateway, and billing-ai must not import this folder.

Launch production is same-call Reader + questions (`oneiros-same-call-reflective-questions-v1.0.3-candidate` / `f5399a49…`) with separate structure normalizer v1.0.0. Composer, Integrity Gate, Repair, Premise Check, and v1.2 orchestration are archived here for regression evidence only.

Prompt grammar R&D on Generator, Integrity Gate, and Repair remains **STOP**.
The v1.0.3 enacted-relation artifact records the promoted production Q1 and its
completed frozen evaluation. Q1 human review passed `21/21`; the separate
normalizer closed its missing-heading blocker. The v1.0.4 imaginal-handoff
artifact records the first Q2-only candidate; its single 21-call evaluation
returned HOLD. The explicitly authorized final v1.0.5 source-ownership candidate
then ran once across 22 frozen calls and also returned HOLD. Both are denied,
their paid runners refuse to repeat persisted packets, and Q2 prompt R&D stops
with no automatic v1.0.6.

Canonical records:

- `docs/REFLECTIVE_QUESTION_PRODUCTION_HOLD.md`
- `docs/ONEIROS_QUESTION_REPAIR_PHASE2_EDITORIAL_FAIL_2026-08-29.md`
- `docs/ONEIROS_V103_ENACTED_RELATION_CANDIDATE_2026-08-29.md`
- `docs/ONEIROS_V104_IMAGINAL_HANDOFF_CANDIDATE_2026-08-29.md`
- `docs/ONEIROS_V104_IMAGINAL_HANDOFF_EVALUATION_REVIEW_2026-08-29.md`
- `docs/ONEIROS_V105_SOURCE_OWNERSHIP_CANDIDATE_2026-08-29.md`
- `docs/ONEIROS_V105_SOURCE_OWNERSHIP_EVALUATION_REVIEW_2026-08-29.md`

Frozen references (`status: frozen_rnd_reference`; standalone method IDs denied):

| Identity | SHA | Status |
|---|---|---|
| `oneiros-same-call-minimal-v1.2.0-candidate` | `4506c898…` | closed Generator experiment |
| `oneiros-question-integrity-gate-v1.0.0-candidate` | `c1d8090f…` | closed Gate experiment |
| `oneiros-question-repair-v1.0.0-candidate` | `0859fd54…` | closed Repair experiment |
| `oneiros-same-call-reflective-questions-v1.0.3-candidate` | `f5399a49…` | PO-approved production Q1; quality PASS `21/21`; structural miss handled by separate normalizer v1.0.0 |
| `oneiros-same-call-reflective-questions-v1.0.4-candidate` | `a4f972c0…` | Q2 imaginal-handoff HOLD; denied after one frozen 21-call evaluation |
| `oneiros-same-call-reflective-questions-v1.0.5-candidate` | `16da1d13…` | final Q2 source-ownership HOLD; denied after one frozen 22-call evaluation; Q2 prompt R&D stopped |

Do not mutate their prompts. Do not add them to production routing.

Historical Composer lives in `src/ai/reflectiveQuestionComposer.ts` and is not an R&D import. Candidate B SHA `08cd3eaf…` remains the historical research base under `candidateB/`. Closed archive/lineage stays in git for provenance only.
