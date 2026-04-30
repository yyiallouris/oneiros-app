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
  primary: '#F7F3F0',      // Warm bone base across the app
  secondary: '#EFE8F1',    // Mist gray / dirty lilac support
  tertiary: '#FFFCFA',     // Clean paper for raised sections
  splash: '#F7F3F0',       // Brand mist used behind native splash and loading mark
  card: '#FFFCFA',         // Clean paper card background
  cardTransparent: 'rgba(255, 252, 250, 0.84)', // Semi-transparent card
  cardSemiTransparent: 'rgba(255, 252, 250, 0.94)', // Stronger glass for hero surfaces
  cardMoreTransparent: 'rgba(255, 252, 250, 0.74)', // More transparent
  
  // Wave backgrounds (for gradients)
  wave1: '#EFE8F1',        // Dirty lilac wash
  wave2: '#DDD3DD',        // Ash-lilac depth
  
  // Overlays
  overlay: 'rgba(43, 36, 48, 0.16)', // Deep ink overlay
  overlayLight: 'rgba(43, 36, 48, 0.08)', // Light overlay for menus
  backdrop: 'rgba(43, 36, 48, 0.18)', // Backdrop for modals/menus
} as const;

// ==================== WAVES (MYSTICAL TINTS) ====================
export const waveTints = {
  A: '#6E6874', // muted moon-gray violet tint
  B: '#8C8290', // ash mauve-gray tint
  accentMist: 'rgba(110, 77, 120, 0.06)', // ultra-subtle tie-in with violet accents
} as const;

// ==================== TEXT COLORS ====================
export const text = {
  primary: '#2B2430',      // Primary ink
  secondary: '#55485D',    // Muted plum-gray for supporting copy
  muted: '#807384',        // Soft muted mist-plum
  warmGray: 'rgba(43, 36, 48, 0.76)', // Warm charcoal-plum for loading screen
  title: '#2B2430',        // Explicit display/title tone
  accent: '#6E4D78',       // Muted violet emphasis
  white: baseColors.white,
  onAccent: baseColors.white, // Text on accent backgrounds
} as const;

// ==================== TAB BAR COLORS ====================
export const tabBar = {
  iconActive: '#2B2430',   // Active tab icon / label
  iconInactive: '#8A7E8A', // Inactive tab icon / label
} as const;

// ==================== ACCENT COLORS ====================
// Primary action color: buttons, tabs, microphone, calendar icon, sidebar, toggles, chips.
// Change buttonPrimary here to update all of them.
export const accent = {
  buttonPrimary: '#4F3A58',           // Primary actions (buttons, tabs, mic, calendar, etc.)
  buttonPrimaryLight: 'rgba(110, 77, 120, 0.14)',   // Light bg for chips, toggles
  buttonPrimaryLight12: 'rgba(110, 77, 120, 0.08)', // Subtle bg
  buttonPrimary40: 'rgba(110, 77, 120, 0.26)',      // Borders, toggle track
  buttonPrimary90: 'rgba(79, 58, 88, 0.92)',        // Solid-ish (e.g. user chat bubble)
  buttonPrimaryDisabled: '#97869B',   // Muted plum-gray for disabled primary actions
  buttonPrimaryDisabledLight: 'rgba(151, 134, 155, 0.12)', // Disabled secondary/ghost bg
  buttonPrimaryDisabledBorder: 'rgba(151, 134, 155, 0.26)', // Disabled outlines/text

  // Decorative muted-violet accents (e.g. calendar hasDreams dot, gradients)
  primary: '#8B6A93',
  light: '#EFE8F1',
  dark: '#4F3A58',
  symbol: '#6E4D78',                 // Icons, symbols, nav accents
  
  // Accent with opacity
  primary90: 'rgba(139, 106, 147, 0.82)', // Semi-transparent accent
  primary60: 'rgba(139, 106, 147, 0.42)', // Light accent overlay
  primary20: 'rgba(139, 106, 147, 0.14)', // Very light accent overlay
  
  // Orange accent (used in calendar)
  orange: 'rgb(220, 150, 100)', // Warm orange for calendar
} as const;

// ==================== BRAND ICON COLORS ====================
// Used by the generated splash/icon assets and documented here so the
// visual identity stays versioned beside the app palette.
export const brandIcon = {
  plum: '#2B2430',         // Dark icon background + wordmark tone
  plumShadow: '#1F1A23',   // Deeper vignette / adaptive icon background shadow
  glow: '#6E4D78',         // Core glow + accent contour highlights
  contour: '#DDD3DD',      // Primary contour/light stroke
  contourSoft: '#BBA8BF',  // Secondary glow / supporting stroke tint
  mist: '#F7F3F0',         // Splash background / light brand backdrop
} as const;

