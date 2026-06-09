import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Dream } from '../types/dream';
import {
  extractDreamSymbolsAndArchetypes,
  type DreamExtraction,
} from './ai';
import { logError, logInfo } from './logger';
import { isOnline } from '../utils/network';

type CachedDreamMetadata = {
  contentHash: string;
  generatedAt: string;
  extraction: DreamExtraction;
};

const CACHE_PREFIX = '@dream_metadata_prefetch:';
const inFlight = new Map<string, Promise<DreamExtraction | null>>();

const contentHashForDream = (dream: Dream): string => {
  const input = `${dream.title ?? ''}\n${dream.date}\n${dream.content}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return `${input.length}:${hash >>> 0}`;
};

const cacheKeyForDream = (dream: Dream): string => `${CACHE_PREFIX}${dream.id}`;

const isEmptyExtraction = (extraction: DreamExtraction): boolean =>
  extraction.symbols.length === 0 &&
  extraction.symbol_stances.length === 0 &&
  extraction.archetypes.length === 0 &&
  extraction.landscapes.length === 0 &&
  extraction.affects.length === 0 &&
  extraction.motifs.length === 0 &&
  extraction.relational_dynamics.length === 0 &&
  extraction.thresholds.length === 0 &&
  extraction.central_conflicts.length === 0 &&
  !extraction.core_mode &&
  extraction.amplifications.length === 0 &&
  !extraction.display_distillation;

async function readCachedDreamMetadata(dream: Dream): Promise<DreamExtraction | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKeyForDream(dream));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedDreamMetadata;
    if (parsed.contentHash !== contentHashForDream(dream)) return null;
    return parsed.extraction;
  } catch (error) {
    logError('dream_metadata_prefetch_read_error', error, { dreamId: dream.id });
    return null;
  }
}

async function writeCachedDreamMetadata(dream: Dream, extraction: DreamExtraction): Promise<void> {
  if (isEmptyExtraction(extraction)) return;

  const record: CachedDreamMetadata = {
    contentHash: contentHashForDream(dream),
    generatedAt: new Date().toISOString(),
    extraction,
  };

  try {
    await AsyncStorage.setItem(cacheKeyForDream(dream), JSON.stringify(record));
  } catch (error) {
    logError('dream_metadata_prefetch_write_error', error, { dreamId: dream.id });
  }
}

async function extractAndCacheDreamMetadata(
  dream: Dream,
  finalInterpretation: string = ''
): Promise<DreamExtraction> {
  const extraction = await extractDreamSymbolsAndArchetypes(dream, finalInterpretation);
  await writeCachedDreamMetadata(dream, extraction);
  return extraction;
}

export function prefetchDreamMetadata(dream: Dream): void {
  if (!dream.content.trim()) return;

  const key = `${dream.id}:${contentHashForDream(dream)}`;
  if (inFlight.has(key)) return;

  const promise = (async () => {
    const cached = await readCachedDreamMetadata(dream);
    if (cached) return cached;

    if (!(await isOnline())) return null;

    logInfo('dream_metadata_prefetch_start', { dreamId: dream.id });
    const extraction = await extractAndCacheDreamMetadata(dream);
    logInfo('dream_metadata_prefetch_done', {
      dreamId: dream.id,
      symbolsCount: extraction.symbols.length,
      motifsCount: extraction.motifs.length,
    });
    return isEmptyExtraction(extraction) ? null : extraction;
  })().catch((error) => {
    logError('dream_metadata_prefetch_error', error, { dreamId: dream.id });
    return null;
  }).finally(() => {
    inFlight.delete(key);
  });

  inFlight.set(key, promise);
}

export async function getDreamMetadataForReflection(
  dream: Dream,
  finalInterpretation: string
): Promise<DreamExtraction> {
  const key = `${dream.id}:${contentHashForDream(dream)}`;
  const cached = await readCachedDreamMetadata(dream);
  if (cached) return cached;

  const pending = inFlight.get(key);
  if (pending) {
    const prefetched = await pending;
    if (prefetched) return prefetched;
  }

  const extracted = await extractAndCacheDreamMetadata(dream, finalInterpretation);
  return extracted;
}
