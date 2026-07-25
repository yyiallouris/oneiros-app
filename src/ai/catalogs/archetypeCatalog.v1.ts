/**
 * Operational archetype catalog v1 — machine-readable definitions for all whitelist labels.
 * Canonical labels must stay aligned with src/constants/archetypes.ts.
 */

export type ArchetypeLineage = 'core-jungian' | 'post-jungian' | 'archetypal-figure' | 'process';
export type ArchetypeTier = 'A' | 'B' | 'C';
export type ArchetypeCarrierType = 'figure' | 'relationship' | 'field' | 'process';

export type ArchetypeDefinition = {
  id: string;
  canonicalLabel: string;
  lineage: ArchetypeLineage;
  tier: ArchetypeTier;
  carrierTypes: ArchetypeCarrierType[];
  definition: string;
  requiredSignals: string[];
  supportingSignals: string[];
  insufficientSignals: string[];
  contraindications: string[];
  competingArchetypes: string[];
};

export const ARCHETYPE_CATALOG_V1: ArchetypeDefinition[] = [
  {
    id: 'self',
    canonicalLabel: 'Self',
    lineage: 'core-jungian',
    tier: 'A',
    carrierTypes: ['field', 'process', 'figure'],
    definition: 'The organizing centre of the psyche — wholeness, mandala-like order, or a figure that unifies opposing movements.',
    requiredSignals: ['organizing_wholeness_or_unifying_centre'],
    supportingSignals: ['mandala_or_centre_image', 'reconciliation_of_opposites', 'numinous_ordering'],
    insufficientSignals: ['positive_feeling_alone', 'wise_advice_alone', 'any_spiritual_symbol'],
    contraindications: ['fragmented_field_without_unifying_movement'],
    competingArchetypes: ['Ego', 'Wise Old Man', 'Wise Old Woman'],
  },
  {
    id: 'ego',
    canonicalLabel: 'Ego',
    lineage: 'core-jungian',
    tier: 'A',
    carrierTypes: ['figure', 'process'],
    definition: 'The dream-ego or conscious centre of agency — the I that acts, refuses, chooses, or narrates.',
    requiredSignals: ['conscious_agency_or_dream_ego_stance'],
    supportingSignals: ['deliberate_choice', 'self_observation', 'identity_maintenance'],
    insufficientSignals: ['any_first_person_presence', 'ordinary_protagonist_without_stance'],
    contraindications: ['purely_passive_witness_with_no_agency_conflict'],
    competingArchetypes: ['Self', 'Persona'],
  },
  {
    id: 'shadow',
    canonicalLabel: 'Shadow',
    lineage: 'core-jungian',
    tier: 'A',
    carrierTypes: ['figure', 'relationship', 'field'],
    definition: 'Excluded, disowned, neglected, or morally rejected qualities kept outside accepted identity.',
    requiredSignals: ['excluded_or_disowned_role'],
    supportingSignals: ['moral_rejection', 'neglected_other', 'feared_instinct', 'bound_or_hidden_counterpart'],
    insufficientSignals: ['darkness_alone', 'danger_alone', 'animal_form_alone', 'underground_alone', 'frightening_atmosphere'],
    contraindications: ['integrated_ally_without_disowning_dynamic'],
    competingArchetypes: ['Double', 'Death–Rebirth', 'Trickster'],
  },
  {
    id: 'persona',
    canonicalLabel: 'Persona',
    lineage: 'core-jungian',
    tier: 'A',
    carrierTypes: ['figure', 'relationship', 'process'],
    definition: 'A social mask, role, or adapted face presented to others — often tense with a more private self.',
    requiredSignals: ['social_mask_or_adapted_role'],
    supportingSignals: ['performance_for_others', 'costume_or_title_as_identity', 'public_vs_private_split'],
    insufficientSignals: ['any_clothing', 'any_job_title', 'being_in_public'],
    contraindications: ['authentic_private_encounter_without_role_pressure'],
    competingArchetypes: ['Ego', 'Ruler', 'Lover'],
  },
  {
    id: 'anima',
    canonicalLabel: 'Anima',
    lineage: 'core-jungian',
    tier: 'A',
    carrierTypes: ['figure', 'relationship'],
    definition: 'A soul-image or mediating feminine figure that draws the dreamer toward relatedness, depth, or inner life.',
    requiredSignals: ['mediating_soul_image_or_relatedness_pull'],
    supportingSignals: ['guides_inward', 'erotic_or_soulful_charge', 'bridges_conscious_and_unconscious'],
    insufficientSignals: ['any_female_figure', 'attractiveness_alone', 'mother_role_alone'],
    contraindications: ['purely_maternal_or_terrible_mother_dynamic_without_soul_mediation'],
    competingArchetypes: ['Great Mother', 'Terrible Mother', 'Lover', 'Animus'],
  },
  {
    id: 'animus',
    canonicalLabel: 'Animus',
    lineage: 'core-jungian',
    tier: 'A',
    carrierTypes: ['figure', 'relationship'],
    definition: 'A mediating masculine soul-image associated with logos, conviction, discrimination, or directed spirit.',
    requiredSignals: ['mediating_masculine_soul_image_or_logos_pull'],
    supportingSignals: ['opinionated_inner_voice', 'directed_discrimination', 'bridges_to_meaning_or_spirit'],
    insufficientSignals: ['any_male_figure', 'authority_alone', 'father_role_alone'],
    contraindications: ['mere_external_authority_without_inner_mediation'],
    competingArchetypes: ['Wise Old Man', 'Hero', 'Ruler', 'Anima'],
  },
  {
    id: 'divine_child',
    canonicalLabel: 'Divine Child',
    lineage: 'archetypal-figure',
    tier: 'B',
    carrierTypes: ['figure'],
    definition: 'A child/infant configuration that organizes renewal, vulnerable future, or decisive transformation.',
    requiredSignals: ['active_structural_agency', 'future_bearing_or_renewal'],
    supportingSignals: ['changes_dream_field', 'organizes_decision', 'unusual_autonomy', 'protected_or_contested_centrally'],
    insufficientSignals: ['literal_child_only', 'brief_memory', 'background_image', 'childhood_injury_only'],
    contraindications: ['child_is_incidental_scenery'],
    competingArchetypes: ['Orphan'],
  },
  {
    id: 'great_mother',
    canonicalLabel: 'Great Mother',
    lineage: 'archetypal-figure',
    tier: 'B',
    carrierTypes: ['figure', 'field', 'relationship'],
    definition: 'A nurturing, containing, fertile maternal matrix that supports growth or belonging.',
    requiredSignals: ['maternal_containing_or_nourishing_function'],
    supportingSignals: ['shelter', 'feeding', 'fertile_ground', 'protective_embrace'],
    insufficientSignals: ['any_mother', 'any_woman', 'house_alone', 'food_alone'],
    contraindications: ['engulfing_or_devouring_dynamic_without_nourishment'],
    competingArchetypes: ['Terrible Mother', 'Anima'],
  },
  {
    id: 'terrible_mother',
    canonicalLabel: 'Terrible Mother',
    lineage: 'archetypal-figure',
    tier: 'B',
    carrierTypes: ['figure', 'relationship'],
    definition: 'A maternal configuration that engulfes, possesses, or regressively binds.',
    requiredSignals: ['maternal_function', 'engulfing_or_possessive_or_regressive_dynamic'],
    supportingSignals: ['devouring_care', 'binding_dependency', 'refusal_of_separation'],
    insufficientSignals: ['powerful_woman', 'underworld_queen', 'death_authority', 'older_woman', 'punishment_or_deprivation_alone'],
    contraindications: ['non_maternal_authority_only'],
    competingArchetypes: ['Great Mother', 'Ruler'],
  },
  {
    id: 'wise_old_man',
    canonicalLabel: 'Wise Old Man',
    lineage: 'archetypal-figure',
    tier: 'B',
    carrierTypes: ['figure'],
    definition: 'An elder masculine wisdom figure offering orientation, meaning, or initiatory knowledge.',
    requiredSignals: ['elder_wisdom_function'],
    supportingSignals: ['initiates_or_orients', 'transmits_knowledge', 'appears_at_threshold'],
    insufficientSignals: ['any_old_man', 'any_teacher', 'advice_without_wisdom_charge'],
    contraindications: ['mere_bureaucratic_authority'],
    competingArchetypes: ['Guide / Psychopomp', 'Animus', 'Ruler'],
  },
  {
    id: 'wise_old_woman',
    canonicalLabel: 'Wise Old Woman',
    lineage: 'archetypal-figure',
    tier: 'B',
    carrierTypes: ['figure'],
    definition: 'An elder feminine wisdom figure offering orientation, craft, fate-knowledge, or initiatory counsel.',
    requiredSignals: ['elder_feminine_wisdom_function'],
    supportingSignals: ['initiates_or_orients', 'craft_or_fate_knowledge', 'appears_at_threshold'],
    insufficientSignals: ['any_old_woman', 'grandmother_role_alone', 'advice_without_wisdom_charge'],
    contraindications: ['mere_domestic_elder_without_numinous_function'],
    competingArchetypes: ['Guide / Psychopomp', 'Great Mother', 'Anima'],
  },
  {
    id: 'hero',
    canonicalLabel: 'Hero',
    lineage: 'archetypal-figure',
    tier: 'B',
    carrierTypes: ['figure', 'process'],
    definition: 'An ego-strengthening questing figure that confronts an ordeal to win a boon or crossing.',
    requiredSignals: ['quest_or_ordeal_agency'],
    supportingSignals: ['combat_or_trial', 'rescue_mission', 'earns_crossing_or_boon'],
    insufficientSignals: ['any_courage', 'any_journey', 'winning_an_argument'],
    contraindications: ['passive_victim_without_agency'],
    competingArchetypes: ['Ego', 'Orphan', 'Death–Rebirth'],
  },
  {
    id: 'trickster',
    canonicalLabel: 'Trickster',
    lineage: 'archetypal-figure',
    tier: 'B',
    carrierTypes: ['figure', 'process'],
    definition: 'A boundary-crossing disruptor that inverts order, exposes hypocrisy, or creates possibility through cunning.',
    requiredSignals: ['boundary_crossing_disruption_or_cunning_inversion'],
    supportingSignals: ['rule_breaking', 'comic_or_chaotic_reversal', 'exposes_false_order'],
    insufficientSignals: ['any_liar', 'any_joke', 'any_animal'],
    contraindications: ['pure_villainy_without_liminal_function'],
    competingArchetypes: ['Shadow', 'Guide / Psychopomp'],
  },
  {
    id: 'guide_psychopomp',
    canonicalLabel: 'Guide / Psychopomp',
    lineage: 'archetypal-figure',
    tier: 'B',
    carrierTypes: ['figure', 'relationship'],
    definition: 'A figure that meaningfully leads between psychic grounds, thresholds, realms, or modes of awareness.',
    requiredSignals: ['actual_crossing', 'active_guidance_across_realms'],
    supportingSignals: ['threshold_escort', 'changes_mode_of_awareness'],
    insufficientSignals: ['offers_transport_only', 'gives_advice_only', 'missed_departure', 'does_not_know_route', 'guards_entry_without_guiding'],
    contraindications: ['mere_helper_or_companion'],
    competingArchetypes: ['Divine Child', 'Wise Old Man', 'Wise Old Woman'],
  },
  {
    id: 'double',
    canonicalLabel: 'Double',
    lineage: 'archetypal-figure',
    tier: 'B',
    carrierTypes: ['figure', 'relationship'],
    definition: 'A rival, substitute, or split-off self that occupies or competes for the dreamer\'s place, role, identity, or agency.',
    requiredSignals: ['identity_competition_or_substitution'],
    supportingSignals: ['occupies_dreamer_place', 'claims_possession_or_recognition', 'split_counterpart'],
    insufficientSignals: ['shared_face_or_eyes_only', 'mirror_resemblance_only', 'vague_familiarity'],
    contraindications: ['bound_or_neglected_other_without_rivalry'],
    competingArchetypes: ['Shadow', 'Death–Rebirth'],
  },
  {
    id: 'orphan',
    canonicalLabel: 'Orphan',
    lineage: 'post-jungian',
    tier: 'C',
    carrierTypes: ['figure', 'relationship', 'process'],
    definition: 'Abandonment, exile, or lack of belonging that organizes the dream\'s emotional centre.',
    requiredSignals: ['abandonment_or_exile_as_central_organizer'],
    supportingSignals: ['search_for_home', 'rejected_by_kin', 'alone_without_protection'],
    insufficientSignals: ['brief_loneliness', 'any_child', 'missing_one_parent_incidentally'],
    contraindications: ['secure_belonging_without_exile_theme'],
    competingArchetypes: ['Divine Child', 'Hero'],
  },
  {
    id: 'lover',
    canonicalLabel: 'Lover',
    lineage: 'post-jungian',
    tier: 'C',
    carrierTypes: ['figure', 'relationship'],
    definition: 'Erotic or devoted relatedness that organizes desire, union, or heart-risk at the dream\'s centre.',
    requiredSignals: ['erotic_or_devotional_relatedness_as_central_organizer'],
    supportingSignals: ['union_or_longing', 'heart_risk', 'choosing_the_beloved'],
    insufficientSignals: ['any_romance_cue', 'attractiveness_alone', 'wedding_scenery_alone'],
    contraindications: ['purely_political_marriage_without_erotic_or_devotional_charge'],
    competingArchetypes: ['Anima', 'Animus', 'Sacred Marriage', 'Persona'],
  },
  {
    id: 'ruler',
    canonicalLabel: 'Ruler',
    lineage: 'post-jungian',
    tier: 'C',
    carrierTypes: ['figure'],
    definition: 'An embodied sovereign or sustained ruling function that organizes the dream field through authority.',
    requiredSignals: ['embodied_sovereign_or_sustained_ruling_function'],
    supportingSignals: ['commands_obedience', 'holds_throne_or_court_as_active_agent'],
    insufficientSignals: ['institution_alone', 'guards_or_audience_alone', 'ceremonial_setting_alone', 'title_without_agency'],
    contraindications: ['passive_institutional_backdrop'],
    competingArchetypes: ['Persona', 'Terrible Mother', 'Wise Old Man'],
  },
  {
    id: 'death_rebirth',
    canonicalLabel: 'Death–Rebirth',
    lineage: 'process',
    tier: 'B',
    carrierTypes: ['process', 'field', 'figure'],
    definition: 'A dying-and-becoming sequence: dissolution, loss of old form, and emergence of a new psychic state.',
    requiredSignals: ['dissolution_and_emergent_renewal_sequence'],
    supportingSignals: ['dismemberment_or_stripping', 'burial_or_descent', 'return_in_new_form'],
    insufficientSignals: ['death_image_alone', 'sadness_alone', 'any_change', 'night_falling'],
    contraindications: ['static_threat_without_transformative_arc'],
    competingArchetypes: ['Shadow', 'Divine Child', 'Hero'],
  },
  {
    id: 'sacred_marriage',
    canonicalLabel: 'Sacred Marriage',
    lineage: 'process',
    tier: 'B',
    carrierTypes: ['relationship', 'process', 'figure'],
    definition: 'Hieros gamos — a union of opposing principles that creates a new psychic wholeness.',
    requiredSignals: ['union_of_opposing_principles'],
    supportingSignals: ['ritual_or_numinous_coupling', 'reconciliation_producing_new_third', 'inner_marriage_imagery'],
    insufficientSignals: ['ordinary_wedding', 'romance_alone', 'any_couple'],
    contraindications: ['mere_social_ceremony_without_opposites_united'],
    competingArchetypes: ['Lover', 'Self', 'Anima', 'Animus'],
  },
];

export function getArchetypeDefinitionV1(canonicalLabel: string): ArchetypeDefinition | undefined {
  const key = canonicalLabel.replace(/^\s*The\s+/i, '').trim().toLowerCase();
  return ARCHETYPE_CATALOG_V1.find((d) => d.canonicalLabel.toLowerCase() === key);
}

export function formatArchetypeHardGatesForPromptV1(): string {
  return ARCHETYPE_CATALOG_V1.map((d) => {
    return [
      `${d.canonicalLabel} (tier ${d.tier} / ${d.lineage}):`,
      `  required: ${d.requiredSignals.join('; ')}`,
      `  insufficient alone: ${d.insufficientSignals.join('; ')}`,
    ].join('\n');
  }).join('\n');
}

/** Assert catalog covers every whitelist label (used by tests). */
export function archetypeCatalogLabels(): string[] {
  return ARCHETYPE_CATALOG_V1.map((d) => d.canonicalLabel);
}