// ==================== BRAND SURFACES ====================
export const surfaces = {
  glass: 'rgba(255, 252, 250, 0.9)',        // Default mist glass card
  glassStrong: 'rgba(255, 252, 250, 0.96)', // Search bars / dropdowns / strong surfaces
  glassSoft: 'rgba(255, 252, 250, 0.76)',   // Chat / atmospheric surfaces
  field: 'rgba(255, 252, 250, 0.94)',       // Inputs and inline controls
  nav: 'rgba(255, 252, 250, 0.94)',         // Bottom nav / header chrome
  navBorder: 'rgba(110, 77, 120, 0.14)',    // Navigation border tone
  edgeGlow: 'rgba(255, 252, 250, 0.92)',    // Soft luminous top edge
} as const;

// ==================== CONTOUR SYSTEM ====================
export const contours = {
  line: 'rgba(110, 77, 120, 0.2)',       // Main contour stroke
  lineSoft: 'rgba(110, 77, 120, 0.12)',  // Supporting contour stroke
  lineFaint: 'rgba(110, 77, 120, 0.07)', // Very soft full-screen texture
  fill: 'rgba(239, 232, 241, 0.22)',     // Mist contour fill
  glow: 'rgba(110, 77, 120, 0.12)',      // Muted violet contour glow
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
  primary: '#DDD3DD',                    // Main border color
  input: '#DDD3DD',                      // Input border
  divider: 'rgba(221, 211, 221, 0.64)', // Divider line
  card: '#DDD3DD',                       // Card border
} as const;

// ==================== SHADOW COLORS ====================
export const shadows = {
  primary: 'rgba(43, 36, 48, 0.08)',  // Main shadow
  card: 'rgba(43, 36, 48, 0.1)',      // Card shadow
  button: 'rgba(79, 58, 88, 0.18)',   // Button shadow
  overlay: 'rgba(43, 36, 48, 0.2)',   // Overlay shadow
} as const;

// ==================== SUN CYCLE (moving sun gradient) ====================
// Sun color varies from FC2947 → FE6244. See useSunCycleColor().
export const sunCyclePalette = ['#FC2947', '#FE6244'] as const;
export const SUN_CYCLE_DURATION_MS = 60 * 1000; // 1 minute per step

// ==================== GRADIENT COLORS ====================
export const gradients = {
  // Mountain wave gradients
  mountainStart: '#F7F3F0',            // Start color
  mountainStart90: 'rgba(247, 243, 240, 0.92)', // With opacity
  mountainMid: '#EFE8F1',              // Mid color (dirty lilac mist)
  mountainMid60: 'rgba(239, 232, 241, 0.42)',  // With opacity
  mountainMid20: 'rgba(239, 232, 241, 0.14)',  // With opacity
  mountainEnd: '#DDD3DD',              // End color
  mountainEnd20: 'rgba(221, 211, 221, 0.14)', // With opacity
  
  // Sun/Moon gradients
  sunMoonStart: '#EFE8F1',            // Start (accent light)
  sunMoonStart60: 'rgba(239, 232, 241, 0.42)', // With opacity
  sunMoonMid: '#F7F3F0',              // Mid (mist)
  sunMoonMid40: 'rgba(247, 243, 240, 0.34)', // With opacity
  sunMoonEnd: '#DDD3DD',              // End (muted violet glow)
  sunMoonEnd20: 'rgba(221, 211, 221, 0.14)', // With opacity

  // Screen atmosphere
  screenTop: '#FFFCFA',
  screenMid: '#F7F3F0',
  screenBottom: '#EFE8F1',
  screenDepth: '#DDD3DD',
  auraTop: 'rgba(255, 252, 250, 0.94)',
  auraMid: 'rgba(239, 232, 241, 0.5)',
  auraBottom: 'rgba(110, 77, 120, 0.08)',

  // Primary action treatment
  buttonTop: '#4F3A58',
  buttonBottom: '#6E4D78',
  buttonEdge: 'rgba(255, 253, 254, 0.5)',
  buttonGlow: 'rgba(79, 58, 88, 0.2)',
  
  // Paper/carve effect
  paper: 'rgba(255, 252, 250, 0.94)',  // Paper color for "carve" effect
  paperLight: 'rgba(247, 243, 240, 0.62)', // Light mist for calendar
} as const;

// ==================== CALENDAR COLORS ====================
export const calendar = {
  noDreams: 'rgba(255, 252, 250, 0.68)', // No dreams - light mist
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
