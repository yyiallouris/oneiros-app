# Dream Metadata and Display Flow

## Summary

Dream reflection now separates two concerns:

- **Display distillation:** the calm user-facing DreamDetail summary (`display_distillation`) with dream essence, visible anchors, and inner movement.
- **Pattern metadata:** structured fields used for Insights and long-term reports (`symbols`, `archetypes`, `landscapes`, `affects`, `motifs`, `relational_dynamics`, `thresholds`, `central_conflicts`, `core_mode`, `amplifications`, `symbol_stances`).

User-facing metadata strings follow the dream's primary language; enum keys and whitelisted archetype names stay English.

Extraction separates two epistemic layers (see `src/ai/dreamExtractionPrompt.ts` SOURCE BOUNDARY):

- **Dream Fabric** (dream-text grounded / extracted): `symbols`, `affects`, `landscapes`, `relational_dynamics`, `thresholds`, `motifs`.
- **Interpretive Echoes** (provisional; may use reflection): `central_conflicts`, `archetypes`, and rare Mythic Echoes in `amplifications`.

`archetypes` are Archetypal Echoes: objects `{ canonical_label, expression, resonance, evidence[], confidence }` plus optional persisted audit fields `{ archetype_id, archetype_catalog_version, evidence_ids, legacy_source_id }` (0–2, high|medium). `legacy_source_id` is used only when older ontology rows like `great_mother` / `terrible_mother` are canonicalized into `mother`, so historical benchmarks and migrations remain auditable without reviving the old selectable IDs. Closed whitelist + concise runtime hard gates for Double, Guide/Psychopomp, Divine Child, and Ruler (`evaluation` optional; explicit failed signals reject; missing evaluation must not empty the UI; stripped before UI). Zero or one is normal; two exceptional. Resonance is shortened at generation time (~20–35 words, hard max 45). DreamDetail shows all returned echoes with canonical title + resonance. Insights aggregates `canonical_label`.

`amplifications` are Mythic Echoes (`{ catalog_id, title, tradition, source_type, resonance, divergence, evidence[], confidence, catalog_myth_version }[]`), ideally 0–1, selected **from the closed Mythic narrative catalog in the same extraction call**. Model returns `catalog_id` only (or `[]`); server resolves title/tradition/source_type. Compact prompt index is build-time generated from `mythic_narrative_catalog.v1.json` (128 ids). Unknown ids / failed gates → `[]` with **no open-world fallback**. Flag `MYTHIC_CLOSED_CATALOG_V1` (default ON). DreamDetail section label stays **Mythic Echoes**; resonance+divergence render as one compact paragraph. Legacy `difference` → `divergence` on read. Reader normalization also backfills title/tradition/source_type from `catalog_id` when a partially resolved row is encountered locally or from sync, so a valid closed-catalog echo does not degrade into a blank generic card. See [`ONEIROS_CLOSED_MYTH_CATALOG_INTEGRATION_BRIEF.md`](./ONEIROS_CLOSED_MYTH_CATALOG_INTEGRATION_BRIEF.md).

Extractions persist `dream-field-map-interpretive-v4.1.3-b` / schema `7` / `prompt_version` `4.1.3-B` (`temperature` `0`). Path: dream + reflection → one `dream_extraction` call → Fabric + Archetypal Echoes (mechanism tags + server hard gates + Trickster carrier/actor alignment) + closed Mythic Echo with `evidence_ids` or `[]` → validators resolve exact dream spans (UI display spread via `selectDisplayEvidence`) → persist/UI. Myth catalog version `1.1.0` (128 ids). No dream-specific prompt examples. Dream Detail hides empty echo subsections; archetypal titles use catalog `displayLabel`; mythic shows resolved title + muted tradition. Optional `debug_interpretive_echoes` may return compact `selection_notes` only (never DB/UI). Acceptance: [`ONEIROS_5_DREAM_ACCEPTANCE_SET.md`](./ONEIROS_5_DREAM_ACCEPTANCE_SET.md). Brief: [`ONEIROS_V4_1_3_POST_PATCH_A_DEV_BRIEF.md`](./ONEIROS_V4_1_3_POST_PATCH_A_DEV_BRIEF.md).

DreamDetail’s “Explore symbolic layers” accordion mirrors that grouping and labels single-dream `motifs` as **Dream Motifs** (not Recurring Scenes — recurrence is only confirmed across many dreams). Fabric / Inner Tensions rendering, counts, and formatting stay on the prior Dream Detail behaviour — echo copy length is a prompt-only change. Forming Patterns aggregates Fabric-facing categories (`symbols` as Returning Images, `motifs` as Recurring Scenes, `affects` as Emotional Weather, `thresholds`, `central_conflicts`, `landscapes`) with distinct-dream counts; archetypes and amplifications stay off the main grid.

DreamDetail should not expose raw extraction categories as primary UI. It shows what the dream gathers around, not everything the system extracted.

## Reflection Flow

1. The entitlement gateway starts the prose reflection first. Mobile reflection requests use an async quota-event status pattern so the full-depth reflection can continue server-side while the client polls. For long reflections, partial model chunks may be exposed through status polling after the client-side reveal threshold, but they are not treated as complete metadata input.
2. The saved interpretation starts with `metadata_status: pending`.
3. The client starts a separate `dream_metadata_extract` gateway request after the reflection response; the gateway takes a server-side lease before extraction uses the saved reflection plus dream text to produce `display_distillation` plus pattern metadata. Structured extraction JSON is Zod-validated in `openai-proxy` (with one same-provider repair) and again in billing-ai before save.
4. The same interpretation row is updated to `metadata_status: ready` when extraction succeeds, or `failed` when the enrichment request fails, returns malformed/domain-invalid JSON after repair, or returns no usable metadata.

**Resilience lock:** extraction must tolerate common model omissions on otherwise rich Interpretive Echoes (e.g. missing `confidence` soft-defaults to `medium` in coerce + Zod preprocess). Do not add new required echo fields without soft defaults + contract tests, and after prompt/validation edits deploy both `openai-proxy` and `ai-entitlements-gateway`. See `documentation/flows-06-jungian-ai-reflection.md` → Locked contract: metadata extraction resilience.

Pending and failed metadata rows are recoverable: when DreamDetail or the alternate chat route loads a pending/failed interpretation, the client restarts metadata enrichment in the background with in-memory dedupe and short retries, while the user-facing reflection remains readable. Server-side lease claims prevent overlapping retries from starting duplicate OpenAI metadata calls for the same pending interpretation. DreamDetail also refreshes immediately when its metadata extraction promise completes and tries a refresh when the chat is closed, so the Dream Details section does not depend only on the next scheduled refresh to show completed metadata.

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

- `src/ai/dreamExtractionPrompt.ts`: canonical extraction system/user prompt shared by client and gateway
- `src/services/ai.ts`: client extraction caller, parser, `DreamExtraction`
- `supabase/functions/_shared/billing-ai.ts`: production `dream_metadata_extract` caller using the same shared prompt module
- `src/services/dreamDetailDisplay.ts`: DreamDetail display model and fallback reducer
- `src/screens/DreamDetailScreen.tsx`: dream sanctuary UI
- `src/types/dream.ts`: `DisplayDistillation` and `Interpretation`
- `src/services/remoteStorage.ts`, `src/services/syncService.ts`: remote sync mapping
