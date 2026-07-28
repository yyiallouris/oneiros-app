import {
  getArchetypeDefinitionById,
  selectableArchetypeIds,
} from './archetypeCatalog.v1.ts';

export const ARCHETYPE_RECOGNITION_CATALOG_VERSION = '2.0.0' as const;

export type ArchetypeRecognitionRecord = {
  id: string;
  label: string;
  coreQuality: string;
  commonExpressions: string[];
  notEnough: string;
};

export const ARCHETYPE_RECOGNITION_CATALOG_V2 = [
  {
    id: 'self',
    label: 'Self',
    coreQuality: 'Wholeness or a unifying center that gathers opposites into one field.',
    commonExpressions: [
      'a central image quietly holding the whole dream together',
      'opposed movements gathered into one pattern or order',
      'numinous coherence reshaping the total atmosphere',
    ],
    notEnough: 'A sacred image, circle, calm mood, or wise feeling without a genuinely unifying center.',
  },
  {
    id: 'shadow',
    label: 'Shadow',
    coreQuality: 'Excluded, disowned, or morally rejected vitality confronting the accepted self.',
    commonExpressions: [
      'a rejected figure or force pressing from the edge',
      'instinct, aggression, shame, or vitality kept outside identity',
      'an unwanted counterpart organizing the emotional charge',
    ],
    notEnough: 'Darkness, danger, fear, hostility, or an unknown figure without clearly disowned psychic content.',
  },
  {
    id: 'persona',
    label: 'Persona',
    coreQuality: 'A socially adapted mask or role displacing private expression or belonging.',
    commonExpressions: [
      'performance, costume, title, or public role as identity pressure',
      'public image pulling against private feeling',
      'recognition, belonging, or permission governed by presentation',
    ],
    notEnough: 'Clothing, work, visibility, ceremony, or public setting without a real mask-versus-self tension.',
  },
  {
    id: 'anima',
    label: 'Anima',
    coreQuality: 'A soul-image opening relation to inner otherness, feeling, and imaginal life.',
    commonExpressions: [
      'a feminine figure mediating unknown inner life',
      'beauty, feeling, or desire redirecting the dreamer inward',
      'an autonomous relational presence opening psychic depth',
    ],
    notEnough: 'A woman, attraction, beauty, romance, or maternal figure without a mediating soul-function.',
  },
  {
    id: 'animus',
    label: 'Animus',
    coreQuality: 'A soul-image opening inner direction through conviction, discrimination, or spirit.',
    commonExpressions: [
      'a masculine figure bringing direction or incisive thought',
      'autonomous conviction reshaping the dreamer’s path',
      'logos-like force opening relation to unknown inner life',
    ],
    notEnough: 'A man, authority, argument, or father-like presence without a mediating inner-direction function.',
  },
  {
    id: 'divine_child',
    label: 'Divine Child',
    coreQuality: 'Vulnerable, luminous, renewing possibility whose presence carries a future.',
    commonExpressions: [
      'a child or infant drawing protection, awe, or hope',
      'fragile new life changing decisions around it',
      'smallness carrying unusual promise or renewal',
    ],
    notEnough: 'Any child, childhood memory, or vulnerability without a future-bearing, renewing center.',
  },
  {
    id: 'mother',
    label: 'Mother',
    coreQuality: 'Nurturing containment, engulfing possession, or generative matrix organizing belonging and growth.',
    commonExpressions: [
      'holding, feeding, sheltering, or binding containment',
      'fertile ground, womb-like enclosure, or anti-separation pull',
      'maternal atmosphere shaping safety, dependence, or leaving',
    ],
    notEnough: 'A mother, woman, house, food, or queenly figure without a truly maternal matrix or hold.',
  },
  {
    id: 'father',
    label: 'Father',
    coreQuality: 'Protective order, authorizing structure, or tyrannical claim shaping orientation and consequence.',
    commonExpressions: [
      'law, permission, demand, or expectation centered in a father-force',
      'orientation or boundary carried by paternal authority',
      'attention, time, or space claimed by an ordering presence',
    ],
    notEnough: 'Any father, older man, rule, or authority without a distinctly paternal structuring claim.',
  },
  {
    id: 'wise_old_man',
    label: 'Wise Old Man',
    coreQuality: 'Elder masculine wisdom bringing orientation, meaning, or initiatory knowledge.',
    commonExpressions: [
      'an elder offering guidance with unusual depth',
      'teaching, warning, or orientation carrying wisdom weight',
      'knowledge that changes how the dream is navigated',
    ],
    notEnough: 'An old man, teacher, or advice-giver without numinous or initiatory wisdom.',
  },
  {
    id: 'wise_old_woman',
    label: 'Wise Old Woman',
    coreQuality: 'Elder feminine wisdom bringing orientation, craft, or fate-sense.',
    commonExpressions: [
      'an elder woman holding practical or fateful knowing',
      'counsel, craft, or orientation that quietly redirects the dream',
      'wisdom carried through seasoned feminine presence',
    ],
    notEnough: 'An old woman, grandmother, or helper without clear wisdom-bearing orientation.',
  },
  {
    id: 'hero',
    label: 'Hero',
    coreQuality: 'Questing agency confronting ordeal for a real crossing, rescue, or boon.',
    commonExpressions: [
      'purposeful movement through trial or confrontation',
      'courage earning passage, retrieval, or changed outcome',
      'a struggle that structurally alters what becomes possible',
    ],
    notEnough: 'Any action, effort, bravery, or journey without ordeal leading to a real gained crossing or boon.',
  },
  {
    id: 'trickster',
    label: 'Trickster',
    coreQuality: 'Cunning inversion or rule-bending that shifts leverage and exposes false order.',
    commonExpressions: [
      'deception, feint, or comic reversal changing who holds power',
      'mischief opening a new possibility',
      'subversion that reveals a rigid order as unstable',
    ],
    notEnough: 'Chaos, humor, strangeness, lying, or rule-breaking without a real leverage-changing reversal.',
  },
  {
    id: 'guide_psychopomp',
    label: 'Guide / Psychopomp',
    coreQuality: 'Meaningful guidance across a threshold, realm, or mode of awareness.',
    commonExpressions: [
      'escort through a crossing, descent, ascent, or in-between zone',
      'guidance that changes how passage becomes possible',
      'a figure who knows the way between psychic grounds',
    ],
    notEnough: 'Transport, company, guarding, or advice without actual threshold-guidance or real passage.',
  },
  {
    id: 'double',
    label: 'Double',
    coreQuality: 'A rival or substitute self competing for place, role, identity, or agency.',
    commonExpressions: [
      'someone taking the dreamer’s place or recognition',
      'a counterpart mirroring and displacing identity',
      'split agency organized through rivalry or substitution',
    ],
    notEnough: 'Resemblance, mirror imagery, or familiarity without identity competition, replacement, or rivalry.',
  },
  {
    id: 'orphan',
    label: 'Orphan',
    coreQuality: 'Abandonment, exile, or missing belonging organizing the emotional center.',
    commonExpressions: [
      'home-seeking or kin-loss driving the dream',
      'unprotected aloneness shaping the atmosphere',
      'exclusion or abandonment as the dream’s basic wound',
    ],
    notEnough: 'Brief loneliness, separation, or a child image without structural exile or lack of belonging.',
  },
  {
    id: 'lover',
    label: 'Lover',
    coreQuality:
      'Mutual erotic, intimate, or beloved relatedness that organizes the emotional and imaginal field.',
    commonExpressions: [
      'serene bodily or emotional intimacy',
      'shared attention, rest, vulnerability, or exploration within an intimate bond',
      'desire, devotion, longing, union, separation, loss, or beloved risk',
      'a bond that makes the dream-space feel safe, open, charged, or deeply inhabited',
    ],
    notEnough:
      'A partner, friendship, teamwork, domestic logistics, attraction, wedding imagery, or a brief kiss without an organizing intimate or beloved bond.',
  },
  {
    id: 'ruler',
    label: 'Ruler',
    coreQuality: 'Embodied sovereign authority ordering the field through command, custody, or governance.',
    commonExpressions: [
      'personal rule shaping what others may do',
      'throne, court, or authority exercised as a living center',
      'order held through command rather than suggestion',
    ],
    notEnough: 'Institutions, guards, titles, or ceremony without an embodied sovereign ordering presence.',
  },
  {
    id: 'death_rebirth',
    label: 'Death–Rebirth',
    coreQuality: 'Dissolution of an old form followed by emergent renewal or return in new state.',
    commonExpressions: [
      'descent, stripping, burial, or ending preceding renewal',
      'old identity or form giving way to another',
      'a felt sequence of dying-and-becoming',
    ],
    notEnough: 'A death image, ending, arrival, or change without a real dissolution-to-renewal sequence.',
  },
  {
    id: 'sacred_marriage',
    label: 'Sacred Marriage',
    coreQuality: 'Union of opposing principles generating a new third, wholeness, or reconciled field.',
    commonExpressions: [
      'ritual or numinous coupling of opposites',
      'masculine and feminine, high and low, or divided poles reconciled',
      'union producing more than romance: a new psychic whole',
    ],
    notEnough: 'A couple, wedding, attraction, or romance without genuine union of opposites and new wholeness.',
  },
] as const satisfies readonly ArchetypeRecognitionRecord[];

