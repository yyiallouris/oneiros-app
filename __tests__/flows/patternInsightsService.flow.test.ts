/**
 * Flow coverage: documentation/flows-07-insights-reports.md (pattern reports, month keys).
 */
import {
  getMonthPeriod,
  getWeekPeriod,
  formatMonthKeyLabel,
  formatReportKeyLabel,
  formatReportKeyLabelForEssay,
  getWeekNumOfMonth,
  isMonthFinished,
  getPatternInsightEntries,
  getRecentPatternInsightEntries,
  generateRecentDreamFieldReflection,
  canGeneratePatternReflection,
} from '../../src/services/patternInsightsService';
import type { Dream, Interpretation } from '../../src/types/dream';

jest.mock('../../src/services/storageService', () => ({
  StorageService: {
    getDreams: jest.fn(),
    getInterpretations: jest.fn(),
  },
}));

jest.mock('../../src/services/ai', () => ({
  generatePatternInsights: jest.fn(),
  generateRecentDreamFieldReflection: jest.fn().mockResolvedValue('recent reflection'),
}));

const recentCache: Record<string, any> = {};
jest.mock('../../src/services/localStorage', () => ({
  LocalStorage: {
    getRecentSequenceReflection: jest.fn((scopeKey: string, language: string) =>
      Promise.resolve(recentCache[`${scopeKey}:${language}`] ?? null)
    ),
    saveRecentSequenceReflection: jest.fn((report: any) => {
      recentCache[`${report.scope_key}:${report.language}`] = report;
      return Promise.resolve();
    }),
  },
}));

import { StorageService } from '../../src/services/storageService';
import { generateRecentDreamFieldReflection as generateRecentDreamFieldReflectionFromAi } from '../../src/services/ai';

const mockDreams = StorageService.getDreams as jest.Mock;
const mockInterpretations = StorageService.getInterpretations as jest.Mock;
const mockGenerateRecentFromAi = generateRecentDreamFieldReflectionFromAi as jest.Mock;

