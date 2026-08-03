import type { InsightsSectionId } from '../types/insights';

export const INSIGHTS_SECTION_TITLES: Record<InsightsSectionId, string> = {
  'recurring-symbols': 'Images',
  'symbol-details': 'Explore symbol data',
  'recurring-archetypes': 'Archetypal Echoes',
  'symbolic-motifs': 'Motifs',
  'emotional-weather': 'Emotional Atmosphere',
  thresholds: 'Thresholds',
  'core-conflicts': 'Inner Tensions',
  'space-landscapes': 'Dream Landscapes',
  'pattern-recognition': 'Period Reflection',
  collective: 'Collective dreaming',
};

export const INSIGHTS_SECTION_SUBTITLES: Record<InsightsSectionId, string> = {
  'recurring-symbols': 'Figures, objects, and forms that carry weight in the dream',
  'symbol-details': 'Recurring symbols, associations, and image families',
  'recurring-archetypes': 'Deeper patterns of human experience resonating through the dream',
  'symbolic-motifs': 'Scenes that give form to recognizable human situations',
  'emotional-weather': 'The felt emotional climate surrounding the dream',
  thresholds: 'Places or moments of passage, hesitation, and change',
  'core-conflicts': 'Opposing pulls or demands held within the dream',
  'space-landscapes': 'The places and environments where the dream unfolds',
  'pattern-recognition': 'Reflection on the dream field',
  collective: 'Anonymized global counts and trends only',
};

export const INSIGHTS_SECTIONS: { id: InsightsSectionId; subtitle: string }[] = [
  { id: 'recurring-symbols', subtitle: INSIGHTS_SECTION_SUBTITLES['recurring-symbols'] },
  { id: 'symbolic-motifs', subtitle: INSIGHTS_SECTION_SUBTITLES['symbolic-motifs'] },
  { id: 'emotional-weather', subtitle: INSIGHTS_SECTION_SUBTITLES['emotional-weather'] },
  { id: 'thresholds', subtitle: INSIGHTS_SECTION_SUBTITLES.thresholds },
  { id: 'core-conflicts', subtitle: INSIGHTS_SECTION_SUBTITLES['core-conflicts'] },
  { id: 'space-landscapes', subtitle: INSIGHTS_SECTION_SUBTITLES['space-landscapes'] },
  { id: 'recurring-archetypes', subtitle: INSIGHTS_SECTION_SUBTITLES['recurring-archetypes'] },
  { id: 'pattern-recognition', subtitle: INSIGHTS_SECTION_SUBTITLES['pattern-recognition'] },
  { id: 'collective', subtitle: INSIGHTS_SECTION_SUBTITLES.collective },
];
