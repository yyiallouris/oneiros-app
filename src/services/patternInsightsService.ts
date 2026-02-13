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
 */
export async function generateMonthlyInsights(
  period: 'monthly' | 'quarterly' = 'monthly',
  periodFilter?: InsightsPeriod | null
): Promise<string> {
  const entries = await getPatternInsightEntries(periodFilter);
  return generatePatternInsights(entries, period);
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
 * Format month key for display (e.g. "2025-01" -> "January 2025").
 */
export function formatMonthKeyLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[m - 1]} ${y}`;
}
