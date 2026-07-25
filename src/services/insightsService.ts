/**
 * Insights service – personal and time-based aggregations.
 * No meaning synthesis; frequency + reference to dreams only.
 */

import pluralize from 'pluralize';
import { StorageService } from './storageService';
import { canonicalArchetypeLabels } from '../ai/archetypalEchoes';
import { ARCHETYPE_WHITELIST, normalizeArchetype } from '../constants/archetypes';
import { isExplicitSymbol, toSafeSymbolLabel } from '../constants/safeLabels';
import {
  getSymbolGroupMap,
  getLandscapeGroupMap,
  getMotifGroupMap,
  applyGroupMap,
  type GroupableTerm,
} from './symbolGroupingService';
import type {
  SymbolCount,
  ArchetypeCount,
  LandscapeCount,
  MotifCount,
  ThresholdCount,
  CentralConflictCount,
  AffectCount,
  CrossCategoryPatternItem,
  InsightsOverviewModel,
  InsightPatternKind,
  SymbolMonthCount,
  ArchetypeMonthCount,
  InsightsPeriod,
} from '../types/insights';

const LEADING_ARTICLE_RE = /^(the|a|an)\s+/;

/**
 * Merge entries where all words of a shorter key appear in a longer key.
 * Requires ≥2 words in the shorter key to avoid false positives on single-word symbols.
 * Mutates the map in place. Dream-id sets are unioned so counts stay distinct-dream.
 */
function mergeSubsetKeys(byKey: Map<string, GroupableTerm>): void {
  const entries = Array.from(byKey.entries()).map(([key, val]) => ({
    key,
    val,
    words: key.split(/\s+/),
  }));
  entries.sort((a, b) => a.words.length - b.words.length);

  const absorbed = new Set<string>();

  for (let i = 0; i < entries.length; i++) {
    const shorter = entries[i];
    if (absorbed.has(shorter.key) || shorter.words.length < 2) continue;

    for (let j = i + 1; j < entries.length; j++) {
      const longer = entries[j];
      if (absorbed.has(longer.key)) continue;

      const allMatch = shorter.words.every((w) => longer.words.includes(w));
      if (!allMatch) continue;

      const target = byKey.get(shorter.key)!;
      const source = byKey.get(longer.key)!;
      if (source.dreamIds.size > target.dreamIds.size) {
        target.displayName = source.displayName;
      }
      source.dreamIds.forEach((id) => target.dreamIds.add(id));
      byKey.delete(longer.key);
      absorbed.add(longer.key);
    }
  }
}

function addTermToDreamAgg(
  byKey: Map<string, GroupableTerm>,
  raw: string,
  dreamId: string,
  normalizeKey: (raw: string) => string = normalizeSymbolKey
): void {
  if (!raw || typeof raw !== 'string') return;
  const key = normalizeKey(raw);
  if (!key) return;
  const existing = byKey.get(key);
  if (existing) {
    existing.dreamIds.add(dreamId);
    return;
  }
  byKey.set(key, { displayName: raw.trim(), dreamIds: new Set([dreamId]) });
}

function toSortedTermCounts(
  byKey: Map<string, GroupableTerm>
): { name: string; normalizedKey: string; count: number }[] {
  return Array.from(byKey.entries())
    .map(([key, v]) => ({
      name: v.displayName,
      normalizedKey: key,
      count: v.dreamIds.size,
    }))
    .sort((a, b) => b.count - a.count);
}

/** Normalize symbol for grouping: lowercase, trim, strip leading articles, singularize */
export function normalizeSymbolKey(raw: string): string {
  const base = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(LEADING_ARTICLE_RE, '');
  return pluralize.singular(base);
}

/** Normalize landscape for filtering (same pipeline as normalizeSymbolKey) */
export function normalizeLandscapeKey(raw: string): string {
  const base = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(LEADING_ARTICLE_RE, '');
  return pluralize.singular(base);
}

/**
 * Returns true if a raw symbol string matches a filter key,
 * using exact match OR word-set subset (same rule as mergeSubsetKeys).
 */
export function symbolKeyMatches(candidateRaw: string, filterKey: string): boolean {
  const candidateKey = normalizeSymbolKey(candidateRaw);
  if (candidateKey === filterKey) return true;

  const candidateWords = candidateKey.split(/\s+/);
  const filterWords = filterKey.split(/\s+/);
  const [shorter, longer] =
    candidateWords.length <= filterWords.length
      ? [candidateWords, filterWords]
      : [filterWords, candidateWords];

  if (shorter.length < 2) return false;
  return shorter.every((w) => longer.includes(w));
}

