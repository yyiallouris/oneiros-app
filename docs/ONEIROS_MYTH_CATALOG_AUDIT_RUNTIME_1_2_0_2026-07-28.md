# Oneiros runtime myth catalog audit for pro review

Last updated: 2026-07-28

This file is intentionally self-contained. A reviewer should be able to read only this file and understand:

- the exact runtime myth catalog line currently in use
- the exact requested records and whether they really exist in runtime catalog `1.2.0`
- the exact generated compact prompt text injected into the extraction prompt
- why the reviewed false matches were still possible
- the proposed record-by-record diff for review before any `M3` wording work

## Runtime line under audit

| Item | Runtime value |
|------|---------------|
| Extraction prompt id | `dream-field-map-interpretive-v4.1.10-M2` |
| Extraction prompt version | `4.1.10-M2` |
| Schema version | `13` |
| Myth catalog version | `1.2.0` |
| Myth prompt index version | `2` |
| Canonical catalog source | `src/ai/catalogs/mythic_narrative_catalog.v1.json` |
| Injected compact index source | `src/ai/catalogs/generated/mythicPromptIndex.v1.ts` |

Important runtime fact:

- the injected compact prompt index is not a full dump of every catalog field
- only IDs inside `CURATED_FULL_INDEX_IDS` get `roles:` and `anti:` appended in the compact line
- all other records are injected as `id=... sig:... req:...` only

That builder behavior is part of the current runtime and matters for the false-match analysis below.

## Requested exact runtime record audit

### 1. Orpheus and Eurydice

- Reviewer title: `Orpheus and Eurydice`
- Exists in runtime `1.2.0`: `yes`
- `catalog_id`: `greek.orpheus_eurydice`
- Resolved title: `Orpheus and Eurydice`
- `sig`: `beloved lost beyond death/threshold → lover crosses to retrieve → conditional return with no-look rule → ascent toward life/light → backward look before threshold cleared → second irreversible loss`
- `roles`: `grieving lover | dead or captive beloved | threshold escort or underworld authority`
- `req`: `lost_beloved|retrieval_crossing ; conditional_return|no_look_rule ; backward_look|second_loss`
- `anti`: none in record
- Exact generated compact prompt text:

```text
id=greek.orpheus_eurydice sig:beloved lost beyond death/threshold → lover crosses to retrieve → conditional return with no-look rule → ascent toward life/light → backward look before threshold cleared → second irreversible loss roles:grieving lover/dead or captive beloved/threshold escort or underworld authority req:lost_beloved|retrieval_crossing;conditional_return|no_look_rule;backward_look|second_loss
```

### 2. Eros and Psyche

- Reviewer title: `Eros and Psyche`
- Exists in runtime `1.2.0`: `yes`
- `catalog_id`: `greek.psyche_eros`
- Resolved title: `Eros and Psyche`
- `sig`: `secret union with hidden lover → forbidden sight/trust condition broken → lover lost → imposed tasks → underworld task/descent → reunion and transformation`
- `roles`: `mortal bride | hidden divine lover | hostile mother-in-law | helpers`
- `req`: `hidden_lover|forbidden_sight ; taboo_breach|lover_lost ; imposed_tasks ; descent_for_reunion|reunion`
- `anti`: `descent without lover separation | stripping without imposed tasks | revival without hidden-lover structure`
- Exact generated compact prompt text:

```text
id=greek.psyche_eros sig:secret union with hidden lover → forbidden sight/trust condition broken → lover lost → imposed tasks → underworld task/descent → reunion and transformation roles:mortal bride/hidden divine lover/hostile mother-in-law/helpers req:hidden_lover|forbidden_sight;taboo_breach|lover_lost;imposed_tasks;descent_for_reunion|reunion anti:descent without lover separation;stripping without imposed tasks;revival without hidden-lover structure
```

### 3. Demeter and Persephone

- Reviewer title: `Demeter and Persephone`
- Exists in runtime `1.2.0`: `yes`
- `catalog_id`: `greek.demeter_persephone`
- Resolved title: `Demeter and Persephone`
- `sig`: `separation → maternal grief and withholding → famine → divine negotiation → cyclical reunion`
- `roles`: `mother of fertility | daughter-queen below | underworld husband | mediating gods`
- `req`: `separation|maternal_grief_and_withholding ; famine|divine_negotiation ; cyclical_reunion`
- `anti`: `no mother-daughter relation | no underworld separation | no cyclical return`
- Exact generated compact prompt text:

