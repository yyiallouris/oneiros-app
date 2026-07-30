import type { InsightsSectionId } from '../types/insights';

export const INSIGHTS_SECTION_TITLES: Record<InsightsSectionId, string> = {
  'recurring-symbols': 'Returning Images',
  'symbol-details': 'Explore symbol data',
  'recurring-archetypes': 'Archetypal Echoes',
  'symbolic-motifs': 'Recurring Scenes',
  'emotional-weather': 'Emotional Weather',
  thresholds: 'Thresholds',
  'core-conflicts': 'Inner Tensions',
  'space-landscapes': 'Dream Places',
  'pattern-recognition': 'Period Reflection',
  collective: 'Collective dreaming',
};

export const INSIGHTS_SECTIONS: { id: InsightsSectionId; subtitle: string }[] = [
  { id: 'recurring-symbols', subtitle: 'Images that keep returning' },
  { id: 'symbolic-motifs', subtitle: 'Scene-shapes that keep returning across dreams' },
  { id: 'emotional-weather', subtitle: 'Felt tones that keep returning across your dreams' },
  { id: 'thresholds', subtitle: 'Places where the dream changes ground' },
  { id: 'core-conflicts', subtitle: 'Tensions that keep returning' },
  { id: 'space-landscapes', subtitle: 'Settings and places you return to' },
  { id: 'recurring-archetypes', subtitle: 'Deep structures that echo across dreams' },
  { id: 'pattern-recognition', subtitle: 'Reflection on the dream field' },
  { id: 'collective', subtitle: 'Anonymized global counts & trends only' },
];