/**
 * Returns true if a raw motif string matches a filter key,
 * using exact match OR word-set subset (same pipeline as symbols).
 */
export function motifKeyMatches(candidateRaw: string, filterKey: string): boolean {
  return symbolKeyMatches(candidateRaw, filterKey);
}

/**
 * Returns true if a raw landscape string matches a filter key,
 * using exact match OR word-set subset.
 */
export function landscapeKeyMatches(candidateRaw: string, filterKey: string): boolean {
  const candidateKey = normalizeLandscapeKey(candidateRaw);
  if (candidateKey === filterKey) return true;

  const candidateWords = candidateKey.split(/\s+/);
  const filterWords = filterKey.split(/\s+/);
  const [shorter, longer] =
    candidateWords.length <= filterWords.length
      ? [candidateWords, filterWords]
      : [filterWords, candidateWords];

  if (shorter.length < 2) return false;
  return shorter.every((w) => longer.includes(w));
}

/** Pick display name (first occurrence wins; we keep original casing from dreams) */
function symbolDisplayName(counts: Map<string, GroupableTerm>): Map<string, SymbolCount> {
  const out = new Map<string, SymbolCount>();
  counts.forEach((v, key) => {
    out.set(key, {
      name: v.displayName,
      normalizedKey: key,
      count: v.dreamIds.size,
    });
  });
  return out;
}

/** Filter dreams by period (inclusive). Dates are YYYY-MM-DD. */
function dreamsInPeriod<T extends { date: string }>(dreams: T[], period: InsightsPeriod): T[] {
  return dreams.filter(
    (d) => d.date >= period.startDate && d.date <= period.endDate
  );
}

/**
 * Recurring symbols (personal): aggregate across dreams/interpretations in optional period.
 * Count by normalized key, sort by frequency desc.
 * Cached semantic groupings use the GLOBAL symbol set so the cache is period-independent.
 */
export async function getRecurringSymbols(period?: InsightsPeriod): Promise<SymbolCount[]> {
  const dreams = await StorageService.getDreams();
  const interpretations = await StorageService.getInterpretations();

  // Collect global unique keys (all dreams) for stable semantic grouping cache
  const globalSymbolKeys = new Set<string>();
  dreams.forEach((d) => d.symbols?.forEach((s) => {
    const k = normalizeSymbolKey(s); if (k) globalSymbolKeys.add(k);
  }));
  interpretations.forEach((i) => i.symbols?.forEach((s) => {
    const k = normalizeSymbolKey(s); if (k) globalSymbolKeys.add(k);
  }));

  // Period-filtered counts (distinct dreams per symbol)
  const filtered = period ? dreamsInPeriod(dreams, period) : dreams;
  const dreamIds = new Set(filtered.map((d) => d.id));
  const byKey = new Map<string, GroupableTerm>();

  filtered.forEach((d) => d.symbols?.forEach((s) => addTermToDreamAgg(byKey, s, d.id)));
  interpretations.forEach((i) => {
    if (dreamIds.has(i.dreamId)) i.symbols?.forEach((s) => addTermToDreamAgg(byKey, s, i.dreamId));
  });

  mergeSubsetKeys(byKey);
  const symbolGroupMap = await getSymbolGroupMap(Array.from(globalSymbolKeys));
  applyGroupMap(byKey, symbolGroupMap);
  const symbolCounts = Array.from(symbolDisplayName(byKey).values());
  return symbolCounts.sort((a, b) => b.count - a.count);
}

/**
 * Recurring archetypes (personal): same logic as symbols, optional period.
 * Only whitelisted archetypes, sorted by count desc.
 */
export async function getRecurringArchetypes(period?: InsightsPeriod): Promise<ArchetypeCount[]> {
  const dreams = await StorageService.getDreams();
  const filtered = period ? dreamsInPeriod(dreams, period) : dreams;
  const dreamIds = new Set(filtered.map((d) => d.id));
  const interpretations = await StorageService.getInterpretations();
  const byName = new Map<string, Set<string>>();

  const addArchetype = (raw: string, dreamId: string) => {
    const normalized = normalizeArchetype(raw);
    if (!normalized) return;
    const existing = byName.get(normalized);
    if (existing) {
      existing.add(dreamId);
      return;
    }
    byName.set(normalized, new Set([dreamId]));
  };

  filtered.forEach((d) => {
    d.archetypes?.forEach((a) => addArchetype(a, d.id));
  });
  interpretations.forEach((i) => {
    if (dreamIds.has(i.dreamId)) {
      canonicalArchetypeLabels(i.archetypes).forEach((a) => addArchetype(a, i.dreamId));
    }
  });

  return ARCHETYPE_WHITELIST.filter((a) => byName.has(a)).map((name) => ({
    name,
    count: byName.get(name)?.size ?? 0,
  })).sort((a, b) => b.count - a.count);
}

