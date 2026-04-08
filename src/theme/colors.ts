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
  primary: '#F7F1F8',      // Mist base used across refreshed screens
  secondary: '#F2EAF4',    // Soft supporting panel tone
  tertiary: '#FBF7FC',     // Lighter paper mist
  splash: '#F5F0F7',       // Brand mist used behind native splash and loading mark
  card: '#F9F5FA',         // Card background
  cardTransparent: 'rgba(249, 245, 250, 0.74)', // Semi-transparent card
  cardSemiTransparent: 'rgba(249, 245, 250, 0.82)', // Stronger glass for hero surfaces
  cardMoreTransparent: 'rgba(249, 245, 250, 0.62)', // More transparent
  
  // Wave backgrounds (for gradients)
  wave1: '#DECFE8',        // Lavender-mist topographic wave
  wave2: '#C7AFD6',        // Deeper plum-lavender depth
  
  // Overlays
  overlay: 'rgba(73, 50, 76, 0.24)', // Brand plum overlay
  overlayLight: 'rgba(73, 50, 76, 0.12)', // Light overlay for menus
  backdrop: 'rgba(46, 32, 51, 0.22)', // Backdrop for modals/menus
} as const;

// ==================== WAVES (MYSTICAL TINTS) ====================
export const waveTints = {
  A: '#403A69', // deep iris indigo
  B: '#665E83', // muted iris mauve
  accentMist: 'rgba(200, 140, 200, 0.12)', // ultra-subtle tie-in with orchid accents
} as const;

// ==================== TEXT COLORS ====================
export const text = {
  primary: '#49324C',      // Plum-primary text / headings
  secondary: '#6F5A77',    // Muted plum for supporting copy
  muted: '#98889D',        // Soft muted mist-plum
  warmGray: 'rgba(73, 50, 76, 0.78)', // Warm plum-gray for loading screen
  title: '#49324C',        // Explicit display/title tone
  accent: '#7A4B8A',       // Orchid-plum emphasis
  white: baseColors.white,
  onAccent: baseColors.white, // Text on accent backgrounds
} as const;

// ==================== TAB BAR COLORS ====================
export const tabBar = {
  iconActive: '#49324C',   // Active tab icon / label
  iconInactive: '#8E7D94', // Inactive tab icon / label
} as const;

// ==================== ACCENT COLORS ====================
// Primary action color: buttons, tabs, microphone, calendar icon, sidebar, toggles, chips.
// Change buttonPrimary here to update all of them.
export const accent = {
  buttonPrimary: '#6B4B7B',           // Primary actions (buttons, tabs, mic, calendar, etc.)
  buttonPrimaryLight: 'rgba(200, 140, 200, 0.22)',   // Light bg for chips, toggles
  buttonPrimaryLight12: 'rgba(200, 140, 200, 0.12)', // Subtle bg
  buttonPrimary40: 'rgba(122, 75, 138, 0.38)',       // Borders, toggle track
  buttonPrimary90: 'rgba(107, 75, 123, 0.92)',      // Solid-ish (e.g. user chat bubble)
  buttonPrimaryDisabled: '#A18EAB',   // Muted plum-orchid for disabled primary actions
  buttonPrimaryDisabledLight: 'rgba(161, 142, 171, 0.16)', // Disabled secondary/ghost bg
  buttonPrimaryDisabledBorder: 'rgba(161, 142, 171, 0.34)', // Disabled outlines/text

  // Decorative iris accents (e.g. calendar hasDreams dot, gradients)
  primary: '#C88CC8',
  light: '#E7D9F2',
  dark: '#6A4475',
  symbol: '#7A4B8A',                 // Icons, symbols, nav accents
  
  // Accent with opacity
  primary90: 'rgba(200, 140, 200, 0.9)', // Semi-transparent accent
  primary60: 'rgba(200, 140, 200, 0.6)',  // Light accent overlay
  primary20: 'rgba(200, 140, 200, 0.2)',  // Very light accent overlay
  
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
  glass: 'rgba(249, 245, 250, 0.76)',       // Default mist glass card
  glassStrong: 'rgba(249, 245, 250, 0.86)', // Search bars / dropdowns / strong surfaces
  glassSoft: 'rgba(249, 245, 250, 0.62)',   // Chat / atmospheric surfaces
  field: 'rgba(252, 249, 252, 0.88)',       // Inputs and inline controls
  nav: 'rgba(245, 240, 247, 0.94)',         // Bottom nav / header chrome
  navBorder: 'rgba(147, 125, 181, 0.22)',   // Navigation border tone
  edgeGlow: 'rgba(255, 246, 255, 0.8)',     // Soft luminous top edge
} as const;

