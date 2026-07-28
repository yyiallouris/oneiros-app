# Oneiros Archetype Recognition Spike `v1.0.0`

This document tracks the standalone 2-pass archetype spike approved on `2026-07-28`.

## Status

```text
status: isolated spike
production: not integrated
deployment: not yet approved
```

Frozen production remains:

```text
dream metadata extraction prompt: 4.1.10-M2
schema version: 13
production archetype catalog: 1.7.0
production myth catalog: 1.2.0
```

This spike is intentionally separate:

```text
task: dream_archetype_recognition
prompt_id: dream-archetype-recognition-v1.0.0
prompt_version: 1.0.0
response_schema_version: 1
recognition_catalog_version: 2.0.0
default model for spike runner: gpt-5.4-mini-2026-03-17
temperature: 0
```

## Scope

Stage 1 discovery takes only:

```text
raw dream
numbered raw-dream evidence spans
target language
compact closed archetype recognition catalog
```

Stage 2 adjudication takes only:

```text
raw dream
numbered raw-dream evidence spans
candidate archetypes returned by discovery
candidate-specific boundary records
target language
```

Neither stage may receive:

```text
final interpretation
Dream Fabric fields
central_conflicts
core_mode
myth catalog
myth instructions
mechanism tags
legacy mechanism gates
near-miss diagnostics
reflection
```

## Files

Implementation:

```text
src/ai/archetypeRecognitionPrompt.ts
src/ai/catalogs/archetypeRecognitionCatalog.v2.ts
src/ai/schemas/archetypeRecognitionSchema.ts
src/ai/archetypeRecognitionMapper.ts
src/ai/archetypeAdjudicationPrompt.ts
src/ai/catalogs/archetypeBoundaryCatalog.v1.ts
src/ai/schemas/archetypeAdjudicationSchema.ts
src/ai/archetypeRecognitionPipeline.ts
```

Tests:

```text
__tests__/archetypeRecognitionPrompt.test.ts
__tests__/archetypeRecognitionSchema.test.ts
__tests__/archetypeRecognitionMapper.test.ts
__tests__/archetypeAdjudicationPrompt.test.ts
__tests__/archetypeAdjudicationSchema.test.ts
__tests__/archetypeRecognitionPipeline.test.ts
```

Runner:

```text
tmp/run-archetype-recognition-v2-regression.ts
tmp/run-archetype-recognition-adjudication-regression.ts
```

## Validation contract

Discovery validator checks only:

```text
valid closed catalog id
maximum 2 archetypes
no duplicate ids
valid numbered evidence ids
non-empty quality
non-empty expression
non-empty resonance
valid confidence
correct target language
```

It does not require:

```text
mechanism_tags
requiredMechanismsAny
requiredMechanismsAll
boolean mechanism formulas
server-side semantic mechanism rejection
```

Adjudication validator checks:

```text
- decisions max 2
- accepted_archetype_ids max 2
- no duplicate ids
- valid evidence ids
- accept/reject only
- accepted_archetype_ids must match accept decisions exactly
- correct output language
```

Adjudication preserves discovery wording for accepted rows and discards rejected rows. It does not regenerate `quality`, `expression`, or `resonance`.

## Live spike note

The runners call dedicated proxy task names:

```text
dream_archetype_recognition
dream_archetype_adjudication
```

This is non-production support only for the standalone spike. It does not connect the new 2-pass path to persisted metadata, DreamDetail, Insights, or the monolithic extraction path.

## Review rule

If this prompt, schema, runner, or compact recognition catalog changes, update:

```text
docs/AI_PROMPTS_INVENTORY.md
docs/ECHOES_PROMPTS_AND_CATALOG.md
documentation/README.md
```

in the same change.