/**
 * Recurring landscapes (settings/places): optional period.
 * Aggregate from dreams and interpretations, count by normalized key, sort by frequency desc.
 * Cached semantic groupings use the GLOBAL landscape set so the cache is period-independent.
 */
export async function getRecurringLandscapes(period?: InsightsPeriod): Promise<LandscapeCount[]> {
  const dreams = await StorageService.getDreams();
  const interpretations = await StorageService.getInterpretations();

  // Collect global unique keys (all dreams) for stable semantic grouping cache
  const globalLandscapeKeys = new Set<string>();
  dreams.forEach((d) => d.landscapes?.forEach((l) => {
    const k = normalizeLandscapeKey(l); if (k) globalLandscapeKeys.add(k);
  }));
  interpretations.forEach((i) => i.landscapes?.forEach((l) => {
    const k = normalizeLandscapeKey(l); if (k) globalLandscapeKeys.add(k);
  }));

  // Period-filtered counts (distinct dreams per landscape)
  const filtered = period ? dreamsInPeriod(dreams, period) : dreams;
  const dreamIds = new Set(filtered.map((d) => d.id));
  const byKey = new Map<string, GroupableTerm>();

  filtered.forEach((d) =>
    d.landscapes?.forEach((l) => addTermToDreamAgg(byKey, l, d.id, normalizeLandscapeKey))
  );
  interpretations.forEach((i) => {
    if (dreamIds.has(i.dreamId)) {
      i.landscapes?.forEach((l) => addTermToDreamAgg(byKey, l, i.dreamId, normalizeLandscapeKey));
    }
  });

  mergeSubsetKeys(byKey);
  const landscapeGroupMap = await getLandscapeGroupMap(Array.from(globalLandscapeKeys));
  applyGroupMap(byKey, landscapeGroupMap);
  return toSortedTermCounts(byKey);
}

/**
 * Recurring motifs (structural/spatial patterns): from interpretations only.
 * Count by normalized key, sort by frequency desc.
 * Cached semantic groupings use the global motif set and are applied to period counts.
 */
export async function getRecurringMotifs(period?: InsightsPeriod): Promise<MotifCount[]> {
  const dreams = await StorageService.getDreams();
  const interpretations = await StorageService.getInterpretations();

  // Global unique motif keys for stable AI grouping cache
  const globalMotifKeys = new Set<string>();
  interpretations.forEach((i) => (i.motifs ?? []).forEach((m) => {
    const k = normalizeSymbolKey(m); if (k) globalMotifKeys.add(k);
  }));

  // Period-filtered counts (motifs live on interpretations only; distinct dreams)
  const filtered = period ? dreamsInPeriod(dreams, period) : dreams;
  const dreamIds = new Set(filtered.map((d) => d.id));
  const byKey = new Map<string, GroupableTerm>();

  interpretations.forEach((i) => {
    if (dreamIds.has(i.dreamId)) {
      (i.motifs ?? []).forEach((m) => addTermToDreamAgg(byKey, m, i.dreamId));
    }
  });

  mergeSubsetKeys(byKey);
  const motifGroupMap = await getMotifGroupMap(Array.from(globalMotifKeys));
  applyGroupMap(byKey, motifGroupMap);

  return toSortedTermCounts(byKey);
}

function aggregateInterpretationTerms(
  interpretations: Awaited<ReturnType<typeof StorageService.getInterpretations>>,
  dreamIds: Set<string>,
  selectTerms: (interpretation: typeof interpretations[number]) => string[] | undefined
): { name: string; normalizedKey: string; count: number }[] {
  const byKey = new Map<string, GroupableTerm>();

  interpretations.forEach((i) => {
    if (!dreamIds.has(i.dreamId)) return;
    (selectTerms(i) ?? []).forEach((term) => addTermToDreamAgg(byKey, term, i.dreamId));
  });

  mergeSubsetKeys(byKey);
  return toSortedTermCounts(byKey);
}

/** Recurring thresholds: transition points, not symbolic motifs. */
export async function getRecurringThresholds(period?: InsightsPeriod): Promise<ThresholdCount[]> {
  const dreams = await StorageService.getDreams();
  const interpretations = await StorageService.getInterpretations();
  const filtered = period ? dreamsInPeriod(dreams, period) : dreams;
  const dreamIds = new Set(filtered.map((d) => d.id));
  return aggregateInterpretationTerms(interpretations, dreamIds, (i) => i.thresholds);
}

