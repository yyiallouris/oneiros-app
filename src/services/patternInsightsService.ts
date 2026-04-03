/**
 * Pattern insights – prepares extracted dream data and calls AI to generate
 * monthly/quarterly reflective insights (post-Jungian, hypothetical only).
 */

import { StorageService } from './storageService';
import { generatePatternInsights, type DreamExtraction, type PatternInsightDreamEntry } from './ai';
import type { Interpretation } from '../types/dream';
import type { InsightsPeriod } from '../types/insights';

const MAX_DREAMS_FOR_INSIGHTS = 30;

function interpretationToExtraction(i: Interpretation): DreamExtraction {
  return {
    symbols: i.symbols ?? [],
    archetypes: i.archetypes ?? [],
    landscapes: i.landscapes ?? [],
    affects: i.affects ?? [],
    motifs: i.motifs ?? [],
    relational_dynamics: i.relational_dynamics ?? [],
    core_mode: i.core_mode ?? '',
    amplifications: i.amplifications ?? [],
    symbol_stances: i.symbol_stances ?? [],
  };
}

/**
 * Build pattern-insight entries from interpretations and dreams (with dates).
 * Uses optional period; if not provided, uses last 30 days for monthly.
 */
export async function getPatternInsightEntries(
  period?: InsightsPeriod | null
): Promise<PatternInsightDreamEntry[]> {
  const [dreams, interpretations] = await Promise.all([
    StorageService.getDreams(),
    StorageService.getInterpretations(),
  ]);

  const dreamIdToDate = new Map(dreams.map((d) => [d.id, d.date]));

  const entries: PatternInsightDreamEntry[] = [];

  for (const i of interpretations) {
    const date = dreamIdToDate.get(i.dreamId);
    if (!date) continue;

    if (period && (date < period.startDate || date > period.endDate)) continue;

    const firstAssistant = i.messages?.find((m) => m.role === 'assistant');
    const interpretationText = firstAssistant?.content ?? i.summary ?? '';

    entries.push({
      date,
      extracted: interpretationToExtraction(i),
      interpretation: interpretationText,
    });
  }

  entries.sort((a, b) => (b.date > a.date ? 1 : -1));
  return entries.slice(0, MAX_DREAMS_FOR_INSIGHTS);
}

/**
 * Generate monthly or quarterly pattern insights from recent interpreted dreams.
 * Returns AI-generated reflective text (hypothetical, no advice).
 * @param language ISO 639-1 code (e.g. 'en', 'el') for essay output language.
 */
export async function generateMonthlyInsights(
  period: 'monthly' | 'quarterly' = 'monthly',
  periodFilter?: InsightsPeriod | null,
  language: string = 'en'
): Promise<string> {
  const entries = await getPatternInsightEntries(periodFilter);
  return generatePatternInsights(entries, period, language);
}

/**
 * Return InsightsPeriod for a given month (monthKey = YYYY-MM).
 */
export function getMonthPeriod(monthKey: string): InsightsPeriod {
  const [y, m] = monthKey.split('-').map(Number);
  const startDate = `${monthKey}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const endDate = `${monthKey}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
}

/**
 * Last 12 months as YYYY-MM (newest first), for month picker.
 */
export function getLast12MonthKeys(): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    keys.push(`${y}-${m}`);
  }
  return keys;
}

/**
 * A month is finished when we've passed its last day (i.e. we're in a later month).
 */
export function isMonthFinished(monthKey: string): boolean {
  const [y, m] = monthKey.split('-').map(Number);
  const firstOfNextMonth = new Date(y, m, 1);
  return new Date() >= firstOfNextMonth;
}

/**
 * Last 12 finished months only (excludes current month until it ends).
 */
export function getFinishedMonthKeys(): string[] {
  return getLast12MonthKeys().filter(isMonthFinished);
}

/**
 * Format month key for display (e.g. "2025-01" -> "January 2025").
 */
export function formatMonthKeyLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[m - 1]} ${y}`;
}

/**
 * Week number (1–5) for a given day of month. Week 1 = days 1–7, Week 2 = 8–14, etc.
 */
export function getWeekNumOfMonth(dayOfMonth: number): number {
  return Math.ceil(dayOfMonth / 7);
}

/**
 * Current month as YYYY-MM.
 */
export function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Whether the first week of the current month is finished (day 8 or later).
 * Used to block pattern generation for current month until at least 7 days have passed.
 */
export function isFirstWeekOfMonthFinished(monthKey: string): boolean {
  if (monthKey !== getCurrentMonthKey()) return true; // Past months: always "finished"
  return new Date().getDate() >= 8;
}

/**
 * Report key for generation: for current month use week key (YYYY-MM-Wk), for past months use month key (YYYY-MM).
 */
export function getReportKeyForGeneration(monthKey: string): string {
  if (monthKey !== getCurrentMonthKey()) return monthKey;
  const weekNum = getWeekNumOfMonth(new Date().getDate());
  return `${monthKey}-W${weekNum}`;
}

/**
 * Period for a specific week of a month. Week 1 = days 1–7, Week 2 = 8–14, etc.
 */
export function getWeekPeriod(monthKey: string, weekNum: number): InsightsPeriod {
  const [y, m] = monthKey.split('-').map(Number);
  const startDay = (weekNum - 1) * 7 + 1;
  const endDay = Math.min(weekNum * 7, new Date(y, m, 0).getDate());
  const startDate = `${monthKey}-${String(startDay).padStart(2, '0')}`;
  const endDate = `${monthKey}-${String(endDay).padStart(2, '0')}`;
  return { startDate, endDate };
}

/**
 * Format report key for display. "2025-03-W2" -> "March 2025 (Week 2)", "2025-02" -> "February 2025".
 */
export function formatReportKeyLabel(reportKey: string): string {
  const weekMatch = reportKey.match(/^(\d{4}-\d{2})-W(\d)$/);
  if (weekMatch) {
    const [, monthKey, weekNum] = weekMatch;
    return `${formatMonthKeyLabel(monthKey)} (Week ${weekNum})`;
  }
  return formatMonthKeyLabel(reportKey);
}

/**
 * Format report key for essay title (month only, no week). "2025-03-W3" -> "March 2025".
 */
export function formatReportKeyLabelForEssay(reportKey: string): string {
  const monthKey = reportKey.replace(/-W\d$/, '') || reportKey;
  return formatMonthKeyLabel(monthKey);
}