```text
id=greek.demeter_persephone sig:separation → maternal grief and withholding → famine → divine negotiation → cyclical reunion req:separation|maternal_grief_and_withholding;famine|divine_negotiation;cyclical_reunion
```

### 4. Amaterasu and the Heavenly Rock Cave

- Reviewer title: `Amaterasu and the Heavenly Rock Cave`
- Exists in runtime `1.2.0`: `yes`
- `catalog_id`: `japanese.amaterasu_cave`
- Resolved title: `Amaterasu and the Heavenly Rock Cave`
- `sig`: `violent offense drives withdrawal → cosmic darkness follows → collective ritual and comic dance staged → curiosity draws goddess → mirror reveals radiance → cave blocked from reclosing`
- `roles`: `withdrawn sun goddess | offending brother | ritual dancer | collective gods`
- `req`: `violent_offense_drives_withdrawal|cosmic_darkness_follows ; collective_ritual_and_comic_dance_staged|curiosity_draws_goddess ; mirror_reveals_radiance|cave_blocked_from_reclosing`
- `anti`: `cave alone | no cosmic darkness | no collective lure`
- Exact generated compact prompt text:

```text
id=japanese.amaterasu_cave sig:violent offense drives withdrawal → cosmic darkness follows → collective ritual and comic dance staged → curiosity draws goddess → mirror reveals radiance → cave blocked from reclosing req:violent_offense_drives_withdrawal|cosmic_darkness_follows;collective_ritual_and_comic_dance_staged|curiosity_draws_goddess;mirror_reveals_radiance|cave_blocked_from_reclosing
```

### 5. Narcissus and Echo

- Reviewer title: `Narcissus and Echo`
- Exists in runtime `1.2.0`: `yes`
- `catalog_id`: `greek.narcissus_echo`
- Resolved title: `Narcissus and Echo`
- `sig`: `others seek relation → narcissistic refusal → reflection encountered → desire cannot be consummated → death and metamorphosis`
- `roles`: `self-absorbed youth | disembodied echoing lover | reflection`
- `req`: `others_seek_relation|narcissistic_refusal ; reflection_encountered|desire_cannot_be_consummated ; death_and_metamorphosis`
- `anti`: `mirror alone | no relational refusal | no self-image fixation`
- Exact generated compact prompt text:

```text
id=greek.narcissus_echo sig:others seek relation → narcissistic refusal → reflection encountered → desire cannot be consummated → death and metamorphosis req:others_seek_relation|narcissistic_refusal;reflection_encountered|desire_cannot_be_consummated;death_and_metamorphosis
```

### 6. Tower of Babel

- Reviewer title: `Tower of Babel`
- Exists in runtime `1.2.0`: `no`
- `catalog_id`: none
- Resolved title: none
- `sig`: none
- `roles`: none
- `req`: none
- `anti`: none
- Exact generated compact prompt text: none, because no exact runtime record exists in catalog `1.2.0`

Nearest runtime-adjacent records that may create misleading partial overlap but are not Tower of Babel:

- `sumerian.enmerkar_aratta`
- `alchemy.chemical_wedding`
- `german.rapunzel`

The closest semantic neighbor among those is:

```text
id=sumerian.enmerkar_aratta sig:sovereign demands tribute → messenger crosses difficult route → rival sets conditions → contest mediated through words and signs req:sovereign_demands_tribute;messenger_crosses_difficult_route;rival_sets_conditions;contest_mediated_through_words_and_signs
```

### 7. Cronus / devouring father

- Reviewer title: `Cronus / devouring father`
- Requested runtime wording often used in local fixtures: `Cronus and the devouring of his children`
- Exists in runtime `1.2.0`: `no`
- `catalog_id`: none
- Resolved title: none
- `sig`: none
- `roles`: none
- `req`: none
- `anti`: none
- Exact generated compact prompt text: none, because no exact runtime record exists in catalog `1.2.0`

Nearest runtime-adjacent record by literal devouring language is not a father myth:

