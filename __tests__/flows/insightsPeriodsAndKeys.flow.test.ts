/**
 * Flow coverage: documentation/flows-07-insights-reports.md (periods, keys, journal filters).
 */
jest.mock('../../src/services/storageService', () => ({
  StorageService: {
    getDreams: jest.fn().mockResolvedValue([]),
    getInterpretations: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../src/services/ai', () => ({
  groupSimilarTerms: jest.fn(),
}));

import {
  getPeriodThisMonth,
  getPeriodLastMonth,
  getPeriodLastNMonths,
  getPeriodLabel,
  normalizeSymbolKey,
  symbolKeyMatches,
  landscapeKeyMatches,
  motifKeyMatches,
  getCollectiveInsights,
  getRecurringSymbols,
  getRecurringLandscapes,
  getRecurringMotifs,
  getInterpretedDreamsCountForPeriod,
  getInsightsOverview,
  buildStrongestPatterns,
  buildDreamFieldSummary,
} from '../../src/services/insightsService';
import { StorageService } from '../../src/services/storageService';
import { groupSimilarTerms } from '../../src/services/ai';

const mockStorageService = StorageService as jest.Mocked<typeof StorageService>;
const mockGroupSimilarTerms = groupSimilarTerms as jest.MockedFunction<typeof groupSimilarTerms>;

describe('insights periods & keys flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageService.getDreams.mockResolvedValue([]);
    mockStorageService.getInterpretations.mockResolvedValue([]);
  });

  it('getPeriodThisMonth returns full month inclusive bounds', () => {
    const p = getPeriodThisMonth();
    expect(p.startDate.endsWith('-01')).toBe(true);
    expect(p.startDate.slice(0, 7)).toBe(p.endDate.slice(0, 7));
    expect(p.endDate >= p.startDate).toBe(true);
  });

  it('getPeriodLastMonth is before this month', () => {
    const thisM = getPeriodThisMonth();
    const lastM = getPeriodLastMonth();
    expect(lastM.endDate < thisM.startDate).toBe(true);
  });

  it('getPeriodLastNMonths spans at least n-1 month gap in start', () => {
    const p = getPeriodLastNMonths(3);
    expect(p.startDate <= p.endDate).toBe(true);
    const start = new Date(p.startDate + 'T12:00:00');
    const end = new Date(p.endDate + 'T12:00:00');
    const diffMonths =
      (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    expect(diffMonths).toBeGreaterThanOrEqual(2);
  });

  it('getPeriodLabel returns This month for current month period', () => {
    expect(getPeriodLabel(getPeriodThisMonth())).toBe('This month');
  });

  it('getPeriodLabel returns Last month for previous month period', () => {
    expect(getPeriodLabel(getPeriodLastMonth())).toBe('Last month');
  });

  it('normalizeSymbolKey strips articles and singularizes', () => {
    expect(normalizeSymbolKey('The Dogs')).toBe('dog');
  });

  it('symbolKeyMatches respects subset words rule', () => {
    expect(symbolKeyMatches('dark forest path', 'dark forest')).toBe(true);
    expect(symbolKeyMatches('cat', 'dog')).toBe(false);
  });

  it('landscapeKeyMatches uses landscape normalization', () => {
    expect(landscapeKeyMatches('The Beaches', 'beach')).toBe(true);
  });

  it('motifKeyMatches aligns with symbol matching (multi-word filter)', () => {
    expect(motifKeyMatches('falling down the stairs', 'falling down')).toBe(true);
  });

  it('getCollectiveInsights returns placeholder shape', async () => {
    const c = await getCollectiveInsights();
    expect(c.topSymbolsThisMonth).toEqual([]);
    expect(c.archetypeTrends).toEqual([]);
  });

  it('recurring insight reads do not start semantic grouping AI on cache misses', async () => {
    mockStorageService.getDreams.mockResolvedValue([
      {
        id: 'dream-1',
        date: '2026-04-01',
        content: 'A river beside an old house.',
        symbols: ['silver river'],
        landscapes: ['old house'],
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      },
    ]);
    mockStorageService.getInterpretations.mockResolvedValue([
      {
        id: 'interpretation-1',
        dreamId: 'dream-1',
        messages: [],
        symbols: ['river'],
        archetypes: [],
        landscapes: ['house'],
        motifs: ['falling', 'fall'],
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      },
    ]);

    await expect(getRecurringSymbols()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ normalizedKey: 'silver river', count: 1 }),
      expect.objectContaining({ normalizedKey: 'river', count: 1 }),
    ]));
    await expect(getRecurringLandscapes()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ normalizedKey: 'old house', count: 1 }),
      expect.objectContaining({ normalizedKey: 'house', count: 1 }),
    ]));
    await expect(getRecurringMotifs()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ normalizedKey: 'falling', count: 1 }),
      expect.objectContaining({ normalizedKey: 'fall', count: 1 }),
    ]));

    expect(mockGroupSimilarTerms).not.toHaveBeenCalled();
  });

  it('buildStrongestPatterns sorts recurring patterns by count and category priority', () => {
    const patterns = buildStrongestPatterns({
      images: [{ label: 'house', kind: 'image', count: 3, sectionId: 'recurring-symbols' }],
      thresholds: [{ label: 'closed door', kind: 'threshold', count: 3, sectionId: 'thresholds' }],
      tensions: [{ label: 'contact vs protection', kind: 'tension', count: 4, sectionId: 'core-conflicts' }],
      places: [{ label: 'old school', kind: 'place', count: 1, sectionId: 'space-landscapes' }],
    });

    expect(patterns.map((p) => p.label)).toEqual([
      'contact vs protection',
      'house',
      'closed door',
    ]);
  });

  it('buildDreamFieldSummary handles empty, forming, and recurring states', () => {
    expect(buildDreamFieldSummary({ interpretedDreamsCount: 0, strongestPatterns: [] }))
      .toContain('No dream field yet');

    expect(buildDreamFieldSummary({
      interpretedDreamsCount: 1,
      strongestPatterns: [{ label: 'sea', kind: 'image', count: 1, sectionId: 'recurring-symbols' }],
    })).toContain('A light field is forming around sea');

    expect(buildDreamFieldSummary({
      interpretedDreamsCount: 3,
      strongestPatterns: [
        { label: 'house', kind: 'image', count: 3, sectionId: 'recurring-symbols' },
        { label: 'threshold', kind: 'threshold', count: 2, sectionId: 'thresholds' },
      ],
    })).toContain('The field gathers around house');
  });

  it('getInterpretedDreamsCountForPeriod counts unique interpreted dreams in period', async () => {
    mockStorageService.getDreams.mockResolvedValue([
      {
        id: 'dream-1',
        date: '2026-04-01',
        content: 'A house.',
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      },
      {
        id: 'dream-2',
        date: '2026-04-03',
        content: 'A road.',
        createdAt: '2026-04-03T00:00:00.000Z',
        updatedAt: '2026-04-03T00:00:00.000Z',
      },
      {
        id: 'dream-3',
        date: '2026-05-01',
        content: 'A beach.',
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z',
      },
    ]);
    mockStorageService.getInterpretations.mockResolvedValue([
      {
        id: 'interpretation-1',
        dreamId: 'dream-1',
        messages: [],
        symbols: [],
        archetypes: [],
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      },
      {
        id: 'interpretation-2',
        dreamId: 'dream-1',
        messages: [],
        symbols: [],
        archetypes: [],
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      },
      {
        id: 'interpretation-3',
        dreamId: 'dream-3',
        messages: [],
        symbols: [],
        archetypes: [],
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z',
      },
    ]);

    await expect(getInterpretedDreamsCountForPeriod({ startDate: '2026-04-01', endDate: '2026-04-30' }))
      .resolves.toBe(1);
  });

  it('seeded interpreted dreams update existing Insights aggregation when a new dream is added', async () => {
    const dreams = [
      {
        id: 'dream-1',
        date: '2026-04-01',
        content: 'A red door in a hallway.',
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      },
      {
        id: 'dream-2',
        date: '2026-04-05',
        content: 'A garden path.',
        createdAt: '2026-04-05T00:00:00.000Z',
        updatedAt: '2026-04-05T00:00:00.000Z',
      },
      {
        id: 'dream-3',
        date: '2026-03-25',
        content: 'An older sea dream.',
        createdAt: '2026-03-25T00:00:00.000Z',
        updatedAt: '2026-03-25T00:00:00.000Z',
      },
    ];
    const interpretations = [
      {
        id: 'interpretation-1',
        dreamId: 'dream-1',
        messages: [{ id: 'message-1', role: 'assistant' as const, content: 'A guarded door reflection.', timestamp: 't' }],
        symbols: ['red door'],
        archetypes: [],
        landscapes: ['hallway'],
        affects: ['tension'],
        motifs: ['blocked threshold'],
        thresholds: ['closed door'],
        central_conflicts: ['wanting entry vs blocked door'],
        createdAt: 't',
        updatedAt: 't',
      },
      {
        id: 'interpretation-2',
        dreamId: 'dream-2',
        messages: [{ id: 'message-2', role: 'assistant' as const, content: 'An open path reflection.', timestamp: 't' }],
        symbols: ['garden path'],
        archetypes: [],
        landscapes: ['garden'],
        affects: ['ease'],
        motifs: ['open path'],
        thresholds: ['leaving house'],
        central_conflicts: [],
        createdAt: 't',
        updatedAt: 't',
      },
      {
        id: 'interpretation-3',
        dreamId: 'dream-3',
        messages: [{ id: 'message-3', role: 'assistant' as const, content: 'A sea reflection.', timestamp: 't' }],
        symbols: ['sea'],
        archetypes: [],
        landscapes: ['shore'],
        affects: ['longing'],
        motifs: ['returning water'],
        thresholds: ['shoreline'],
        central_conflicts: [],
        createdAt: 't',
        updatedAt: 't',
      },
    ];
    mockStorageService.getDreams.mockImplementation(async () => dreams);
    mockStorageService.getInterpretations.mockImplementation(async () => interpretations);
    const april = { startDate: '2026-04-01', endDate: '2026-04-30' };

    await expect(getInsightsOverview(april)).resolves.toMatchObject({
      dreamsLoggedCount: 2,
      interpretedDreamsCount: 2,
      topImages: expect.arrayContaining([
        expect.objectContaining({ label: 'red door', count: 1 }),
      ]),
    });

    dreams.push({
      id: 'dream-4',
      date: '2026-04-12',
      content: 'The same red door appeared again.',
      createdAt: '2026-04-12T00:00:00.000Z',
      updatedAt: '2026-04-12T00:00:00.000Z',
    });
    interpretations.push({
      id: 'interpretation-4',
      dreamId: 'dream-4',
      messages: [{ id: 'message-4', role: 'assistant' as const, content: 'Another guarded door reflection.', timestamp: 't' }],
      symbols: ['red door'],
      archetypes: [],
      landscapes: ['hallway'],
      affects: ['tension'],
      motifs: ['blocked threshold'],
      thresholds: ['closed door'],
      central_conflicts: ['wanting entry vs blocked door'],
      createdAt: 't',
      updatedAt: 't',
    });

    const updated = await getInsightsOverview(april);

    expect(updated.dreamsLoggedCount).toBe(3);
    expect(updated.interpretedDreamsCount).toBe(3);
    expect(updated.topImages[0]).toEqual(expect.objectContaining({ label: 'red door', count: 2 }));
    expect(updated.topMotifs[0]).toEqual(expect.objectContaining({ label: 'blocked threshold', count: 2 }));
    expect(updated.topThresholds[0]).toEqual(expect.objectContaining({ label: 'closed door', count: 2 }));
    expect(updated.strongestPatterns.map((pattern) => pattern.label)).toEqual(
      expect.arrayContaining(['red door', 'closed door', 'blocked threshold'])
    );
    expect(updated.fieldSummary).toContain('red door');
  });
});
