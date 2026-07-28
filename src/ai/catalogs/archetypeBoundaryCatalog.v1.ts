import {
  ARCHETYPE_RECOGNITION_CATALOG_V2,
  getArchetypeRecognitionRecord,
  type ArchetypeRecognitionId,
} from './archetypeRecognitionCatalog.v2.ts';

export const ARCHETYPE_BOUNDARY_CATALOG_VERSION = '1.0.0' as const;

export type ArchetypeBoundaryRecord = {
  id: ArchetypeRecognitionId;
  distinctiveFunction: string;
  decisiveQuestion: string;
  rejectWhen: string[];
};

export const ARCHETYPE_BOUNDARY_CATALOG_V1 = [
  {
    id: 'self',
    distinctiveFunction:
      'A unifying center or wholeness-image that gathers opposed elements into one living field rather than merely decorating the dream with calm, meaning, or sacred tone.',
    decisiveQuestion:
      'Does the dream stage an image or presence that truly gathers tensions, opposites, or the whole atmosphere into a more unified center?',
    rejectWhen: [
      'there is only calm, beauty, balance, or sacred feeling',
      'a circle, temple, or radiant image appears without organizing the whole dream',
      'coherence is aesthetic rather than unifying',
    ],
  },
  {
    id: 'shadow',
    distinctiveFunction:
      'A rejected, disowned, or unrecognized aspect of the dreamer or conscious position pressing for encounter.',
    decisiveQuestion:
      'Does the dream link the threatening or disturbing quality to something rejected, split off, mirrored, or unowned in the dreamer?',
    rejectWhen: [
      'there is only danger, fear, darkness, pursuit, aggression, or an unseen threat',
      'the threatening presence has no self-referential or disowned quality',
      'a monster, animal, stranger, or attacker is merely dangerous',
      'the dream contains no pressure toward recognition, ownership, or encounter with a rejected aspect',
    ],
  },
  {
    id: 'persona',
    distinctiveFunction:
      'A socially adapted mask, role, or presentation that suppresses, replaces, or conflicts with private expression.',
    decisiveQuestion:
      'Does a public role or social presentation actively constrain, displace, or conceal the dreamer’s private self?',
    rejectWhen: [
      'there is only a crowd, ceremony, formal clothing, audience, observation, or public setting',
      'the dreamer is merely a spectator',
      'social appearance is present without public-role pressure or private-self displacement',
    ],
  },
  {
    id: 'anima',
    distinctiveFunction:
      'A feminine soul-image mediating relation to inner otherness, feeling, beauty, or imaginal depth in a way that changes the dreamer’s inner orientation.',
    decisiveQuestion:
      'Does the feminine figure function as an inner mediator who opens feeling or imaginal depth, rather than simply appearing as a woman, beloved, mother, or attractive person?',
    rejectWhen: [
      'there is only a woman, attraction, beauty, or romance',
      'the figure does not redirect the dreamer toward inner otherness',
      'the relational charge is explained by ordinary social or erotic context alone',
    ],
  },
  {
    id: 'animus',
    distinctiveFunction:
      'A masculine soul-image mediating inner direction through conviction, discrimination, or spirit rather than merely representing a man, authority figure, or father.',
    decisiveQuestion:
      'Does the masculine figure bring an autonomous inner direction or logos-like force that reorients the dreamer, beyond ordinary advice, command, or male presence?',
    rejectWhen: [
      'there is only a man, authority, argument, or competence',
      'the figure does not mediate inner direction or spirit',
      'the role is fully explained by father, guide, teacher, or partner context',
    ],
  },
  {
    id: 'divine_child',
    distinctiveFunction:
      'A vulnerable yet charged new life whose smallness carries unusual promise, renewal, or future-bearing significance for the whole field.',
    decisiveQuestion:
      'Does the child figure carry a fragile but exceptional future-bearing significance that reorganizes care, hope, or protection around it?',
    rejectWhen: [
      'there is only a child, baby, childhood memory, or dependency',
      'vulnerability appears without unusual promise or renewing charge',
      'the surrounding field does not reorganize around protecting or honoring the child',
    ],
  },
  {
    id: 'mother',
    distinctiveFunction:
      'A maternal matrix of nurture, enclosure, generativity, or engulfing hold that organizes belonging, dependence, growth, or anti-separation in the dream.',
    decisiveQuestion:
      'Does the dream center a specifically maternal field of holding, feeding, sheltering, generativity, or engulfing possession, beyond female presence or domestic comfort?',
    rejectWhen: [
      'there is only a woman, house, meal, home, or comforting scene',
      'care appears without a maternal matrix or anti-separation hold',
      'the atmosphere is warm but not organized by nurture, enclosure, or engulfment',
    ],
  },
  {
    id: 'father',
    distinctiveFunction:
      'A paternal principle of ordering claim, permission, law, boundary, or consequence shaping orientation rather than merely an older man or generic authority.',
    decisiveQuestion:
      'Does a distinctly paternal presence organize the dream through authorizing structure, demand, law, boundary, or consequence?',
    rejectWhen: [
      'there is only an older man, rule, expectation, or authority',
      'the figure does not carry a specifically paternal structuring claim',
      'order exists without being centered in a father-force',
    ],
  },
  {
    id: 'wise_old_man',
    distinctiveFunction:
      'Elder masculine wisdom that carries unusual orientation, warning, or initiatory knowledge rather than routine instruction or ordinary expertise.',
    decisiveQuestion:
      'Does the elder man bring wisdom-weighted orientation or knowledge that changes how the dream can be understood or navigated?',
    rejectWhen: [
      'there is only an old man, teacher, or helper',
      'guidance is practical but not wisdom-bearing or initiatory',
      'knowledge is routine, technical, or replaceable',
    ],
  },
  {
    id: 'wise_old_woman',
    distinctiveFunction:
      'Elder feminine wisdom carrying seasoned orientation, craft, or fate-sense that quietly redirects the dream beyond ordinary grandmotherly or helper presence.',
    decisiveQuestion:
      'Does the elder woman function as a bearer of seasoned feminine knowing that genuinely orients the dreamer or the field?',
    rejectWhen: [
      'there is only an old woman, grandmother, healer, or helper',
      'care or assistance appears without clear wisdom-bearing orientation',
      'the role is practical but not seasoned, fateful, or meaning-bearing',
    ],
  },
  {
    id: 'hero',
    distinctiveFunction:
      'Questing agency confronting an ordeal that wins passage, rescue, retrieval, or another real boon, rather than mere activity, effort, or bravery.',
    decisiveQuestion:
      'Does the dream stage a meaningful ordeal whose confrontation produces a real crossing, retrieval, rescue, or changed possibility?',
    rejectWhen: [
      'there is only movement, trying, bravery, or a journey',
      'there is no real ordeal or confrontation',
      'effort occurs without a gained crossing, boon, or structurally changed outcome',
    ],
  },
  {
    id: 'trickster',
    distinctiveFunction:
      'Cunning, inversion, or rule-bending that shifts leverage and exposes rigid order as unstable, not mere chaos, humor, lying, or oddity.',
    decisiveQuestion:
      'Does deception, mischief, or reversal actually change leverage or expose a false order, rather than simply making the scene strange or unruly?',
    rejectWhen: [
      'there is only chaos, comedy, weirdness, or rule-breaking',
      'deception occurs without a leverage-changing reversal',
      'mischief is decorative and does not alter the field',
    ],
  },
  {
    id: 'guide_psychopomp',
    distinctiveFunction:
      'A guiding presence whose knowledge, mediation, or accompaniment makes a psychologically meaningful crossing possible.',
    decisiveQuestion:
      'Does a figure actively know, reveal, mediate, or enable a passage that the dreamer could not otherwise navigate?',
    rejectWhen: [
      'the dream contains only a station, airport, vehicle, road, ticket, platform, or doorway',
      'a driver or worker performs ordinary transport or logistics',
      'the dreamer searches for directions without an actual guiding presence',
      'movement occurs without a meaningful change of realm, state, or psychic position',
    ],
  },
  {
    id: 'double',
    distinctiveFunction:
      'A rival, substitute, or mirrored self competing for identity, place, role, or agency rather than simple resemblance or mirror imagery.',
    decisiveQuestion:
      'Does the counterpart threaten to replace, rival, duplicate, or split the dreamer’s identity or agency in a structurally meaningful way?',
    rejectWhen: [
      'there is only resemblance, mirroring, or familiarity',
      'a similar figure appears without rivalry, replacement, or displacement',
      'doubling is visual only and does not organize identity pressure',
    ],
  },
  {
    id: 'orphan',
    distinctiveFunction:
      'A wound of abandonment, exile, or missing belonging organizing the emotional center rather than brief loneliness, distance, or a generic child image.',
    decisiveQuestion:
      'Does the dream’s emotional center turn on unprotected aloneness, kin-loss, exclusion, or home-seeking as a structural lack of belonging?',
    rejectWhen: [
      'there is only temporary loneliness, separation, or waiting',
      'the dream includes a child or distance without exile or belonging-wound',
      'the atmosphere is sad but not organized by abandonment or exclusion',
    ],
  },
  {
    id: 'lover',
    distinctiveFunction:
      'Erotic, romantic, pair-bonded, or unmistakably beloved relatedness that organizes the dream field.',
    decisiveQuestion:
      'Does the dream show a specifically intimate or beloved bond beyond warmth, friendship, trust, belonging, or companionship?',
    rejectWhen: [
      'the scene is fully explained by friendship, group closeness, companionship, or shared enjoyment',
      'there is warmth or tenderness but no intimate, erotic, romantic, pair-bonded, or beloved dimension',
      'a partner label appears only in logistics or background activity',
      'attraction, a kiss, or wedding imagery appears without an organizing bond',
    ],
  },
  {
    id: 'ruler',
    distinctiveFunction:
      'Embodied sovereign authority ordering the field through command, custody, governance, or decree rather than generic institutions, titles, guards, or ceremony.',
    decisiveQuestion:
      'Does an embodied sovereign presence personally organize what others may do, hold, or become through command or custody?',
    rejectWhen: [
      'there is only hierarchy, rules, guards, or formal rank',
      'authority is institutional rather than embodied in a ruling center',
      'ceremony or command appears without living sovereign governance',
    ],
  },
  {
    id: 'death_rebirth',
    distinctiveFunction:
      'A sequence in which an old form dissolves, dies, strips away, or descends and a new form genuinely emerges, returns, or becomes possible.',
    decisiveQuestion:
      'Does the dream show a real dissolution-to-renewal sequence rather than mere ending, loss, change, or a death image?',
    rejectWhen: [
      'there is only death, burial, ending, departure, or change',
      'something stops without renewal, return, or emergent new state',
      'renewal is implied abstractly but not staged as a sequence',
    ],
  },
  {
    id: 'sacred_marriage',
    distinctiveFunction:
      'A union of opposing principles that generates a reconciled field, new third, or wholeness beyond ordinary romance, attraction, couplehood, or wedding imagery.',
    decisiveQuestion:
      'Does the union reconcile meaningful opposites and produce more than relationship itself, such as a new wholeness or transformed field?',
    rejectWhen: [
      'there is only a couple, wedding, attraction, or sexual bond',
      'the union does not reconcile distinct principles or opposites',
      'romance is central but no new third or wider wholeness is generated',
    ],
  },
] as const satisfies readonly ArchetypeBoundaryRecord[];

