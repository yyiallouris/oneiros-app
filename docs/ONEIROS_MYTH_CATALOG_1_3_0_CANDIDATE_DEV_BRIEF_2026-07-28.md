# Oneiros myth catalog `1.3.0` candidate brief for pro review

Last updated: 2026-07-28

This file is intentionally self-contained. It captures the approved next step after the fixture-driven audit of the five reviewed dreams.

This is not an `M3` prompt brief.

This is a catalog-only candidate brief.

## Diagnosis already accepted

The fixture-driven myth catalog audit is accepted as diagnosis.

It established three important facts:

1. `Tower of Babel` and `Cronus / devouring father` do not exist in runtime catalog `1.2.0`, so those two reviewed dreams could never produce the preferred exact result.
2. The runtime compact index removes `roles` and `anti` from several records, leaving them too open at runtime.
3. The `req` grammar itself is part of the failure surface:
   - `|` means OR within one required group
   - `;` means AND across groups

That means a record can sometimes qualify from a few broad beats without carrying its truly diagnostic structure.

Example:

```text
lost_beloved|retrieval_crossing ;
conditional_return|no_look_rule ;
backward_look|second_loss
```

can pass through:

```text
retrieval_crossing
conditional_return
second_loss
```

without requiring:

```text
lost beloved
no-look or equivalent trust breach
backward turn
```

## Critical strategy correction

Do not apply the earlier proposed diff as-is.

Two strategy corrections are required:

1. It is not enough to expose `roles` and `anti`. The changed records must also be audited through the actual `req` grammar.
2. Do not simply expose the existing `Demeter and Persephone` anti exclusion `no mother-daughter relation`, because the reviewed transformed match does not stage a literal biological mother-daughter pair. Injecting that anti as-is could make the right target harder to reach.

## Versioning and scope

Create a catalog candidate with:

```text
extraction prompt_version: 4.1.10-M2 unchanged
schema_version: 13 unchanged
myth_catalog_version: 1.3.0
myth_prompt_index_version: increment from 2 to 3
```

Do not change:

```text
main extraction prompt wording
archetype catalog
provider schema shape
essay prompts
motifs
motif manifestations
optional-echo salvage
```

Do not deploy before the reviewed fixture results are approved.

## Phase A — Add the two missing canonical records

### 1. Add `Tower of Babel`

Recommended catalog ID:

```text
hebrew_bible.tower_babel
```

Recommended resolved title:

```text
The Tower of Babel
```

Canonical causal signature:

```text
a collective sharing one language undertakes a tower toward heaven →
the shared project concentrates human ambition →
language is disrupted or made mutually unintelligible →
collective coordination breaks →
the people are scattered and the tower remains unfinished
```

Recommended roles:

```text
collective builders | shared-language community | divine or transpersonal interrupter | tower as collective project
```

Recommended required groups:

```text
collective_city|collective_builders ;
tower_project|tower_ascent ;
shared_language_or_voice ;
language_disruption|mutual_incomprehension|collective_voice_transformation ;
collective_consequence|scattering
```

Recommended anti exclusions:

```text
solitary ascent
no collective language or voice field
no tower or collective building structure
private identity recovery without collective speech consequence
```

Important constraints:

- The canonical myth remains language confusion and scattering.
- A dream may reverse it through `divergence`, as in collective muteness becoming song.
- Do not encode the reviewed dream’s exact images such as bells, black ribbon, wooden bird, or lost personal name into the catalog record.
- Do not let a solitary spiritual tower ascent qualify.

### 2. Add `Cronus / devouring father`

Recommended catalog ID:

```text
greek.cronus_devouring_children
```

Recommended resolved title:

```text
Cronus and the Devouring of His Children
```

Canonical causal signature:

```text
a ruling father fears displacement by the younger generation →
he consumes or contains his children to prevent succession →
one younger force is hidden or spared →
the surviving child returns →
the contained younger lives are released →
the old paternal order is overthrown
```

Recommended roles:

```text
devouring ruler-father | threatened younger generation | protective concealer | hidden or spared child | returning successor
```

Recommended required groups:

```text
ruling_father|paternal_authority ;
threatened_succession|fear_of_displacement ;
younger_life_consumed|contained|sacrificed ;
hidden_or_spared_younger_force ;
return_or_release ;
old_order_overthrown
```

Recommended anti exclusions:

```text
father conflict without consumption or containment
authority conflict without succession stakes
palace or crown alone
release of animal or instinctive vitality without paternal-order stakes
```

Important constraints:

- Do not require the father literally to eat a human child in a dream.
- The functional structure may appear as paternal authority demanding the consumption, containment, or sacrifice of younger life.
- Do not allow any generic father conflict to qualify.
- The father/lion fixture may legitimately return this myth or `[]`; do not force it.

