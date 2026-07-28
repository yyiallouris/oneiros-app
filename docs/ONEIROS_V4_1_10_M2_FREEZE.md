# Oneiros first-release production freeze

Last updated: 2026-07-28

This file is intentionally self-contained.

It closes the pre-release archetype/myth tuning thread and records the exact production snapshot that remains approved for the first release.

## Production freeze

Keep this as the frozen production line:

```text
production_status: frozen_for_first_release
prompt_id: dream-field-map-interpretive-v4.1.10-M2
prompt_version: 4.1.10-M2
schema_version: 13
archetype_catalog_version: 1.7.0
runtime_myth_catalog_version: 1.2.0
temperature: 0
optional_echo_salvage_status: deployed_and_production_closed
```

Do not deploy the local myth catalog candidate:

```text
1.3.0
```

Do not implement now:

```text
1.3.0-R2
```

The `1.3.0` candidate and the `1.3.0-R2` brief remain:

```text
not deployed
not production
post-launch catalog-tuning work
```

## Release posture

Describe this line as:

```text
production freeze for first release
with known archetype and myth-selection residuals
```

Do not describe this snapshot as a completed or perfectly calibrated interpretive system.

No further global archetype or myth prompt tuning is required before the first release.

## Why we freeze here

The first-release line is acceptable because the core product path is working:

```text
core extraction functions
Dream Fabric functions
display layer functions
optional-echo resilience was fixed and confirmed live
invalid optional myth/archetype rows no longer destroy full metadata extraction
Orpheus works well enough for release
```

The remaining issues are mainly quality/resolution issues in optional Mythic Echo selection, not a failure of the core product.

## Known residuals accepted for first release

Treat the following as documented, non-blocking residuals:

```text
- Guide / Psychopomp may overfire on some offered-but-unrealized journey structures.
- Persephone-style transformed myths are not reliably recognized by catalog 1.2.0.
- Tower of Babel does not exist in production myth catalog 1.2.0.
- Cronus / devouring father does not exist in production myth catalog 1.2.0.
- Some transformed tower and father narratives may return an unrelated myth or [].
- Mythic Echoes remain optional and may legitimately be empty.
```

## Candidate `1.3.0` status

The local `1.3.0` candidate is not deployable as tested:

```text
- it improved the Persephone fixture;
- it improved bus myth restraint;
- it preserved the reviewed Orpheus result;
- but Babel and Cronus remained unreachable;
- and the canonical Eros/Psyche positive regressed.
```

Keep all candidate artifacts, benchmark packets, and review documents. Do not delete them.

If the candidate artifacts or generated runtime files are present on an active working branch, isolate them as candidate-only work. The frozen production branch/runtime line must continue to match the real deployed `1.2.0` myth catalog snapshot.

## Post-launch backlog boundary

The file below remains the approved post-launch tuning plan and nothing more:

```text
docs/ONEIROS_MYTH_CATALOG_1_3_0_R2_DEV_BRIEF_2026-07-28.md
```

Do not reopen archetype/myth tuning before the first release unless:

```text
- real beta-user examples reveal a repeated high-impact failure;
- a production regression occurs;
- or the post-launch catalog-tuning milestone is intentionally started.
```

## Frozen dependencies

- Canonical prompt source: `src/ai/dreamExtractionPrompt.ts`
- Metadata reviewer packet: `docs/PROMPTS_AND_DEPENDENCIES_FOR_REVIEW.md`
- Prompt inventory: `docs/AI_PROMPTS_INVENTORY.md`
- Echo prompt and closed-catalog contract: `docs/ECHOES_PROMPTS_AND_CATALOG.md`
- Architecture / extraction flow: `documentation/architecture-interpretation.md`
- End-to-end reflection flow: `documentation/flows-06-jungian-ai-reflection.md`
- Symbol + display distillation flow: `docs/SYMBOLS_FLOW.md`
- Optional-echo resilience review packet: `docs/ONEIROS_OPTIONAL_ECHO_SALVAGE_PRO_REVIEW_2026-07-28.md`
- Myth catalog `1.3.0` candidate brief: `docs/ONEIROS_MYTH_CATALOG_1_3_0_CANDIDATE_DEV_BRIEF_2026-07-28.md`
- Myth catalog `1.3.0` candidate review packet: `docs/ONEIROS_MYTH_CATALOG_1_3_0_CANDIDATE_REVIEW_PACKET_2026-07-28.md`
- Myth catalog `1.3.0-R2` backlog brief: `docs/ONEIROS_MYTH_CATALOG_1_3_0_R2_DEV_BRIEF_2026-07-28.md`

## Freeze rule

Any future change to this prompt or any connected validation/catalog/runtime file must update, in the same change:

1. `docs/AI_PROMPTS_INVENTORY.md`
2. `docs/ECHOES_PROMPTS_AND_CATALOG.md`
3. `docs/PROMPTS_AND_DEPENDENCIES_FOR_REVIEW.md`
4. `documentation/architecture-interpretation.md`
5. `documentation/flows-06-jungian-ai-reflection.md`
6. `docs/SYMBOLS_FLOW.md`
7. this freeze brief and any relevant benchmark or reviewer packet if the frozen line changes

Do not retune `4.1.10-M2` in place. Any further prompt or catalog adjustment requires a new versioned change and a new freeze/update pass.

## Freeze housekeeping report

```text
1. Exact production prompt version: 4.1.10-M2
2. Exact schema version: 13
3. Exact production archetype and myth catalog versions: archetype 1.7.0, myth 1.2.0
4. Optional-echo salvage deployment status: deployed and production-closed
5. Candidate 1.3.0 is not in production
6. R2 is preserved as post-launch backlog
7. Production branch/runtime artifacts must match the frozen line
8. No database push is required
```