/** Recurring central conflicts: dynamic tensions stated as "X vs Y". */
export async function getRecurringCentralConflicts(period?: InsightsPeriod): Promise<CentralConflictCount[]> {
  const dreams = await StorageService.getDreams();
  const interpretations = await StorageService.getInterpretations();
  const filtered = period ? dreamsInPeriod(dreams, period) : dreams;
  const dreamIds = new Set(filtered.map((d) => d.id));
  return aggregateInterpretationTerms(interpretations, dreamIds, (i) => i.central_conflicts);
}

/** Recurring affects: dominant felt tones from interpretations. */
export async function getRecurringAffects(period?: InsightsPeriod): Promise<AffectCount[]> {
  const dreams = await StorageService.getDreams();
  const interpretations = await StorageService.getInterpretations();
  const filtered = period ? dreamsInPeriod(dreams, period) : dreams;
  const dreamIds = new Set(filtered.map((d) => d.id));
  return aggregateInterpretationTerms(interpretations, dreamIds, (i) => i.affects);
}

/** Dreams with at least one interpretation in the period. */
export async function getInterpretedDreamsCountForPeriod(period: InsightsPeriod): Promise<number> {
  const dreams = await StorageService.getDreams();
  const interpretations = await StorageService.getInterpretations();
  const filtered = dreamsInPeriod(dreams, period);
  const dreamIds = new Set(filtered.map((d) => d.id));
  const interpretedDreamIds = new Set<string>();
  interpretations.forEach((i) => {
    if (dreamIds.has(i.dreamId)) interpretedDreamIds.add(i.dreamId);
  });
  return interpretedDreamIds.size;
}

const PATTERN_KIND_PRIORITY: Record<InsightPatternKind, number> = {
  image: 0,
  motif: 1,
  affect: 2,
  threshold: 3,
  tension: 4,
  place: 5,
  archetypal_echo: 6,
};

const patternKindLabel = (kind: InsightPatternKind): string => {
  switch (kind) {
    case 'image':
      return 'image';
    case 'motif':
      return 'recurring scene';
    case 'threshold':
      return 'threshold';
    case 'tension':
      return 'inner tension';
    case 'place':
      return 'place';
    case 'archetypal_echo':
      return 'archetypal echo';
    case 'affect':
      return 'emotional weather';
    default:
      return 'pattern';
  }
};

const joinNatural = (items: string[]): string => {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
};

function toPatternItems<T extends { name: string; count: number }>(
  items: T[],
  kind: InsightPatternKind,
  sectionId: CrossCategoryPatternItem['sectionId'],
  filterType?: NonNullable<CrossCategoryPatternItem['filter']>['type']
): CrossCategoryPatternItem[] {
  return items.map((item) => ({
    label: item.name,
    kind,
    count: item.count,
    sectionId,
    filter: filterType ? { type: filterType, value: item.name } : undefined,
  }));
}

export function buildStrongestPatterns(params: {
  images?: CrossCategoryPatternItem[];
  motifs?: CrossCategoryPatternItem[];
  thresholds?: CrossCategoryPatternItem[];
  tensions?: CrossCategoryPatternItem[];
  places?: CrossCategoryPatternItem[];
  /** Kept for callers; excluded from main Forming Patterns ranking. */
  archetypalEchoes?: CrossCategoryPatternItem[];
  affects?: CrossCategoryPatternItem[];
  limit?: number;
}): CrossCategoryPatternItem[] {
  const all = [
    ...(params.images ?? []),
    ...(params.motifs ?? []),
    ...(params.affects ?? []),
    ...(params.thresholds ?? []),
    ...(params.tensions ?? []),
    ...(params.places ?? []),
  ].filter((item) => item.label.trim().length > 0);

  const recurring = all.filter((item) => item.count >= 2);
  const source = recurring.length > 0 ? recurring : all;
  return source
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      const priority = PATTERN_KIND_PRIORITY[a.kind] - PATTERN_KIND_PRIORITY[b.kind];
      if (priority !== 0) return priority;
      return a.label.localeCompare(b.label);
    })
    .slice(0, params.limit ?? 5);
}