const BOUNDARY_RECORDS_BY_ID = new Map<ArchetypeRecognitionId, ArchetypeBoundaryRecord>(
  ARCHETYPE_BOUNDARY_CATALOG_V1.map((record) => [record.id, record])
);

function tokenizeWords(value: string): string[] {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function archetypeBoundaryRecordWordCount(record: ArchetypeBoundaryRecord): number {
  return [
    ...tokenizeWords(record.distinctiveFunction),
    ...tokenizeWords(record.decisiveQuestion),
    ...record.rejectWhen.flatMap(tokenizeWords),
  ].length;
}

export function getArchetypeBoundaryRecord(
  archetypeId: ArchetypeRecognitionId
): ArchetypeBoundaryRecord | undefined {
  return BOUNDARY_RECORDS_BY_ID.get(archetypeId);
}

export function formatArchetypeBoundaryRecordsForPrompt(
  archetypeIds: ArchetypeRecognitionId[]
): string {
  return archetypeIds
    .flatMap((archetypeId) => {
      const record = getArchetypeBoundaryRecord(archetypeId);
      const recognitionRecord = getArchetypeRecognitionRecord(archetypeId);
      if (!record || !recognitionRecord) return [];
      return [
        [
          `id=${record.id} label:${recognitionRecord.label}`,
          `  distinctive function: ${record.distinctiveFunction}`,
          `  decisive question: ${record.decisiveQuestion}`,
          `  reject when: ${record.rejectWhen.join('; ')}`,
        ].join('\n'),
      ];
    })
    .join('\n');
}

function assertBoundaryCatalogCoverage(): void {
  const recognitionIds = ARCHETYPE_RECOGNITION_CATALOG_V2.map((record) => record.id);
  const missing = recognitionIds.filter((id) => !BOUNDARY_RECORDS_BY_ID.has(id));
  if (missing.length > 0) {
    throw new Error(`Boundary catalog missing recognition ids: ${missing.join(', ')}`);
  }
}

assertBoundaryCatalogCoverage();
