/**
 * Flow coverage: documentation/flows-07-insights-reports.md
 * (semantic grouping cache, grouping invalidation, canonical merges).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  applyGroupMap,
  getLandscapeGroupMap,
  getMotifGroupMap,
  getSymbolGroupMap,
  invalidateSymbolGroupingCache,
} from '../../src/services/symbolGroupingService';
import { groupSimilarTerms } from '../../src/services/ai';

jest.mock('../../src/services/ai', () => ({
  groupSimilarTerms: jest.fn(),
}));

const mockGroupSimilarTerms = groupSimilarTerms as jest.MockedFunction<typeof groupSimilarTerms>;

describe('symbol grouping service flow', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('returns an empty group map for one or zero terms', async () => {
    await expect(getSymbolGroupMap([])).resolves.toEqual({});
    await expect(getSymbolGroupMap(['moon'])).resolves.toEqual({});
    expect(mockGroupSimilarTerms).not.toHaveBeenCalled();
  });

  it('does not start AI grouping on a cache miss by default', async () => {
    await expect(getSymbolGroupMap(['moons', 'moon'])).resolves.toEqual({});
    expect(mockGroupSimilarTerms).not.toHaveBeenCalled();
  });

  it('groups symbols through AI when refresh is explicit and reuses cache regardless of input order', async () => {
    mockGroupSimilarTerms.mockResolvedValueOnce({
      symbolGroupMap: { moons: 'moon' },
      landscapeGroupMap: {},
    });

    await expect(getSymbolGroupMap(['moons', 'moon'], { allowAiRefresh: true })).resolves.toEqual({ moons: 'moon' });
    await expect(getSymbolGroupMap(['moon', 'moons'])).resolves.toEqual({ moons: 'moon' });

    expect(mockGroupSimilarTerms).toHaveBeenCalledTimes(1);
    expect(mockGroupSimilarTerms).toHaveBeenCalledWith(['moons', 'moon'], []);
  });

  it('recovers from invalid cached JSON without starting AI unless refresh is explicit', async () => {
    await AsyncStorage.setItem('oneiros_symbol_grouping_v2', '{not-json');

    await expect(getSymbolGroupMap(['moons', 'moon'])).resolves.toEqual({});
    expect(mockGroupSimilarTerms).not.toHaveBeenCalled();

    mockGroupSimilarTerms.mockResolvedValueOnce({
      symbolGroupMap: { moons: 'moon' },
      landscapeGroupMap: {},
    });

    await expect(getSymbolGroupMap(['moons', 'moon'], { allowAiRefresh: true })).resolves.toEqual({ moons: 'moon' });
    expect(mockGroupSimilarTerms).toHaveBeenCalledTimes(1);
  });

  it('keeps separate caches for motifs and landscapes', async () => {
    mockGroupSimilarTerms
      .mockResolvedValueOnce({ symbolGroupMap: { falling: 'fall' }, landscapeGroupMap: {} })
      .mockResolvedValueOnce({ symbolGroupMap: {}, landscapeGroupMap: { beaches: 'beach' } });

    await expect(getMotifGroupMap(['falling', 'fall'], { allowAiRefresh: true })).resolves.toEqual({ falling: 'fall' });
    await expect(getLandscapeGroupMap(['beaches', 'beach'], { allowAiRefresh: true })).resolves.toEqual({ beaches: 'beach' });

    expect(mockGroupSimilarTerms).toHaveBeenNthCalledWith(1, ['falling', 'fall'], []);
    expect(mockGroupSimilarTerms).toHaveBeenNthCalledWith(2, [], ['beaches', 'beach']);
  });

  it('invalidates all grouping caches', async () => {
    mockGroupSimilarTerms.mockResolvedValue({
      symbolGroupMap: { moons: 'moon' },
      landscapeGroupMap: { beaches: 'beach' },
    });

    await getSymbolGroupMap(['moons', 'moon'], { allowAiRefresh: true });
    await getLandscapeGroupMap(['beaches', 'beach'], { allowAiRefresh: true });
    await invalidateSymbolGroupingCache();
    await getSymbolGroupMap(['moons', 'moon'], { allowAiRefresh: true });

    expect(mockGroupSimilarTerms).toHaveBeenCalledTimes(3);
  });

  it('merges variant counts into canonical entries and preserves the strongest display name', () => {
    const byKey = new Map<string, { count: number; displayName: string }>([
      ['moon', { count: 2, displayName: 'Moon' }],
      ['moons', { count: 5, displayName: 'Moons' }],
      ['sun', { count: 1, displayName: 'Sun' }],
    ]);

    applyGroupMap(byKey, {
      moons: 'moon',
      sun: 'sun',
      missing: 'moon',
    });

    expect(byKey.get('moon')).toEqual({ count: 7, displayName: 'Moons' });
    expect(byKey.has('moons')).toBe(false);
    expect(byKey.get('sun')).toEqual({ count: 1, displayName: 'Sun' });
  });
});
