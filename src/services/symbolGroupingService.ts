/**
 * Symbol grouping service — caches AI-based semantic grouping of symbols/landscapes.
 * A single cheap API call per type, only re-runs when the unique term set changes.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { groupSimilarTerms } from './ai';

const SYMBOL_CACHE_KEY = 'oneiros_symbol_grouping_v2';
const LANDSCAPE_CACHE_KEY = 'oneiros_landscape_grouping_v1';
const MOTIF_CACHE_KEY = 'oneiros_motif_grouping_v1';

type TermCache = {
  hash: string;
  groupMap: Record<string, string>;
};

/** Simple djb2-style hash of a sorted list of strings. */
function computeHash(items: string[]): string {
  const s = [...items].sort().join('|');
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  }
  return h.toString(16);
}

async function loadTermCache(key: string): Promise<TermCache | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as TermCache) : null;
  } catch {
    return null;
  }
}

async function saveTermCache(key: string, cache: TermCache): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(cache));
  } catch {}
}

/**
 * Returns a variant→canonical groupMap for symbols.
 * Uses cached result when the unique symbol set hasn't changed.
 */
export async function getSymbolGroupMap(
  uniqueSymbols: string[]
): Promise<Record<string, string>> {
  if (uniqueSymbols.length < 2) return {};

  const hash = computeHash(uniqueSymbols);
  const cached = await loadTermCache(SYMBOL_CACHE_KEY);
  if (cached?.hash === hash) return cached.groupMap;

  const { symbolGroupMap } = await groupSimilarTerms(uniqueSymbols, []);
  await saveTermCache(SYMBOL_CACHE_KEY, { hash, groupMap: symbolGroupMap });
  return symbolGroupMap;
}

/**
 * Returns a variant→canonical groupMap for motifs.
 * Uses cached result when the unique motif set hasn't changed.
 */
export async function getMotifGroupMap(
  uniqueMotifs: string[]
): Promise<Record<string, string>> {
  if (uniqueMotifs.length < 2) return {};

  const hash = computeHash(uniqueMotifs);
  const cached = await loadTermCache(MOTIF_CACHE_KEY);
  if (cached?.hash === hash) return cached.groupMap;

  // Motifs reuse the symbols slot in groupSimilarTerms (same language, same rules)
  const { symbolGroupMap } = await groupSimilarTerms(uniqueMotifs, []);
  await saveTermCache(MOTIF_CACHE_KEY, { hash, groupMap: symbolGroupMap });
  return symbolGroupMap;
}

/**
 * Returns a variant→canonical groupMap for landscapes.
 * Uses cached result when the unique landscape set hasn't changed.
 */
export async function getLandscapeGroupMap(
  uniqueLandscapes: string[]
): Promise<Record<string, string>> {
  if (uniqueLandscapes.length < 2) return {};

  const hash = computeHash(uniqueLandscapes);
  const cached = await loadTermCache(LANDSCAPE_CACHE_KEY);
  if (cached?.hash === hash) return cached.groupMap;

  const { landscapeGroupMap } = await groupSimilarTerms([], uniqueLandscapes);
  await saveTermCache(LANDSCAPE_CACHE_KEY, { hash, groupMap: landscapeGroupMap });
  return landscapeGroupMap;
}

/**
 * Merges variant entries into their canonical entry in a byKey map.
 * Mutates the map in place.
 */
export function applyGroupMap(
  byKey: Map<string, { count: number; displayName: string }>,
  groupMap: Record<string, string>
): void {
  for (const [variant, canonical] of Object.entries(groupMap)) {
    if (variant === canonical) continue;
    const variantEntry = byKey.get(variant);
    if (!variantEntry) continue;
    const canonicalEntry = byKey.get(canonical);
    if (!canonicalEntry) continue;

    if (variantEntry.count > canonicalEntry.count) {
      canonicalEntry.displayName = variantEntry.displayName;
    }
    canonicalEntry.count += variantEntry.count;
    byKey.delete(variant);
  }
}

/** Call after saving a new dream so the next insights load triggers a fresh grouping. */
export async function invalidateSymbolGroupingCache(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(SYMBOL_CACHE_KEY),
      AsyncStorage.removeItem(LANDSCAPE_CACHE_KEY),
      AsyncStorage.removeItem(MOTIF_CACHE_KEY),
    ]);
  } catch {}
}
