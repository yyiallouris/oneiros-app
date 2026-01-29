/**
 * Insights service – personal and time-based aggregations.
 * No meaning synthesis; frequency + reference to dreams only.
 */

import { StorageService } from './storageService';
import { ARCHETYPE_WHITELIST, normalizeArchetype } from '../constants/archetypes';
import { isExplicitSymbol, toSafeSymbolLabel } from '../constants/safeLabels';
import type {
  SymbolCount,
  ArchetypeCount,
  LandscapeCount,
  SymbolMonthCount,
  ArchetypeMonthCount,
  InsightsPeriod,
} from '../types/insights';

/** Normalize symbol for grouping: lowercase, trim, collapse spaces */
export function normalizeSymbolKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/** Pick display name (first occurrence wins; we keep original casing from dreams) */
function symbolDisplayName(
  counts: Map<string, { count: number; displayName: string }>
): Map<string, SymbolCount> {
  const out = new Map<string, SymbolCount>();
  counts.forEach((v, key) => {
    out.set(key, {
      name: v.displayName,
      normalizedKey: key,
      count: v.count,
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
 */
export async function getRecurringSymbols(period?: InsightsPeriod): Promise<SymbolCount[]> {
  const dreams = await StorageService.getDreams();
  const filtered = period ? dreamsInPeriod(dreams, period) : dreams;
  const dreamIds = new Set(filtered.map((d) => d.id));
  const interpretations = await StorageService.getInterpretations();
  const byKey = new Map<string, { count: number; displayName: string }>();

  const addSymbol = (raw: string) => {
    if (!raw || typeof raw !== 'string') return;
    const key = normalizeSymbolKey(raw);
    if (!key) return;
    const existing = byKey.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      byKey.set(key, { count: 1, displayName: raw.trim() });
    }
  };

  filtered.forEach((d) => {
    d.symbols?.forEach(addSymbol);
  });
  interpretations.forEach((i) => {
    if (dreamIds.has(i.dreamId)) {
      i.symbols?.forEach(addSymbol);
    }
  });

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
  const counts = new Map<string, number>();

  const addArchetype = (raw: string) => {
    const normalized = normalizeArchetype(raw);
    if (!normalized) return;
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  };

  filtered.forEach((d) => {
    d.archetypes?.forEach(addArchetype);
  });
  interpretations.forEach((i) => {
    if (dreamIds.has(i.dreamId)) {
      i.archetypes?.forEach(addArchetype);
    }
  });

  return ARCHETYPE_WHITELIST.filter((a) => counts.has(a)).map((name) => ({
    name,
    count: counts.get(name) ?? 0,
  })).sort((a, b) => b.count - a.count);
}

/** Normalize landscape for grouping (same as symbols) */
function normalizeLandscapeKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Recurring landscapes (settings/places): optional period.
 * Aggregate from dreams and interpretations, count by normalized key, sort by frequency desc.
 */
export async function getRecurringLandscapes(period?: InsightsPeriod): Promise<LandscapeCount[]> {
  const dreams = await StorageService.getDreams();
  const filtered = period ? dreamsInPeriod(dreams, period) : dreams;
  const dreamIds = new Set(filtered.map((d) => d.id));
  const interpretations = await StorageService.getInterpretations();
  const byKey = new Map<string, { count: number; displayName: string }>();

  const addLandscape = (raw: string) => {
    if (!raw || typeof raw !== 'string') return;
    const key = normalizeLandscapeKey(raw);
    if (!key) return;
    const existing = byKey.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      byKey.set(key, { count: 1, displayName: raw.trim() });
    }
  };

  filtered.forEach((d) => {
    d.landscapes?.forEach(addLandscape);
  });
  interpretations.forEach((i) => {
    if (dreamIds.has(i.dreamId)) {
      i.landscapes?.forEach(addLandscape);
    }
  });

  const list = Array.from(byKey.entries()).map(([key, v]) => ({
    name: v.displayName,
    normalizedKey: key,
    count: v.count,
  }));
  return list.sort((a, b) => b.count - a.count);
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
  start.setMonth(start.getMonth() - (n - 1));
  start.setDate(1);
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
    i.archetypes?.forEach((a) => addArchetypeMonth(a, dateStr));
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
