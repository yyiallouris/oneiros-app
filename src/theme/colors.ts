/**
 * Centralized color system — single source of truth for the active app palette.
 *
 * Only tokens referenced by live UI belong here. Legacy wave components keep
 * wave1/wave2 + waveTints; everything else is the paper + plum design system.
 */

const baseColors = {
  white: '#FFFFFF',
} as const;

/**
 * Locked Oneiros v1.3.0 visual-foundation palette.
 *
 * Product roles below alias these seven approved primitives instead of
 * inventing local hues. PLUM_SOFT is artwork/state colour, not essential copy.
 */
export const oneirosPalette = {
  PAPER: '#F3ECE2',
  SURFACE: '#FAF7F1',
  INK: '#342A38',
  INK_MUTED: '#6B606C',
  PLUM: '#5E4566',
  PLUM_SOFT: '#897B8C',
  BORDER: '#E4DCD2',
} as const;

export const backgrounds = {
  primary: oneirosPalette.PAPER,
  secondary: oneirosPalette.SURFACE,
  tertiary: oneirosPalette.SURFACE,
  splash: oneirosPalette.PAPER,
  card: oneirosPalette.SURFACE,
  wave1: '#DAD2C8',
  wave2: '#CFC6BA',
  overlay: 'rgba(52, 42, 56, 0.16)',
  backdrop: 'rgba(52, 42, 56, 0.18)',
} as const;

/** Legacy mountain-wave tints — used by LegacyMountainWaveBackground only. */
export const waveTints = {
  A: '#4B4266',
  B: '#6E5160',
} as const;

export const text = {
  primary: oneirosPalette.INK,
  secondary: oneirosPalette.INK_MUTED,
  // Muted copy can still be essential at 12–14dp. Keep it on the AA-safe ink
  // primitive; PLUM_SOFT is reserved for non-text/inactive control artwork.
  muted: oneirosPalette.INK_MUTED,
  title: oneirosPalette.INK,
  accent: oneirosPalette.PLUM,
  white: baseColors.white,
  onAccent: baseColors.white,
} as const;

export const tabBar = {
  iconActive: oneirosPalette.PLUM,
  iconInactive: oneirosPalette.PLUM_SOFT,
} as const;

/** Candidate flat ink for symbolic marks; authored PNG tinting remains a later gate. */
export const iconInks = {
  symbolic: oneirosPalette.INK,
} as const;

export const accent = {
  buttonPrimary: oneirosPalette.PLUM,
  buttonPrimaryLight: 'rgba(94, 69, 102, 0.14)',
  buttonPrimaryLight12: 'rgba(94, 69, 102, 0.08)',
  buttonPrimary40: 'rgba(94, 69, 102, 0.26)',
  buttonPrimary90: oneirosPalette.PLUM,
  buttonPrimaryDisabled: oneirosPalette.PLUM_SOFT,
  buttonPrimaryDisabledLight: 'rgba(137, 123, 140, 0.12)',
  buttonPrimaryDisabledBorder: 'rgba(137, 123, 140, 0.26)',
  buttonEdge: 'rgba(250, 247, 241, 0.5)',
  buttonGlow: 'rgba(94, 69, 102, 0.2)',
  oldGold: '#B58A4A',
  clayBrown: '#8C6B5A',
} as const;

/** Subscription plan CTAs use their own palette and do not affect shared app buttons. */
export const subscriptionButtons = {
  premiumBackground: '#FBF5EC',
  premiumBackgroundPressed: '#F4E7D5',
  premiumText: '#4E4053',
  premiumBorder: 'rgba(255, 255, 255, 0.16)',
  premiumShadow: 'rgba(52, 39, 56, 0.16)',
  freeBackground: 'transparent',
  freeBackgroundPressed: 'rgba(129, 118, 130, 0.08)',
  freeText: '#403744',
  freeTextPressed: '#342C37',
  freeBorder: '#817682',
  freeShadow: 'rgba(45, 36, 48, 0.06)',
  deeperBackground: 'rgba(255, 255, 255, 0.10)',
  deeperBackgroundPressed: 'rgba(255, 255, 255, 0.14)',
  deeperText: '#F8F1FA',
  deeperBorder: 'rgba(255, 255, 255, 0.26)',
  deeperShadow: 'rgba(19, 16, 24, 0.18)',
} as const;

