# Reflective-question R&D boundary

Offline research only. Nothing in this folder is a runtime/client/gateway import.

Protected production remains recovered `reflective-question-psychological-aliveness-v1.4.0` SHA `4885e351…` in `src/ai/reflectiveQuestionProductionHold.ts`. That snapshot is also not a runtime import.

## After (this cleanup)

```
src/ai/reflectiveQuestionProductionHold.ts          protected production snapshot + deploy gate
src/ai/rd/reflective-questions/active.ts            only current R&D selection (Candidate B)
src/ai/rd/reflective-questions/candidateB/          active research base SHA 08cd3eaf…
src/ai/rd/reflective-questions/lineage/             frozen imports Candidate B still needs
src/ai/rd/reflective-questions/archive/             closed experiments + rejected local Reader
scripts/live/rd/reflective-questions/               thin current R&D runner
scripts/live/archive/reflective-questions/          historical multiplexer + old live scripts
```

## Before

Closed experiments, rejected local Reader, Candidate B, and the 2300-line multiplexer all sat in `src/ai/` / `scripts/live/` as if they were live choices. Local `src/ai/reflectiveQuestionPrompt.ts` looked canonical even though it is denied for deploy.

## Active vs archived

| Identity | Status |
|---|---|
| psychological-aliveness v1.4.0 / `4885e351…` | protected production reference |
| Oneiros Reader v1.4.0 / `0ea4b9a2…` | archived, `DO NOT DEPLOY` |
| Candidate B / `08cd3eaf…` | only active R&D base |
| Language+Operator / `f5aa40a4…` | frozen lineage, not selectable |
| Decoupling and earlier experiments | archived historical lineage/source |

Lineage modules were not flattened: Candidate B still imports Language+Operator contracts/SHAs. Flattening would duplicate frozen prompt text.

Historical docs, tmp packets, and result sheets were not deleted.

Current R&D runner: `npm run review:reflective-questions-active`. Do not add flags to the archived mega-runner. Future Candidate C should land in `active.ts` + the thin runner, not the multiplexer.