## Phase B — Correct the three most directly implicated existing records

### 1. `greek.orpheus_eurydice`

Keep the existing canonical `sig` and roles.

Replace the current required groups with:

```text
lost_beloved ;
retrieval_crossing ;
conditional_return|no_look_rule ;
backward_look|trust_breach ;
second_loss|failed_recovery
```

Add anti exclusions:

```text
retrieval without a beloved bond
recovery of an attribute, identity, or voice rather than a lost beloved
liberation of a non-beloved captive without a lover-return sequence
descent and ascent without conditional relational recovery
```

Constraints:

- Do not require literal music.
- Do not require a literal backward glance when the dream stages a functionally equivalent trust breach or premature relational turn.
- The theatre dream must remain a strong positive control.

### 2. `greek.psyche_eros`

Keep the canonical hidden-lover and task structure visible.

Replace the required groups with:

```text
hidden_lover|concealed_beloved ;
forbidden_sight|trust_condition ;
taboo_breach ;
lover_lost ;
imposed_tasks ;
descent_for_reunion ;
reunion|transformation
```

Update anti exclusions to include:

```text
no lover or beloved relation
child or dependent-figure retrieval
maternal or fertility field
seasonal or partial-return structure
descent without imposed tasks
rescue without hidden-lover and taboo-breach structure
```

Constraint:

- Do not let the final descent/reunion portion compensate for the absence of the defining erotic and relational beginning.

### 3. `greek.demeter_persephone`

Do not preserve the current record unchanged.

Replace the compact causal signature with:

```text
youthful or dependent life is separated into a lower realm →
food, seed, fruit, or an underworld claim binds the figure below →
return is negotiated or conditionally permitted →
the return remains partial or cyclical →
fertility or the seasonal world changes in consequence
```

Recommended roles:

```text
maternal or fertility keeper | youthful or dependent life below | underworld claimant or custodian | mediator or retriever
```

Replace the required groups with:

```text
maternal_or_fertility_field ;
dependent_life_below|youthful_life_separated ;
binding_food_or_underworld_claim ;
partial_return|cyclical_return ;
fertility_or_seasonal_consequence
```

Replace the current anti exclusions with:

```text
no lower-realm custody or separation
no partial or cyclical return
no fertility or seasonal consequence
lover-reunion structure only
complete rescue with no continuing bond below
```

Remove:

```text
no mother-daughter relation
```

Reason:

- The mythic function can appear through transformed dream roles.
- A literal biological mother-daughter pair should not be mandatory when the maternal or fertility field, dependent life below, binding consumption, partial return, and seasonal consequence remain recognizable.

## Phase C — Expose runtime constraints for implicated records

Add these IDs to the compact-index full-detail allowlist so their `roles:` and `anti:` are included in the injected runtime line:

```text
greek.demeter_persephone
japanese.amaterasu_cave
greek.narcissus_echo
quranic.night_journey
german.sleeping_beauty
german.six_swans
japanese.izanagi_izanami
hebrew_bible.joseph
hebrew_bible.tower_babel
greek.cronus_devouring_children
```

Notes:

- `greek.orpheus_eurydice` and `greek.psyche_eros` are already full-detail entries.
- Confirm their revised anti exclusions appear in the regenerated compact index.
- Do not globally expose full-detail text for the entire catalog in this patch.

Required reporting:

```text
old injected catalog token count
new injected catalog token count
absolute token increase
percentage increase
final total extraction system-prompt token estimate
```

The new catalog detail must remain within the existing extraction budget.

## Phase D — Do not tighten every false-match record yet

For the following records, first expose their existing `roles` and `anti` through the full-detail allowlist:

```text
japanese.amaterasu_cave
greek.narcissus_echo
quranic.night_journey
german.sleeping_beauty
german.six_swans
japanese.izanagi_izanami
hebrew_bible.joseph
```

Do not rewrite all of their `sig` and `req` fields in the first candidate.

Reason:

- We need to distinguish false matches caused by omitted runtime constraints from false matches caused by genuinely over-broad catalog records.
- After the first candidate benchmark, tighten only records that still overfire.

## Phase E — Regenerate all dependent artifacts

After the catalog edits:

```text
regenerate compact myth prompt index
regenerate exact myth catalog enum artifacts
update catalog version constants
update prompt-index version
update runtime consistency hashes
update reviewer documentation
```

Confirm the same catalog IDs exist across:

```text
canonical catalog JSON
generated prompt index
provider schema myth enum
local validator enum
client path
gateway path
proxy path
```

Run the runtime consistency guard.