```text
id=alchemy.green_lion_sun sig:active solvent attacks fixed solar substance → radiant form darkens or dissolves → hidden essence released for further work req:active_solvent_attacks_fixed_solar_subst;radiant_form_darkens_or_dissolves;hidden_essence_released_for_further_work
```

### 8. Joseph

- Reviewer title: `Joseph`
- Exists in runtime `1.2.0`: `yes`
- `catalog_id`: `hebrew_bible.joseph`
- Resolved title: `Joseph: Dreams, Descent, and Recognition`
- `sig`: `dreams provoke envy → descent into pit and slavery → repeated reversal → gift used in prison and court → famine brings family → identity withheld → reconciliation`
- `roles`: `dreaming younger brother | jealous brothers | ambivalent father | foreign ruler | accusing woman`
- `req`: `dreams_provoke_envy|descent_into_pit_and_slavery ; repeated_reversal|gift_used_in_prison_and_court ; famine_brings_family|identity_withheld ; reconciliation`
- `anti`: `no dream gift | no fraternal betrayal | no hidden reunion`
- Exact generated compact prompt text:

```text
id=hebrew_bible.joseph sig:dreams provoke envy → descent into pit and slavery → repeated reversal → gift used in prison and court → famine brings family → identity withheld → reconciliation req:dreams_provoke_envy|descent_into_pit_and_slavery;repeated_reversal|gift_used_in_prison_and_court;famine_brings_family|identity_withheld;reconciliation
```

### 9. The Night Journey and Ascension

- Reviewer title: `The Night Journey and Ascension`
- Exists in runtime `1.2.0`: `yes`
- `catalog_id`: `quranic.night_journey`
- Resolved title: `The Night Journey and Ascension`
- `sig`: `journey begins at night → horizontal sacred travel → vertical ascent through ordered heavens → meetings and instruction → return to ordinary world`
- `roles`: `prophetic traveler | celestial guide | prophets at levels | community receiving prayer obligation`
- `req`: `journey_begins_at_night|horizontal_sacred_travel ; vertical_ascent_through_ordered_heavens|meetings_and_instruction ; return_to_ordinary_world`
- `anti`: `ordinary flight | no sacred stations or ascent | no return`
- Exact generated compact prompt text:

```text
id=quranic.night_journey sig:journey begins at night → horizontal sacred travel → vertical ascent through ordered heavens → meetings and instruction → return to ordinary world req:journey_begins_at_night|horizontal_sacred_travel;vertical_ascent_through_ordered_heavens|meetings_and_instruction;return_to_ordinary_world
```

### 10. Sleeping Beauty / Briar Rose

- Reviewer title: `Sleeping Beauty / Briar Rose`
- Exists in runtime `1.2.0`: `yes`
- `catalog_id`: `german.sleeping_beauty`
- Resolved title: `Sleeping Beauty / Briar Rose`
- `sig`: `child blessed and cursed → danger suppressed unsuccessfully → adolescent wound → collective suspension → time and barrier mature → awakening`
- `roles`: `royal child | offended elder power | protective court | later visitor`
- `req`: `child_blessed_and_cursed|danger_suppressed_unsuccessfully ; adolescent_wound|collective_suspension ; time_and_barrier_mature|awakening`
- `anti`: `sleep alone | no birth curse | no collective suspension`
- Exact generated compact prompt text:

```text
id=german.sleeping_beauty sig:child blessed and cursed → danger suppressed unsuccessfully → adolescent wound → collective suspension → time and barrier mature → awakening req:child_blessed_and_cursed|danger_suppressed_unsuccessfully;adolescent_wound|collective_suspension;time_and_barrier_mature|awakening
```

### 11. The Six Swans

- Reviewer title: `The Six Swans`
- Exists in runtime `1.2.0`: `yes`
- `catalog_id`: `german.six_swans`
- Resolved title: `The Six Swans`
- `sig`: `stepmother curse → sister learns rescue condition → years of silence and labor → false accusations → final shirts thrown over birds`
- `roles`: `silent rescuing sister | enchanted brothers | hostile mother-in-law | husband`
- `req`: `stepmother_curse|sister_learns_rescue_condition ; years_of_silence_and_labor|false_accusations ; final_shirts_thrown_over_birds`
- `anti`: `no transformed siblings | no silent weaving task | no last-minute rescue`
- Exact generated compact prompt text:

```text
id=german.six_swans sig:stepmother curse → sister learns rescue condition → years of silence and labor → false accusations → final shirts thrown over birds req:stepmother_curse|sister_learns_rescue_condition;years_of_silence_and_labor|false_accusations;final_shirts_thrown_over_birds
```

### 12. Izanagi and Izanami / Descent to Yomi

- Reviewer title: `Izanagi and Izanami / Descent to Yomi`
- Exists in runtime `1.2.0`: `yes`
- `catalog_id`: `japanese.izanagi_izanami`
- Resolved title: `Izanagi and Izanami: Descent to Yomi`
- `sig`: `creative union → death in childbirth → grieving descent → promise not to look broken → horror and chase → boundary sealed → purification`
- `roles`: `creator husband | dead creator wife | pursuing death beings`
- `req`: `creative_union|death_in_childbirth ; grieving_descent|promise_not_to_look_broken ; horror_and_chase|boundary_sealed ; purification`
- `anti`: `no dead spouse | no forbidden look | no sealing of underworld`
- Exact generated compact prompt text:

```text
id=japanese.izanagi_izanami sig:creative union → death in childbirth → grieving descent → promise not to look broken → horror and chase → boundary sealed → purification req:creative_union|death_in_childbirth;grieving_descent|promise_not_to_look_broken;horror_and_chase|boundary_sealed;purification
```

## Runtime findings that matter immediately

### Finding 1: two reviewer-target records do not exist as exact runtime records

- `Tower of Babel` is not present in runtime catalog `1.2.0`
- `Cronus / devouring father` is not present in runtime catalog `1.2.0`

This means the current runtime cannot select those exact records no matter how good the wording is elsewhere.

### Finding 2: the injected V2 compact index is selectively under-constrained

Only a small curated set gets `roles:` and `anti:` in the injected compact line:

- `sumerian.inanna_descent`
- `greek.orpheus_eurydice`
- `greek.sisyphus`
- `greek.psyche_eros`
- `arabian.fisherman_and_jinni`
- `kiche_maya.hero_twins_xibalba`

The reviewed false-match records below mostly do not get that extra runtime constraint in the prompt index.

### Finding 3: some false-match pressure is structural, not just wording

The reviewed misses are not explained only by bad prose. Three separate structural issues are visible:

- missing exact target records in runtime (`Tower of Babel`, `Cronus / devouring father`)
- reviewed target records such as `Demeter and Persephone`, `The Night Journey and Ascension`, `Amaterasu`, `Sleeping Beauty`, `The Six Swans`, `Izanagi and Izanami`, and `Joseph` lose `roles:` and `anti:` in the compact runtime injection
- `Orpheus and Eurydice` has `roles:` but no `anti:` line at runtime, so broad retrieval/across-threshold shapes remain relatively open

## Why the reviewed misses were still possible

### Persephone dream reviewed misses

Target dream: underground child, maternal/seasonal field, partial return, one part remains below.

#### Wrong pick: `Eros and Psyche`

Why it was still reachable:

- its runtime line is richly specified and includes `underworld task/descent → reunion`
- its current `anti:` block excludes generic descent-without-lover only at a high level
- it does not explicitly exclude maternal-child retrieval, seasonal split, or child-underworld custody

Most relevant allowing clauses:

```text
sig: ... lover lost → imposed tasks → underworld task/descent → reunion and transformation
anti: descent without lover separation; stripping without imposed tasks; revival without hidden-lover structure
```

Why this is a mismatch:

- the dream does not have hidden lover structure
- the retrieved figure is childlike, not a concealed beloved
- the central field is maternal/seasonal, not erotic union

#### Wrong pick: `Sleeping Beauty / Briar Rose`

Why it was still reachable:

- the injected runtime line omits `roles:` and `anti:`
- the compact line still exposes child + danger + suspension + awakening
- that can overfire on child-return dreams with sleep/latency/return energy

Most relevant allowing clauses:

```text
sig: child blessed and cursed → danger suppressed unsuccessfully → adolescent wound → collective suspension → time and barrier mature → awakening
req: child_blessed_and_cursed|danger_suppressed_unsuccessfully; adolescent_wound|collective_suspension; time_and_barrier_mature|awakening
```

