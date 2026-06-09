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

export interface MotifCount {
  name: string;
  normalizedKey: string;
  count: number;
}

export interface ThresholdCount {
  name: string;
  normalizedKey: string;
  count: number;
}

export interface CentralConflictCount {
  name: string;
  normalizedKey: string;
  count: number;
}

export interface AffectCount {
  name: string;
  normalizedKey: string;
  count: number;
}

export type InsightPatternKind =
  | 'image'
  | 'motif'
  | 'threshold'
  | 'tension'
  | 'place'
  | 'archetypal_echo'
  | 'affect';

export type InsightPatternFilter =
  | { type: 'symbol'; value: string }
  | { type: 'motif'; value: string }
  | { type: 'landscape'; value: string };

export type CrossCategoryPatternItem = {
  label: string;
  kind: InsightPatternKind;
  count: number;
  sectionId: InsightsSectionId;
  filter?: InsightPatternFilter;
};

export type InsightsOverviewModel = {
  dreamsLoggedCount: number;
  interpretedDreamsCount: number;
  topImages: CrossCategoryPatternItem[];
  topMotifs: CrossCategoryPatternItem[];
  topThresholds: CrossCategoryPatternItem[];
  topTensions: CrossCategoryPatternItem[];
  topPlaces: CrossCategoryPatternItem[];
  topArchetypalEchoes: CrossCategoryPatternItem[];
  topAffects: CrossCategoryPatternItem[];
  strongestPatterns: CrossCategoryPatternItem[];
  fieldSummary: string;
};

/** Monthly symbolic overview – short reflective text (no advice) */
export interface MonthlyOverview {
  month: string;
  text: string;
  generatedAt: string;
}

/** Saved pattern insight report for one month (monthKey = YYYY-MM) */
export interface PatternReportEntry {
  monthKey: string;
  generatedAt: string;
  text: string;
}

export type PatternReflectionScopeType = 'calendar_period' | 'recent_sequence' | 'custom_range';

export type PatternReflectionScope =
  | {
      type: 'calendar_period';
      period: 'month' | 'quarter';
      startDate: string;
      endDate: string;
      key: string;
    }
  | {
      type: 'recent_sequence';
      dreamIds: string[];
      count: number;
      key: string;
    }
  | {
      type: 'custom_range';
      startDate: string;
      endDate: string;
      key: string;
    };

export interface PatternReflectionReport {
  id: string;
  scope_type: PatternReflectionScopeType;
  scope_key: string;
  start_date?: string;
  end_date?: string;
  dream_ids?: string[];
  dream_count: number;
  language: string;
  content: string;
  generated_at: string;
}

export interface RecentSequenceReflection {
  id: string;
  scope_type: 'recent_sequence';
  scope_key: string;
  dream_ids: string[];
  dream_count: number;
  language: string;
  content: string;
  generated_at: string;
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
  | 'symbolic-motifs'    // recurring structural/spatial patterns from dreams
  | 'thresholds'         // transition points: work, travel, sleep, crossing, shelter
  | 'core-conflicts'     // dynamic tensions stated as "X vs Y"
  | 'space-landscapes'   // recurring settings/places (e.g. forest, beach)
  | 'pattern-recognition' // AI-generated monthly/quarterly pattern insights
  | 'collective';
