import type { InsightsSectionId } from '../types/insights';

export const INSIGHTS_SECTION_TITLES: Record<InsightsSectionId, string> = {
  'recurring-symbols': 'Returning Images',
  'symbol-details': 'Explore symbol data',
  'recurring-archetypes': 'Archetypal Echoes',
  'symbolic-motifs': 'Repeating Patterns',
  thresholds: 'Thresholds',
  'core-conflicts': 'Inner Tensions',
  'space-landscapes': 'Dream Places',
  'pattern-recognition': 'Period Reflection',
  collective: 'Collective dreaming',
};

export const INSIGHTS_SECTIONS: { id: InsightsSectionId; subtitle: string }[] = [
  { id: 'recurring-symbols', subtitle: 'Images that keep returning' },
  { id: 'recurring-archetypes', subtitle: 'Deep structures that echo across dreams' },
  { id: 'symbolic-motifs', subtitle: 'Recurring dream situations and shapes' },
  { id: 'thresholds', subtitle: 'Places where the dream changes ground' },
  { id: 'core-conflicts', subtitle: 'Tensions that keep returning' },
  { id: 'space-landscapes', subtitle: 'Settings and places you return to' },
  { id: 'pattern-recognition', subtitle: 'Reflection on the dream field' },
  { id: 'collective', subtitle: 'Anonymized global counts & trends only' },
];
