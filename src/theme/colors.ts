/**
 * Centralized Color System — single source of truth for the app palette.
 *
 * Edit this file to try new palettes. Shared UI and brand/splash colors live here.
 * All colors used in the app should be defined here; no hardcoded colors in components.
 */

// ==================== BASE COLORS ====================
const baseColors = {
  white: '#FFFFFF',
  black: '#000000',
} as const;

// ==================== BACKGROUND COLORS ====================
export const backgrounds = {
  // Main backgrounds
  primary: '#FCF9FB',      // Airy paper-mist base across the app
  secondary: '#F8F4F8',    // Soft supporting panel tone
  tertiary: '#FFFDFF',     // Clean light paper for raised sections
  splash: '#F7F3F7',       // Brand mist used behind native splash and loading mark
  card: '#FFFFFF',         // Clean card background
  cardTransparent: 'rgba(255, 255, 255, 0.82)', // Semi-transparent card
  cardSemiTransparent: 'rgba(255, 255, 255, 0.92)', // Stronger glass for hero surfaces
  cardMoreTransparent: 'rgba(255, 255, 255, 0.72)', // More transparent
  
  // Wave backgrounds (for gradients)
  wave1: '#EAE0EF',        // Very light iris mist
  wave2: '#DDD0E5',        // Soft plum-lilac depth
  
  // Overlays
  overlay: 'rgba(73, 50, 76, 0.14)', // Brand plum overlay
  overlayLight: 'rgba(73, 50, 76, 0.08)', // Light overlay for menus
  backdrop: 'rgba(46, 32, 51, 0.16)', // Backdrop for modals/menus
} as const;

// ==================== WAVES (MYSTICAL TINTS) ====================
export const waveTints = {
  A: '#6A657B', // softened iris-plum tint
  B: '#8A8090', // muted mauve-gray tint
  accentMist: 'rgba(200, 140, 200, 0.06)', // ultra-subtle tie-in with orchid accents
} as const;

// ==================== TEXT COLORS ====================
export const text = {
  primary: '#352B36',      // Deep plum-charcoal for body text
  secondary: '#5A4C5E',    // Muted plum-gray for supporting copy
  muted: '#85788A',        // Soft muted mist-plum
  warmGray: 'rgba(53, 43, 54, 0.76)', // Warm charcoal-plum for loading screen
  title: '#352B36',        // Explicit display/title tone
  accent: '#6F4B82',       // Orchid-plum emphasis
  white: baseColors.white,
  onAccent: baseColors.white, // Text on accent backgrounds
} as const;

// ==================== TAB BAR COLORS ====================
export const tabBar = {
  iconActive: '#433746',   // Active tab icon / label
  iconInactive: '#918491', // Inactive tab icon / label
} as const;

// ==================== ACCENT COLORS ====================
// Primary action color: buttons, tabs, microphone, calendar icon, sidebar, toggles, chips.
// Change buttonPrimary here to update all of them.
export const accent = {
  buttonPrimary: '#6B4B7B',           // Primary actions (buttons, tabs, mic, calendar, etc.)
  buttonPrimaryLight: 'rgba(200, 140, 200, 0.14)',   // Light bg for chips, toggles
  buttonPrimaryLight12: 'rgba(200, 140, 200, 0.08)', // Subtle bg
  buttonPrimary40: 'rgba(122, 75, 138, 0.24)',       // Borders, toggle track
  buttonPrimary90: 'rgba(107, 75, 123, 0.92)',      // Solid-ish (e.g. user chat bubble)
  buttonPrimaryDisabled: '#A18EAB',   // Muted plum-orchid for disabled primary actions
  buttonPrimaryDisabledLight: 'rgba(161, 142, 171, 0.12)', // Disabled secondary/ghost bg
  buttonPrimaryDisabledBorder: 'rgba(161, 142, 171, 0.26)', // Disabled outlines/text

  // Decorative iris accents (e.g. calendar hasDreams dot, gradients)
  primary: '#C88CC8',
  light: '#E7D9F2',
  dark: '#6A4475',
  symbol: '#7A4B8A',                 // Icons, symbols, nav accents
  
  // Accent with opacity
  primary90: 'rgba(200, 140, 200, 0.82)', // Semi-transparent accent
  primary60: 'rgba(200, 140, 200, 0.42)',  // Light accent overlay
  primary20: 'rgba(200, 140, 200, 0.14)',  // Very light accent overlay
  
  // Turquoise accent (used in loading, animations)
  turquoise: 'rgba(30, 95, 90, 1)',       // Full turquoise
  turquoise55: 'rgba(30, 95, 90, 0.55)',  // Dusty turquoise (default)
  turquoise45: 'rgba(30, 95, 90, 0.45)',  // Dusty turquoise fill
  turquoise25: 'rgba(30, 95, 90, 0.25)',  // Light turquoise
  turquoise20: 'rgba(30, 95, 90, 0.2)',   // Very light turquoise
  turquoise15: 'rgba(30, 95, 90, 0.15)',  // Muted turquoise track
  turquoise14: 'rgba(30, 95, 90, 0.14)',  // Low contrast track
  
  // Orange accent (used in calendar)
  orange: 'rgb(220, 150, 100)', // Warm orange for calendar
} as const;

