# Oneiros M2.1 archetypal-field diagnostic

Date: `2026-07-28`

## Scope

This packet captures the exact Phase 1 diagnostic state after the general
`4.1.10-M2.1` calibration:

```text
- global archetype activation instructions injected at runtime
- exact injected Lover catalog block
- generated source used by the gateway
- confirmation that runtime content matches catalog version 1.7.0
- Lover prompt position and immediate surrounding records
```

This is a diagnostic artifact only.

```text
No Lover-specific catalog change has been applied.
No myth-selection change has been applied.
No deployment has been performed from this packet.
```

## Current runtime line

```text
prompt_id: dream-field-map-interpretive-v4.1.10-M2.1
prompt_version: 4.1.10-M2.1
schema_version: 13
archetype_catalog_version: 1.7.0
myth_catalog_version: 1.2.0
```

## Source confirmation

The gateway uses the shared canonical extraction prompt module:

```text
supabase/functions/_shared/billing-ai.ts
→ ../../../src/ai/dreamExtractionPrompt.ts
→ buildDreamExtractionSystemPrompt()
→ formatArchetypeCatalogForPromptV1()
```

The exact generated archetype prompt source remains:

```text
src/ai/catalogs/archetypeCatalog.v1.ts
```

The current generated enum source includes `lover` in the selectable archetype set:

```text
src/ai/catalogs/generated/catalogIdEnums.v1.ts
```

## Diagnostic conclusion

The current repo/runtime split is:

```text
global activation contract: updated in M2.1
Lover catalog record: unchanged 1.7.0 record
```

So the current patch is intentionally:

```text
general archetypal-field calibration
without a Lover-specific catalog rewrite
```

## Exact global archetype activation block

```text
GLOBAL ARCHETYPE ACTIVATION

An archetype may be enacted through an event, action, conflict,
transformation, or sustained field.

Do not require every archetype to produce a decision, crossing,
crisis, reversal, or changed outcome.

A relational, containing, ordering, unifying, or restorative
archetype may be fully active when its presence organizes how the
whole dream-space is felt and inhabited.

Distinguish:
- a figure or relationship that merely appears
from
- a figure, bond, or quality that organizes the dream's emotional,
  relational, or imaginal field.

Harmony, stillness, mutuality, safety, and sustained attention do
not weaken archetypal relevance.

Core State and Core Restoration dreams remain eligible for
archetypal recognition.

Select an archetypal echo when its function is central, sustained, or image-bearing in the dream.

When an archetypal resonance is real but gentle, return it at medium confidence rather than omitting it.

Do not select an archetype merely because its typical carrier appears.
A child, elder, lover-figure, job, duplicate, death image, journey, or threshold is not sufficient without the corresponding archetypal function.

Family calibration:
A. Relational / mediating (Lover, Anima, Animus, Mother, Father, Wise Old Man, Wise Old Woman, relational Guide):
   a sustained relational field, meaningful mediation, mutual orientation, holding, paternal claim, devotion, or psychic reorientation may be sufficient.
   Do not require crisis, climax, sacrifice, victory, or world-changing outcome.
   For Mother and Father, put polarity (nurturing/devouring, protective/tyrannical, absent, etc.) in expression — do not invent separate polarity ids.
B. Transformational (Hero, Death–Rebirth, Trickster, Sacred Marriage, Self):
   keep structural sequence requirements; do not weaken existing Hero gates.
C. Identity / boundary (Persona, Double, Shadow, Orphan):
   tighten carrier-vs-function — occupation, resemblance, loss, or danger alone are insufficient without the archetype's specific structure (see catalog insufficientWhen).
```

## Exact injected Lover block

```text
id=lover label:Lover
  function: Erotic or devoted relatedness that organizes desire, union, or heart-risk at the centre.
  select when: erotic or devoted relatedness organizes the dream; union, longing, or heart-risk is the structural stake; choosing the beloved changes the field; mutual intimacy or chosen closeness is the emotional centre of the dream; two figures share a sustained orientation toward the same psychic depth, future, or field; the bond itself changes how the dream-space can be inhabited, even without conflict or dramatic outcome
  not enough: any romance cue; attractiveness alone; wedding scenery alone; requiring longing, separation, vow, sacrifice, or transformed social order when gentle closeness already organizes the field
  require mechanisms: (devotion_or_longing | union_separation_or_loss) & bond_organizes_dream
```