export function buildDreamFieldSummary(params: {
  interpretedDreamsCount: number;
  strongestPatterns: CrossCategoryPatternItem[];
}): string {
  const { interpretedDreamsCount, strongestPatterns } = params;
  if (interpretedDreamsCount === 0) {
    return 'No dream field yet. Reflect on a dream to begin seeing recurring images, places, and movements.';
  }

  if (strongestPatterns.length === 0) {
    return 'A light field is forming, but stronger patterns need more reflected dreams.';
  }

  const recurring = strongestPatterns.filter((item) => item.count >= 2);
  if (recurring.length === 0) {
    return `A light field is forming around ${joinNatural(strongestPatterns.slice(0, 3).map((item) => item.label))}, but stronger patterns need more reflected dreams.`;
  }

  const imageLabels = recurring.filter((item) => item.kind === 'image').slice(0, 3).map((item) => item.label);
  const pressure =
    recurring.find((item) => item.kind === 'threshold') ??
    recurring.find((item) => item.kind === 'tension') ??
    recurring.find((item) => item.kind === 'motif') ??
    recurring.find((item) => item.kind === 'place') ??
    recurring.find((item) => item.kind === 'affect');

  if (imageLabels.length > 0 && pressure && !imageLabels.includes(pressure.label)) {
    return `The field gathers around ${joinNatural(imageLabels)}, with a repeated ${patternKindLabel(pressure.kind)} near ${pressure.label}.`;
  }
  if (imageLabels.length > 0) {
    return `The field gathers around ${joinNatural(imageLabels)}.`;
  }
  if (pressure) {
    return `The field gathers around ${pressure.label}, a recurring ${patternKindLabel(pressure.kind)} in this period.`;
  }

  return `The field gathers around ${joinNatural(recurring.slice(0, 3).map((item) => item.label))}.`;
}

export async function getInsightsOverview(period: InsightsPeriod): Promise<InsightsOverviewModel> {
  const [
    dreamsLoggedCount,
    interpretedDreamsCount,
    symbols,
    motifs,
    thresholds,
    centralConflicts,
    landscapes,
    archetypes,
    affects,
  ] = await Promise.all([
    getDreamsCountForPeriod(period),
    getInterpretedDreamsCountForPeriod(period),
    getRecurringSymbols(period),
    getRecurringMotifs(period),
    getRecurringThresholds(period),
    getRecurringCentralConflicts(period),
    getRecurringLandscapes(period),
    getRecurringArchetypes(period),
    getRecurringAffects(period),
  ]);

  const topImages = toPatternItems(symbols, 'image', 'recurring-symbols', 'symbol').slice(0, 5);
  const topMotifs = toPatternItems(motifs, 'motif', 'symbolic-motifs', 'motif').slice(0, 5);
  const topThresholds = toPatternItems(thresholds, 'threshold', 'thresholds').slice(0, 5);
  const topTensions = toPatternItems(centralConflicts, 'tension', 'core-conflicts').slice(0, 5);
  const topPlaces = toPatternItems(landscapes, 'place', 'space-landscapes', 'landscape').slice(0, 5);
  const topArchetypalEchoes = toPatternItems(archetypes, 'archetypal_echo', 'recurring-archetypes').slice(0, 5);
  const topAffects = toPatternItems(affects, 'affect', 'emotional-weather').slice(0, 5);
  const strongestPatterns = buildStrongestPatterns({
    images: topImages,
    motifs: topMotifs,
    thresholds: topThresholds,
    tensions: topTensions,
    places: topPlaces,
    affects: topAffects,
  });

  return {
    dreamsLoggedCount,
    interpretedDreamsCount,
    topImages,
    topMotifs,
    topThresholds,
    topTensions,
    topPlaces,
    topArchetypalEchoes,
    topAffects,
    strongestPatterns,
    fieldSummary: buildDreamFieldSummary({ interpretedDreamsCount, strongestPatterns }),
  };
}

const THIS_MONTH = new Date().toISOString().slice(0, 7);

/**
 * Most frequent symbol this month (by count in current month). Fallback: top overall.
 */
export async function getMostFrequentSymbolThisMonth(
  allSymbols: SymbolCount[]
): Promise<string | null> {
  if (allSymbols.length === 0) return null;
  const { symbolByMonth } = await getPatternsOverTime();
  const thisMonth = symbolByMonth.filter((p) => p.month === THIS_MONTH);
  if (thisMonth.length === 0) return allSymbols[0]?.name ?? null;
  const topKey = thisMonth[0]?.symbol;
  const match = allSymbols.find((s) => s.normalizedKey === topKey);
  return match?.name ?? allSymbols[0]?.name ?? null;
}

/**
 * Most active archetype this month. Fallback: top overall.
 */
export async function getMostFrequentArchetypeThisMonth(
  allArchetypes: ArchetypeCount[]
): Promise<string | null> {
  if (allArchetypes.length === 0) return null;
  const { archetypeByMonth } = await getPatternsOverTime();
  const thisMonth = archetypeByMonth.filter((p) => p.month === THIS_MONTH);
  if (thisMonth.length === 0) return allArchetypes[0]?.name ?? null;
  return thisMonth[0]?.archetype ?? allArchetypes[0]?.name ?? null;
}

