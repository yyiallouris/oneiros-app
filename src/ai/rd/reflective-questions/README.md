# Reflective-question R&D boundary

Offline research plus frozen production-component sources. Client must not import this folder. Gateway may reach same-call / Integrity Gate / Repair only through `src/ai/reflectiveQuestionPipeline.ts`.

Prompt grammar R&D on Generator, Integrity Gate, and Repair remains **STOP**.

Canonical record: `docs/ONEIROS_QUESTION_REPAIR_PHASE2_EDITORIAL_FAIL_2026-08-29.md`

Frozen production components (`status: frozen_rnd_reference`; standalone method IDs denied):

| Identity | SHA | Status |
|---|---|---|
| `oneiros-same-call-minimal-v1.2.0-candidate` | `4506c898…` | frozen production Generator |
| `oneiros-question-integrity-gate-v1.0.0-candidate` | `c1d8090f…` | frozen production Gate |
| `oneiros-question-repair-v1.0.0-candidate` | `0859fd54…` | frozen production Repair |

Do not mutate their prompts. Approved production identity is the orchestration bundle `oneiros-reflective-question-production-v1.0.0`.

Historical Composer lives in `src/ai/reflectiveQuestionComposer.ts` and is not an R&D import. Frozen Reader remains `src/ai/dreamReflectionPrompt.ts`. Candidate B SHA `08cd3eaf…` remains the historical research base under `candidateB/`. Closed archive/lineage stays in git for provenance only.
