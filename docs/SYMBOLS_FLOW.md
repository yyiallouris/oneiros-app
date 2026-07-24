# Dream Metadata and Display Flow

## Summary

Dream reflection now separates two concerns:

- **Display distillation:** the calm user-facing DreamDetail summary (`display_distillation`) with dream essence, visible anchors, and inner movement.
- **Pattern metadata:** structured fields used for Insights and long-term reports (`symbols`, `archetypes`, `landscapes`, `affects`, `motifs`, `relational_dynamics`, `thresholds`, `central_conflicts`, `core_mode`, `amplifications`, `symbol_stances`).

DreamDetail should not expose raw extraction categories as primary UI. It shows what the dream gathers around, not everything the system extracted.

## Reflection Flow

1. The entitlement gateway starts the prose reflection first. Mobile reflection requests use an async quota-event status pattern so the full-depth reflection can continue server-side while the client polls. For long reflections, partial model chunks may be exposed through status polling after the client-side reveal threshold, but they are not treated as complete metadata input.
2. The saved interpretation starts with `metadata_status: pending`.
3. The client starts a separate `dream_metadata_extract` gateway request after the reflection response; extraction uses the saved reflection plus dream text to produce `display_distillation` plus pattern metadata.
4. The same interpretation row is updated to `metadata_status: ready` when extraction succeeds, or `failed` when the enrichment request fails, returns malformed JSON, or returns no usable metadata.

Pending rows are recoverable: when DreamDetail or the alternate chat route loads a pending interpretation, the client restarts metadata enrichment in the background with in-memory dedupe and short retries, while the user-facing reflection remains readable. DreamDetail also refreshes immediately when its metadata extraction promise completes and tries a refresh when the chat is closed, so the Dream Details section does not depend only on the next scheduled refresh to show completed metadata.

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

Insights skip interpretations whose `metadata_status` is still `pending`; legacy rows and completed/failed rows continue to behave as reflected dreams.

## Files Involved

- `src/services/ai.ts`: extraction prompt, parser, `DreamExtraction`
- `src/services/dreamDetailDisplay.ts`: DreamDetail display model and fallback reducer
- `src/screens/DreamDetailScreen.tsx`: dream sanctuary UI
- `src/types/dream.ts`: `DisplayDistillation` and `Interpretation`
- `src/services/remoteStorage.ts`, `src/services/syncService.ts`: remote sync mapping
