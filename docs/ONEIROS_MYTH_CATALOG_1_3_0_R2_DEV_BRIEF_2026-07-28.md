# Oneiros myth catalog `1.3.0-R2` implementation brief

Last updated: 2026-07-28

This file is intentionally self-contained.

It locks the next approved step after the `1.3.0` candidate review packet returned:

```text
revise candidate
```

This is:

```text
catalog candidate revision R2
```

This is not:

```text
M3 prompt tuning
deployment
database work
motif_manifestations work
```

## Current position

The local `1.3.0` candidate already delivered real gains that must be preserved:

```text
bus myth negative: 3/5 empty -> 5/5 empty
Persephone reviewed target: 0/5 -> 4/5 Demeter and Persephone
Orpheus reviewed positive: stable at 4/5
```

The current problem is mainly reachability:

```text
hebrew_bible.tower_babel stayed too hard to activate
greek.cronus_devouring_children stayed too hard to activate
the revised greek.psyche_eros also became too hard to activate
```

The likely cause is over-tightening through too many mandatory `req` groups.

## 1. First lock the canonical-control inputs

Before changing any record, the next reviewer packet must include the complete raw texts of these canonical controls:

```text
Babel positive
Babel negative
Cronus positive
Cronus negative
Orpheus positive
Eros/Psyche positive
Demeter/Persephone positive
```

For each control include:

```text
fixture_id
full raw dream text
numbered evidence spans
expected catalog_id or []
actual catalog_id
resonance
divergence
evidence_ids
prompt version
catalog version
model/provider
```

### Babel positive must explicitly stage

```text
collective sharing one language
collective tower project
language disruption or mutual unintelligibility
breakdown of collective coordination
scattering or collapse of the collective project
```

### Cronus positive must explicitly stage

```text
ruling father fears succession
younger generation consumed or contained
one younger force hidden or spared
surviving younger force returns
contained younger lives released
old paternal order overthrown
```

### Eros/Psyche positive must explicitly stage

```text
hidden or concealed lover
sight or trust prohibition
breach of the prohibition
separation or loss of the lover
imposed tasks or ordeals
reunion or transformation
```

If a positive control omits one of its intended defining structures, correct the control instead of weakening the catalog record to fit an incomplete fixture.

## 2. Run debug diagnostics on the three failed positives before editing

Using the current candidate exactly as it now exists:

```text
myth_catalog_version: 1.3.0
myth_prompt_index_version: 3
prompt_version: 4.1.10-M2
schema_version: 13
```

Run:

```text
Babel positive: 3 fresh uncached debug runs
Cronus positive: 3 fresh uncached debug runs
Eros/Psyche positive: 3 fresh uncached debug runs
```

Enable only the existing additive `interpretive_diagnostics`.

Preserve:

```text
mythic_reason
near_misses
selected catalog_id
evidence_ids
full compact catalog line used
```

Do not change the main extraction prompt.

If the complete canonical text contains the required structure but the target remains `0/3`, proceed with the R2 changes below.

## 3. Candidate versioning

Because `1.3.0` has not been deployed, keep the release catalog version:

```text
myth_catalog_version: 1.3.0
```

Track this implementation as:

```text
candidate_revision: 1.3.0-R2
myth_prompt_index_version: 4
```

Keep unchanged:

```text
prompt_version: 4.1.10-M2
schema_version: 13
main extraction prompt wording
archetype catalog
optional-echo salvage
essay prompts
motifs
motif manifestations
database schema
```

## 4. Revise only the three unreachable records

Do not revise in R2:

```text
greek.orpheus_eurydice
greek.demeter_persephone
japanese.amaterasu_cave
greek.narcissus_echo
quranic.night_journey
german.sleeping_beauty
german.six_swans
japanese.izanagi_izanami
hebrew_bible.joseph
```

Keep the current full-detail allowlist unchanged during R2 so the effect of the reachability edits stays isolated.

### A. `hebrew_bible.tower_babel`

Keep unchanged:

```text
canonical title
prompt signature
roles
anti features
```

Add this signature feature:

```json
{
  "id": "collective_speech_consequence",
  "text": "collective consequence of changed or broken speech"
}
```

Replace `required_feature_groups` with:

```json
[
  [
    "collective_city",
    "collective_builders"
  ],
  [
    "tower_project",
    "tower_ascent"
  ],
  [
    "shared_language_or_voice"
  ],
  [
    "language_disruption",
    "mutual_incomprehension",
    "collective_voice_transformation",
    "collective_speech_consequence"
  ]
]
```

The current separate group:

```text
collective_consequence|scattering
```