// ==================== BRAND ICON COLORS ====================
// Used by the generated splash/icon assets and documented here so the
// visual identity stays versioned beside the app palette.
export const brandIcon = {
  plum: '#49324C',         // Dark icon background + wordmark tone
  plumShadow: '#2E2033',   // Deeper vignette / adaptive icon background shadow
  orchid: '#C88CC8',       // Core glow + accent contour highlights
  lavender: '#E7D9F2',     // Primary contour/light stroke
  lavenderSoft: '#D9B4E8', // Secondary glow / supporting stroke tint
  mist: '#F5F0F7',         // Splash background / light brand backdrop
} as const;

// ==================== BRAND SURFACES ====================
export const surfaces = {
  glass: 'rgba(255, 255, 255, 0.9)',        // Default mist glass card
  glassStrong: 'rgba(255, 255, 255, 0.96)', // Search bars / dropdowns / strong surfaces
  glassSoft: 'rgba(255, 255, 255, 0.76)',   // Chat / atmospheric surfaces
  field: 'rgba(255, 255, 255, 0.94)',       // Inputs and inline controls
  nav: 'rgba(255, 255, 255, 0.94)',         // Bottom nav / header chrome
  navBorder: 'rgba(107, 75, 123, 0.12)',    // Navigation border tone
  edgeGlow: 'rgba(255, 255, 255, 0.92)',    // Soft luminous top edge
} as const;

// ==================== CONTOUR SYSTEM ====================
export const contours = {
  line: 'rgba(126, 104, 141, 0.18)',       // Main contour stroke
  lineSoft: 'rgba(126, 104, 141, 0.12)',   // Supporting contour stroke
  lineFaint: 'rgba(126, 104, 141, 0.07)',  // Very soft full-screen texture
  fill: 'rgba(231, 217, 242, 0.08)',       // Mist contour fill
  glow: 'rgba(200, 140, 200, 0.14)',       // Orchid contour glow
} as const;

// ==================== SEMANTIC COLORS ====================
export const semantic = {
  // Status colors
  success: '#4CAF50',      // Green - success states
  error: '#FF3B30',        // Red - error states
  warning: '#FFA726',      // Orange - warning states
  info: '#2196F3',         // Blue - info states
  
  // Error variants
  errorLight: '#FF5252',   // Light red
  errorDark: '#D32F2F',    // Dark red (delete buttons)
  
  // Status with opacity
  successBackground: 'rgba(76, 175, 80, 0.1)',   // Light green background
  errorBackground: 'rgba(255, 59, 48, 0.1)',     // Light red background
  warningBackground: 'rgba(255, 167, 38, 0.1)',  // Light orange background
} as const;

// ==================== BORDER COLORS ====================
export const borders = {
  primary: 'rgba(107, 75, 123, 0.12)', // Main border color
  input: 'rgba(107, 75, 123, 0.16)',   // Input border
  divider: 'rgba(107, 75, 123, 0.08)', // Divider line
  card: 'rgba(107, 75, 123, 0.11)',    // Card border
} as const;

// ==================== SHADOW COLORS ====================
export const shadows = {
  primary: 'rgba(53, 43, 54, 0.08)',  // Main shadow
  card: 'rgba(53, 43, 54, 0.1)',      // Card shadow
  button: 'rgba(90, 58, 99, 0.18)',   // Button shadow
  overlay: 'rgba(46, 32, 51, 0.2)',   // Overlay shadow
} as const;

// ==================== SUN CYCLE (moving sun gradient) ====================
// Sun color varies from FC2947 → FE6244. See useSunCycleColor().
export const sunCyclePalette = ['#FC2947', '#FE6244'] as const;
export const SUN_CYCLE_DURATION_MS = 60 * 1000; // 1 minute per step

