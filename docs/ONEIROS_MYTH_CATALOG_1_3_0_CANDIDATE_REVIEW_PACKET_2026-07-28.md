# Oneiros myth catalog `1.3.0` candidate review packet

Last updated: 2026-07-28

Status:

- implemented locally only
- not deployed
- no database push
- extraction prompt remains `dream-field-map-interpretive-v4.1.10-M2`
- schema remains `13`
- final recommendation for this candidate: `revise candidate`

This file is intentionally self-contained.

## 1. Exact files changed

Implemented and regenerated:

```text
src/ai/catalogs/mythic_narrative_catalog.v1.json
scripts/build-mythic-prompt-index.ts
src/ai/catalogs/generated/mythicPromptIndex.v1.ts
src/ai/catalogs/generated/catalogIdEnums.v1.ts
__tests__/mythicCatalogValidator.test.ts
__tests__/flows/mythCatalogRuntimeConsistency.flow.test.ts
tmp/run-myth-catalog-130-controls.ts
tmp/run-myth-catalog-130-controls.sh
documentation/README.md
docs/ONEIROS_MYTH_CATALOG_1_3_0_CANDIDATE_REVIEW_PACKET_2026-07-28.md
```

Not changed:

```text
main extraction prompt wording
archetype catalog
optional-echo salvage
motifs
motif manifestations
essay prompts
database schema
```

## 2. Version line and runtime hashes

Baseline line:

```text
prompt_version: 4.1.10-M2
schema_version: 13
myth_catalog_version: 1.2.0
myth_prompt_index_version: 2
myth_catalog_hash: 37924efdaa6238a8
myth_prompt_index_hash: 98f6916323a58c4d
```

Candidate line:

```text
prompt_version: 4.1.10-M2
schema_version: 13
myth_catalog_version: 1.3.0
myth_prompt_index_version: 3
myth_catalog_hash: 12f8fbc838546e22
myth_prompt_index_hash: 8bb5eaf3f714f9e1
```

## 3. Token report

Measured with the same tokenizer and prompt-building path:

```text
compact catalog token count: 9220 -> 9946
absolute compact increase: 726
compact increase percentage: 7.87%

complete extraction system prompt token count: 15173 -> 15899
absolute prompt increase: 726
prompt increase percentage: 4.78%

tokenizer: gpt-tokenizer:/tmp/tok/node_modules/gpt-tokenizer
```

The compact myth index stayed under the hard `10k` ceiling, but only narrowly:

```text
9946 / 10000
```

## 4. Runtime consistency and enum tests

Commands run:

```text
npm run build:interpretive-catalogs
npm run test:one -- __tests__/mythicCatalogValidator.test.ts __tests__/flows/mythCatalogRuntimeConsistency.flow.test.ts
```

Observed:

```text
build: passed
runtime consistency test: passed
validator test: passed
```

What was confirmed:

```text
catalog version is 1.3.0
prompt-index version is 3
130 myth IDs exist in canonical JSON, generated prompt index, generated enums, and provider response schema
hebrew_bible.tower_babel exists across runtime artifacts
greek.cronus_devouring_children exists across runtime artifacts
full-detail compact lines include id + sig + roles + req + anti for the expanded allowlist
non-allowlisted records still remain compact-only
```

## 5. Full-detail allowlist before and after

Before:

```text
arabian.fisherman_and_jinni
greek.sisyphus
greek.orpheus_eurydice
sumerian.inanna_descent
kiche_maya.hero_twins_xibalba
greek.psyche_eros
```

After:

```text
arabian.fisherman_and_jinni
greek.sisyphus
greek.orpheus_eurydice
sumerian.inanna_descent
kiche_maya.hero_twins_xibalba
greek.psyche_eros
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

## 6. Exact canonical JSON diff

Header diff:

```json
{
  "version": "1.3.0",
  "entry_count": 130
}
```

### Final Babel record

```json
{
  "id": "hebrew_bible.tower_babel",
  "canonical_title": "The Tower of Babel",
  "aliases": [],
  "tradition_id": "hebrew_bible",
  "tradition_display": "Hebrew Bible / Tanakh",
  "region": "Ancient Israel / Jewish tradition",
  "source_type": "religious_narrative",
  "source_refs": [
    "sefaria_tanakh"
  ],
  "usage_tier": "living_tradition_caution",
  "match_tier": 1,
  "core_synopsis": "a one-language collective builds upward; the shared project concentrates ambition; language becomes mutually unintelligible; coordination breaks; the people scatter and the tower remains unfinished",
  "defining_cluster": [
    "collective builders sharing one language",
    "tower project toward heaven",
    "speech or language disrupted",
    "collective coordination breaks",
    "people scattered and project unfinished"
  ],
  "narrative_sequence": [
    "collective builders share one language",
    "tower project rises toward heaven",
    "language is disrupted or made mutually unintelligible",
    "collective coordination breaks",
    "people scatter and the tower remains unfinished"
  ],
  "relational_roles": [
    "collective builders",
    "shared-language community",
    "divine or transpersonal interrupter",
    "tower as collective project"
  ],
  "central_conflicts": [
    "shared human ambition versus imposed limit",
    "collective speech versus broken coordination"
  ],
  "transformations": [
    "one coordinated voice fragments into scattered and unfinished collective life"
  ],
  "disqualifiers": [
    "solitary ascent",
    "no collective language or voice field",
    "no tower or collective building structure",
    "private identity recovery without collective speech consequence"
  ],
  "cultural_notes": [
    "Use the exact tradition label; do not universalize or psychologize the living tradition."
  ],
  "source_subtype": "scriptural_narrative",
  "prompt_signature": "a collective sharing one language undertakes a tower toward heaven → the shared project concentrates human ambition → language is disrupted or made mutually unintelligible → collective coordination breaks → the people are scattered and the tower remains unfinished",
  "signature_features": [
    {
      "id": "collective_city",
      "text": "collective city or shared civic build"
    },
    {
      "id": "collective_builders",
      "text": "collective builders"
    },
    {
      "id": "tower_project",
      "text": "tower project"
    },
    {
      "id": "tower_ascent",
      "text": "tower ascent"
    },
    {
      "id": "shared_language_or_voice",
      "text": "shared language or voice field"
    },
    {
      "id": "language_disruption",
      "text": "language disruption"
    },
    {
      "id": "mutual_incomprehension",
      "text": "mutual incomprehension"
    },
    {
      "id": "collective_voice_transformation",
      "text": "collective voice transformation"
    },
    {
      "id": "collective_consequence",
      "text": "collective consequence"
    },
    {
      "id": "scattering",
      "text": "scattering"
    }
  ],
  "required_feature_groups": [
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
      "collective_voice_transformation"
    ],
    [
      "collective_consequence",
      "scattering"
    ]
  ],
  "anti_features": [
    {
      "id": "solitary_ascent",
      "text": "solitary ascent"
    },
    {
      "id": "no_collective_language_or_voice_field",
      "text": "no collective language or voice field"
    },
    {
      "id": "no_tower_or_collective_building_structure",
      "text": "no tower or collective building structure"
    },
    {
      "id": "private_identity_recovery_without_collective_speech_consequence",
      "text": "private identity recovery without collective speech consequence"
    }
  ]
}
```

### Final Cronus record

```json
{
  "id": "greek.cronus_devouring_children",
  "canonical_title": "Cronus and the Devouring of His Children",
  "aliases": [],
  "tradition_id": "greek",
  "tradition_display": "Greek mythology",
  "region": "Mediterranean",
  "source_type": "myth",
  "source_refs": [
    "perseus"
  ],
  "usage_tier": "public_reference",
  "match_tier": 1,
  "core_synopsis": "ruling father fears succession; younger life is consumed or contained; one child is hidden; the surviving child returns; the contained younger lives are released; the old paternal order falls",
  "defining_cluster": [
    "ruling father fears replacement",
    "younger generation consumed or contained",
    "one younger force hidden or spared",
    "returning successor",
    "contained younger lives released",
    "old paternal order overthrown"
  ],
  "narrative_sequence": [
    "ruling father fears displacement",
    "younger life is consumed, contained, or sacrificed",
    "one younger force is hidden or spared",
    "the surviving child returns",
    "the contained younger lives are released",
    "the old order is overthrown"
  ],
  "relational_roles": [
    "devouring ruler-father",
    "threatened younger generation",
    "protective concealer",
    "hidden or spared child",
    "returning successor"
  ],
  "central_conflicts": [
    "paternal domination versus succession",
    "contained younger life versus released future"
  ],
  "transformations": [
    "contained younger life returns and overturns the ruling father"
  ],
  "disqualifiers": [
    "father conflict without consumption or containment",
    "authority conflict without succession stakes",
    "palace or crown alone",
    "release of animal or instinctive vitality without paternal-order stakes"
  ],
  "cultural_notes": [],
  "source_subtype": "myth",
  "prompt_signature": "a ruling father fears displacement by the younger generation → he consumes or contains his children to prevent succession → one younger force is hidden or spared → the surviving child returns → the contained younger lives are released → the old paternal order is overthrown",
  "signature_features": [
    {
      "id": "ruling_father",
      "text": "ruling father or paternal authority"
    },
    {
      "id": "paternal_authority",
      "text": "paternal authority"
    },
    {
      "id": "threatened_succession",
      "text": "threatened succession"
    },
    {
      "id": "fear_of_displacement",
      "text": "fear of displacement by the younger generation"
    },
    {
      "id": "younger_life_consumed",
      "text": "younger life consumed"
    },
    {
      "id": "contained",
      "text": "younger life contained"
    },
    {
      "id": "sacrificed",
      "text": "younger life sacrificed to preserve the old order"
    },
    {
      "id": "hidden_or_spared_younger_force",
      "text": "hidden or spared younger force"
    },
    {
      "id": "return_or_release",
      "text": "return or release of the surviving younger force"
    },
    {
      "id": "old_order_overthrown",
      "text": "old paternal order overthrown"
    }
  ],
  "required_feature_groups": [
    [
      "ruling_father",
      "paternal_authority"
    ],
    [
      "threatened_succession",
      "fear_of_displacement"
    ],
    [
      "younger_life_consumed",
      "contained",
      "sacrificed"
    ],
    [
      "hidden_or_spared_younger_force"
    ],
    [
      "return_or_release"
    ],
    [
      "old_order_overthrown"
    ]
  ],
  "anti_features": [
    {
      "id": "father_conflict_without_consumption_or_containment",
      "text": "father conflict without consumption or containment"
    },
    {
      "id": "authority_conflict_without_succession_stakes",
      "text": "authority conflict without succession stakes"
    },
    {
      "id": "palace_or_crown_alone",
      "text": "palace or crown alone"
    },
    {
      "id": "animal_vitality_release_without_paternal_order_stakes",
      "text": "release of animal or instinctive vitality without paternal-order stakes"
    }
  ]
}
```

### Final Orpheus record

```json
{
  "id": "greek.orpheus_eurydice",
  "canonical_title": "Orpheus and Eurydice",
  "aliases": [],
  "tradition_id": "greek",
  "tradition_display": "Greek mythology",
  "region": "Mediterranean",
  "source_type": "myth",
  "source_refs": [
    "perseus"
  ],
  "usage_tier": "public_reference",
  "match_tier": 1,
  "core_synopsis": "living lover descends to retrieve dead beloved; conditional return granted; ascent under look-back prohibition; forbidden turn; irreversible second loss",
  "defining_cluster": [
    "dead or lost beloved beyond a threshold",
    "living lover crosses to retrieve",
    "conditional escort back to life or light",
    "forbidden backward look",
    "second irreversible separation at the threshold"
  ],
  "narrative_sequence": [
    "bereavement or loss of beloved",
    "descent or crossing for retrieval",
    "exception granted with no-look condition",
    "ascent toward light or life",
    "look back before threshold cleared",
    "irreversible second loss"
  ],
  "relational_roles": [
    "grieving lover",
    "dead or captive beloved",
    "threshold escort or underworld authority"
  ],
  "central_conflicts": [
    "love versus law of death",
    "trust versus doubt at the threshold"
  ],
  "transformations": [
    "near-restoration collapses at the final threshold"
  ],
  "disqualifiers": [
    "no beloved to retrieve",
    "no conditional return or escort rule",
    "no backward-look failure",
    "underworld visit without retrieval attempt",
    "guide crossing without love-loss stake"
  ],
  "cultural_notes": [],
  "source_subtype": "myth",
  "prompt_signature": "beloved lost beyond death/threshold → lover crosses to retrieve → conditional return with no-look rule → ascent toward life/light → backward look before threshold cleared → second irreversible loss",
  "signature_features": [
    {
      "id": "lost_beloved",
      "text": "beloved lost beyond death or threshold"
    },
    {
      "id": "retrieval_crossing",
      "text": "lover crosses to retrieve"
    },
    {
      "id": "conditional_return",
      "text": "conditional return"
    },
    {
      "id": "no_look_rule",
      "text": "no-look rule"
    },
    {
      "id": "backward_look",
      "text": "backward look before threshold cleared"
    },
    {
      "id": "trust_breach",
      "text": "trust breach or premature turn toward the beloved"
    },
    {
      "id": "second_loss",
      "text": "second irreversible loss"
    },
    {
      "id": "failed_recovery",
      "text": "failed recovery after near-restoration"
    }
  ],
  "required_feature_groups": [
    [
      "lost_beloved"
    ],
    [
      "retrieval_crossing"
    ],
    [
      "conditional_return",
      "no_look_rule"
    ],
    [
      "backward_look",
      "trust_breach"
    ],
    [
      "second_loss",
      "failed_recovery"
    ]
  ],
  "anti_features": [
    {
      "id": "retrieval_without_beloved_bond",
      "text": "retrieval without a beloved bond"
    },
    {
      "id": "attribute_or_voice_recovery_instead_of_beloved",
      "text": "recovery of an attribute, identity, or voice rather than a lost beloved"
    },
    {
      "id": "non_beloved_captive_without_lover_return",
      "text": "liberation of a non-beloved captive without a lover-return sequence"
    },
    {
      "id": "descent_ascent_without_conditional_relational_recovery",
      "text": "descent and ascent without conditional relational recovery"
    }
  ]
}
```

### Final Eros/Psyche record

```json
{
  "id": "greek.psyche_eros",
  "canonical_title": "Eros and Psyche",
  "aliases": [],
  "tradition_id": "greek",
  "tradition_display": "Greek mythology",
  "region": "Mediterranean",
  "source_type": "myth",
  "source_refs": [
    "perseus"
  ],
  "usage_tier": "public_reference",
  "match_tier": 1,
  "core_synopsis": "secret union; curiosity breaks condition; lover lost; tasks imposed; underworld journey; divinized reunion",
  "defining_cluster": [
    "hidden lover",
    "prohibition on seeing",
    "lamp revelation",
    "separation",
    "impossible tasks",
    "descent for beauty or life",
    "reunion"
  ],
  "narrative_sequence": [
    "secret union",
    "curiosity breaks condition",
    "lover lost",
    "tasks imposed",
    "underworld journey",
    "divinized reunion"
  ],
  "relational_roles": [
    "mortal bride",
    "hidden divine lover",
    "hostile mother-in-law",
    "helpers"
  ],
  "central_conflicts": [
    "trust versus demand to see",
    "love tested through ordeals"
  ],
  "transformations": [
    "mortal psyche becomes immortal partner"
  ],
  "disqualifiers": [
    "no hidden lover",
    "no taboo breach",
    "no imposed tasks or reunion"
  ],
  "cultural_notes": [],
  "source_subtype": "myth",
  "prompt_signature": "secret union with hidden lover → forbidden sight/trust condition broken → lover lost → imposed tasks → underworld task/descent → reunion and transformation",
  "signature_features": [
    {
      "id": "hidden_lover",
      "text": "secret union with hidden lover"
    },
    {
      "id": "concealed_beloved",
      "text": "concealed beloved relation"
    },
    {
      "id": "forbidden_sight",
      "text": "forbidden sight or trust condition"
    },
    {
      "id": "trust_condition",
      "text": "trust condition that must not be broken"
    },
    {
      "id": "taboo_breach",
      "text": "taboo breach"
    },
    {
      "id": "lover_lost",
      "text": "lover lost"
    },
    {
      "id": "imposed_tasks",
      "text": "imposed tasks"
    },
    {
      "id": "descent_for_reunion",
      "text": "underworld task or descent"
    },
    {
      "id": "reunion",
      "text": "reunion"
    },
    {
      "id": "transformation",
      "text": "transformation through reunion"
    }
  ],
  "required_feature_groups": [
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
      "lover_lost"
    ],
    [
      "imposed_tasks"
    ],
    [
      "descent_for_reunion"
    ],
    [
      "reunion",
      "transformation"
    ]
  ],
  "anti_features": [
    {
      "id": "no_lover_or_beloved_relation",
      "text": "no lover or beloved relation"
    },
    {
      "id": "child_or_dependent_figure_retrieval",
      "text": "child or dependent-figure retrieval"
    },
    {
      "id": "maternal_or_fertility_field",
      "text": "maternal or fertility field"
    },
    {
      "id": "seasonal_or_partial_return_structure",
      "text": "seasonal or partial-return structure"
    },
    {
      "id": "descent_without_imposed_tasks",
      "text": "descent without imposed tasks"
    },
    {
      "id": "rescue_without_hidden_lover_and_taboo_breach",
      "text": "rescue without hidden-lover and taboo-breach structure"
    }
  ]
}
```

### Final Demeter/Persephone record

```json
{
  "id": "greek.demeter_persephone",
  "canonical_title": "Demeter and Persephone",
  "aliases": [
    "The Abduction of Persephone"
  ],
  "tradition_id": "greek",
  "tradition_display": "Greek mythology",
  "region": "Mediterranean",
  "source_type": "mythic_cycle",
  "source_refs": [
    "perseus"
  ],
  "usage_tier": "public_reference",
  "match_tier": 1,
  "core_synopsis": "dependent life descends below; food or underworld claim binds it there; return is negotiated; return remains partial or cyclical; seasonal or fertility consequence follows",
  "defining_cluster": [
    "youthful or dependent life separated into a lower realm",
    "food seed fruit or underworld claim binds the figure below",
    "return is negotiated or conditionally permitted",
    "return remains partial or cyclical",
    "fertility or seasonal consequence follows"
  ],
  "narrative_sequence": [
    "dependent life descends below",
    "binding claim fixes a bond to the lower realm",
    "return is negotiated",
    "return remains partial or cyclical",
    "fertility or seasonal world changes"
  ],
  "relational_roles": [
    "maternal or fertility keeper",
    "youthful or dependent life below",
    "underworld claimant or custodian",
    "mediator or retriever"
  ],
  "central_conflicts": [
    "lower-realm claim versus return to living growth",
    "care and fertility versus continuing bond below"
  ],
  "transformations": [
    "separation becomes a recurring pattern of partial return and altered fertility"
  ],
  "disqualifiers": [
    "no lower-realm custody or separation",
    "no partial or cyclical return",
    "no fertility or seasonal consequence",
    "lover-reunion structure only",
    "complete rescue with no continuing bond below"
  ],
  "cultural_notes": [],
  "source_subtype": "mythic_cycle",
  "prompt_signature": "youthful or dependent life is separated into a lower realm → food, seed, fruit, or an underworld claim binds the figure below → return is negotiated or conditionally permitted → the return remains partial or cyclical → fertility or the seasonal world changes in consequence",
  "signature_features": [
    {
      "id": "maternal_or_fertility_field",
      "text": "maternal or fertility field"
    },
    {
      "id": "dependent_life_below",
      "text": "dependent life below"
    },
    {
      "id": "youthful_life_separated",
      "text": "youthful life separated into a lower realm"
    },
    {
      "id": "binding_food_or_underworld_claim",
      "text": "binding food, seed, fruit, or underworld claim"
    },
    {
      "id": "partial_return",
      "text": "partial return"
    },
    {
      "id": "cyclical_return",
      "text": "cyclical return"
    },
    {
      "id": "fertility_or_seasonal_consequence",
      "text": "fertility or seasonal consequence"
    },
    {
      "id": "role_maternal_or_fertility_keeper",
      "text": "maternal or fertility keeper"
    },
    {
      "id": "role_youthful_or_dependent_life_below",
      "text": "youthful or dependent life below"
    },
    {
      "id": "role_underworld_claimant_or_custodian",
      "text": "underworld claimant or custodian"
    },
    {
      "id": "role_mediator_or_retriever",
      "text": "mediator or retriever"
    }
  ],
  "required_feature_groups": [
    [
      "maternal_or_fertility_field"
    ],
    [
      "dependent_life_below",
      "youthful_life_separated"
    ],
    [
      "binding_food_or_underworld_claim"
    ],
    [
      "partial_return",
      "cyclical_return"
    ],
    [
      "fertility_or_seasonal_consequence"
    ]
  ],
  "anti_features": [
    {
      "id": "no_underworld_separation",
      "text": "no lower-realm custody or separation"
    },
    {
      "id": "no_cyclical_return",
      "text": "no partial or cyclical return"
    },
    {
      "id": "no_fertility_or_seasonal_consequence",
      "text": "no fertility or seasonal consequence"
    },
    {
      "id": "lover_reunion_structure_only",
      "text": "lover-reunion structure only"
    },
    {
      "id": "complete_rescue_without_continuing_bond_below",
      "text": "complete rescue with no continuing bond below"
    }
  ]
}
```

## 7. Exact generated compact lines

```text
id=greek.orpheus_eurydice sig:beloved lost beyond death/threshold → lover crosses to retrieve → conditional return with no-look rule → ascent toward life/light → backward look before threshold cleared → second irreversible loss roles:grieving lover/dead or captive beloved/threshold escort or underworld authority req:lost_beloved;retrieval_crossing;conditional_return|no_look_rule;backward_look|trust_breach;second_loss|failed_recovery anti:retrieval without a beloved bond;recovery of an attribute, identity, or voice rather than a lost beloved;liberation of a non-beloved captive without a lover-return sequence;descent and ascent without conditional relational recovery
id=greek.psyche_eros sig:secret union with hidden lover → forbidden sight/trust condition broken → lover lost → imposed tasks → underworld task/descent → reunion and transformation roles:mortal bride/hidden divine lover/hostile mother-in-law/helpers req:hidden_lover|concealed_beloved;forbidden_sight|trust_condition;taboo_breach;lover_lost;imposed_tasks;descent_for_reunion;reunion|transformation anti:no lover or beloved relation;child or dependent-figure retrieval;maternal or fertility field;seasonal or partial-return structure;descent without imposed tasks;rescue without hidden-lover and taboo-breach structure
id=greek.demeter_persephone sig:youthful or dependent life is separated into a lower realm → food, seed, fruit, or an underworld claim binds the figure below → return is negotiated or conditionally permitted → the return remains partial or cyclical → fertility or the seasonal world changes in consequence roles:maternal or fertility keeper/youthful or dependent life below/underworld claimant or custodian/mediator or retriever req:maternal_or_fertility_field;dependent_life_below|youthful_life_separated;binding_food_or_underworld_claim;partial_return|cyclical_return;fertility_or_seasonal_consequence anti:no lower-realm custody or separation;no partial or cyclical return;no fertility or seasonal consequence;lover-reunion structure only;complete rescue with no continuing bond below
id=greek.cronus_devouring_children sig:a ruling father fears displacement by the younger generation → he consumes or contains his children to prevent succession → one younger force is hidden or spared → the surviving child returns → the contained younger lives are released → the old paternal order is overthrown roles:devouring ruler-father/threatened younger generation/protective concealer/hidden or spared child/returning successor req:ruling_father|paternal_authority;threatened_succession|fear_of_displacement;younger_life_consumed|contained|sacrificed;hidden_or_spared_younger_force;return_or_release;old_order_overthrown anti:father conflict without consumption or containment;authority conflict without succession stakes;palace or crown alone;release of animal or instinctive vitality without paternal-order stakes
id=hebrew_bible.tower_babel sig:a collective sharing one language undertakes a tower toward heaven → the shared project concentrates human ambition → language is disrupted or made mutually unintelligible → collective coordination breaks → the people are scattered and the tower remains unfinished roles:collective builders/shared-language community/divine or transpersonal interrupter/tower as collective project req:collective_city|collective_builders;tower_project|tower_ascent;shared_language_or_voice;language_disruption|mutual_incomprehension|collective_voice_transformation;collective_consequence|scattering anti:solitary ascent;no collective language or voice field;no tower or collective building structure;private identity recovery without collective speech consequence
id=japanese.amaterasu_cave sig:violent offense drives withdrawal → cosmic darkness follows → collective ritual and comic dance staged → curiosity draws goddess → mirror reveals radiance → cave blocked from reclosing roles:withdrawn sun goddess/offending brother/ritual dancer/collective gods req:violent_offense_drives_withdrawal|cosmic_darkness_follows;collective_ritual_and_comic_dance_staged|curiosity_draws_goddess;mirror_reveals_radiance|cave_blocked_from_reclosing anti:cave alone;no cosmic darkness;no collective lure
id=greek.narcissus_echo sig:others seek relation → narcissistic refusal → reflection encountered → desire cannot be consummated → death and metamorphosis roles:self-absorbed youth/disembodied echoing lover/reflection req:others_seek_relation|narcissistic_refusal;reflection_encountered|desire_cannot_be_consummated;death_and_metamorphosis anti:mirror alone;no relational refusal;no self-image fixation
id=quranic.night_journey sig:journey begins at night → horizontal sacred travel → vertical ascent through ordered heavens → meetings and instruction → return to ordinary world roles:prophetic traveler/celestial guide/prophets at levels/community receiving prayer obligation req:journey_begins_at_night|horizontal_sacred_travel;vertical_ascent_through_ordered_heavens|meetings_and_instruction;return_to_ordinary_world anti:ordinary flight;no sacred stations or ascent;no return
id=german.sleeping_beauty sig:child blessed and cursed → danger suppressed unsuccessfully → adolescent wound → collective suspension → time and barrier mature → awakening roles:royal child/offended elder power/protective court/later visitor req:child_blessed_and_cursed|danger_suppressed_unsuccessfully;adolescent_wound|collective_suspension;time_and_barrier_mature|awakening anti:sleep alone;no birth curse;no collective suspension
id=german.six_swans sig:stepmother curse → sister learns rescue condition → years of silence and labor → false accusations → final shirts thrown over birds roles:silent rescuing sister/enchanted brothers/hostile mother-in-law/husband req:stepmother_curse|sister_learns_rescue_condition;years_of_silence_and_labor|false_accusations;final_shirts_thrown_over_birds anti:no transformed siblings;no silent weaving task;no last-minute rescue
id=japanese.izanagi_izanami sig:creative union → death in childbirth → grieving descent → promise not to look broken → horror and chase → boundary sealed → purification roles:creator husband/dead creator wife/pursuing death beings req:creative_union|death_in_childbirth;grieving_descent|promise_not_to_look_broken;horror_and_chase|boundary_sealed;purification anti:no dead spouse;no forbidden look;no sealing of underworld
id=hebrew_bible.joseph sig:dreams provoke envy → descent into pit and slavery → repeated reversal → gift used in prison and court → famine brings family → identity withheld → reconciliation roles:dreaming younger brother/jealous brothers/ambivalent father/foreign ruler/accusing woman req:dreams_provoke_envy|descent_into_pit_and_slavery;repeated_reversal|gift_used_in_prison_and_court;famine_brings_family|identity_withheld;reconciliation anti:no dream gift;no fraternal betrayal;no hidden reunion
```

## 8. Canonical positive and negative control results

Control summary:

```text
Babel positive: FAIL -> []
Babel negative: PASS -> []
Cronus positive: FAIL -> []
Cronus negative: PASS -> []
Orpheus positive: PASS -> Orpheus and Eurydice
Eros/Psyche positive: FAIL -> []
Demeter positive: PASS -> Demeter and Persephone
```

Implication:

- the new Babel record did not overfire on the solitary-tower negative
- the new Cronus record did not overfire on ordinary father conflict
- but both new records were not operationally reachable on their canonical positives
- the revised `greek.psyche_eros` record also lost its canonical positive control

## 9. Fresh baseline `1.2.0` vs candidate `1.3.0` on the five reviewed dreams

Comparison conditions:

```text
same five complete raw dreams
5 fresh uncached runs per fixture
same model/provider
temperature 0
schema 13
raw-dream-only
debug off
```

### Fixture 1 — Theatre / lost beloved

Baseline:

```text
4/5 Orpheus
1/5 []
0 unrelated myths
```

Candidate:

```text
4/5 Orpheus
1/5 []
0 unrelated myths
```

Verdict:

```text
stable
```

### Fixture 2 — Apartment / route-less bus

Baseline:

```text
3/5 []
1/5 Night Journey
1/5 Odysseus
```

Candidate:

```text
5/5 []
```

Verdict:

```text
improved on myth precision
Guide archetype residual remains out of scope
```

### Fixture 3 — Underground child / divided spring

Baseline:

```text
4/5 Eros and Psyche
1/5 Izanagi and Izanami
0/5 Demeter and Persephone
```

Candidate:

```text
4/5 Demeter and Persephone
1/5 []
0/5 Eros and Psyche
0/5 Sleeping Beauty
0/5 Six Swans
0/5 Izanagi and Izanami
```

Verdict:

```text
major improvement
accepted on the reviewed Persephone fixture
```

### Fixture 4 — Tower / voice / collective song

Baseline:

```text
1/5 []
1/5 Eros and Psyche
1/5 Amaterasu
1/5 Tawhaki
1/5 Rapunzel
0/5 Babel
```

Candidate:

```text
2/5 []
1/5 Rapunzel
1/5 Night Journey and Ascension
1/5 Nachiketa and Yama
0/5 Babel
```

Verdict:

```text
not accepted
new Babel record still unreachable
unrelated myths remain common
```

### Fixture 5 — Father / crown / chained lion

Baseline:

```text
1/5 []
1/5 Odysseus
2/5 Heracles and the Capture of Cerberus
1/5 Phaethon
0/5 Cronus
```

Candidate:

```text
2/5 []
1/5 Demeter and Persephone
2/5 Ariadne and the Cretan Labyrinth
0/5 Cronus
```

Verdict:

```text
not accepted
new Cronus record still unreachable
unrelated myths remain common
```

## 10. Dream Fabric and archetype spillover report

Important limitation:

- the preexisting reviewed-dream runner persisted post-validation echo layers and archetype/amplification outputs
- it did not persist the full raw Dream Fabric fields or `display_distillation`
- therefore this packet can report observed archetype spillover exactly, but cannot claim a complete field-by-field Dream Fabric diff from the existing captured artifacts

Observed spillover in captured layers:

```text
Orpheus fixture: archetypes stayed stable at Guide / Psychopomp + Lover in all 5 baseline and all 5 candidate runs

