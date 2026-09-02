import { colors } from './colors';

/**
 * Immutable identity for the calendar artwork approved for Oneiros v1.
 *
 * Any visual edit requires a new release id, asset filename, and digest. This
 * prevents a later iteration from silently replacing the approved artifact.
 */
export const ONEIROS_V1_CALENDAR_ICON_RELEASE = {
  id: 'oneiros-calendar-date-leaf-v1.0.0',
  designRelease: 'oneiros-design-v1.0.1',
  status: 'final',
  approvedOn: '2026-09-02',
  assetFile: 'calendar_date_leaf_ink_v1.png',
  assetSha256: '6f275899ec569cacf75b15c1d05ebbbbc0172ddcd18d042d4ccb66da34a038a8',
  sourceCanvas: { width: 512, height: 512 },
  opticalSize: 31,
} as const;

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
    writeSize: 30,
    journalSize: 30,
    insightsSize: 29,
    activeInk: colors.tabIconActive,
    inactiveInk: colors.tabIconInactive,
    activeOpacity: 0.98,
    inactiveOpacity: 0.58,
  },
  functional: {
    microphoneSize: 31,
    calendarSize: 31,
    stopSize: 36,
  },
  insights: {
    // Empty-state marks should hold the silence, not become the protagonist.
    sectionSize: 88,
  },
} as const;
