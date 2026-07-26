/**
 * Operational archetype catalog v1 — machine-readable definitions for selection.
 * Canonical labels must stay aligned with src/constants/archetypes.ts.
 * `kind` / operational fields guide the model; `displayLabel` is user-facing.
 */

export type ArchetypeKind =
  | 'psychic_structure'
  | 'archetypal_figure'
  | 'relational_role'
  | 'transformational_pattern';

export type ArchetypeDefinition = {
  id: string;
  canonicalLabel: string;
  /** Exact UI title — do not auto-prefix "The". */
  displayLabel: string;
  kind: ArchetypeKind;
  /** What the pattern primarily does in a dream (compact). */
  coreFunction: string;
  /** Positive selection cues (compact phrases). */
  selectWhen: string[];
  /** Common false positives — not enough alone. */
  insufficientWhen: string[];
  /** Nearby labels that often compete for the same carrier. */
  competingLabels: string[];
};

export const ARCHETYPE_CATALOG_V1: ArchetypeDefinition[] = [
  {
    id: 'self',
    canonicalLabel: 'Self',
    displayLabel: 'Self',
    kind: 'psychic_structure',
    coreFunction: 'Organizing centre of the psyche — wholeness or a unifying order that gathers opposing movements.',
    selectWhen: [
      'a centre, mandala, or figure unifies opposing movements',
      'numinous ordering reshapes the whole field',
      'reconciliation produces a new whole rather than a local truce',
    ],
    insufficientWhen: ['positive feeling alone', 'wise advice alone', 'any spiritual symbol'],
    competingLabels: ['Ego', 'Wise Old Man', 'Wise Old Woman'],
  },
  {
    id: 'ego',
    canonicalLabel: 'Ego',
    displayLabel: 'Ego',
    kind: 'psychic_structure',
    coreFunction: 'Conscious centre of agency — the dream-I that chooses, refuses, observes, or maintains identity.',
    selectWhen: [
      'deliberate choice or refusal organizes the scene',
      'self-observation or identity maintenance is the structural issue',
      'agency stance is contested or newly claimed',
    ],
    insufficientWhen: ['any first-person presence', 'ordinary protagonist without stance conflict'],
    competingLabels: ['Self', 'Persona', 'Hero'],
  },
  {
    id: 'shadow',
    canonicalLabel: 'Shadow',
    displayLabel: 'Shadow',
    kind: 'psychic_structure',
    coreFunction: 'Excluded, disowned, neglected, or morally rejected qualities kept outside accepted identity.',
    selectWhen: [
      'a rejected or neglected counterpart carries disowned force',
      'moral rejection or hidden instinct presses for recognition',
      'the excluded other organizes more than one phase of the dream',
    ],
    insufficientWhen: ['darkness alone', 'danger alone', 'animal form alone', 'frightening atmosphere'],
    competingLabels: ['Double', 'Trickster', 'Death–Rebirth'],
  },
  {
    id: 'persona',
    canonicalLabel: 'Persona',
    displayLabel: 'Persona',
    kind: 'psychic_structure',
    coreFunction: 'Social mask or adapted role presented to others — often tense with a more private self.',
    selectWhen: [
      'performance for others or costume/title as identity is central',
      'public vs private split organizes action',
      'adapted role pressure changes belonging or agency',
    ],
    insufficientWhen: ['any clothing', 'any job title', 'being in public'],
    competingLabels: ['Ego', 'Ruler', 'Lover'],
  },
  {
    id: 'anima',
    canonicalLabel: 'Anima',
    displayLabel: 'Anima',
    kind: 'psychic_structure',
    coreFunction:
      'Mediating soul-image that opens relation between the dream-ego and autonomous imaginal, relational, or unknown psychic life.',
    selectWhen: [
      'a figure mediates ego and unknown inner/relational life',
      'the encounter redirects inward belonging or desire with autonomy',
      'no better catalog pattern (Lover, Guide, Shadow, known person) fits the function',
    ],
    insufficientWhen: [
      'presence of a woman alone',
      'attraction or romance alone',
      'mystery or beauty alone',
      'mother role alone',
      'assumed from dreamer sex/gender',
    ],
    competingLabels: ['Great Mother', 'Terrible Mother', 'Lover', 'Animus', 'Guide / Psychopomp'],
  },
  {
    id: 'animus',
    canonicalLabel: 'Animus',
    displayLabel: 'Animus',
    kind: 'psychic_structure',
    coreFunction:
      'Mediating soul-image associated with directed discrimination, conviction, or spirit that opens unknown psychic life to the ego.',
    selectWhen: [
      'a figure mediates ego and logos/spirit/unknown inner direction',
      'autonomous conviction or discrimination redirects the dream-ego',
      'no better catalog pattern (Hero, Guide, Ruler, known person) fits the function',
    ],
    insufficientWhen: [
      'presence of a man alone',
      'authority alone',
      'father role alone',
      'assumed from dreamer sex/gender',
    ],
    competingLabels: ['Wise Old Man', 'Hero', 'Ruler', 'Anima'],
  },
  {
    id: 'divine_child',
    canonicalLabel: 'Divine Child',
    displayLabel: 'The Divine Child',
    kind: 'archetypal_figure',
    coreFunction: 'Child/infant configuration that carries renewal, vulnerable future, or decisive transformation.',
    selectWhen: [
      'the child actively changes the main action or field',
      'future-bearing renewal is contested or protected centrally',
      'unusual autonomy organizes decisions around the child',
    ],
    insufficientWhen: ['literal child only', 'brief memory', 'background image', 'childhood injury only'],
    competingLabels: ['Orphan'],
  },
  {
    id: 'great_mother',
    canonicalLabel: 'Great Mother',
    displayLabel: 'The Great Mother',
    kind: 'archetypal_figure',
    coreFunction: 'Nurturing, containing, fertile maternal matrix that supports growth or belonging.',
    selectWhen: [
      'maternal containing or nourishing organizes the field',
      'shelter, feeding, or fertile ground is the structural gift',
      'protective embrace enables growth rather than binding',
    ],
    insufficientWhen: ['any mother', 'any woman', 'house alone', 'food alone'],
    competingLabels: ['Terrible Mother', 'Anima'],
  },
  {
    id: 'terrible_mother',
    canonicalLabel: 'Terrible Mother',
    displayLabel: 'The Terrible Mother',
    kind: 'archetypal_figure',
    coreFunction: 'Maternal configuration that engulfs, possesses, or regressively binds.',
    selectWhen: [
      'maternal function binds, engulfs, or refuses separation',
      'devouring care or possessive holding organizes the conflict',
      'regressive pull prevents crossing or growth',
    ],
    insufficientWhen: ['powerful woman', 'underworld queen', 'older woman', 'punishment alone'],
    competingLabels: ['Great Mother', 'Ruler'],
  },
  {
    id: 'wise_old_man',
    canonicalLabel: 'Wise Old Man',
    displayLabel: 'The Wise Old Man',
    kind: 'archetypal_figure',
    coreFunction: 'Elder masculine wisdom offering orientation, meaning, or initiatory knowledge.',
    selectWhen: [
      'elder wisdom orients at a threshold',
      'knowledge transmission changes the dream-ego’s path',
      'numinous counsel exceeds ordinary advice',
    ],
    insufficientWhen: ['any old man', 'any teacher', 'advice without wisdom charge'],
    competingLabels: ['Guide / Psychopomp', 'Animus', 'Ruler'],
  },
  {
    id: 'wise_old_woman',
    canonicalLabel: 'Wise Old Woman',
    displayLabel: 'The Wise Old Woman',
    kind: 'archetypal_figure',
    coreFunction: 'Elder feminine wisdom offering orientation, craft, fate-knowledge, or initiatory counsel.',
    selectWhen: [
      'elder feminine wisdom orients at a threshold',
      'craft or fate-knowledge changes the path',
      'numinous counsel exceeds ordinary domestic advice',
    ],
    insufficientWhen: ['any old woman', 'grandmother role alone', 'advice without wisdom charge'],
    competingLabels: ['Guide / Psychopomp', 'Great Mother', 'Anima'],
  },
  {
    id: 'hero',
    canonicalLabel: 'Hero',
    displayLabel: 'The Hero',
    kind: 'archetypal_figure',
    coreFunction: 'Ego-strengthening questing agency that confronts an ordeal to win a boon or crossing.',
    selectWhen: [
      'quest or ordeal agency organizes the movement',
      'trial, combat, or rescue earns a crossing or boon',
      'courageous agency is the structural function, not mere action',
    ],
    insufficientWhen: ['any courage', 'any journey', 'dreamer takes any action'],
    competingLabels: ['Ego', 'Orphan', 'Death–Rebirth'],
  },
  {
    id: 'trickster',
    canonicalLabel: 'Trickster',
    displayLabel: 'The Trickster',
    kind: 'archetypal_figure',
    coreFunction:
      'Boundary-crossing disruption that inverts order, exposes false structure, or opens possibility through cunning — as figure or mode of action.',
    selectWhen: [
      'rules are inverted or boundaries crossed with cunning',
      'comic or chaotic reversal exposes false order',
      'disruption creates a new possibility rather than mere villainy',
    ],
    insufficientWhen: ['any liar', 'any joke', 'anything strange or confusing'],
    competingLabels: ['Shadow', 'Guide / Psychopomp'],
  },
  {
    id: 'guide_psychopomp',
    canonicalLabel: 'Guide / Psychopomp',
    displayLabel: 'The Guide / Psychopomp',
    kind: 'relational_role',
    coreFunction: 'Leads meaningfully between psychic grounds, thresholds, realms, or modes of awareness.',
    selectWhen: [
      'active guidance across a real crossing or realm-shift',
      'threshold escort changes mode of awareness',
      'guidance is structural, not mere companionship',
    ],
    insufficientWhen: ['offers transport only', 'gives advice only', 'missed departure', 'guards without guiding'],
    competingLabels: ['Divine Child', 'Wise Old Man', 'Wise Old Woman'],
  },
  {
    id: 'double',
    canonicalLabel: 'Double',
    displayLabel: 'The Double',
    kind: 'relational_role',
    coreFunction: 'Rival, substitute, or split-off self competing for the dreamer’s place, role, identity, or agency.',
    selectWhen: [
      'identity competition, substitution, or rivalry for the dreamer’s place',
      'a counterpart occupies or claims the dreamer’s recognition',
      'split agency is the organizing conflict',
    ],
    insufficientWhen: ['shared face or eyes only', 'mirror resemblance only', 'vague familiarity'],
    competingLabels: ['Shadow', 'Death–Rebirth'],
  },
  {
    id: 'orphan',
    canonicalLabel: 'Orphan',
    displayLabel: 'The Orphan',
    kind: 'archetypal_figure',
    coreFunction: 'Abandonment, exile, or lack of belonging that organizes the dream’s emotional centre.',
    selectWhen: [
      'exile or abandonment organizes the centre',
      'search for home or kin-protection drives movement',
      'aloneness without belonging is structural, not incidental',
    ],
    insufficientWhen: ['brief loneliness', 'any child', 'missing one parent incidentally'],
    competingLabels: ['Divine Child', 'Hero'],
  },
  {
    id: 'lover',
    canonicalLabel: 'Lover',
    displayLabel: 'The Lover',
    kind: 'relational_role',
    coreFunction: 'Erotic or devoted relatedness that organizes desire, union, or heart-risk at the centre.',
    selectWhen: [
      'erotic or devoted relatedness organizes the dream',
      'union, longing, or heart-risk is the structural stake',
      'choosing the beloved changes the field',
    ],
    insufficientWhen: ['any romance cue', 'attractiveness alone', 'wedding scenery alone'],
    competingLabels: ['Anima', 'Animus', 'Sacred Marriage', 'Persona'],
  },
  {
    id: 'ruler',
    canonicalLabel: 'Ruler',
    displayLabel: 'The Ruler',
    kind: 'archetypal_figure',
    coreFunction: 'Embodied sovereign or sustained ruling function that organizes the field through authority.',
    selectWhen: [
      'embodied sovereign agency commands the field',
      'throne, court, or ruling will is actively exercised',
      'authority is personal and structural, not mere backdrop',
    ],
    insufficientWhen: ['institution alone', 'guards or audience alone', 'ceremony alone', 'title without agency'],
    competingLabels: ['Persona', 'Terrible Mother', 'Wise Old Man'],
  },
  {
    id: 'death_rebirth',
    canonicalLabel: 'Death–Rebirth',
    displayLabel: 'Death–Rebirth',
    kind: 'transformational_pattern',
    coreFunction: 'Dying-and-becoming sequence — dissolution of old form and emergence of a new psychic state.',
    selectWhen: [
      'dissolution and emergent renewal form a sequence',
      'stripping, burial, or descent precedes return in new form',
      'the ending is transformative, not merely sad or threatening',
    ],
    insufficientWhen: ['death image alone', 'any change', 'departure or arrival alone', 'night falling'],
    competingLabels: ['Shadow', 'Divine Child', 'Hero'],
  },
  {
    id: 'sacred_marriage',
    canonicalLabel: 'Sacred Marriage',
    displayLabel: 'Sacred Marriage',
    kind: 'transformational_pattern',
    coreFunction: 'Hieros gamos — union of opposing principles that creates a new psychic third/wholeness.',
    selectWhen: [
      'opposing principles unite into a new third',
      'ritual or numinous coupling reconciles a structural split',
      'inner marriage imagery produces wholeness, not mere romance',
    ],
    insufficientWhen: ['ordinary wedding', 'romance alone', 'any couple'],
    competingLabels: ['Lover', 'Self', 'Anima', 'Animus'],
  },
];