/** Canonical symbolic domains only (no "Themes" / no meta-category). */
export const SYMBOLIC_DOMAIN_LABELS = [
  'Body themes',
  'Nature / Elements',
  'Protection',
  'Figures',
  'Objects',
  'Intimacy themes',
  'Movement / Withdrawal',
] as const;

/** Cluster label → keywords (feedback: "Movement / Withdrawal") */
const SYMBOL_CLUSTER_KEYWORDS: Record<string, string[]> = {
  'Protection': ['jacket', 'helmet', 'shield', 'armor', 'wall', 'door', 'house', 'shelter'],
  'Nature / Elements': ['wind', 'water', 'fire', 'earth', 'open space', 'sky', 'mountain', 'tree', 'forest', 'river', 'sea', 'storm'],
  'Movement / Withdrawal': ['road', 'path', 'bridge', 'car', 'train', 'boat', 'flight', 'stairs', 'crossing', 'withdrawal', 'leaving'],
  'Figures': ['child', 'woman', 'man', 'stranger', 'shadow figure', 'animal'],
  'Objects': ['key', 'mirror', 'book', 'phone', 'light', 'lamp'],
};

/**
 * Group symbols into clusters for display. Symbols not matching any cluster appear in "Other".
 */
export function getSymbolClusters(symbols: SymbolCount[]): { clusterName: string; symbols: string[] }[] {
  const byCluster = new Map<string, string[]>();
  const matchedKeys = new Set<string>();

  for (const [clusterName, keywords] of Object.entries(SYMBOL_CLUSTER_KEYWORDS)) {
    const list: string[] = [];
    for (const s of symbols) {
      const key = s.normalizedKey;
      if (matchedKeys.has(key)) continue;
      const nameLower = s.name.toLowerCase();
      if (keywords.some((kw) => key.includes(kw) || nameLower.includes(kw))) {
        list.push(s.name);
        matchedKeys.add(key);
      }
    }
    if (list.length > 0) byCluster.set(clusterName, list);
  }

  const lessFrequent: string[] = symbols.filter((s) => !matchedKeys.has(s.normalizedKey)).map((s) => s.name);
  const result: { clusterName: string; symbols: string[] }[] = [];
  byCluster.forEach((symbolsList, clusterName) => result.push({ clusterName, symbols: symbolsList }));
  if (lessFrequent.length > 0) result.push({ clusterName: 'Less frequent symbols', symbols: lessFrequent });
  return result;
}

/** Get cluster name for a symbol (for main-screen abstract labels) */
function getClusterNameForSymbol(symbol: SymbolCount): string | null {
  const key = symbol.normalizedKey;
  const nameLower = symbol.name.toLowerCase();
  for (const [clusterName, keywords] of Object.entries(SYMBOL_CLUSTER_KEYWORDS)) {
    if (keywords.some((kw) => key.includes(kw) || nameLower.includes(kw))) return clusterName;
  }
  return null;
}

/**
 * Symbolic domain for a symbol: explicit → safe category, else cluster, else "Other".
 * No "Themes" as item (ontology: domain vs symbol vs association).
 */
export function getAbstractLabelForSymbol(symbol: SymbolCount): string {
  if (isExplicitSymbol(symbol.normalizedKey)) {
    return toSafeSymbolLabel(symbol.name, symbol.normalizedKey, false);
  }
  const cluster = getClusterNameForSymbol(symbol);
  return cluster ?? 'Other';
}

