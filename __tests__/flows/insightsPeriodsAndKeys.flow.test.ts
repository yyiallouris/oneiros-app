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
        summary: '',
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
});