export function getArchetypeDefinitionV1(canonicalLabel: string): ArchetypeDefinition | undefined {
  const key = canonicalLabel.replace(/^\s*The\s+/i, '').trim().toLowerCase();
  return ARCHETYPE_CATALOG_V1.find((d) => d.canonicalLabel.toLowerCase() === key);
}

/** Exact Dream Detail / essay title from catalog; never auto-prefix "The". */
export function getArchetypeDisplayLabel(canonicalLabel: string): string {
  const def = getArchetypeDefinitionV1(canonicalLabel);
  if (def) return def.displayLabel;
  const trimmed = canonicalLabel.trim();
  return trimmed;
}

/**
 * Compact operational block injected into dream_extraction.
 * Keeps positive definitions in the catalog, not scattered hard gates.
 */
export function formatArchetypeCatalogForPromptV1(): string {
  return ARCHETYPE_CATALOG_V1.map((d) => {
    return [
      `- ${d.canonicalLabel} [${d.kind}] UI:"${d.displayLabel}"`,
      `  function: ${d.coreFunction}`,
      `  select when: ${d.selectWhen.join('; ')}`,
      `  insufficient: ${d.insufficientWhen.join('; ')}`,
      `  competes with: ${d.competingLabels.join(', ')}`,
    ].join('\n');
  }).join('\n');
}

/** @deprecated Prefer formatArchetypeCatalogForPromptV1 — kept for import compatibility. */
export function formatArchetypeHardGatesForPromptV1(): string {
  return formatArchetypeCatalogForPromptV1();
}

/** Assert catalog covers every whitelist label (used by tests). */
export function archetypeCatalogLabels(): string[] {
  return ARCHETYPE_CATALOG_V1.map((d) => d.canonicalLabel);
}
