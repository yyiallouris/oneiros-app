/**
 * Insights – data shapes for personal and collective aggregations.
 * No UI logic here; data correctness only.
 */

/** Recurring symbol: display name + normalized key for grouping */
export interface SymbolCount {
  name: string;
  normalizedKey: string;
  count: number;
}

/** Recurring archetype from fixed whitelist */
export interface ArchetypeCount {
  name: string;
  count: number;
}

/** Symbol frequency in a time window (e.g. per month) */
export interface SymbolMonthCount {
  symbol: string;
  month: string; // "YYYY-MM"
  count: number;
}

/** Archetype presence in a time window */
export interface ArchetypeMonthCount {
  archetype: string;
  month: string;
  count: number;
}

/** Recurring landscape (setting/place): same shape as SymbolCount for aggregation */
export interface LandscapeCount {
  name: string;
  normalizedKey: string;
  count: number;
}

/** Monthly symbolic overview – short reflective text (no advice) */
export interface MonthlyOverview {
  month: string;
  text: string;
  generatedAt: string;
}

/** Date range for insights filtering (YYYY-MM-DD) */
export interface InsightsPeriod {
  startDate: string;
  endDate: string;
}

/** Insight section id for navigation */
export type InsightsSectionId =
  | 'recurring-symbols'   // overview: bars + 1 line + View symbol details
  | 'symbol-details'     // deep dive: recurring symbols, clusters, all symbols
  | 'recurring-archetypes'
  | 'space-landscapes'   // recurring settings/places (e.g. forest, beach)
  | 'collective';
