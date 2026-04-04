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
} from '../../src/services/patternInsightsService';
import type { Dream, Interpretation } from '../../src/types/dream';

jest.mock('../../src/services/storageService', () => ({
  StorageService: {
    getDreams: jest.fn(),
    getInterpretations: jest.fn(),
  },
}));

import { StorageService } from '../../src/services/storageService';

const mockDreams = StorageService.getDreams as jest.Mock;
const mockInterpretations = StorageService.getInterpretations as jest.Mock;

describe('patternInsightsService flow', () => {
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
        summary: 's',
        createdAt: 't',
        updatedAt: 't',
      },
      {
        id: 'i2',
        dreamId: 'd2',
        messages: [{ id: 'm2', role: 'assistant', content: 'old', timestamp: 't' }],
        symbols: [],
        archetypes: [],
        summary: 's2',
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
});
