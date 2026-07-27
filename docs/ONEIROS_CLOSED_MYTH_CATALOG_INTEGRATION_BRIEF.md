# Oneiros — Closed Myth Catalog Integration Brief

## Goal

Replace open-world Mythic Echo generation with closed-catalog selection while keeping:

- one existing `dream_metadata_extract` model call
- the current model and billing path
- Dream Fabric extraction
- current Archetypal Echo behavior
- current persistence/UI contract as backward-compatible as possible

The model must never invent a myth title, tradition, source, or generic motif label.

Input catalog supplied by product:
`mythic_narrative_catalog.v1.json`

---

## Non-negotiable runtime behavior

1. Raw dream is the only evidence source for myth selection.
2. Reflection is wording context only after selection.
3. Model may select only a supplied `catalog_id`.
4. Model never authors `title`, `tradition`, `source_type`, or `source_refs`.
5. Server resolves those fields deterministically from the catalog.
6. Unknown or invalid IDs are rejected.
7. If anything fails, return `amplifications: []`.
8. Never fall back to open-world myth generation.
9. Keep one generative model call.
10. Temperature remains `0`.

---

## Phase 1 architecture: compact full index, no extra retrieval call

Because no second runtime AI/embedding call is allowed, do not inject the full JSON
record bodies and do not add a network retrieval request.

Generate a compact prompt-facing index from all catalog records at build time.

### Canonical catalog location

```text
src/ai/catalogs/mythic_narrative_catalog.v1.json
```

Keep it server-side. Do not bundle it into the mobile client.

### Add these modules

```text
src/ai/catalogs/mythicNarrativeCatalog.ts
src/ai/catalogs/mythicPromptIndex.ts
src/ai/catalogs/generated/mythicPromptIndex.v1.ts
src/ai/validators/mythicCatalogValidator.ts
scripts/build-mythic-prompt-index.ts
```

Adjust paths to the real repository layout if needed.

### Edge-runtime requirement

The Supabase Edge runtime must not depend on Node `fs` at request time.

Use either:

- a static JSON import supported by the current Deno build, or
- preferably a generated TypeScript module exported by the build script.

The generated module should export:

```ts
export const MYTHIC_CATALOG_VERSION = "1.0.0";
export const MYTHIC_PROMPT_INDEX = `...`;
export const MYTHIC_CATALOG_BY_ID = new Map<string, MythicNarrativeEntry>(...);
```

---

## Validate the source catalog during build

Fail the build when:

- IDs are missing or duplicated
- `canonical_title` is missing
- `tradition_display` is missing
- `source_type` is missing
- `core_synopsis` is missing
- `narrative_sequence` is empty
- `relational_roles` is empty
- `disqualifiers` is missing
- an unsupported `source_type` is present

Allowed production source types:

```text
myth
mythic_cycle
fairy_tale
epic_episode
religious_narrative
alchemical_sequence
```

Do not silently repair malformed records.

---

## Compact prompt-index format

Generate one compact line/block per catalog entry.

Recommended format:

```text
[id=<id>]
title: <canonical_title>
tradition: <tradition_display>
mechanism: <core_synopsis>
cluster: <up to 3 strongest defining_cluster items>
sequence: <compact narrative_sequence in order>
roles: <up to 3 relational_roles>
reject: <up to 2 strongest disqualifiers>
```

Do not include in the model prompt:

- region
- source references
- long cultural notes
- aliases unless they materially disambiguate a title
- redundant metadata
- full prose descriptions

Keep `usage_tier` as a compact flag only when needed:

```text
caution: living_tradition
```

### Token budget

Measure with the actual tokenizer used by the gateway.

Targets:

- compact myth index: preferably 4,000–8,000 input tokens
- do not ship if it is above 10,000 without product approval
- report the final total system-prompt token count

If above budget, shorten in this order:

1. reduce cluster items from 3 to 2
2. reduce roles from 3 to 2
3. reduce disqualifiers from 2 to 1
4. shorten `core_synopsis`
5. remove title aliases

Do not remove ordered sequence or catalog ID.

---

## Prompt changes

Remove all open-world myth recall instructions, including instructions that ask
the model to remember, invent, translate, or independently name narratives.

Inject:

```text
<CLOSED_MYTH_CATALOG version="1.0.0">
${MYTHIC_PROMPT_INDEX}
</CLOSED_MYTH_CATALOG>
```

Use this Mythic Echo contract:

```text
MYTHIC ECHO — CLOSED CATALOG

Select 0–1 mythic narrative.

Use the RAW DREAM only for selection and evidence.
Treat the reflection as absent until selection, confidence, and evidence are fixed.

You may select only a catalog `id` supplied inside CLOSED_MYTH_CATALOG.
Never invent or rewrite an ID.
Never output a myth title, tradition, source, generic motif, or free-text candidate.

First derive the dream's own:
- distinctive linked configuration
- ordered causal sequence
- functional relational roles
- defining conflict, bargain, prohibition, test, deception, recognition,
  sacrifice, reversal, or transformation
- ending

Then compare catalog records in this order:

1. defining cluster
2. ordered narrative sequence
3. relational roles
4. central conflict
5. transformation or ending
6. general theme

A candidate qualifies only when:

- at least three substantial dimensions match
- `narrative_sequence` or `relational_roles` is one of the substantial matches
- its defining configuration remains recognizable
- no supplied disqualifier describes the dream's actual configuration
- divergence modifies a real match rather than excusing missing core structure
- evidence comes only from the raw dream

Return [] when no supplied record qualifies.
A false Mythic Echo is worse than no result.
Do not select from a single object, creature, atmosphere, setting, or broad theme.
Do not infer cultural belonging from the dreamer's language or location.
```

### Reflection firewall

```text
The reflection may help only with localized `resonance` and `divergence`
wording after `catalog_id`, confidence, evaluation, and evidence are final.

A myth name, cultural parallel, or symbolic claim appearing only in the
reflection must be ignored for selection.
```

---

## Internal model-output schema

The model-facing `amplifications` item must become:

```ts
type RawClosedCatalogMythicEcho = {
  catalog_id: string;
  resonance: string;
  divergence: string;
  evidence: string[];
  confidence: "high" | "medium";
  evaluation: {
    matched_dimensions: Array<
      | "distinctive_cluster"
      | "narrative_sequence"
      | "relational_roles"
      | "central_conflict"
      | "transformation_or_ending"
      | "general_theme"
    >;
    divergence_type:
      | "outcome_changed"
      | "emphasis_changed"
      | "pattern_interrupted"
      | "pattern_unfinished"
      | "core_structure_absent";
    disqualifiers_triggered: string[];
  };
};
```

The model schema must:

- disallow `title`
- disallow `tradition`
- disallow unknown extra fields
- allow at most one amplification
- require `catalog_id`
- restrict confidence to high/medium
- restrict evaluation enums

Do not ask the model for a self-authored numeric score.

Compute the deterministic score server-side from `matched_dimensions`:

```ts
const DIMENSION_WEIGHTS = {
  distinctive_cluster: 4,
  narrative_sequence: 3,
  relational_roles: 3,
  central_conflict: 2,
  transformation_or_ending: 2,
  general_theme: 0.5,
} as const;
```

Thresholds:

```text
medium: >= 8
high: >= 11
```

At least three substantial dimensions are required.
`general_theme` does not count as substantial.
At least one of sequence or roles is mandatory.

---

## Server-side normalization and validation

After the model response:

1. Read `catalog_id`.
2. Resolve the record from `MYTHIC_CATALOG_BY_ID`.
3. Reject when missing.
4. Reject unsupported `source_type`.
5. Recalculate score from matched dimensions.
6. Reject fewer than three substantial dimensions.
7. Reject when neither sequence nor roles matched.
8. Reject `core_structure_absent`.
9. Reject any non-empty `disqualifiers_triggered`.
10. Validate all evidence against raw dream text.
11. Resolve canonical display metadata from the catalog.
12. Produce the sanitized app-facing object.

Recommended resolver:

```ts
function resolveMythDisplay(catalogId: string) {
  const entry = MYTHIC_CATALOG_BY_ID.get(catalogId);
  return entry
    ? {
        title: entry.canonical_title,
        tradition: entry.tradition_display,
        sourceType: entry.source_type,
      }
    : null;
}
```

Failure behavior:

```ts
amplifications = [];
```

Never fall back to:

- model-authored title
- open-world generation
- generic motif
- nearest title guess
- alias matching from arbitrary free text

---

## App-facing / persisted shape

Keep the existing UI shape by resolving fields server-side:

```ts
type SanitizedMythicEcho = {
  catalog_id: string;
  title: string;
  tradition: string;
  source_type: string;
  resonance: string;
  divergence: string;
  evidence: string[];
  confidence: "high" | "medium";
};
```

Persist:

```text
catalog_id
catalog_myth_version
title/tradition only if materialized server-side from the catalog
resonance
divergence
evidence
confidence
prompt_version
schema_version
```

Preferred behavior:

- `catalog_id` is authoritative
- current title/tradition may be resolved at render time
- if materialized, they must be copied from the catalog server-side