Bus fixture: myths improved to 5/5 empty, but Guide / Psychopomp residual remained on 2/5 candidate runs and 1/5 baseline run

Persephone fixture: myth layer improved strongly; archetypes became slightly less pair-stable than baseline
baseline preferred pair pass: 3/5
candidate preferred pair pass: 2/5

Tower fixture: archetypes stayed broadly the same (Guide / Psychopomp + Divine Child dominated), while myth errors remained unresolved

Father/lion fixture: archetype spillover worsened
baseline required Father pass: 3/5
candidate required Father pass: 1/5
candidate skewed more heavily toward Hero-only readings
```

Operational interpretation:

- the catalog-only candidate produced clear myth-layer improvement on the Persephone reviewed dream and on the myth precision of the bus negative
- but it also coincided with worse archetype behavior on the father/lion fixture
- because the runner did not persist full Dream Fabric fields, a complete `display_distillation` / `symbols` / `motifs` / `thresholds` spillover audit is still outstanding if this line is revised and re-benchmarked

## 11. Stop-condition outcome

Stop conditions triggered:

```text
canonical Eros/Psyche positive breaks
new Babel positive is not reachable
new Cronus positive is not reachable
unrelated myths remain common in the tower reviewed fixture
unrelated myths remain common in the father/lion reviewed fixture
```

Stop conditions not triggered:

```text
Orpheus reviewed positive did not weaken
Demeter reviewed target improved materially
apartment/bus no longer receives myths
Babel negative does not overfire
Cronus negative does not overfire
runtime consistency guard passed
generated enums and compact index stayed aligned
prompt-token growth stayed below the hard 10k compact ceiling
```

## 12. Final recommendation

Recommendation:

```text
revise candidate
```

Do not:

```text
deploy 1.3.0
create M3
begin motif_manifestations work
```

Why the candidate is not deployable yet:

```text
The candidate fixed the reviewed Persephone miss and cleaned the bus negative myth layer.
But the new Babel and Cronus records are still not reachable on their canonical positives.
The revised Eros/Psyche record also lost its own canonical positive.
Tower and father/lion reviewed fixtures still produce unrelated myths too often.
```

Most likely second-stage follow-up, narrowly scoped:

```text
1. Increase reachability of hebrew_bible.tower_babel without weakening the solitary-tower negative.
2. Increase reachability of greek.cronus_devouring_children without weakening the ordinary father-conflict negative.
3. Restore the canonical Eros/Psyche positive without reopening the Persephone false match.
4. Re-run the same controls and the same five reviewed dreams.
5. Persist full Dream Fabric fields in the benchmark artifact before the next rerun so spillover can be audited completely.
```
