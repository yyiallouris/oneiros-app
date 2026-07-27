/**
 * Operational archetype catalog v1 — machine-readable definitions for selection.
 * Canonical labels must stay aligned with src/constants/archetypes.ts.
 * `kind` / operational fields guide the model; `displayLabel` is user-facing.
 * v4.1.4: single `trickster` id (B.2 carrier-scoped variants frozen as non-production experiment).
 * v1.7.0: polarity-neutral `mother` + `father` (replaces selectable great_mother / terrible_mother).
 * Polarity (nurturing/devouring, protective/tyrannical, etc.) lives in instance-level `expression`.
 */

import {
  ARCHETYPE_MECHANISM_HARD_GATES,
  formatHardGateForPrompt,
  type ArchetypeCarrierKind,
} from '../archetypeMechanisms.ts';

export const ARCHETYPE_CATALOG_VERSION = '1.7.0' as const;

/** Legacy selectable ids → current catalog id (read/validate canonicalize). */
export const ARCHETYPE_ID_ALIASES: Readonly<Record<string, string>> = {
  great_mother: 'mother',
  terrible_mother: 'mother',
};

export function canonicalizeArchetypeId(archetypeId: string): string {
  const key = archetypeId.trim();
  if (!key) return key;
  return ARCHETYPE_ID_ALIASES[key] ?? key;
}

export type ArchetypeKind =
  | 'psychic_structure'
  | 'archetypal_figure'
  | 'archetypal_function'
  | 'relational_role'
  | 'transformational_pattern';

export type ArchetypeDefinition = {
  id: string;
  canonicalLabel: string;
  /** Exact UI title — do not auto-prefix "The". */
  displayLabel: string;
  kind: ArchetypeKind;
  /**
   * When false, omit from dream_extraction catalog injection / selectable Echoes.
   * Ego remains in the wider catalog for structural reading but is never a user-facing echo.
   */
  selectableAsEcho?: boolean;
  /** What the pattern primarily does in a dream (compact). */
  coreFunction: string;
  /** Positive selection cues (compact phrases). */
  selectWhen: string[];
  /** Common false positives — not enough alone. */
  insufficientWhen: string[];
  /** Nearby labels that often compete for the same carrier. */
  competingLabels: string[];
  /** Fixed carrier for carrier-scoped catalog variants (model selects by archetype_id). */
  carrierKind?: ArchetypeCarrierKind;
  /** Compact function line for carrier-scoped prompt index entries. */
  functionSignature?: string;
  /** Prompt-facing anti-features for carrier-scoped variants. */
  promptAntiFeatures?: string[];
  /** Lower wins when collapsing duplicate canonicalLabel candidates (tie-break after confidence). */
  canonicalVariantPriority?: number;
  /** @deprecated B.2 — use carrierKind on carrier-scoped records instead. */
  allowedCarrierKinds?: ArchetypeCarrierKind[];
  /** @deprecated B.2 — use carrierKind on carrier-scoped records instead. */
  preferredCarrierKinds?: ArchetypeCarrierKind[];
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
    selectableAsEcho: false,
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
    insufficientWhen: [
      'darkness alone',
      'danger alone',
      'animal form alone',
      'frightening atmosphere',
      'danger or hostility alone without rejected or disowned psychic content belonging to the dreamer',
    ],
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
    insufficientWhen: [
      'any clothing',
      'any job title',
      'being in public',
      'ordinary occupation, uniform, badge, or assigned task without tension between public presentation and private identity',
      'being visible in public without a socially adapted mask governing belonging, recognition, or permissible expression',
      "another figure stealing or occupying the dreamer's identity or role; prefer Double when substitution or rivalry is central",
      'a ceremony, audience, or social setting that merely surrounds a stronger relational or archetypal function',
    ],
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
    competingLabels: ['Mother', 'Father', 'Lover', 'Animus', 'Guide / Psychopomp'],
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
    id: 'mother',
    canonicalLabel: 'Mother',
    displayLabel: 'The Mother',
    kind: 'archetypal_figure',
    coreFunction:
      'Maternal matrix of holding, nourishment, belonging, or binding — polarity (nurturing or devouring) belongs in expression.',
    selectWhen: [
      'maternal containing, nourishing, or binding organizes the field',
      'shelter, feeding, fertile ground, or anti-separation holding is structural',
      'the maternal function changes growth, belonging, or the capacity to leave',
    ],
    insufficientWhen: [
      'any mother',
      'any woman',
      'house alone',
      'food alone',
      'powerful woman alone',
      'underworld queen alone',
    ],
    competingLabels: ['Anima', 'Father', 'Ruler', 'Wise Old Woman'],
  },
  {
    id: 'father',
    canonicalLabel: 'Father',
    displayLabel: 'The Father',
    kind: 'archetypal_figure',
    coreFunction:
      'Paternal principle of authority, law, orientation, or claim on attention — polarity (protective, initiating, absent, or tyrannical) belongs in expression.',
    selectWhen: [
      'paternal authority, law, or orientation organizes the field',
      'a father-figure claims time, attention, psychic space, or consequence',
      'structure, boundary, or paternal demand is the structural function — not mere male presence',
    ],
    insufficientWhen: [
      'any father',
      'any older man',
      'any authority figure',
      'anger alone',
      'rules without paternal claim',
    ],
    competingLabels: ['Ruler', 'Wise Old Man', 'Animus', 'Persona'],
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
    competingLabels: ['Guide / Psychopomp', 'Animus', 'Father', 'Ruler'],
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
    competingLabels: ['Guide / Psychopomp', 'Mother', 'Anima'],
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
    insufficientWhen: [
      'any courage',
      'any journey',
      'dreamer takes any action',
      'ordeal without an achieved crossing, rescue, boon, or changed outcome',
      'effort or persistence alone',
      'ascent without completion or transformation',
      'repeated struggle that restores the starting condition',
      'courage without a structurally changed outcome',
    ],
    competingLabels: ['Ego', 'Orphan', 'Death–Rebirth'],
  },
  {
    id: 'trickster',
    canonicalLabel: 'Trickster',
    displayLabel: 'The Trickster',
    kind: 'archetypal_function',
    coreFunction:
      'Cunning, inversion, deception, or rule-bending that actually changes leverage, exposes false order, or opens a new possibility.',
    selectWhen: [
      'cunning or inversion changes leverage or exposes false structure',
      'deception or feigned belief reverses who holds power',
      'strategic reversal opens a new possibility rather than mere spectacle',
    ],
    insufficientWhen: [
      'lying',
      'shape-shifting',
      'changing promises',
      'humor',
      'chaos or strangeness',
      'rule-breaking without changed leverage',
    ],
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
    insufficientWhen: [
      'shared face or eyes only',
      'mirror resemblance only',
      'vague familiarity',
      'physical resemblance alone without substitution, rivalry, identity displacement, or split agency',
    ],
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
    insufficientWhen: [
      'brief loneliness',
      'any child',
      'missing one parent incidentally',
      'loss or separation alone unless abandonment, exile, or lack of belonging organizes the field',
    ],
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
      'mutual intimacy or chosen closeness is the emotional centre of the dream',
      'two figures share a sustained orientation toward the same psychic depth, future, or field',
      'the bond itself changes how the dream-space can be inhabited, even without conflict or dramatic outcome',
    ],
    insufficientWhen: [
      'any romance cue',
      'attractiveness alone',
      'wedding scenery alone',
      'requiring longing, separation, vow, sacrifice, or transformed social order when gentle closeness already organizes the field',
    ],
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
    competingLabels: ['Persona', 'Mother', 'Father', 'Wise Old Man'],
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