must no longer remain independently mandatory.

Keep `collective_consequence` and `scattering` in the broader record, signature, and descriptive cluster, but do not require a second separately recognized consequence after the model has already recognized collective language transformation.

Required safety property:

```text
must still fail on solitary tower ascent
must still fail on private revelation only
must still fail when there is no collective language or voice field
must still fail when there is no collective speech consequence
```

The reviewed tower dream may qualify through a transformed collective consequence:

```text
collective muteness or blocked speech -> collective song
```

### B. `greek.cronus_devouring_children`

Keep unchanged:

```text
canonical title
prompt signature
roles
anti features
```

Add these signature features:

```json
{
  "id": "preservation_of_old_order",
  "text": "paternal authority preserves the existing order against younger life"
}
```

```json
{
  "id": "surviving_younger_force",
  "text": "a younger force survives concealment or containment"
}
```

Replace `required_feature_groups` with:

```json
[
  [
    "ruling_father",
    "paternal_authority"
  ],
  [
    "threatened_succession",
    "fear_of_displacement",
    "preservation_of_old_order"
  ],
  [
    "younger_life_consumed",
    "contained",
    "sacrificed"
  ],
  [
    "hidden_or_spared_younger_force",
    "surviving_younger_force"
  ],
  [
    "return_or_release",
    "old_order_overthrown"
  ]
]
```

R2 should no longer require both:

```text
return_or_release
AND
old_order_overthrown
```

as independently mandatory semicolon groups.

Required safety property:

```text
ordinary disagreement with father stays insufficient
king or crown imagery alone stays insufficient
authority conflict alone stays insufficient
animal release without paternal-order stakes stays insufficient
family conflict without consumption, containment, or sacrifice of younger life stays insufficient
```

### C. `greek.psyche_eros`

Keep unchanged:

```text
prompt signature
roles
anti features
```

Add:

```json
{
  "id": "separation_after_breach",
  "text": "separation from the beloved after the taboo or trust breach"
}
```

```json
{
  "id": "ordeals_for_reunion",
  "text": "ordeals or tasks undertaken toward reunion"
}
```

Replace `required_feature_groups` with:

```json
[
  [
    "hidden_lover",
    "concealed_beloved"
  ],
  [
    "forbidden_sight",
    "trust_condition"
  ],
  [
    "taboo_breach"
  ],
  [
    "lover_lost",
    "separation_after_breach"
  ],
  [
    "imposed_tasks",
    "ordeals_for_reunion"
  ],
  [
    "descent_for_reunion",
    "reunion",
    "transformation"
  ]
]
```

Keep all current anti exclusions, especially:

```text
no lover or beloved relation
child or dependent-figure retrieval
maternal or fertility field
seasonal or partial-return structure
rescue without hidden-lover and taboo-breach structure
```

Required safety property:

```text
the Persephone reviewed dream must stay excluded
descent + retrieval + return + transformation alone must not re-open the false match
```

## 5. Preserve the gains already achieved

Do not modify in R2:

```text
greek.orpheus_eurydice
greek.demeter_persephone
```

Do not remove their R1 revisions.

Keep the existing full-detail allowlist unchanged.

## 6. Token-budget requirement

Regenerate the compact index and report:

```text
R1 compact catalog tokens
R2 compact catalog tokens
absolute delta
R2 total extraction system-prompt tokens
distance from the 10,000 compact-index ceiling
```

R1 currently uses:

```text
9946 compact catalog tokens
```

R2 must stay under:

```text
10000
```

If R2 exceeds the ceiling:

```text
do not silently remove semantic constraints
first propose a token-neutral compression diff
prefer shortening duplicated prose in the three changed compact lines
do not remove meaningful anti constraints
```

## 7. Regenerate and validate runtime artifacts

Run:

```text
npm run build:interpretive-catalogs
```

Confirm consistency across:

```text
canonical JSON
generated compact index
generated catalog ID enums
provider schema enum
local validator enum
client path
gateway path
proxy path
```

Run:

```text
__tests__/mythicCatalogValidator.test.ts
__tests__/flows/mythCatalogRuntimeConsistency.flow.test.ts
```

Confirm:

```text
catalog version = 1.3.0
prompt index version = 4
130 IDs remain aligned
Babel and Cronus IDs remain present everywhere
```

## 8. Canonical control rerun

Run each control for:

```text
3 fresh uncached runs
```

### Babel positive

Expected:

```text
at least 2/3 hebrew_bible.tower_babel
no unrelated myth
```

### Babel negative

Expected:

```text
3/3 []
```

### Cronus positive

Expected:

