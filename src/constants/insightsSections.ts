import type { InsightsSectionId } from '../types/insights';

export const INSIGHTS_SECTION_TITLES: Record<InsightsSectionId, string> = {
  'recurring-symbols': 'Recurring symbols',
  'symbol-details': 'Explore symbol data',
  'recurring-archetypes': 'Archetype trends',
  'symbolic-motifs': 'Symbolic motifs',
  thresholds: 'Thresholds',
  'core-conflicts': 'Core conflicts',
  'space-landscapes': 'Space landscapes',
  'pattern-recognition': 'Pattern recognition',
  collective: 'Collective dreaming',
};

export const INSIGHTS_SECTIONS: { id: InsightsSectionId; subtitle: string }[] = [
  { id: 'recurring-symbols', subtitle: 'Your symbols · frequency (no meaning synthesis)' },
  { id: 'recurring-archetypes', subtitle: 'Fixed list, counts only' },
  { id: 'symbolic-motifs', subtitle: 'Imaginal shapes and recurring dream situations' },
  { id: 'thresholds', subtitle: 'Transition points: work, travel, sleep, shelter' },
  { id: 'core-conflicts', subtitle: 'Dynamic tensions staged as X vs Y' },
  { id: 'space-landscapes', subtitle: 'Recurring settings and places' },
  { id: 'pattern-recognition', subtitle: 'AI reflection on emerging patterns' },
  { id: 'collective', subtitle: 'Anonymized global counts & trends only' },
];