/** Unique domain labels for display (canonical only, no Other in overview bars). */
export function getAbstractLabelsForMainScreen(symbols: SymbolCount[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of symbols) {
    const label = getAbstractLabelForSymbol(s);
    if (seen.has(label)) continue;
    seen.add(label);
    if (SYMBOLIC_DOMAIN_LABELS.includes(label as typeof SYMBOLIC_DOMAIN_LABELS[number])) {
      out.push(label);
    }
    if (out.length >= 7) break;
  }
  return out;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** First and last day of month (YYYY-MM-DD). */
function monthBounds(YYYYMM: string): { start: string; end: string } {
  const [y, m] = YYYYMM.split('-').map(Number);
  const start = `${YYYYMM}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${YYYYMM}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

/** Period for current month. */
export function getPeriodThisMonth(): InsightsPeriod {
  const b = monthBounds(THIS_MONTH);
  return { startDate: b.start, endDate: b.end };
}

/** Period for previous month. */
export function getPeriodLastMonth(): InsightsPeriod {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  const yyyyMm = d.toISOString().slice(0, 7);
  const b = monthBounds(yyyyMm);
  return { startDate: b.start, endDate: b.end };
}

/** Period for last N months (including current). */
export function getPeriodLastNMonths(n: number): InsightsPeriod {
  const end = new Date();
  const start = new Date();
  start.setDate(1);
  start.setMonth(start.getMonth() - (n - 1));
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

/**
 * Period from the date the first dream was registered to today.
 * Lower bound = earliest dream date (not user account registration).
 * If there are no dreams, uses start of current month.
 */
export async function getPeriodAllTime(): Promise<InsightsPeriod> {
  const dreams = await StorageService.getDreams();
  const today = new Date().toISOString().slice(0, 10);
  if (dreams.length === 0) {
    const start = new Date();
    start.setDate(1);
    return { startDate: start.toISOString().slice(0, 10), endDate: today };
  }
  const minDate = dreams.reduce((min, d) => (d.date < min ? d.date : min), dreams[0].date);
  return { startDate: minDate, endDate: today };
}

/** Human-readable label (e.g. "This month", "October 2025", "October–November 2025"). */
export function getPeriodLabel(period: InsightsPeriod): string {
  const thisPeriod = getPeriodThisMonth();
  const lastPeriod = getPeriodLastMonth();
  if (period.startDate === thisPeriod.startDate && period.endDate === thisPeriod.endDate) {
    return 'This month';
  }
  if (period.startDate === lastPeriod.startDate && period.endDate === lastPeriod.endDate) {
    return 'Last month';
  }
  const startM = Number(period.startDate.slice(5, 7));
  const startY = period.startDate.slice(0, 4);
  const endM = Number(period.endDate.slice(5, 7));
  const endY = period.endDate.slice(0, 4);
  const startLabel = `${MONTH_NAMES[startM - 1]} ${startY}`;
  const endLabel = `${MONTH_NAMES[endM - 1]} ${endY}`;
  if (startLabel === endLabel) return startLabel;
  return `${startLabel}–${endLabel}`;
}

/** Dreams logged in the current month. */
export async function getDreamsThisMonthCount(): Promise<number> {
  const dreams = await StorageService.getDreams();
  const thisMonth = THIS_MONTH;
  return dreams.filter((d) => d.date.slice(0, 7) === thisMonth).length;
}

/** Dreams logged in a given period (inclusive). */
export async function getDreamsCountForPeriod(period: InsightsPeriod): Promise<number> {
  const dreams = await StorageService.getDreams();
  return dreamsInPeriod(dreams, period).length;
}

/** Recurring symbol patterns = count of distinct symbols with frequency > 1. */
export function getRecurringSymbolPatternsCount(symbols: SymbolCount[]): number {
  return symbols.filter((s) => s.count > 1).length;
}

/** Dominant symbolic domain = domain with the largest total symbol frequency. */
export function getDominantSymbolicDomain(symbols: SymbolCount[]): string | null {
  if (symbols.length === 0) return null;
  const byLabel = new Map<string, number>();
  for (const s of symbols) {
    const label = getAbstractLabelForSymbol(s);
    byLabel.set(label, (byLabel.get(label) ?? 0) + s.count);
  }
  let maxSum = 0;
  let dominant: string | null = null;
  byLabel.forEach((sum, label) => {
    if (sum > maxSum && label !== 'Other') {
      maxSum = sum;
      dominant = label;
    }
  });
  return dominant;
}

/** @deprecated Use getDominantSymbolicDomain. Kept for compatibility. */
export function getDominantSetting(symbols: SymbolCount[]): string | null {
  return getDominantSymbolicDomain(symbols);
}

/** Domain distribution for bar viz: only canonical domains, sorted by total count desc. */
export function getThemeDistributionForBars(symbols: SymbolCount[]): { label: string; count: number }[] {
  const byLabel = new Map<string, number>();
  const allowed = new Set(SYMBOLIC_DOMAIN_LABELS);
  for (const s of symbols) {
    const label = getAbstractLabelForSymbol(s);
    if (!allowed.has(label as typeof SYMBOLIC_DOMAIN_LABELS[number])) continue;
    byLabel.set(label, (byLabel.get(label) ?? 0) + s.count);
  }
  return Array.from(byLabel.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

/** True if symbol appears in any main cluster (has associations). */
export function symbolHasAssociations(
  symbolName: string,
  clusters: { clusterName: string; symbols: string[] }[]
): boolean {
  const mainClusters = clusters.filter((c) => c.clusterName !== 'Less frequent symbols');
  for (const cluster of mainClusters) {
    if (cluster.symbols.includes(symbolName)) return true;
  }
  return false;
}

/**
 * Associations for a single symbol: the cluster it belongs to and the other symbols in that cluster.
 * Returns null if symbol is not in any main cluster (e.g. in "Less frequent symbols").
 */
export function getAssociationsForSymbol(
  symbolName: string,
  clusters: { clusterName: string; symbols: string[] }[]
): { clusterName: string; relatedSymbols: string[] } | null {
  const mainClusters = clusters.filter((c) => c.clusterName !== 'Less frequent symbols');
  for (const cluster of mainClusters) {
    if (cluster.symbols.includes(symbolName)) {
      const relatedSymbols = cluster.symbols.filter((s) => s !== symbolName);
      return { clusterName: cluster.clusterName, relatedSymbols };
    }
  }
  return null;
}

/**
 * Patterns over time: symbol and archetype counts per month.
 * Simple data only; UI (graph/list/heatmap) can come later.
 */
export async function getPatternsOverTime(): Promise<{
  symbolByMonth: SymbolMonthCount[];
  archetypeByMonth: ArchetypeMonthCount[];
}> {
  const dreams = await StorageService.getDreams();
  const interpretations = await StorageService.getInterpretations();
  const dreamIds = new Set(dreams.map((d) => d.id));
  const dreamDateByDreamId = new Map(dreams.map((d) => [d.id, d.date]));

  const symbolByMonth = new Map<string, number>();
  const archetypeByMonth = new Map<string, number>();

  const monthFromDate = (dateStr: string) => dateStr.slice(0, 7);

  const addSymbolMonth = (symbol: string, dateStr: string) => {
    const key = normalizeSymbolKey(symbol);
    if (!key) return;
    const month = monthFromDate(dateStr);
    const mapKey = `${key}\t${month}`;
    symbolByMonth.set(mapKey, (symbolByMonth.get(mapKey) ?? 0) + 1);
  };

  const addArchetypeMonth = (archetype: string, dateStr: string) => {
    const norm = normalizeArchetype(archetype);
    if (!norm) return;
    const month = monthFromDate(dateStr);
    const mapKey = `${norm}\t${month}`;
    archetypeByMonth.set(mapKey, (archetypeByMonth.get(mapKey) ?? 0) + 1);
  };

  dreams.forEach((d) => {
    const month = monthFromDate(d.date);
    d.symbols?.forEach((s) => addSymbolMonth(s, d.date));
    d.archetypes?.forEach((a) => addArchetypeMonth(a, d.date));
  });

  interpretations.forEach((i) => {
    const dateStr = dreamDateByDreamId.get(i.dreamId);
    if (!dreamIds.has(i.dreamId) || !dateStr) return;
    i.symbols?.forEach((s) => addSymbolMonth(s, dateStr));
    canonicalArchetypeLabels(i.archetypes).forEach((a) => addArchetypeMonth(a, dateStr));
  });

  const symbolList: SymbolMonthCount[] = [];
  symbolByMonth.forEach((count, mapKey) => {
    const [symbol, month] = mapKey.split('\t');
    symbolList.push({ symbol, month, count });
  });

  const archetypeList: ArchetypeMonthCount[] = [];
  archetypeByMonth.forEach((count, mapKey) => {
    const [archetype, month] = mapKey.split('\t');
    archetypeList.push({ archetype, month, count });
  });

  symbolList.sort((a, b) => b.count - a.count);
  archetypeList.sort((a, b) => b.count - a.count);

  return { symbolByMonth: symbolList, archetypeByMonth: archetypeList };
}

/**
 * Monthly symbolic overview (auto-generated).
 * Placeholder: no AI run yet; returns empty. When implemented:
 * once per month, collect dominant symbols + archetypes, generate 1 short
 * reflective text (no advice, no "you should").
 */
export async function getMonthlyOverview(): Promise<
  { month: string; text: string }[]
> {
  // TODO: implement monthly job + AI-generated short text
  return [];
}

/**
 * Collective dreaming (anonymized aggregate).
 * Placeholder: no backend yet. When implemented:
 * NO individual data, NO quotes, NO dates tied to users.
 * Only global counts & trends (e.g. top symbols this month, archetype ↑/↓).
 * Statistical aggregation only, not psychological profiling.
 */
export async function getCollectiveInsights(): Promise<{
  topSymbolsThisMonth: { symbol: string; count: number }[];
  archetypeTrends: { archetype: string; direction: 'up' | 'down' | 'stable' }[];
}> {
  // TODO: backend endpoint with anonymized aggregates
  return {
    topSymbolsThisMonth: [],
    archetypeTrends: [],
  };
}
