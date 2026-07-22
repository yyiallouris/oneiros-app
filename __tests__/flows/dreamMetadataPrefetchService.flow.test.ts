/**
 * Flow coverage: documentation/architecture-interpretation.md (metadata prefetch and extraction cache).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Dream } from '../../src/types/dream';
import type { DreamExtraction } from '../../src/services/ai';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../../src/services/ai', () => ({
  extractDreamSymbolsAndArchetypes: jest.fn(),
}));

jest.mock('../../src/utils/network', () => ({
  isOnline: jest.fn(),
}));

import { extractDreamSymbolsAndArchetypes } from '../../src/services/ai';
import { isOnline } from '../../src/utils/network';
import {
  getDreamMetadataForReflection,
  prefetchDreamMetadata,
} from '../../src/services/dreamMetadataPrefetchService';

const mockExtract = extractDreamSymbolsAndArchetypes as jest.MockedFunction<typeof extractDreamSymbolsAndArchetypes>;
const mockIsOnline = isOnline as jest.MockedFunction<typeof isOnline>;

const dreamFixture = (overrides: Partial<Dream> = {}): Dream => ({
  id: 'dream-1',
  title: 'Door',
  date: '2026-04-01',
  content: 'A red door would not open.',
  archived: false,
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-01T00:00:00.000Z',
  ...overrides,
});

const extractionFixture = (symbol = 'red door'): DreamExtraction => ({
  display_distillation: {
    essence_title: 'Guarded entry',
    essence_line: 'The dream gathers around a guarded threshold.',
    dominant_lens: 'threshold',
    visible_anchors: [
      { label: symbol, type: 'threshold', salience: 5, ui_meaning: 'a guarded point of entry' },
    ],
    main_tension: 'entry vs protection',
    dream_movement: 'approaching',
    movement_line: 'Something approaches without crossing.',
  },
  symbols: [symbol],
  symbol_stances: [{ symbol, stance: 'blocking, charged' }],
  archetypes: [],
  landscapes: ['hallway'],
  affects: ['tension'],
  motifs: ['blocked threshold'],
  relational_dynamics: ['distance at entry'],
  thresholds: ['closed door'],
  central_conflicts: ['wanting entry vs blocked door'],
  core_mode: 'Core Tension',
  amplifications: [],
});

const flushPromises = () => new Promise<void>((resolve) => setImmediate(resolve));

describe('dream metadata prefetch flow', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    mockIsOnline.mockResolvedValue(true);
  });

  it('reuses cached metadata when the dream content hash is unchanged', async () => {
    mockExtract.mockResolvedValue(extractionFixture());
    const dream = dreamFixture();

    await expect(getDreamMetadataForReflection(dream, 'final reading')).resolves.toMatchObject({
      symbols: ['red door'],
    });
    await expect(getDreamMetadataForReflection(dream, 'changed final reading')).resolves.toMatchObject({
      symbols: ['red door'],
    });

    expect(mockExtract).toHaveBeenCalledTimes(1);
    expect(mockExtract).toHaveBeenCalledWith(dream, 'final reading');
  });

  it('invalidates cached metadata when dream content changes', async () => {
    mockExtract
      .mockResolvedValueOnce(extractionFixture('red door'))
      .mockResolvedValueOnce(extractionFixture('blue gate'));

    await getDreamMetadataForReflection(dreamFixture({ content: 'A red door would not open.' }), 'first reading');
    const changedDream = dreamFixture({ content: 'A blue gate opened slowly.' });
    const extraction = await getDreamMetadataForReflection(changedDream, 'second reading');

    expect(extraction.symbols).toEqual(['blue gate']);
    expect(mockExtract).toHaveBeenCalledTimes(2);
    expect(mockExtract).toHaveBeenLastCalledWith(changedDream, 'second reading');
  });

  it('dedupes in-flight prefetch work and lets final reflection reuse the pending extraction', async () => {
    let resolveExtraction: (value: DreamExtraction) => void = () => undefined;
    mockExtract.mockImplementation(
      () => new Promise<DreamExtraction>((resolve) => {
        resolveExtraction = resolve;
      })
    );
    const dream = dreamFixture();

    prefetchDreamMetadata(dream);
    prefetchDreamMetadata(dream);
    const pending = getDreamMetadataForReflection(dream, 'final reading');
    await flushPromises();

    expect(mockExtract).toHaveBeenCalledTimes(1);
    expect(mockExtract).toHaveBeenCalledWith(dream, '');

    resolveExtraction(extractionFixture());
    await expect(pending).resolves.toMatchObject({ symbols: ['red door'] });
  });

  it('skips offline prefetch without writing an empty cache entry', async () => {
    mockIsOnline.mockResolvedValue(false);
    const dream = dreamFixture();

    prefetchDreamMetadata(dream);
    await flushPromises();

    expect(mockExtract).not.toHaveBeenCalled();
    expect(await AsyncStorage.getItem('@dream_metadata_prefetch:dream-1')).toBeNull();
  });
});