// ==================== GRADIENT COLORS ====================
export const gradients = {
  // Mountain wave gradients
  mountainStart: '#FCF8FB',            // Start color
  mountainStart90: 'rgba(252, 248, 251, 0.92)', // With opacity
  mountainMid: '#F1E8F2',              // Mid color (lavender mist)
  mountainMid60: 'rgba(241, 232, 242, 0.42)',  // With opacity
  mountainMid20: 'rgba(241, 232, 242, 0.14)',   // With opacity
  mountainEnd: '#E8D8EA',              // End color
  mountainEnd20: 'rgba(232, 216, 234, 0.14)', // With opacity
  
  // Sun/Moon gradients
  sunMoonStart: '#F1E8F2',            // Start (accent light)
  sunMoonStart60: 'rgba(241, 232, 242, 0.42)', // With opacity
  sunMoonMid: '#FAF6FA',               // Mid (mist)
  sunMoonMid40: 'rgba(250, 246, 250, 0.34)',  // With opacity
  sunMoonEnd: '#E8D8EA',               // End (orchid glow)
  sunMoonEnd20: 'rgba(232, 216, 234, 0.14)', // With opacity

  // Screen atmosphere
  screenTop: '#FFFDFE',
  screenMid: '#F8F1FA',
  screenBottom: '#EFE4F2',
  screenDepth: '#E3D5E8',
  auraTop: 'rgba(255, 249, 255, 0.94)',
  auraMid: 'rgba(231, 217, 242, 0.42)',
  auraBottom: 'rgba(107, 75, 123, 0.1)',

  // Primary action treatment
  buttonTop: '#5A3A63',
  buttonBottom: '#C88CC8',
  buttonEdge: 'rgba(255, 255, 255, 0.62)',
  buttonGlow: 'rgba(200, 140, 200, 0.22)',
  
  // Paper/carve effect
  paper: 'rgba(255, 251, 255, 0.94)',  // Paper color for "carve" effect
  paperLight: 'rgba(255, 255, 255, 0.62)', // Light mist for calendar
} as const;

// ==================== CALENDAR COLORS ====================
export const calendar = {
  noDreams: 'rgba(255, 255, 255, 0.68)', // No dreams - light mist
  hasDreams: accent.primary,              // Has dreams - accent color
  orange: accent.orange,                  // Warm orange variant
} as const;

// ==================== LEGACY COMPATIBILITY ====================
// Export as flat object for backward compatibility
// Components can use either the grouped exports or this flat object
export const colors = {
  // Base
  white: baseColors.white,
  black: baseColors.black,
  
  // Backgrounds
  background: backgrounds.primary,
  cardBackground: backgrounds.secondary,
  backgroundSecondary: backgrounds.secondary,
  backgroundTertiary: backgrounds.tertiary,
  backgroundSplash: backgrounds.splash,
  cardGlass: surfaces.glass,
  cardGlassStrong: surfaces.glassStrong,
  cardGlassSoft: surfaces.glassSoft,
  fieldSurface: surfaces.field,
  navSurface: surfaces.nav,
  navBorder: surfaces.navBorder,
  contourLine: contours.line,
  contourLineSoft: contours.lineSoft,
  contourLineFaint: contours.lineFaint,
  contourGlow: contours.glow,
  wave1: backgrounds.wave1,
  wave2: backgrounds.wave2,
  waveTintA: waveTints.A,
  waveTintB: waveTints.B,
  waveAccentMist: waveTints.accentMist,
  
  // Text
  textPrimary: text.primary,
  textSecondary: text.secondary,
  textMuted: text.muted,
  textTitle: text.title,
  textAccent: text.accent,
  onAccent: text.onAccent,
  
  // Tab bar icon colors
  tabIconActive: tabBar.iconActive,
  tabIconInactive: tabBar.iconInactive,

  // Accent & Buttons (primary action = buttonPrimary everywhere)
  accent: accent.primary,
  accentLight: accent.light,
  accentDark: accent.dark,
  buttonPrimary: accent.buttonPrimary,
  buttonPrimaryLight: accent.buttonPrimaryLight,
  buttonPrimaryLight12: accent.buttonPrimaryLight12,
  buttonPrimary40: accent.buttonPrimary40,
  buttonPrimary90: accent.buttonPrimary90,
  buttonPrimaryDisabled: accent.buttonPrimaryDisabled,
  buttonPrimaryDisabledLight: accent.buttonPrimaryDisabledLight,
  buttonPrimaryDisabledBorder: accent.buttonPrimaryDisabledBorder,
  buttonGradientTop: gradients.buttonTop,
  buttonGradientBottom: gradients.buttonBottom,
  buttonEdge: gradients.buttonEdge,
  buttonGlow: gradients.buttonGlow,
  
  // Semantic
  success: semantic.success,
  error: semantic.error,
  warning: semantic.warning,
  info: semantic.info,
  
  // Borders
  border: borders.primary,
  inputBorder: borders.input,
  divider: borders.divider,
  
  // Shadows & Overlays
  shadow: shadows.primary,
  overlay: backgrounds.overlay,
} as const;

// ==================== TYPE EXPORTS ====================
export type ColorKey = keyof typeof colors;
export type BackgroundKey = keyof typeof backgrounds;
export type TextKey = keyof typeof text;
export type AccentKey = keyof typeof accent;
export type SemanticKey = keyof typeof semantic;
export type BorderKey = keyof typeof borders;
export type ShadowKey = keyof typeof shadows;
export type GradientKey = keyof typeof gradients;
export type CalendarKey = keyof typeof calendar;
export type BrandIconKey = keyof typeof brandIcon;
export type SurfaceKey = keyof typeof surfaces;
export type ContourKey = keyof typeof contours;