export function getArchetypeDefinitionById(archetypeId: string): ArchetypeDefinition | undefined {
  const key = canonicalizeArchetypeId(archetypeId);
  if (!key) return undefined;
  return ARCHETYPE_CATALOG_V1.find((d) => d.id === key);
}

export function getArchetypeDefinitionV1(canonicalLabel: string): ArchetypeDefinition | undefined {
  const key = canonicalLabel.replace(/^\s*The\s+/i, '').trim().toLowerCase();
  const matches = ARCHETYPE_CATALOG_V1.filter((d) => d.canonicalLabel.toLowerCase() === key);
  if (matches.length === 1) return matches[0];
  return undefined;
}

/** Exact Dream Detail / essay title from catalog; never auto-prefix "The". */
export function getArchetypeDisplayLabel(canonicalLabel: string): string {
  const key = canonicalLabel.replace(/^\s*The\s+/i, '').trim().toLowerCase();
  const matches = ARCHETYPE_CATALOG_V1.filter((d) => d.canonicalLabel.toLowerCase() === key);
  if (matches.length > 0) return matches[0].displayLabel;
  return canonicalLabel.trim();
}

/** Selectable archetype ids injected into dream_extraction (includes carrier-scoped variants). */
export function selectableArchetypeIds(): string[] {
  return ARCHETYPE_CATALOG_V1.filter((d) => d.selectableAsEcho !== false).map((d) => d.id);
}

function formatCarrierScopedArchetypeLine(def: ArchetypeDefinition): string {
  const gate = ARCHETYPE_MECHANISM_HARD_GATES[def.id];
  const anti = def.promptAntiFeatures?.join('; ') ?? def.insufficientWhen.join('; ');
  return [
    `id=${def.id}`,
    `carrier:${def.carrierKind}`,
    `function:${def.functionSignature ?? def.coreFunction}`,
    gate ? `require:${formatHardGateForPrompt(gate)}` : null,
    anti ? `anti:${anti}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

function formatStandardArchetypeLine(def: ArchetypeDefinition): string {
  const lines = [
    `id=${def.id} label:${def.canonicalLabel}`,
    `  function: ${def.coreFunction}`,
    `  select when: ${def.selectWhen.join('; ')}`,
    `  not enough: ${def.insufficientWhen.join('; ')}`,
  ];
  const gate = ARCHETYPE_MECHANISM_HARD_GATES[def.id];
  if (gate) {
    lines.push(`  require mechanisms: ${formatHardGateForPrompt(gate)}`);
  }
  return lines.join('\n');
}

/**
 * Compact operational block injected into dream_extraction (v4.1.3-B.2).
 * Carrier-scoped records use id= / carrier / function / require / anti lines.
 */
export function formatArchetypeCatalogForPromptV1(): string {
  return ARCHETYPE_CATALOG_V1.filter((d) => d.selectableAsEcho !== false)
    .map((d) => (d.carrierKind ? formatCarrierScopedArchetypeLine(d) : formatStandardArchetypeLine(d)))
    .join('\n');
}

/** @deprecated Prefer formatArchetypeCatalogForPromptV1 — kept for import compatibility. */
export function formatArchetypeHardGatesForPromptV1(): string {
  return formatArchetypeCatalogForPromptV1();
}

/** Assert catalog covers every whitelist label (used by tests). */
export function archetypeCatalogLabels(): string[] {
  return ARCHETYPE_CATALOG_V1.map((d) => d.canonicalLabel);
}
