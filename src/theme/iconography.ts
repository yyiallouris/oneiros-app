import { colors } from './colors';

/**
 * Oneiros icon-system roles.
 *
 * The three subfamilies intentionally keep different density:
 * - navigation: hand-drawn branded silhouettes
 * - symbolic: denser hand-ink Insights artwork
 * - functional: restrained controls with shared rounded strokes
 *
 * Optical sizes are calibrated by visible ink, not by making every source
 * occupy the same mathematical box.
 */
export const iconography = {
  ink: {
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
    inactive: colors.tabIconInactive,
  },
  stroke: {
    functional: 1.7,
  },
  navigation: {
    frameWidth: 60,
    frameHeight: 34,
    writeSize: 40,
    journalSize: 30,
    insightsSize: 31,
    activeOpacity: 0.96,
    inactiveOpacity: 0.76,
  },
  functional: {
    microphoneSize: 29,
    calendarSize: 30,
    stopSize: 36,
  },
  insights: {
    // Empty-state marks should hold the silence, not become the protagonist.
    sectionSize: 88,
  },
} as const;
