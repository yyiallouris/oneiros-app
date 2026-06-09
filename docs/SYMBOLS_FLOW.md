# Dream Metadata and Display Flow

## Summary

Dream reflection now separates two concerns:

- **Display distillation:** the calm user-facing DreamDetail summary (`display_distillation`) with dream essence, visible anchors, and inner movement.
- **Pattern metadata:** structured fields used for Insights and long-term reports (`symbols`, `archetypes`, `landscapes`, `affects`, `motifs`, `relational_dynamics`, `thresholds`, `central_conflicts`, `core_mode`, `amplifications`, `symbol_stances`).

DreamDetail should not expose raw extraction categories as primary UI. It shows what the dream gathers around, not everything the system extracted.

## Reflection Flow

1. `generateInitialInterpretation(dream, { depth })` returns the prose reflection.
2. `getDreamMetadataForReflection(dream, aiResponse)` runs the structured extraction call.
3. The extraction returns `display_distillation` plus pattern metadata.
4. `saveInterpretation` persists the assistant message and metadata locally, then syncs remotely when possible.

## DreamDetail Display Priority

`DreamDetailScreen` uses:

1. `interpretation.display_distillation`, when present.
2. `buildDreamDetailDisplayModel(dream, interpretation)` fallback for old interpretations.

The AI parser normalizes `display_distillation` defensively before storage: display enum values are lowercased/underscore-normalized, duplicate visible anchors are removed by label, anchor meanings are capped for compact UI, and visible anchors are capped at five.

Fallback anchor priority:

1. `symbol_stances`
2. `central_conflicts`
3. `thresholds`
4. `relational_dynamics`
5. `affects`
6. latest `interpretation.symbols`
7. stale `dream.symbols` only as final fallback

Dream-level `dream.symbols` / `dream.archetypes` are no longer shown as top-level chips on DreamDetail.

## Insights Metadata

Insights and pattern reports still use full extraction metadata. The rich ontology is useful for monthly/quarterly synthesis, but it remains secondary on a single dream page.

## Files Involved

- `src/services/ai.ts`: extraction prompt, parser, `DreamExtraction`
- `src/services/dreamDetailDisplay.ts`: DreamDetail display model and fallback reducer
- `src/screens/DreamDetailScreen.tsx`: dream sanctuary UI
- `src/types/dream.ts`: `DisplayDistillation` and `Interpretation`
- `src/services/remoteStorage.ts`, `src/services/syncService.ts`: remote sync mapping