describe('patternInsightsService flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(recentCache).forEach((key) => delete recentCache[key]);
  });

  it('getMonthPeriod covers full February in leap and non-leap years', () => {
    const p2024 = getMonthPeriod('2024-02');
    expect(p2024).toEqual({ startDate: '2024-02-01', endDate: '2024-02-29' });
    const p2025 = getMonthPeriod('2025-02');
    expect(p2025.endDate).toBe('2025-02-28');
  });

  it('getWeekPeriod week 1 and last week of month', () => {
    expect(getWeekPeriod('2025-01', 1)).toEqual({
      startDate: '2025-01-01',
      endDate: '2025-01-07',
    });
    expect(getWeekPeriod('2025-01', 5)).toEqual({
      startDate: '2025-01-29',
      endDate: '2025-01-31',
    });
  });

  it('formatMonthKeyLabel and report labels', () => {
    expect(formatMonthKeyLabel('2025-03')).toMatch(/March/);
    expect(formatReportKeyLabel('2025-03-W2')).toContain('Week 2');
    expect(formatReportKeyLabelForEssay('2025-03-W3')).toBe(formatMonthKeyLabel('2025-03'));
  });

  it('getWeekNumOfMonth', () => {
    expect(getWeekNumOfMonth(1)).toBe(1);
    expect(getWeekNumOfMonth(8)).toBe(2);
  });

  it('canGeneratePatternReflection requires at least two interpreted dreams', () => {
    expect(canGeneratePatternReflection(0)).toBe(false);
    expect(canGeneratePatternReflection(1)).toBe(false);
    expect(canGeneratePatternReflection(2)).toBe(true);
  });

  it('isMonthFinished is true for distant past month', () => {
    expect(isMonthFinished('2000-01')).toBe(true);
  });

  it('getPatternInsightEntries filters by period and caps', async () => {
    const dreams: Dream[] = [
      {
        id: 'd1',
        date: '2025-06-15',
        content: 'a',
        symbol: 'moon',
        createdAt: 'x',
        updatedAt: 'x',
      },
      {
        id: 'd2',
        date: '2020-01-01',
        content: 'b',
        symbol: 'sun',
        createdAt: 'x',
        updatedAt: 'x',
      },
    ];
    const interpretations: Interpretation[] = [
      {
        id: 'i1',
        dreamId: 'd1',
        messages: [{ id: 'm1', role: 'assistant', content: 'hello', timestamp: 't' }],
        symbols: [],
        archetypes: [],
        createdAt: 't',
        updatedAt: 't',
      },
      {
        id: 'i2',
        dreamId: 'd2',
        messages: [{ id: 'm2', role: 'assistant', content: 'old', timestamp: 't' }],
        symbols: [],
        archetypes: [],
        createdAt: 't',
        updatedAt: 't',
      },
    ];
    mockDreams.mockResolvedValue(dreams);
    mockInterpretations.mockResolvedValue(interpretations);

    const period = { startDate: '2025-06-01', endDate: '2025-06-30' };
    const entries = await getPatternInsightEntries(period);
    expect(entries).toHaveLength(1);
    expect(entries[0].date).toBe('2025-06-15');
  });

  it('getRecentPatternInsightEntries returns the newest reflected dreams by date', async () => {
    const dreams: Dream[] = [1, 2, 3, 4, 5, 6].map((n) => ({
      id: `d${n}`,
      date: `2025-06-0${n}`,
      content: `dream ${n}`,
      createdAt: 'x',
      updatedAt: 'x',
    }));
    const interpretations: Interpretation[] = dreams.map((dream, index) => ({
      id: `i${index + 1}`,
      dreamId: dream.id,
      messages: [{ id: `m${index + 1}`, role: 'assistant', content: `reading ${index + 1}`, timestamp: 't' }],
      symbols: [],
      archetypes: [],
      createdAt: 't',
      updatedAt: 't',
    }));
    mockDreams.mockResolvedValue(dreams);
    mockInterpretations.mockResolvedValue(interpretations);

    const latestTwo = await getRecentPatternInsightEntries(2);
    expect(latestTwo.map((entry) => entry.date)).toEqual(['2025-06-05', '2025-06-06']);
    await expect(getRecentPatternInsightEntries(3)).resolves.toHaveLength(3);
    const latestFive = await getRecentPatternInsightEntries(5);
    expect(latestFive.map((entry) => entry.date)).toEqual([
      '2025-06-02',
      '2025-06-03',
      '2025-06-04',
      '2025-06-05',
      '2025-06-06',
    ]);
  });

  it('generateRecentDreamFieldReflection delegates to AI without archive storage', async () => {
    const dreams: Dream[] = [
      { id: 'd1', date: '2025-06-01', content: 'one', createdAt: 'x', updatedAt: 'x' },
      { id: 'd2', date: '2025-06-02', content: 'two', createdAt: 'x', updatedAt: 'x' },
      { id: 'd3', date: '2025-06-03', content: 'three', createdAt: 'x', updatedAt: 'x' },
    ];
    const interpretations: Interpretation[] = dreams.map((dream) => ({
      id: `i-${dream.id}`,
      dreamId: dream.id,
      messages: [{ id: `m-${dream.id}`, role: 'assistant', content: `reading ${dream.id}`, timestamp: 't' }],
      symbols: [],
      archetypes: [],
      createdAt: 't',
      updatedAt: 't',
    }));
    mockDreams.mockResolvedValue(dreams);
    mockInterpretations.mockResolvedValue(interpretations);

    await expect(generateRecentDreamFieldReflection(2, 'el')).resolves.toBe('recent reflection');
    expect(mockGenerateRecentFromAi).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ date: '2025-06-02' }),
        expect.objectContaining({ date: '2025-06-03' }),
      ]),
      'el'
    );
  });

  it('generateRecentDreamFieldReflection reuses cached exact recent sequence by dream-id hash', async () => {
    const dreams: Dream[] = [
      { id: 'd1', date: '2025-06-01', content: 'one', createdAt: 'x', updatedAt: 'x' },
      { id: 'd2', date: '2025-06-02', content: 'two', createdAt: 'x', updatedAt: 'x' },
    ];
    const interpretations: Interpretation[] = dreams.map((dream) => ({
      id: `i-${dream.id}`,
      dreamId: dream.id,
      messages: [{ id: `m-${dream.id}`, role: 'assistant', content: `reading ${dream.id}`, timestamp: 't' }],
      symbols: [],
      archetypes: [],
      createdAt: 't',
      updatedAt: 't',
    }));
    mockDreams.mockResolvedValue(dreams);
    mockInterpretations.mockResolvedValue(interpretations);

    await expect(generateRecentDreamFieldReflection(2, 'en')).resolves.toBe('recent reflection');
    await expect(generateRecentDreamFieldReflection(2, 'en')).resolves.toBe('recent reflection');

    expect(mockGenerateRecentFromAi).toHaveBeenCalledTimes(1);
  });
});