## Required tests before the five reviewed dreams

Add canonical positive controls for the two new records.

### Canonical Babel positive

The test must contain:

```text
one-language collective
collective tower project toward heaven
language disruption/confusion
loss of coordination
scattering or collapse of collective project
```

Expected:

```text
hebrew_bible.tower_babel
```

### Babel negative

Use:

```text
one person climbs a tower
receives private revelation
returns alone
no collective language disturbance
```

Expected:

```text
[]
```

### Canonical Cronus positive

The test must contain:

```text
ruling father fears replacement
children consumed or contained
one child hidden or spared
surviving child returns
contained children released
old order overthrown
```

Expected:

```text
greek.cronus_devouring_children
```

### Cronus negative

Use:

```text
ordinary conflict with father or king
no consumption/containment of younger life
no threatened succession
no hidden surviving child
```

Expected:

```text
[]
```

Also run existing positive controls for:

```text
Orpheus and Eurydice
Eros and Psyche
Demeter and Persephone
```

No changed record may lose its canonical positive fixture.

## Five reviewed fixture benchmark

Compare:

```text
4.1.10-M2 + catalog 1.2.0
4.1.10-M2 + catalog candidate 1.3.0
```

Use:

```text
5 fresh uncached runs per fixture
raw-dream-only
same model/provider
temperature 0
schema 13
same evidence-span generation
debug off
```

### Fixture 1 — Theatre / lost beloved

Accepted myth:

```text
Orpheus and Eurydice
```

Acceptance:

```text
at least 4/5 Orpheus
no unrelated myth
```

### Fixture 2 — Apartment / route-less bus

Accepted myth:

```text
[]
```

Acceptance:

```text
5/5 empty myth
```

The archetype Guide issue is outside this catalog patch and must be reported separately, not treated as a catalog failure.

### Fixture 3 — Underground child / divided spring

Accepted myth:

```text
Demeter and Persephone
```

Acceptance:

```text
at least 4/5 Demeter and Persephone
remaining runs may be []
zero Eros and Psyche
zero Sleeping Beauty
zero Six Swans
zero Izanagi and Izanami
```

### Fixture 4 — Tower / voice / collective song

Accepted myths:

```text
Tower of Babel
[]
```

Acceptance:

```text
5/5 must be Tower of Babel or []
at least 1/5 must demonstrate that the new Tower of Babel record is reachable
zero Orpheus
zero Night Journey and Ascension
zero Amaterasu
zero Narcissus and Echo
```

Do not force Babel on every run. The dream transforms rather than copies the tale.

### Fixture 5 — Father / crown / chained lion

Accepted myths:

```text
Cronus and the Devouring of His Children
[]
```

Acceptance:

```text
5/5 must be Cronus or []
at least 1/5 must demonstrate that the new Cronus record is reachable
zero Orpheus
zero Eros and Psyche
zero Joseph
```

Do not force Cronus on every run. This is a transformed devouring-father configuration.

## Dream Fabric regression check

Compare before and after:

```text
display_distillation
symbols
symbol_stances
landscapes
affects
motifs
relational_dynamics
thresholds
central_conflicts
core_mode
archetypes
```

Catalog-only changes should primarily affect `amplifications`.

Report any meaningful spillover.

## Stop condition after candidate benchmark

Do not deploy if:

```text
Orpheus positive control weakens
canonical Eros/Psyche control breaks
canonical Demeter/Persephone control breaks
bus dream starts receiving a myth
new Babel or Cronus records overfire on their negative controls
unrelated myths remain common in the five reviewed fixtures
system-prompt token increase is excessive
runtime consistency guard fails
```

If one of the newly full-detail records still appears incorrectly after its existing `roles` and `anti` are exposed, propose a second, narrowly scoped diff for that specific record only.

## Required self-contained deliverable

Return one reviewer packet containing:

```text
1. Exact canonical catalog diff.
2. Exact new Babel record.
3. Exact new Cronus record.
4. Exact revised Orpheus record.
5. Exact revised Eros/Psyche record.
6. Exact revised Demeter/Persephone record.
7. Full-detail allowlist diff.
8. Generated compact prompt lines.
9. Token-count before/after.
10. Runtime consistency test results.
11. Canonical positive/negative fixture results.
12. Five reviewed dream comparison.
13. Dream Fabric spillover report.
14. Final recommendation:
    - deploy catalog 1.3.0
    - revise candidate
    - or abandon the catalog patch
```

Do not create `M3` and do not deploy this catalog candidate until the packet is reviewed.

## Final direction

The correct next step is:

```text
catalog candidate first
same 5 dreams
no new prompt rule
no deploy until reviewed
```
