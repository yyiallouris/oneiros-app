# Reflective-question R&D boundary

**OFFLINE ONLY — not production.**

Offline research plus frozen experimental sources. Client, gateway, and billing-ai must not import this folder.

Launch production is same-call Reader + questions (`oneiros-same-call-reflective-questions-v1.0.3-candidate` / `f5399a49…`) with separate structure normalizer v1.0.0. Composer, Integrity Gate, Repair, Premise Check, and v1.2 orchestration are archived here for regression evidence only.

Prompt grammar R&D on Generator, Integrity Gate, and Repair remains **STOP**.
The v1.0.3 enacted-relation artifact records one Q1-only candidate and its
completed frozen evaluation. Q1 human review passed `21/21`; one missing heading
keeps deployment on HOLD. It has no runtime import or deployment approval, and
its paid runner refuses to repeat the persisted packet.

Canonical records:

- `docs/REFLECTIVE_QUESTION_PRODUCTION_HOLD.md`
- `docs/ONEIROS_QUESTION_REPAIR_PHASE2_EDITORIAL_FAIL_2026-08-29.md`
- `docs/ONEIROS_V103_ENACTED_RELATION_CANDIDATE_2026-08-29.md`

Frozen references (`status: frozen_rnd_reference`; standalone method IDs denied):

| Identity | SHA | Status |
|---|---|---|
| `oneiros-same-call-minimal-v1.2.0-candidate` | `4506c898…` | closed Generator experiment |
| `oneiros-question-integrity-gate-v1.0.0-candidate` | `c1d8090f…` | closed Gate experiment |
| `oneiros-question-repair-v1.0.0-candidate` | `0859fd54…` | closed Repair experiment |
| `oneiros-same-call-reflective-questions-v1.0.3-candidate` | `f5399a49…` | PO-approved production Q1; quality PASS `21/21`; structural miss handled by separate normalizer v1.0.0 |

Do not mutate their prompts. Do not add them to production routing.

Historical Composer lives in `src/ai/reflectiveQuestionComposer.ts` and is not an R&D import. Candidate B SHA `08cd3eaf…` remains the historical research base under `candidateB/`. Closed archive/lineage stays in git for provenance only.