export const subscriptionCards = {
  freeBackground: '#F5F0E8',
  freeGlyph: 'rgba(30, 25, 31, 0.86)',
  freeBorder: 'rgba(216, 206, 215, 0.52)',
  freeTextPrimary: '#1E191F',
  freeTextSecondary: '#5B525D',
  premiumBackgroundTop: '#6F5D73',
  premiumBackgroundBottom: '#6F5D73',
  premiumGlyph: '#F8F2E8',
  premiumBorder: 'rgba(255,255,255,0.18)',
  premiumTextPrimary: '#FFF9F2',
  premiumTextSecondary: 'rgba(255, 249, 242, 0.92)',
  premiumBadgeBackground: '#F4E7C9',
  premiumBadgeText: '#56465B',
  deeperBackground: '#2B2633',
  deeperBackgroundUndertone: '#2B2633',
  deeperGlyph: '#EDE3F2',
  deeperBorder: 'rgba(199, 173, 211, 0.22)',
  deeperTextPrimary: '#F7F1F8',
  deeperTextSecondary: 'rgba(247, 241, 248, 0.68)',
} as const;

export const surfaces = {
  glass: 'rgba(250, 247, 241, 0.78)',
  glassStrong: 'rgba(250, 247, 241, 0.88)',
  glassSoft: 'rgba(250, 247, 241, 0.58)',
  field: 'rgba(250, 247, 241, 0.94)',
  nav: oneirosPalette.SURFACE,
  conversationDock: 'rgba(250, 247, 241, 0.86)',
  navBorder: oneirosPalette.BORDER,
} as const;

export const contours = {
  line: oneirosPalette.BORDER,
  lineSoft: oneirosPalette.BORDER,
  lineFaint: oneirosPalette.BORDER,
} as const;

export const semantic = {
  success: '#4CAF50',
  error: '#FF3B30',
  warning: '#FFA726',
  errorDark: '#D32F2F',
  errorBackground: 'rgba(255, 59, 48, 0.1)',
} as const;

export const borders = {
  primary: oneirosPalette.BORDER,
  input: oneirosPalette.BORDER,
  divider: oneirosPalette.BORDER,
} as const;

export const shadows = {
  primary: 'rgba(52, 42, 56, 0.1)',
} as const;

export const calendar = {
  noDreams: 'rgba(240, 229, 223, 0.4)',
} as const;

/** Flat aliases for existing screens — prefer grouped exports in new code. */
export const colors = {
  white: baseColors.white,
  background: backgrounds.primary,
  cardBackground: backgrounds.secondary,
  backgroundSecondary: backgrounds.secondary,
  cardGlass: surfaces.glass,
  cardGlassStrong: surfaces.glassStrong,
  cardGlassSoft: surfaces.glassSoft,
  fieldSurface: surfaces.field,
  navSurface: surfaces.nav,
  conversationDockSurface: surfaces.conversationDock,
  navBorder: surfaces.navBorder,
  contourLine: contours.line,
  contourLineSoft: contours.lineSoft,
  contourLineFaint: contours.lineFaint,
  wave1: backgrounds.wave1,
  wave2: backgrounds.wave2,
  textPrimary: text.primary,
  textSecondary: text.secondary,
  textMuted: text.muted,
  textTitle: text.title,
  textAccent: text.accent,
  onAccent: text.onAccent,
  tabIconActive: tabBar.iconActive,
  tabIconInactive: tabBar.iconInactive,
  symbolicInk: iconInks.symbolic,
  accentOldGold: accent.oldGold,
  accentClayBrown: accent.clayBrown,
  buttonPrimary: accent.buttonPrimary,
  buttonPrimaryLight: accent.buttonPrimaryLight,
  buttonPrimaryLight12: accent.buttonPrimaryLight12,
  buttonPrimary40: accent.buttonPrimary40,
  buttonPrimary90: accent.buttonPrimary90,
  buttonPrimaryDisabled: accent.buttonPrimaryDisabled,
  buttonPrimaryDisabledLight: accent.buttonPrimaryDisabledLight,
  buttonPrimaryDisabledBorder: accent.buttonPrimaryDisabledBorder,
  buttonEdge: accent.buttonEdge,
  buttonGlow: accent.buttonGlow,
  error: semantic.error,
  border: borders.primary,
  inputBorder: borders.input,
  divider: borders.divider,
  shadow: shadows.primary,
  overlay: backgrounds.overlay,
} as const;

export type ColorKey = keyof typeof colors;
export type OneirosPaletteKey = keyof typeof oneirosPalette;
export type BackgroundKey = keyof typeof backgrounds;
export type TextKey = keyof typeof text;
export type AccentKey = keyof typeof accent;
export type SubscriptionButtonKey = keyof typeof subscriptionButtons;
export type SubscriptionCardKey = keyof typeof subscriptionCards;
export type SemanticKey = keyof typeof semantic;
export type BorderKey = keyof typeof borders;
export type ShadowKey = keyof typeof shadows;
export type CalendarKey = keyof typeof calendar;
export type SurfaceKey = keyof typeof surfaces;
export type ContourKey = keyof typeof contours;
export type IconInkKey = keyof typeof iconInks;