## Runtime match confirmation

The injected prompt-facing `Lover` block above matches the current generated
catalog line:

```text
archetype_catalog_version: 1.7.0
```

This means:

```text
- the runtime is not silently using a different Lover record
- the current diagnosis is not “missing Lover clauses in injection”
- the next question is behavioral salience under the full prompt, not a missing catalog row
```

## Prompt position

```text
lover_index_zero_based_in_catalog_block_list: 15
lover_char_offset_in_system_prompt: 21734
lover_token_offset_approx_in_system_prompt: 2958
```

Interpretation:

```text
- Lover is present in the injected catalog
- it is not unusually early in the archetype list
- it appears mid/late inside a long system prompt
```

This does not prove a salience problem by itself, but it preserves the exact
prompt-position fact the reviewer asked for.

## Surrounding catalog records

```text
id=double label:Double
  function: Rival, substitute, or split-off self competing for the dreamer’s place, role, identity, or agency.
  select when: identity competition, substitution, or rivalry for the dreamer’s place; a counterpart occupies or claims the dreamer’s recognition; split agency is the organizing conflict
  not enough: shared face or eyes only; mirror resemblance only; vague familiarity; physical resemblance alone without substitution, rivalry, identity displacement, or split agency
```

```text
id=orphan label:Orphan
  function: Abandonment, exile, or lack of belonging that organizes the dream’s emotional centre.
  select when: exile or abandonment organizes the centre; search for home or kin-protection drives movement; aloneness without belonging is structural, not incidental
  not enough: brief loneliness; any child; missing one parent incidentally; loss or separation alone unless abandonment, exile, or lack of belonging organizes the field
```

```text
id=lover label:Lover
  function: Erotic or devoted relatedness that organizes desire, union, or heart-risk at the centre.
  select when: erotic or devoted relatedness organizes the dream; union, longing, or heart-risk is the structural stake; choosing the beloved changes the field; mutual intimacy or chosen closeness is the emotional centre of the dream; two figures share a sustained orientation toward the same psychic depth, future, or field; the bond itself changes how the dream-space can be inhabited, even without conflict or dramatic outcome
  not enough: any romance cue; attractiveness alone; wedding scenery alone; requiring longing, separation, vow, sacrifice, or transformed social order when gentle closeness already organizes the field
  require mechanisms: (devotion_or_longing | union_separation_or_loss) & bond_organizes_dream
```

```text
id=ruler label:Ruler
  function: Embodied sovereign or sustained ruling function that organizes the field through authority.
  select when: embodied sovereign agency commands the field; throne, court, or ruling will is actively exercised; authority is personal and structural, not mere backdrop
  not enough: institution alone; guards or audience alone; ceremony alone; title without agency
```

```text
id=death_rebirth label:Death–Rebirth
  function: Dying-and-becoming sequence — dissolution of old form and emergence of a new psychic state.
  select when: dissolution and emergent renewal form a sequence; stripping, burial, or descent precedes return in new form; the ending is transformative, not merely sad or threatening
  not enough: death image alone; any change; departure or arrival alone; night falling
  require mechanisms: dissolution_or_symbolic_death & revival_or_return & identity_or_status_transformed
```

## What changed in M2.1

Applied now:

```text
- general archetypal-field activation calibration
- general Inner Tensions / conflict-vs-complementarity correction
- deterministic rule:
  central_conflicts = [] -> main_tension = null
- broad regression fixture expansion for calm-field and false-conflict cases
```

Not applied now:

```text
- no Lover record rewrite
- no archetype catalog version bump
- no myth tuning
- no validator hard-gate change
- no deterministic Lover fallback
```

## Verification completed locally

Commands run:

```text
npx jest __tests__/structuredTaskValidation.test.ts __tests__/patchFStability.test.ts __tests__/flows/edgeExtractionPrompt.flow.test.ts __tests__/flows/dreamMetadataExtraction.resilience.contract.flow.test.ts __tests__/flows/interpretiveEchoesV31.ranking.flow.test.ts __tests__/flows/entitledAiService.flow.test.ts --runInBand
npx tsc --noEmit --pretty false
```

Result:

```text
deterministic Jest suite: passed
typecheck: passed
```

## Current recommendation

```text
Proceed to broad regression/live runs next.
Do not change the Lover record yet.
Do not deploy before the regression packet is reviewed.
```