export type ArchetypeRecognitionId = (typeof ARCHETYPE_RECOGNITION_CATALOG_V2)[number]['id'];

const RECOGNITION_RECORDS_BY_ID = new Map<string, ArchetypeRecognitionRecord>(
  ARCHETYPE_RECOGNITION_CATALOG_V2.map((record) => [record.id, record])
);

function tokenizeWords(value: string): string[] {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function archetypeRecognitionRecordWordCount(record: ArchetypeRecognitionRecord): number {
  return [
    ...tokenizeWords(record.coreQuality),
    ...record.commonExpressions.flatMap(tokenizeWords),
    ...tokenizeWords(record.notEnough),
  ].length;
}

export function getArchetypeRecognitionRecord(
  archetypeId: string
): ArchetypeRecognitionRecord | undefined {
  return RECOGNITION_RECORDS_BY_ID.get(archetypeId.trim());
}

export function getArchetypeRecognitionCatalogIds(): ArchetypeRecognitionId[] {
  return ARCHETYPE_RECOGNITION_CATALOG_V2.map((record) => record.id);
}

export function isArchetypeRecognitionId(value: unknown): value is ArchetypeRecognitionId {
  return typeof value === 'string' && RECOGNITION_RECORDS_BY_ID.has(value.trim());
}

export function formatArchetypeRecognitionCatalogForPromptV2(): string {
  return ARCHETYPE_RECOGNITION_CATALOG_V2.map((record) =>
    [
      `id=${record.id} label:${record.label}`,
      `  quality: ${record.coreQuality}`,
      `  common expressions: ${record.commonExpressions.join('; ')}`,
      `  not enough: ${record.notEnough}`,
    ].join('\n')
  ).join('\n');
}

export function assertRecognitionCatalogCoverage(): void {
  const selectableIds = selectableArchetypeIds();
  const missing = selectableIds.filter((id) => !RECOGNITION_RECORDS_BY_ID.has(id));
  if (missing.length > 0) {
    throw new Error(`Recognition catalog missing selectable archetype ids: ${missing.join(', ')}`);
  }

  for (const record of ARCHETYPE_RECOGNITION_CATALOG_V2) {
    const definition = getArchetypeDefinitionById(record.id);
    if (!definition) {
      throw new Error(`Recognition catalog references unknown archetype id: ${record.id}`);
    }
    if (definition.canonicalLabel !== record.label) {
      throw new Error(
        `Recognition catalog label mismatch for ${record.id}: expected ${definition.canonicalLabel}, got ${record.label}`
      );
    }
  }
}

assertRecognitionCatalogCoverage();