#### Wrong pick: `The Six Swans`

Why it was still reachable:

- the injected runtime line omits `roles:` and `anti:`
- the compact line foregrounds curse + rescue condition + labor + return
- that is broad enough to bleed into sacrificial rescue dreams with endangered younger figures

Most relevant allowing clauses:

```text
sig: stepmother curse → sister learns rescue condition → years of silence and labor → false accusations → final shirts thrown over birds
req: stepmother_curse|sister_learns_rescue_condition; years_of_silence_and_labor|false_accusations; final_shirts_thrown_over_birds
```

#### Wrong pick: `Izanagi and Izanami: Descent to Yomi`

Why it was still reachable:

- the injected runtime line omits `roles:` and `anti:`
- descent + prohibition + boundary-return structure is very salient in the compact line
- the false-match barrier for spouse-death material is not injected at runtime even though it exists in the full JSON

Most relevant allowing clauses:

```text
sig: creative union → death in childbirth → grieving descent → promise not to look broken → horror and chase → boundary sealed → purification
req: creative_union|death_in_childbirth; grieving_descent|promise_not_to_look_broken; horror_and_chase|boundary_sealed; purification
```

### Tower dream reviewed misses

Target dream: tower ascent, loss of voice/name, restored song, collective speech release.

Primary structural problem:

- there is no exact `Tower of Babel` record in runtime `1.2.0`

#### Wrong pick: `Orpheus and Eurydice`

Why it was still reachable:

- it is one of the curated records, so its full line is highly visible
- it emphasizes retrieval across threshold, ascent, and irreversible loss
- it has no runtime `anti:` line to explicitly reject non-beloved retrieval, non-romantic lost-name recovery, or voice restoration stories

Most relevant allowing clauses:

```text
sig: beloved lost beyond death/threshold → lover crosses to retrieve → conditional return with no-look rule → ascent toward life/light → backward look before threshold cleared → second irreversible loss
roles: grieving lover/dead or captive beloved/threshold escort or underworld authority
```

#### Wrong pick: `The Night Journey and Ascension`

Why it was still reachable:

- the injected runtime line omits `roles:` and `anti:`
- the compact line strongly advertises night journey + ascent + instruction + return
- a tower-climb with transformation and restored voice can partially echo that sequence if there is no exact Babel record to absorb the hit

Most relevant allowing clauses:

```text
sig: journey begins at night → horizontal sacred travel → vertical ascent through ordered heavens → meetings and instruction → return to ordinary world
req: journey_begins_at_night|horizontal_sacred_travel; vertical_ascent_through_ordered_heavens|meetings_and_instruction; return_to_ordinary_world
```

#### Wrong pick: `Amaterasu and the Heavenly Rock Cave`

Why it was still reachable:

- the injected runtime line omits `roles:` and `anti:`
- the compact line foregrounds withdrawal, darkness, ritual performance, and restored radiance
- a speech-blocked world restored by song can partially rhyme with that structure when no exact Babel record exists

Most relevant allowing clauses:

```text
sig: violent offense drives withdrawal → cosmic darkness follows → collective ritual and comic dance staged → curiosity draws goddess → mirror reveals radiance → cave blocked from reclosing
req: violent_offense_drives_withdrawal|cosmic_darkness_follows; collective_ritual_and_comic_dance_staged|curiosity_draws_goddess; mirror_reveals_radiance|cave_blocked_from_reclosing
```

### Father/lion dream reviewed misses

Target dream: father enthronement pressure, devouring demand, chained lion vitality, crown broken, departure from dead paternal house.

Primary structural problem:

- there is no exact `Cronus / devouring father` record in runtime `1.2.0`

#### Wrong pick: `Orpheus and Eurydice`

Why it was still reachable:

- the dream has descent below the palace, retrieval, ascent back upward, and irreversible departure
- `Orpheus` remains a very visible curated full line
- it still lacks runtime `anti:` exclusions against non-beloved rescue, father-house power struggle, or animal vitality release

Most relevant allowing clauses:

```text
sig: beloved lost beyond death/threshold → lover crosses to retrieve → conditional return with no-look rule → ascent toward life/light → backward look before threshold cleared → second irreversible loss
```

