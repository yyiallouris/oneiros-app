# Oneiros optional-echo salvage pro review packet

Last updated: 2026-07-28

This file is intentionally self-contained. It documents only the structured-output resilience fix for optional Archetypal Echo and Mythic Echo rows. It does **not** change prompt wording, catalogs, schema version, essay prompts, or motif architecture.

## Scope summary

Goal:

- prevent one invalid optional `archetypes[]` or `amplifications[]` item from failing an otherwise valid `dream_extraction`
- preserve valid Dream Fabric and `display_distillation`
- skip full structured repair when item-level salvage already yields a valid extraction

Out of scope:

- prompt wording changes
- archetype catalog changes
- myth catalog changes
- schema version bump
- essay prompt changes
- M3 tuning

## Exact files changed

Code:

- `src/ai/structuredTaskValidation.ts`

Tests:

- `__tests__/structuredTaskValidation.test.ts`
- `__tests__/catalogNamespaceEnforcement.test.ts`
- `__tests__/flows/dreamMetadataExtraction.resilience.contract.flow.test.ts`

Documentation:

- `documentation/flows-06-jungian-ai-reflection.md`
- `documentation/architecture-interpretation.md`
- `docs/SYMBOLS_FLOW.md`
- `supabase/functions/openai-proxy/README.md`
- `supabase/functions/ai-entitlements-gateway/README.md`

## Exact salvage order

Shared validator path for `dream_extraction` is now:

1. Parse top-level JSON.
2. Coerce known aliases / legacy shapes.
3. Run full `dreamExtractionSchema` validation once.
4. If full validation fails, retry with **base extraction only**:
   base object = same payload with `archetypes: []` and `amplifications: []`.
5. If base extraction is invalid, fail normally.
6. If base extraction is valid, validate each `archetypes[]` item independently.
7. Keep only individually valid archetype rows.
8. Validate each `amplifications[]` item independently.
9. Keep only individually valid myth rows; keep at most the first valid myth row.
10. Rebuild the full extraction from:
    - preserved base extraction
    - salvaged archetypes
    - salvaged amplifications
11. Revalidate the rebuilt extraction.
12. If valid, return success with `salvagedWithoutRepair = true`.
13. Use full structured repair only if the required/core extraction shape is still invalid after salvage.

## Invalid optional echo conditions now dropped

Archetype row is dropped when it has:

- unknown `archetype_id`
- myth `catalog_id` placed inside `archetype_id`
- invalid / unknown `mechanism_tags`
- invalid `evidence_ids`
- malformed required fields

Myth row is dropped when it has:

- unknown `catalog_id`
- archetype id placed inside `catalog_id`
- invalid `evidence_ids`
- malformed required fields
- extra valid myth rows beyond the first accepted one

## Hard confirmations

### 1. Valid Dream Fabric is preserved

Confirmed.

The salvage path first validates the non-echo/base extraction and rebuilds the final payload from that validated base object. The new unit coverage asserts that these fields survive unchanged when invalid optional echoes are dropped:

- `display_distillation`
- `symbols`
- `symbol_stances`
- `landscapes`
- `affects`
- `motifs`
- `relational_dynamics`
- `thresholds`
- `central_conflicts`
- `core_mode`

### 2. No replacement IDs are inferred

Confirmed.

The fix never maps an invalid id to a nearest valid id. Invalid optional rows are dropped. Valid bracket-normalization behavior is unchanged, but there is no new nearest-match or fallback mapping.

### 3. Full structured repair is skipped when salvage succeeds

Confirmed.

Successful salvage returns `validateStructuredTaskContent(...).ok = true` with log fields:

- `salvageSucceeded = true`
- `salvagedWithoutRepair = true`
- `repairAttempted = false`

That means the payload is accepted before the proxy repair path runs.

### 4. Prompt wording and catalogs were not changed

Confirmed.

No changes were made to:

- `src/ai/dreamExtractionPrompt.ts`
- archetype catalog records
- myth catalog records
- prompt id / prompt version
- schema version

## Tests added / updated

Updated tests now cover:

- bare invalid archetype tags are dropped instead of failing the whole extraction when valid non-echo metadata exists
- myth `catalog_id` placed in `archetype_id` is dropped via namespace-crossover salvage
- missing required `archetype_id` is dropped when valid Dream Fabric remains
- exact observed invalid archetype ids:
  - `public_role_or_social_mask`
  - `power_asymmetry_reversed`
  - `norse.odin_runes`
  - `hebrew_bible.exodus`
  - `sovereign`
- invalid evidence ids on archetype rows
- invalid myth ids on amplification rows
- one valid echo sibling is preserved while invalid siblings are dropped
- extraction still fails when all invalid echoes are dropped and no required/core metadata remains

## Test results

Command run:

```bash
npm test -- --runTestsByPath __tests__/structuredTaskValidation.test.ts __tests__/catalogNamespaceEnforcement.test.ts __tests__/flows/dreamMetadataExtraction.resilience.contract.flow.test.ts
```

