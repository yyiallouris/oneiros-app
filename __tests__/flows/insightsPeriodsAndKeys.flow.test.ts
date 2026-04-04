/**
 * Flow coverage: documentation/flows-07-insights-reports.md (periods, keys, journal filters).
 */
jest.mock('../../src/services/storageService', () => ({
  StorageService: {
    getDreams: jest.fn().mockResolvedValue([]),
  },
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
} from '../../src/services/insightsService';

describe('insights periods & keys flow', () => {
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
});