#### Wrong pick: `Eros and Psyche`

Why it was still reachable:

- the dream contains command/prohibition dynamics, descent, release, and transformation
- the runtime line still strongly emphasizes descent + return sequence
- its `anti:` line does not explicitly exclude paternal enthronement/devouring pressure or animal-heart substitution imagery

Most relevant allowing clauses:

```text
sig: secret union with hidden lover → forbidden sight/trust condition broken → lover lost → imposed tasks → underworld task/descent → reunion and transformation
anti: descent without lover separation; stripping without imposed tasks; revival without hidden-lover structure
```

## Proposed record-by-record diff for review

No changes are applied in code by this document. This is the proposed review diff only.

### Add missing exact runtime records

1. Add a true `Tower of Babel` record to runtime catalog `1.2.0` successor.
2. Add a true `Cronus / devouring father` record to runtime catalog `1.2.0` successor.

Reason:

- these are currently impossible exact selections because the records do not exist

### Promote these records to full compact injection (`roles:` + `anti:` visible at runtime)

Proposed additions to the compact-index full-detail allowlist:

- `greek.demeter_persephone`
- `japanese.amaterasu_cave`
- `hebrew_bible.joseph`
- `quranic.night_journey`
- `german.sleeping_beauty`
- `german.six_swans`
- `japanese.izanagi_izanami`

Reason:

- their full JSON already contains meaningful `roles` and `anti_features`
- those constraints are currently lost in the injected compact prompt line
- several reviewed misses align exactly with records that are currently under-constrained this way

### Tighten exact records most implicated in reviewed misses

#### `greek.orpheus_eurydice`

Proposed review diff:

- add explicit anti exclusions for non-beloved retrieval
- add explicit anti exclusions for lost-name/lost-voice recovery without beloved stake
- add explicit anti exclusions for paternal power conflict or animal liberation

Reason:

- `Orpheus` is currently high-salience and curated full-detail
- it has no `anti:` line at runtime at all

#### `greek.psyche_eros`

Proposed review diff:

- add anti exclusions for maternal-child underworld retrieval
- add anti exclusions for non-erotic rescue without hidden-lover structure
- tighten the descent/reunion tail so it cannot overpower absent hidden-lover and taboo-breach structure

#### `greek.demeter_persephone`

Proposed review diff:

- keep the existing record, but expose `roles:` and `anti:` in the compact line
- consider strengthening the compact signature toward `mother-daughter`, `underworld custody`, and `partial/seasonal return`

#### `german.sleeping_beauty`

Proposed review diff:

- expose `roles:` and `anti:` in the compact line
- consider stronger anti language against generic child latency/return dreams without curse + spindle + realm-wide suspension

#### `german.six_swans`

Proposed review diff:

- expose `roles:` and `anti:` in the compact line
- consider stronger anti language against generic sibling/child rescue dreams without transformed brothers + silent weaving labor

#### `japanese.izanagi_izanami`

Proposed review diff:

- expose `roles:` and `anti:` in the compact line
- consider stronger anti language against descent-return dreams lacking dead spouse structure

#### `quranic.night_journey`

Proposed review diff:

- expose `roles:` and `anti:` in the compact line
- consider stronger anti language against symbolic tower ascent or voice-restoration stories without sacred stations and prophetic itinerary

#### `japanese.amaterasu_cave`

Proposed review diff:

- expose `roles:` and `anti:` in the compact line
- consider stronger anti language against generic withdrawal/darkness/restoration stories without sun-goddess withdrawal and collective lure

#### `hebrew_bible.joseph`

Proposed review diff:

- expose `roles:` and `anti:` in the compact line
- keep `dream gift`, `fraternal betrayal`, and `hidden reunion` impossible to ignore in compact form

## Bottom-line audit verdict

- The optional-echo resilience patch can stay closed and untouched.
- The next problem is genuinely a myth-catalog quality and runtime-constraint problem.
- Before any `M3` wording proposal, the reviewer should judge this audit first.
- The most important runtime facts are:
  - exact `Tower of Babel` is absent
  - exact `Cronus / devouring father` is absent
  - several reviewed records lose `roles:` and `anti:` in the injected compact prompt line
  - `Orpheus` is unusually strong in the compact prompt and still lacks runtime anti exclusions
