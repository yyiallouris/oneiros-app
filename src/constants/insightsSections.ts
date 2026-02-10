import type { InsightsSectionId } from '../types/insights';

export const INSIGHTS_SECTION_TITLES: Record<InsightsSectionId, string> = {
  'recurring-symbols': 'Recurring symbols',
  'symbol-details': 'Explore symbol data',
  'recurring-archetypes': 'Archetype trends',
  'space-landscapes': 'Space landscapes',
  'pattern-recognition': 'Pattern recognition',
  collective: 'Collective dreaming',
};

export const INSIGHTS_SECTIONS: { id: InsightsSectionId; subtitle: string }[] = [
  { id: 'recurring-symbols', subtitle: 'Your symbols · frequency (no meaning synthesis)' },
  { id: 'recurring-archetypes', subtitle: 'Fixed list, counts only' },
  { id: 'space-landscapes', subtitle: 'Recurring settings and places' },
  { id: 'pattern-recognition', subtitle: 'AI reflection on emerging patterns' },
  { id: 'collective', subtitle: 'Anonymized global counts & trends only' },
];
