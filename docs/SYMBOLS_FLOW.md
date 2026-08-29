# Dream Metadata and Display Flow

## Summary

Dream reflection now separates two concerns:

- **Display distillation:** the calm user-facing DreamDetail summary (`display_distillation`) with dream essence, visible anchors, and inner movement.
- **Pattern metadata:** structured fields used for Insights and long-term reports (`symbols`, `archetypes`, `landscapes`, `affects`, `motifs`, `relational_dynamics`, `thresholds`, `central_conflicts`, `core_mode`, `amplifications`, `symbol_stances`).

User-facing metadata strings follow the dream's primary language; enum keys and whitelisted archetype names stay English.

Extraction separates two epistemic layers (see `src/ai/dreamExtractionPrompt.ts` SOURCE BOUNDARY):

- **Dream Fabric** (dream-text grounded / extracted): `symbols`, `affects`, `landscapes`, `relational_dynamics`, `thresholds`, `motifs`.
- **Interpretive Echoes** (provisional; may use reflection): `central_conflicts`, `archetypes`, and rare Mythic Echoes in `amplifications`.

`archetypes` are Archetypal Echoes: objects `{ canonical_label, expression, resonance, evidence[], confidence }` plus optional persisted audit fields `{ archetype_id, archetype_catalog_version, evidence_ids, legacy_source_id }` (0–2, high|medium). `legacy_source_id` is used only when older ontology rows like `great_mother` / `terrible_mother` are canonicalized into `mother`, so historical benchmarks and migrations remain auditable without reviving the old selectable IDs. Closed whitelist + concise runtime hard gates for Double, Guide/Psychopomp, Divine Child, and Ruler (`evaluation` optional; explicit failed signals reject; missing evaluation must not empty the UI; stripped before UI). Zero or one is normal; two exceptional. Resonance is shortened at generation time (~20–35 words, hard max 45). DreamDetail renders each card as canonical title + one natural paragraph: normalized `resonance` when present, otherwise normalized `expression`, with whitespace/casing/punctuation cleanup only and no visible subsection headings. Insights aggregates `canonical_label`.

`amplifications` are Mythic Echoes (`{ catalog_id, title, tradition, source_type, resonance, divergence, evidence[], confidence, catalog_myth_version }[]`), ideally 0–1, selected **from the closed Mythic narrative catalog in the same extraction call**. Model returns `catalog_id` only (or `[]`); server resolves title/tradition/source_type. Compact prompt index is build-time generated from `mythic_narrative_catalog.v1.json` (128 ids). Unknown ids / failed gates → `[]` with **no open-world fallback**. Flag `MYTHIC_CLOSED_CATALOG_V1` (default ON). DreamDetail section label stays **Mythic Echoes**; cards are now composed deterministically as title + localized tradition + localized catalog `core_synopsis` as the first paragraph when localization succeeds, followed by one flowing comparison paragraph built from stored `resonance` and optional stored `divergence` without visible subsection headings. Synopsis localization uses a presentation-only helper/cache keyed by `myth_catalog_version + catalog_id + target_language`; it never mutates persisted extraction metadata and never passes dream/resonance/divergence into the synopsis translation step. If localization fails, DreamDetail keeps only the comparison paragraph; if `resonance` is missing, the myth card is omitted. Legacy `difference` → `divergence` on read. Reader normalization also backfills title/tradition/source_type from `catalog_id` when a partially resolved row is encountered locally or from sync, so a valid closed-catalog echo does not degrade into a blank generic card. See [`ONEIROS_CLOSED_MYTH_CATALOG_INTEGRATION_BRIEF.md`](./ONEIROS_CLOSED_MYTH_CATALOG_INTEGRATION_BRIEF.md).

Extractions persist `dream-field-map-interpretive-v4.1.10-M2.2` / schema `13` / `prompt_version` `4.1.10-M2.2` (`temperature` `0`). Path: dream + reflection → one `dream_extraction` call → Fabric + Archetypal Echoes (closed catalog `archetype_id`, mechanism tags, namespace-safe validation, polarity-neutral Mother/Father line, output-language commit gate, sustained-function-over-carrier archetype preference plus general calm-field activation, explicit-negation restraint, and a minimal `Lover 1.7.1` calm-beloved wording revision) + closed Mythic Echo with `catalog_id` + `evidence_ids` or `[]` → validators resolve exact dream spans (UI display spread via `selectDisplayEvidence`) → persist/UI. Myth catalog version `1.2.0` (128 ids). Myth ranking still prefers distinctive convergence of images, roles, causal turns, and consequences over broad plot resemblance; `divergence` can transform a valid match but cannot rescue a missing defining structure. Inner Tensions now explicitly distinguish conflict from complementarity or ordinary resolved obstacles, and `display_distillation.main_tension` is normalized deterministically against `central_conflicts`. No dream-specific prompt examples. Dream Detail hides empty echo subsections; archetypal titles use catalog `displayLabel`; mythic shows resolved title + muted tradition. Optional `debug_interpretive_echoes` may return compact `selection_notes` only (never DB/UI). Acceptance: [`ONEIROS_5_DREAM_ACCEPTANCE_SET.md`](./ONEIROS_5_DREAM_ACCEPTANCE_SET.md). Current canonical prompt source: `src/ai/dreamExtractionPrompt.ts`.

Alongside that frozen monolithic line, the repo now contains an isolated 2-pass archetype spike:

```text
task: dream_archetype_recognition
prompt_id: dream-archetype-recognition-v1.0.0
prompt_version: 1.0.0
schema version: 1
recognition catalog version: 2.0.0

task: dream_archetype_adjudication
prompt_id: dream-archetype-adjudication-v1.0.0
prompt_version: 1.0.0
schema version: 1
boundary catalog version: 1.0.0
```

Discovery takes only raw dream + numbered evidence spans + target language + compact archetype catalog, and it deliberately excludes reflection, myths, Dream Fabric fields, central_conflicts, and legacy mechanism gates. Adjudication then receives only the raw dream, numbered spans, discovery candidates, and candidate-specific boundary records; it cannot discover new archetypes or rewrite discovery quality/expression/resonance. As of the v1 freeze on July 28, 2026, production metadata persistence uses this dedicated two-pass result for `interpretation.archetypes` and explicitly discards the monolithic `dream_extraction.archetypes` output after validation. Successful adjudicated `[]` commits as metadata `ready`; technical / schema / language failure retries once and then marks metadata `failed` without falling back to legacy monolithic archetypes.

When the validated extraction object arrives with an unexpectedly empty `archetypes` array but the raw model object still contains archetype rows, the server extraction path must rehydrate those candidates from raw `archetype_id` rows before archetype validation/persistence. This keeps valid closed-catalog echoes from disappearing on the very first DreamDetail save.

DreamDetail’s **Explore symbolic layers** accordion mirrors that grouping and labels single-dream `motifs` as **Dream Motifs** (not Recurring Scenes — recurrence is only confirmed across many dreams). Its full-width 60dp transparent header behaves as an editorial transition: no resting border, fill, elevation, card shape, or decorative leading icon. The right-aligned chevron is its only UI affordance and rotates with the 280ms content reveal. The row follows the closing hairline of **Inner movement** without an orphaned spacer; the existing **Symbolic reflection** hairline completes the page transition below. Fabric / Inner Tensions rendering, counts, and formatting stay on the prior Dream Detail behaviour. Echo presentation is a deterministic composition layer only: empty echo arrays still hide the subsection, missing myth `divergence` omits only that subsection, and synopsis-localization failure omits only **The myth / Ο μύθος** while preserving the rest of the card. Forming Patterns aggregates Fabric-facing categories (`symbols` as Returning Images, `motifs` as Recurring Scenes, `affects` as Emotional Weather, `thresholds`, `central_conflicts`, `landscapes`) with distinct-dream counts; archetypes and amplifications stay off the main grid.

DreamDetail should not expose raw extraction categories as primary UI. It shows what the dream gathers around, not everything the system extracted.

## Reflection Flow

1. The entitlement gateway starts the prose reflection first. Mobile reflection requests use an async quota-event status pattern so the full-depth reflection can continue server-side while the client polls. For long reflections, partial model chunks may be exposed through status polling after the client-side reveal threshold, but they are not treated as complete metadata input.
2. The Reader writes questions in the same markdown as the reading. Streaming reveals that reading, including questions. Approved prompt identity is `oneiros-same-call-reflective-questions-v1.0.3-candidate` / `f5399a49…`, Reader `oneiros-dream-reflection-v3.2.3-candidate`. After a Standard/Advanced response completes, production `oneiros-reflective-question-structure-normalizer-v1.0.0` may insert only exact `## Reflective Questions` before an unambiguous pair of terminal question bullets; ambiguity is a byte-identical no-op and partial streaming is never altered. Runtime bundle identity is `oneiros-reflective-questions-runtime-v1.0.3+structure-v1.0.0`. Post-completion marker/language/cardinality/no-answer-menu validation is stored as fail-open shadow telemetry only; a failed contract or observer exception never rejects, retries, or calls a question-only model. Normalizer and runtime identity telemetry stay separate from the prompt SHA. Q2 is unchanged. This changes no extraction prompt/schema, Echo selection, `display_distillation`, `archetypes`, `amplifications`, or catalogs.
3. The saved interpretation starts with `metadata_status: pending`; the artifact lives on its owning assistant message in existing JSONB.
4. The client starts a separate `dream_metadata_extract` gateway request after the reflection response; the gateway takes a server-side lease before extraction uses the saved reflection plus dream text to produce `display_distillation` plus pattern metadata. Structured extraction JSON is Zod-validated in `openai-proxy`; if the only failures are optional echo rows, shared validation salvages by dropping just the invalid `archetypes[]` / `amplifications[]` items before any full repair attempt. Billing-ai then runs the same shared contract before save.
5. The same interpretation row is updated to `metadata_status: ready` when extraction succeeds, or `failed` when the enrichment request fails, returns malformed/domain-invalid JSON after repair, or returns no usable metadata.

Follow-up conversation metadata may revise only affects, motifs, relational dynamics, thresholds, central conflicts, and core mode. It cannot return or revise `archetypes` or `amplifications`; those remain evidence-bound outputs of the raw-dream extraction path, preventing chat from inventing an open-world Mythic Echo.

**Resilience lock:** extraction must tolerate common model omissions on otherwise rich Interpretive Echoes (e.g. missing `confidence` soft-defaults to `medium` in coerce + Zod preprocess). Optional echo salvage must drop invalid archetype/myth rows rather than fail valid Dream Fabric or `display_distillation`, and full structured repair must be skipped when salvage already yields a valid extraction. Do not add new required echo fields without soft defaults + contract tests, and after prompt/validation edits deploy both `openai-proxy` and `ai-entitlements-gateway`. See `documentation/flows-06-jungian-ai-reflection.md` → Locked contract: metadata extraction resilience.

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
