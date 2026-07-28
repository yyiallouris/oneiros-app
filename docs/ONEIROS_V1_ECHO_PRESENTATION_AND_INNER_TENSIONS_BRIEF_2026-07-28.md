# Oneiros v1 echo presentation and Inner Tensions closing brief

Last updated: 2026-07-28

This file is intentionally self-contained.

It captures the final approved pre-release direction for:

```text
1. Inner Tensions (`central_conflicts`) and language smoke verification
2. v1 presentation/content verification for Archetypal Echoes and Mythic Parallels
```

This is a small closing task.

This is not:

```text
new benchmark cycle
prompt retuning
schema expansion
catalog revision
model-routing change
new AI feature thread
```

## Runtime line

Use the frozen production snapshot only:

```text
prompt_version: 4.1.10-M2
schema_version: 13
archetype_catalog_version: 1.7.0
myth_catalog_version: 1.2.0
```

Do not use:

```text
local myth catalog candidate 1.3.0
1.3.0-R2
```

Do not change:

```text
prompt wording
schema
catalog records
model routing
archetype selection logic
myth selection logic
```

## 1. Inner Tensions status

The honest release status is:

```text
Inner Tensions and language/text are implementation-ready and good enough for release,
but not exhaustively benchmarked.
```

What is already materially in place:

```text
- `central_conflicts` is constrained to 0–2
- it is requested only when a real tension is staged
- phrasing is image-near rather than generic psychology
- generic binaries like "fear vs desire" are discouraged
- `[]` is allowed when no true conflict is present
- user-facing strings are required in the dream's primary language
- a general output-language gate exists
- a field-level language repair path exists for user-facing text
```

The remaining gap is verification breadth, not prompt architecture.

## 2. Minimal Inner Tensions smoke check

Do not start a large benchmark thread.

Run only these three targeted smoke cases:

```text
1. Greek dream with clear real tension -> short Greek `X vs Y`
2. Greek dream without a real opposition -> `[]`
3. English dream -> English result with no mixed-language leakage
```

For each smoke case return:

```text
fixture_id
full raw dream text
exact `central_conflicts`
relevant display_distillation text
language verdict
brief pass/fail note
```

Acceptance:

```text
- conflict phrasing stays short and image-near
- no generic psych-language filler
- empty case stays empty
- English case does not leak Greek explanatory text
- Greek cases do not leak English explanatory text
```

If this passes, treat Inner Tensions as closed for `v1`.

## 3. v1 presentation decision for Archetypes and Mythic Parallels

This is worth shipping in `v1`, but only as a safer presentation improvement built from existing structured fields.

Do not expand the model output just to make the UI richer.

The goal is to turn strong labels such as:

```text
The Divine Child
Orpheus and Eurydice
```

into grounded, understandable interpretive text that explains why the label appeared in this dream.

## 4. Required architecture

### Archetypes

Use the existing structured fields:

```text
expression
resonance
evidence_ids
```

Render them as two short idea blocks:

```text
Πώς εμφανίζεται
Τι φέρνει στο όνειρο
```

English equivalent:

```text
How it appears
What it carries
```

Do not generate encyclopedia-style archetype definitions.

### Mythic Parallels

Use this exact split:

```text
The myth
Where it meets your dream
Where it differs
```

Architecture:

```text
The myth
-> deterministic catalog text only:
   canonical_title + core_synopsis

Where it meets your dream
-> existing model-produced resonance

Where it differs
-> existing model-produced divergence
```

The model must not retell the myth from memory.

Reasons:

```text
- it can drift or invent details
- it wastes tokens
- the same myth summary would become inconsistent across dreams
- the catalog is the source of truth
```

## 4A. Catalog synopsis localization

The raw catalog `core_synopsis` must not be shown directly when its language differs from the dream/UI language.

For Mythic Parallel rendering:

```text
1. Resolve canonical_title, tradition, and core_synopsis from the exact catalog_id.
2. Treat the catalog core_synopsis as the sole semantic source.
3. If its language differs from the target output language, translate it faithfully through the existing constrained field-language repair path.
4. Do not ask the model to summarize, expand, or retell the myth.
5. Cache the translated synopsis by:
   myth_catalog_version + catalog_id + target_language.
```

Implementation boundary:

```text
use a dedicated catalog-synopsis localization helper/cache
follow the same constrained translation contract as language repair
do not pass synopsis text through dream-extraction validation
do not pass synopsis text through structured-repair
do not mutate persisted extraction payload
do not trigger a new extraction call
```

Recommended flow:

```text
catalog_id
→ resolve canonical core_synopsis
→ check target language
→ retrieve cached localized synopsis
→ otherwise perform constrained translation
→ validate non-empty localized string
→ cache by myth_catalog_version + catalog_id + target_language
→ render
```