// ==================== CONTOUR SYSTEM ====================
export const contours = {
  line: 'rgba(147, 125, 181, 0.32)',       // Main contour stroke
  lineSoft: 'rgba(147, 125, 181, 0.2)',    // Supporting contour stroke
  lineFaint: 'rgba(147, 125, 181, 0.12)',  // Very soft full-screen texture
  fill: 'rgba(231, 217, 242, 0.14)',       // Mist contour fill
  glow: 'rgba(200, 140, 200, 0.24)',       // Orchid contour glow
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
  primary: 'rgba(147, 125, 181, 0.18)', // Main border color
  input: 'rgba(147, 125, 181, 0.24)',   // Input border
  divider: 'rgba(147, 125, 181, 0.12)', // Divider line
  card: 'rgba(147, 125, 181, 0.18)',    // Card border
} as const;

// ==================== SHADOW COLORS ====================
export const shadows = {
  primary: 'rgba(73, 50, 76, 0.1)',   // Main shadow
  card: 'rgba(73, 50, 76, 0.12)',     // Card shadow
  button: 'rgba(90, 58, 99, 0.25)',   // Button shadow
  overlay: 'rgba(46, 32, 51, 0.28)',  // Overlay shadow
} as const;

// ==================== SUN CYCLE (moving sun gradient) ====================
// Sun color varies from FC2947 → FE6244. See useSunCycleColor().
export const sunCyclePalette = ['#FC2947', '#FE6244'] as const;
export const SUN_CYCLE_DURATION_MS = 60 * 1000; // 1 minute per step

// ==================== GRADIENT COLORS ====================
export const gradients = {
  // Mountain wave gradients
  mountainStart: '#F5F0F7',            // Start color
  mountainStart90: 'rgba(245, 240, 247, 0.9)', // With opacity
  mountainMid: '#E7D9F2',              // Mid color (lavender)
  mountainMid60: 'rgba(231, 217, 242, 0.6)',  // With opacity
  mountainMid20: 'rgba(231, 217, 242, 0.2)',   // With opacity
  mountainEnd: '#D9B4E8',              // End color
  mountainEnd20: 'rgba(217, 180, 232, 0.2)', // With opacity
  
  // Sun/Moon gradients
  sunMoonStart: '#E7D9F2',            // Start (accent light)
  sunMoonStart60: 'rgba(231, 217, 242, 0.6)', // With opacity
  sunMoonMid: '#F5F0F7',               // Mid (mist)
  sunMoonMid40: 'rgba(245, 240, 247, 0.4)',  // With opacity
  sunMoonEnd: '#D9B4E8',               // End (orchid glow)
  sunMoonEnd20: 'rgba(217, 180, 232, 0.2)', // With opacity

  // Screen atmosphere
  screenTop: '#FBF7FC',
  screenMid: '#F5F0F7',
  screenBottom: '#E7D9F2',
  screenDepth: '#C7AFD6',
  auraTop: 'rgba(255, 246, 255, 0.95)',
  auraMid: 'rgba(231, 217, 242, 0.55)',
  auraBottom: 'rgba(200, 140, 200, 0.18)',

  // Primary action treatment
  buttonTop: '#5A3A63',
  buttonBottom: '#C88CC8',
  buttonEdge: 'rgba(231, 217, 242, 0.52)',
  buttonGlow: 'rgba(200, 140, 200, 0.35)',
  
  // Paper/carve effect
  paper: 'rgba(245, 240, 247, 0.92)',  // Paper color for "carve" effect
  paperLight: 'rgba(249, 245, 250, 0.55)', // Light mist for calendar
} as const;

// ==================== CALENDAR COLORS ====================
export const calendar = {
  noDreams: 'rgba(249, 245, 250, 0.5)', // No dreams - light mist
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