Result:

```text
PASS __tests__/flows/dreamMetadataExtraction.resilience.contract.flow.test.ts
PASS __tests__/catalogNamespaceEnforcement.test.ts
PASS __tests__/structuredTaskValidation.test.ts

Test Suites: 3 passed, 3 total
Tests:       27 passed, 27 total
```

## Important implementation notes

- `dreamEvidenceIdSchema` now enforces numbered evidence ids like `D1`.
- `coerceExtractionAmplifications` no longer truncates to the first raw item before salvage; it now preserves the array so item-level myth validation can decide what to keep/drop.
- Safe structured validation logs now expose non-sensitive salvage telemetry:
  - `salvageAttempted`
  - `salvageSucceeded`
  - `salvagedWithoutRepair`
  - `salvagedArchetypesDropped`
  - `salvagedAmplificationsDropped`
  - `salvageDropCategories`

## Practical conclusion

This fix closes the resilience finding from the benchmark sequencing:

- invalid optional echoes no longer force a `structured_schema_invalid` when valid Dream Fabric remains
- valid metadata is preserved
- no prompt or catalog tuning was mixed into the change

The next separate step can be myth-record audit / quality work, but this patch itself is strictly a resilience-layer fix.

## Deployment verification status

### Pre-deploy scope check

Confirmed from scoped diff review:

- `src/ai/dreamExtractionPrompt.ts`: no changes in this resilience patch
- archetype catalog records: no changes
- myth catalog records: no changes
- provider schema enum source files: no changes
- `DREAM_EXTRACTION_SCHEMA_VERSION`: no change
- essay prompts: no changes
- motif architecture: no changes

Additional verification suites run:

```bash
npm test -- --runTestsByPath __tests__/flows/structuredAiValidation.flow.test.ts __tests__/flows/edgeExtractionPrompt.flow.test.ts
```

Result:

```text
PASS __tests__/flows/structuredAiValidation.flow.test.ts
PASS __tests__/flows/edgeExtractionPrompt.flow.test.ts
```

### Evidence ID restriction verification

The stricter `dreamEvidenceIdSchema` now enforces `D<number>` ids at structured-validation time.

Verification outcome:

- live extraction prompt contract already instructs numbered `[Dn]` spans only
- `src/ai/dreamEvidenceSpans.ts` already resolves only numbered `D<number>` ids
- archetype evidence ids and myth evidence ids already share that same numbered contract
- language repair forbids changing ids / mechanism tags / confidence / evidence ids
- no currently active live extraction producer or prompt contract was found expecting another evidence-id shape

Practical conclusion:

- the new validation rule aligns the shared validator with the already-deployed extraction contract
- no active production path was found that depends on non-`D<number>` evidence ids

### Deployments completed

Deployment timestamp (UTC):

```text
2026-07-28T10:26:45Z
```

Supabase project reference:

```text
xacdawttvtfrdbcwhcqn
```

Git commit hash at deploy time:

```text
2c59e17ab98985ca5b0b5b3df78a5d2dcef5974c
```

Deployed functions:

- `openai-proxy`
- `ai-entitlements-gateway`

Runtime line at deploy time:

- `prompt_version = 4.1.10-M2`
- `schema_version = 13`
- `myth_catalog_version = 1.2.0`

### Live smoke status

Completed successfully:

1. Deployed `openai-proxy` unauthenticated boundary smoke via live Jest smoke:

```text
PASS __tests__/live/aiSupabaseSmoke.live.test.ts
- reaches Supabase auth health
- reaches openai-proxy and rejects unauthenticated AI calls before provider work
```

2. Deployed `ai-entitlements-gateway` unauthenticated boundary smoke via direct live request:

```text
status: 401
body: {"error":"Unauthorized","details":{"upstreamMessage":"This endpoint requires a valid Bearer token"}}
```

This confirms the deployed gateway endpoint is reachable and enforcing auth.

### Remaining blocker for full production-close

Not completed yet:

- authenticated live `dream_extraction` smoke through deployed `openai-proxy`
- authenticated live `dream_metadata_extract` smoke through deployed `ai-entitlements-gateway`
- live invalid-archetype salvage smoke
- live invalid-myth salvage smoke
- live mixed-sibling salvage smoke
- live fallback-to-full-repair smoke

Reason:

- local environment currently exposes only:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT`
- no `LIVE_SUPABASE_ACCESS_TOKEN`
- no `LIVE_SUPABASE_EMAIL`
- no `LIVE_SUPABASE_PASSWORD`
- no existing deployed fault-injection hook for intentionally invalid optional echo rows

So the remaining reviewer checklist items are blocked by missing authenticated live test credentials and by the lack of a controlled invalid-row test hook in the deployed path.

### Honest status

What is closed:

- resilience implementation
- scoped tests
- broader structured-validation / extraction contract tests
- deployments to both server paths
- deployed unauthenticated reachability/auth-boundary checks
- evidence-id contract audit

What is not yet closed:

- authenticated live extraction verification
- authenticated live salvage telemetry verification
- production-path invalid-row fault injection

No database push was required.

## Live verification update

### Authenticated normal gateway smoke

Using test interpretation:

```text
interpretation_id = 05ddf672-0444-4e07-a4bf-40060d47b92b
```

An authenticated live call to `ai-entitlements-gateway` with:

```text
action = dream_metadata_extract
debug_interpretive_echoes = false
```

returned:

```text
status = committed
metadata_status = ready
cached = false
```

This confirms:

- authenticated gateway path reached
- `dream_metadata_extract` ran end-to-end
- no unexpected structured repair was required for the normal path

### Authenticated proxy smoke

Authenticated live `openai-proxy` verification returned:

```json
{"symbol_groups":[],"landscape_groups":[]}
```

This is valid and expected for the `semantic_grouping` task contract. The earlier live smoke failure came from an overly narrow test expectation (`{ ok: true }`), not from a runtime/auth issue.

### Guarded debug-only fault injection

Temporary verification-only gate was enabled with:

- secret flag `ENABLE_DEBUG_ECHO_FAULT_INJECTION=1`
- authorized user id `1631d925-4d3e-44eb-82cb-0fbfd892ed0c`
- debug requests only

The hook was used only for:

- `invalid_archetype`
- `invalid_myth`
- `mixed_optional`
- `all_optional_invalid`

After verification, the secrets were immediately reset to:

```text
ENABLE_DEBUG_ECHO_FAULT_INJECTION=0
DEBUG_ECHO_FAULT_INJECTION_ALLOWED_USER_IDS=
```

### Live fault-case results

#### 1. Invalid optional archetype

Result:

```text
status = 200
topStatus = committed
metadata_status = ready
repairAttempted = false
salvageAttempted = true
salvageSucceeded = true
salvagedWithoutRepair = true
salvagedArchetypesDropped = 1
salvagedAmplificationsDropped = 0
salvageDropCategories = [dream_extraction_invalid_archetype_dropped]
```

#### 2. Invalid optional myth

Result:

```text
status = 200
topStatus = committed
metadata_status = ready
repairAttempted = false
salvageAttempted = true
salvageSucceeded = true
salvagedWithoutRepair = true
salvagedArchetypesDropped = 0
salvagedAmplificationsDropped = 1
salvageDropCategories = [dream_extraction_invalid_myth_dropped]
```

#### 3. Mixed sibling case

Injected:

- one invalid archetype
- one invalid myth

Result:

```text
status = 200
topStatus = committed
metadata_status = ready
repairAttempted = false
salvageAttempted = true
salvageSucceeded = true
salvagedWithoutRepair = true
salvagedArchetypesDropped = 1
salvagedAmplificationsDropped = 1
salvageDropCategories = [
  dream_extraction_invalid_archetype_dropped,
  dream_extraction_invalid_myth_dropped
]
```

Observed post-validation counts:

```text
post_validation_archetypes_count = 2
post_validation_amplifications_count = 1
```

This confirms valid optional siblings were preserved while invalid siblings were dropped.

#### 4. All optional echoes invalid

Injected:

- invalid-only archetypes array
- invalid-only amplifications array

Result:

```text
status = 200
topStatus = committed
metadata_status = ready
repairAttempted = false
salvageAttempted = true
salvageSucceeded = true
salvagedWithoutRepair = true
salvagedArchetypesDropped = 1
salvagedAmplificationsDropped = 1
post_validation_archetypes_count = 0
post_validation_amplifications_count = 0
```

This confirms valid Dream Fabric can still commit with all optional echoes dropped.

### Restore pass

After the fault cases, a final authenticated normal debug extraction was run on the same test interpretation to restore it to a non-fault-injected state.

Restore result:

```text
status = 200
topStatus = committed
metadata_status = ready
cached = false
repairAttempted = false
salvageSucceeded = false
```

Observed restored post-validation counts on that run:

```text
post_validation_archetypes_count = 1
post_validation_amplifications_count = 0
```

Note:

- this restore pass confirms the hook was no longer injecting invalid rows
- model output itself may vary across fresh live extractions, so restored optional counts do not need to match a previous historical run exactly

### Remaining unverified item

Not live-verified through the guarded hook:

- invalid non-echo/base extraction fallback into full repair

Reason:

- the approved guard scope for the temporary hook was limited to invalid optional archetype/amplification rows only
- no separate live base-shape corruption hook was added

This fallback remains covered by the shared structured-validation tests rather than this live fault-injection pass.

### Final production-safety verdict

For the approved optional-echo scope, the feature is production-closed:

- both deployed function paths were verified
- authenticated gateway `dream_metadata_extract` succeeded
- optional invalid archetype rows were dropped live
- optional invalid myth rows were dropped live
- mixed valid/invalid sibling behavior was verified live
- all-invalid optional echo fallback was verified live
- no full structured repair was triggered when salvage succeeded
- no prompt/catalog/schema/motif/essay changes were mixed into verification
- no real user data was used; only the designated test interpretation was exercised