Translation contract:

```text
preserve every mythic actor
preserve causal sequence
preserve negations and conditions
do not add interpretation
do not connect it to the dream
do not paraphrase beyond natural translation
```

The three presentation layers must remain independent:

```text
Ο μύθος
→ localized deterministic core_synopsis

Πού συναντά το όνειρό σου
→ existing amplification.resonance

Πού διαφέρει
→ existing amplification.divergence
```

Do not pass `resonance` or `divergence` into the synopsis translation request.

The localized synopsis is presentation content only.

It must not alter:

```text
amplification.resonance
amplification.divergence
evidence_ids
confidence
stored extraction metadata
```

If synopsis localization fails:

```text
do not show mixed-language synopsis
do not generate a replacement myth summary
hide only the "Ο μύθος" subsection and preserve resonance/divergence
log a non-sensitive localization fallback
```

No schema or extraction-prompt change is required.

## 5. Small UX/content verification packet

Before locking the v1 presentation, create one self-contained verification packet.

This is not a new accuracy benchmark.

Use the same five reviewed dreams:

```text
1. underground theatre / lost beloved
2. expanding apartment / route-less bus
3. underground child / divided spring
4. tower / lost name / collective song
5. father / crown / chained lion
```

Run:

```text
1 fresh uncached run per dream
```

If one run is obviously malformed or unusually poor, do:

```text
1 second run only for that specific dream
```

## 6. For each dream, persist

### Full raw dream

Include the exact full dream text.

### Raw archetype output

```text
archetype_id
canonical_label
expression
resonance
mechanism_tags
evidence_ids
confidence
```

### Raw myth output

```text
catalog_id
canonical title
tradition
catalog core_synopsis
resonance
divergence
evidence_ids
confidence
```

### Exact proposed rendered copy

For each archetype:

```text
[Archetype title]

Πώς εμφανίζεται
[expression, lightly composed only if necessary]

Τι φέρνει στο όνειρο
[resonance]
```

For each myth:

```text
[Myth title]
[Tradition]

Ο μύθος
[localized deterministic catalog core_synopsis]

Πού συναντά το όνειρό σου
[resonance]

Πού διαφέρει
[divergence]
```

The `core_synopsis` must come deterministically from the catalog and be faithfully localized when the UI language requires it.

Do not ask the model to rewrite the myth.

## 7. Empty-state behavior

Also show what the UI would do when:

```text
archetypes = []
amplifications = []
divergence is empty or unavailable
```

Expected:

```text
- no empty card
- no placeholder prose
- no fabricated explanation
- the optional section may hide completely or use the existing calm empty state
```

## 8. Review criteria

### Archetypes

Rendered archetype text must:

```text
- say more than the label alone
- stay image-near
- reference the concrete figure, relationship, object, or movement in the dream
- explain the function the archetype holds inside this specific dream
- avoid encyclopedia-style explanation
- avoid presenting the archetype as diagnosis or fixed identity
- avoid near-duplication between expression and resonance
- stay roughly 2–4 short sentences total per archetype block
```

### Myths

Rendered myth text must:

```text
- describe the actual myth correctly from the catalog
- explain the specific meeting points with the dream
- distinguish the important difference or transformation clearly
- avoid presenting the mythic parallel as certainty
- avoid inventing myth details
- avoid repeating the synopsis inside resonance
- remain short and readable
```

## 9. Language verification

For each Greek fixture confirm that all user-facing explanatory text is Greek:

```text
expression
resonance
divergence
section labels
empty states
```

Canonical archetype or myth titles may follow the existing product convention, but explanatory copy must not leak mixed-language text.

## 10. Length/readability report

For each rendered block report:

```text
character count
approximate line count at current card width
whether truncation or expand/collapse would activate
```

Do not implement truncation yet.

This packet is for verification of real output shape first.

## 11. Required reviewer file

Return one self-contained file containing:

```text
1. the 5 full raw dreams
2. the exact raw archetype/myth outputs
3. the catalog synopsis used, including the localized synopsis actually rendered in the Greek UI when applicable
4. the exact rendered UI copy
5. empty-state examples
6. language review
7. length/readability review
8. any duplication or overclaiming cases
9. final recommendation:
   - ready for v1 presentation
   - needs copy composition adjustment
   - or requires new model fields
```

Predicted outcome:

```text
no new AI fields should be required
likely only a small deterministic presentation/composition layer
```

## 12. Final product stance

Ship this only under the following rule:

```text
use the existing structured fields
use deterministic catalog synopsis
do not reopen prompt/catalog benchmark work before release
```

That gives a materially stronger user experience without reopening the archetype/myth tuning thread.
