import {
  buildFieldMapBoundEssayContext,
  buildReflectiveEssayFieldMapMessages,
  parseReflectiveEssayFieldMap,
  REFLECTIVE_ESSAY_FIELD_MAP_PROMPT_VERSION,
  ReflectiveEssayFieldMap,
  validateReflectiveEssayFieldMap,
} from '../src/ai/reflectiveEssayFieldMapSpike';

const entries = [
  {
    date: '2026-08-20',
    dreamNarrative: 'I crossed a blue bridge over a river.',
    affects: ['wonder'],
    symbols: ['bridge'],
    symbolStances: ['bridge: crossing'],
    landscapes: ['river'],
    relationalDynamics: ['moving across'],
    interpretation: 'The bridge may suggest transition.',
  },
  {
    date: '2026-08-21',
    dreamNarrative: 'I stopped before a red bridge and waited.',
    affects: ['hesitation'],
    symbols: ['bridge'],
    symbolStances: ['bridge: refusing'],
    landscapes: ['ravine'],
    relationalDynamics: ['stopping at the edge'],
    interpretation: 'The bridge may suggest a threshold.',
  },
];

const unifiedMap: ReflectiveEssayFieldMap = {
  schema_version: 1,
  topology: 'unified',
  clusters: [{
    cluster_id: 'cluster_1',
    dream_indices: [1, 2],
    concrete_recurrences: ['A bridge is approached in both dreams.'],
  }],
  supported_cross_dream_relations: [{
    scope: 'field',
    cluster_id: null,
    relation: 'Both dreams stage a relation to a bridge.',
    evidence: [
      { dream_index: 1, detail: 'crossed a blue bridge' },
      { dream_index: 2, detail: 'stopped before a red bridge' },
    ],
  }],
  unsupported_or_weak_affinities: [],
  temporal_movement: { status: 'unsupported', evidence: [] },
};

describe('reflective essay Field Map architecture spike', () => {
  it('uses a versioned, evidence-only pre-pass over narrative-first context', () => {
    const messages = buildReflectiveEssayFieldMapMessages({ entries, surface: 'recent' });

    expect(REFLECTIVE_ESSAY_FIELD_MAP_PROMPT_VERSION).toBe('0.1.0-rd');
    expect(messages[0].content).toContain('Your only task is to classify the observable topology');
    expect(messages[0].content).toContain('Previous interpretation notes are hypotheses, never evidence.');
    expect(messages[0].content).toContain('Chronological order is not temporal movement.');
    expect(messages[1].content).toContain('Dream narrative excerpt: I crossed a blue bridge');
    expect(messages[1].content).not.toContain('Core Mode:');
    expect(messages[1].content).not.toContain('Motifs:');
  });

  it('parses fenced JSON and accepts an evidence-earned unified map', () => {
    const parsed = parseReflectiveEssayFieldMap(`\`\`\`json\n${JSON.stringify(unifiedMap)}\n\`\`\``);
    const result = validateReflectiveEssayFieldMap(parsed, 2);

    expect(result).toEqual({ ok: true, value: unifiedMap });
  });

  it('rejects a loose map that smuggles in a supported cross-dream relation', () => {
    const result = validateReflectiveEssayFieldMap({
      ...unifiedMap,
      topology: 'loose',
    }, 2);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toContain('loose topology cannot contain supported cross-dream relations');
  });

  it('rejects a parallel-cluster map with a master field bridge', () => {
    const result = validateReflectiveEssayFieldMap({
      ...unifiedMap,
      topology: 'parallel_clusters',
      clusters: [
        unifiedMap.clusters[0],
        { cluster_id: 'cluster_2', dream_indices: [1, 2], concrete_recurrences: ['another local relation'] },
      ],
    }, 2);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toContain('parallel_clusters topology cannot contain field-scoped relations');
  });

  it('binds composition to the map while retaining the exact narrative context', () => {
    const narrativeContext = 'Dream 1\nDream narrative excerpt: a blue bridge';
    const bound = buildFieldMapBoundEssayContext(unifiedMap, narrativeContext);

    expect(bound).toContain('BINDING COMPOSITION BOUNDARY');
    expect(bound).toContain('Do not add a field relation, cluster bridge, or temporal movement');
    expect(bound).toContain(JSON.stringify(unifiedMap));
    expect(bound.endsWith(narrativeContext)).toBe(true);
  });
});
