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