If metadata is stored in JSONB, no DB migration may be necessary.
Update TypeScript types and validators anyway.

Historical records without `catalog_id` may remain displayable.
Do not generate new legacy records.

---

## UI

No redesign is required.

Mythic Echo heading:

```text
<catalog canonical title>
<catalog tradition display>
```

Body:

```text
resonance
divergence
```

Hide the entire section when `amplifications` is empty.

Never display:

- catalog score
- matched dimensions
- disqualifiers
- source refs
- diagnostics
- confidence badge

---

## Archetypes

Do not redesign Archetypal Echoes in this change.

Keep:

- current v4 archetype prompt
- closed selectable archetype catalog
- `temperature: 0`
- Ego excluded
- current validators

This PR is specifically for Mythic Echo closed-catalog selection.

---

## Logging

Add structured logs:

```text
myth_catalog_version
myth_prompt_index_token_count
myth_catalog_entry_count
raw_catalog_id
matched_dimensions
computed_score
validation_issues
resolved_title
resolved_tradition
post_validation_amplification_count
total_prompt_tokens
model_cost
latency
```

Do not log the entire catalog or full prompt in production.

Development-only invariant:

```text
If a production Mythic Echo exists:
- catalog_id resolves exactly once
- title/tradition equal the catalog record
- no free-text title/tradition entered the model contract
```

---

## Feature flag and rollout

Add:

```text
MYTHIC_CLOSED_CATALOG_V1
```

Behavior:

```text
flag OFF:
  temporary amplifications: [] or current production behavior only in local testing

flag ON:
  closed catalog only
  no open-world fallback
```

Recommended rollout:

1. local/test environment
2. benchmark
3. internal users
4. production

If the closed-catalog pipeline errors, return `[]` and log the error.

---

## Required tests

### Catalog tests

- loads all expected records
- unique IDs
- required fields present
- allowed source types only
- deterministic generated prompt index
- token count under budget

### Schema tests

- unknown `catalog_id` rejected
- title/tradition from model rejected by schema
- more than one myth rejected
- invalid dimension enum rejected
- low/medium/high confidence rules enforced

### Validator tests

- fewer than three substantial dimensions rejected
- theme-only match rejected
- no sequence/role rejected
- triggered disqualifier rejected
- core structure absent rejected
- untraceable evidence rejected
- canonical title/tradition resolved exactly

### Regression tests

- no Aladdin/Gyges/Fisher King free-text can reach UI unless their exact catalog
  IDs were validly selected
- generic labels such as “Jinn in the Bottle” cannot reach UI
- model cannot change or localize canonical title
- reflection-only myth names do not affect selection

---

## Benchmark

Run with debug suffix OFF and no prompt changes between runs.

### Target dream

5 fresh uncached runs.

Acceptance:

- exact catalog ID for `The Fisherman and the Jinni`: >= 4/5
- no wrong catalog ID: 0/5
- no unknown ID: 0/5
- no generic/free-text title: 0/5
- title/tradition exact catalog resolution: 100%

### Holdouts

At least 20 varied dreams:

- ordinary personal conflicts
- brief dreams
- object-lure dreams
- exact narrative-sequence positives
- cultural-tradition cases
- ambiguous cases that should return []

Release thresholds:

```text
unknown catalog IDs: 0%
model-authored titles/traditions reaching UI: 0%
generic motif titles reaching UI: 0%
wrong-myth false positives: <= 5%
exact strong-match recall: >= 80%
empty output on weak/ordinary dreams: expected and acceptable
```

Do not tune against one dream after every run.
Review the complete batch.

---

## Deployment checklist

1. Add catalog JSON to server-side source.
2. Add catalog schema/build validation.
3. Generate compact prompt index.
4. Record exact prompt-index token count.
5. Update Mythic prompt from open-world to closed IDs.
6. Update structured-output schema.
7. Add catalog resolver and deterministic validator.
8. Preserve app-facing shape.
9. Add catalog/prompt version fields.
10. Add feature flag.
11. Run unit tests.
12. Run benchmark.
13. Deploy `openai-proxy`.
14. Deploy `ai-entitlements-gateway`.
15. Force uncached re-extraction.
16. Verify logs and UI.
17. Remove/disable all open-world Mythic fallback code.

---

## Definition of done

This architecture is complete only when:

- the model can output only a known catalog ID or []
- model-authored myth title/tradition are impossible by schema
- server resolves title/tradition deterministically
- invalid candidates become []
- one generative model call remains
- no open-world fallback remains
- token budget is measured and approved
- the benchmark passes