```text
at least 2/3 greek.cronus_devouring_children
no unrelated myth
```

### Cronus negative

Expected:

```text
3/3 []
```

### Eros/Psyche positive

Expected:

```text
at least 2/3 greek.psyche_eros
no unrelated myth
```

### Orpheus positive

Expected:

```text
at least 2/3 greek.orpheus_eurydice
no unrelated myth
```

### Demeter/Persephone positive

Expected:

```text
at least 2/3 greek.demeter_persephone
no unrelated myth
```

Do not proceed to the five reviewed dreams if:

```text
any canonical negative overfires
Eros/Psyche remains 0/3
Babel remains 0/3
Cronus remains 0/3
```

## 9. Persist the complete extraction output in benchmark artifacts

Before the next reviewed benchmark, update the runner so every run stores:

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
amplifications
validation telemetry
repair telemetry
prompt version
schema version
catalog version
prompt-index version
model/provider
```

The R1 packet could not complete a full Dream Fabric audit because those fields were not persisted.

Do not claim:

```text
no Dream Fabric spillover
```

without these artifacts.

## 10. Five reviewed-dream R2 benchmark

Use the same five full raw dreams.

Run:

```text
5 fresh uncached runs per fixture
raw-dream-only
same model/provider
temperature 0
schema 13
debug off
```

Compare against:

```text
locked 1.2.0 baseline
current 1.3.0-R1 results
```

### Theatre / lost beloved

Expected:

```text
at least 4/5 Orpheus
remaining result may be []
zero unrelated myths
```

### Apartment / route-less bus

Expected:

```text
5/5 []
```

Do not count the separate Guide archetype residual as a myth-catalog failure.

### Underground child / divided spring

Expected:

```text
at least 4/5 Demeter and Persephone
remaining result may be []
zero Eros and Psyche
zero Sleeping Beauty
zero Six Swans
zero Izanagi and Izanami
```

### Tower / voice / collective song

Expected:

```text
5/5 Babel or []
Babel reachable at least 1/5
zero Rapunzel
zero Night Journey and Ascension
zero Nachiketa and Yama
zero Orpheus
zero Amaterasu
zero Narcissus and Echo
```

Do not force Babel. `[]` remains fully acceptable in the transformed case.

### Father / crown / chained lion

Expected:

```text
5/5 Cronus or []
Cronus reachable at least 1/5
zero Demeter and Persephone
zero Ariadne and the Cretan Labyrinth
zero Orpheus
zero Eros and Psyche
zero Joseph
```

Do not force Cronus. `[]` remains fully acceptable in the transformed case.

## 11. Spillover acceptance

Compare all persisted fields.

The catalog candidate should primarily affect:

```text
amplifications
```

Report separately:

```text
archetype exact changes
Dream Fabric exact changes
display_distillation changes
core_mode changes
```

Because model calls are not perfectly deterministic, do not fail R2 because of one isolated wording difference.

Flag instead:

```text
systematic field drift
repeated loss of a required archetype
repeated motif-label changes
repeated display-distillation movement changes
```

The father/lion required `Father` should not remain stuck near `1/5`.

If that persists under R2, report it as:

```text
one-call spillover
token/salience risk
```

Do not tune the archetype prompt inside this patch.

## 12. Stop conditions

Do not deploy if:

```text
Babel canonical positive remains 0/3
Cronus canonical positive remains 0/3
Eros/Psyche canonical positive remains 0/3
Babel or Cronus negatives overfire
Orpheus reviewed positive weakens
Persephone improvement is lost
bus myth-negative precision regresses
unrelated myths remain common in tower or father/lion
compact index exceeds 10000 tokens
runtime consistency fails
systematic Dream Fabric or archetype spillover appears
```

## 13. Required final reviewer packet

Return one self-contained file containing:

```text
1. Exact canonical-control raw texts.
2. Current R1 debug diagnostics for the three failed positives.
3. Exact R2 JSON diff.
4. Exact R2 generated compact lines.
5. Token report.
6. Runtime consistency tests.
7. Three-run canonical control results.
8. Five-run results for the same five reviewed dreams.
9. Full Dream Fabric and display-distillation comparison.
10. Archetype spillover comparison.
11. Final recommendation:
    - deploy 1.3.0
    - revise again
    - abandon candidate
```

Do not:

```text
deploy
create M3
begin motif_manifestations
```

until the R2 packet is reviewed.

## Final direction

The correct next step is:

```text
catalog candidate revision R2
debug-first on the three failed positives
preserve the R1 gains
keep prompt wording untouched
no deploy before the next reviewer packet
```
