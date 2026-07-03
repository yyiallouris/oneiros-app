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
  primary: '#F4EFEA',      // Soft warm cream base from the pre-Psyche background
  secondary: '#EDE6DF',    // Slightly darker warm paper for cards
  tertiary: '#F4EFE8',     // Warm paper tone for raised sections
  splash: '#4B3158',       // Night Plum behind native splash and loading mark
  card: '#EDE6DF',         // Warm paper card background
  cardTransparent: 'rgba(237, 230, 223, 0.7)', // Semi-transparent card
  cardSemiTransparent: 'rgba(240, 229, 223, 0.7)', // Stronger glass for hero surfaces
  cardMoreTransparent: 'rgba(240, 229, 223, 0.5)', // More transparent
  
  // Wave backgrounds (for gradients)
  wave1: '#DAD2C8',        // Gentle sand wave
  wave2: '#CFC6BA',        // Deeper grounding wave
  
  // Overlays
  overlay: 'rgba(45, 36, 48, 0.16)', // Deep Ink overlay
  overlayLight: 'rgba(45, 36, 48, 0.08)', // Light overlay for menus
  backdrop: 'rgba(45, 36, 48, 0.18)', // Backdrop for modals/menus
} as const;

// ==================== WAVES (MYSTICAL TINTS) ====================
export const waveTints = {
  A: '#4B4266', // deep mystic indigo tint
  B: '#6E5160', // dusky mauve-brown tint
  accentMist: 'rgba(106, 79, 179, 0.12)', // pre-Psyche wave accent tint
} as const;

// ==================== TEXT COLORS ====================
export const text = {
  primary: '#2D2430',      // Deep Ink
  secondary: '#5E5263',    // Muted Ink for supporting copy
  muted: '#8C8290',        // Ghost Text
  warmGray: 'rgba(45, 36, 48, 0.76)', // Warm charcoal-plum for loading screen
  title: '#2D2430',        // Explicit display/title tone
  accent: '#65446F',       // Ritual Plum emphasis
  white: baseColors.white,
  onAccent: baseColors.white, // Text on accent backgrounds
} as const;

// ==================== TAB BAR COLORS ====================
export const tabBar = {
  iconActive: '#2D2430',   // Active tab icon / label
  iconInactive: '#8C8290', // Inactive tab icon / label
} as const;

// ==================== ACCENT COLORS ====================
// Primary action color: buttons, tabs, microphone, calendar icon, sidebar, toggles, chips.
// Change buttonPrimary here to update all of them.
export const accent = {
  buttonPrimary: '#4B3158',           // Night Plum primary actions
  buttonPrimaryLight: 'rgba(101, 68, 111, 0.14)',   // Ritual Plum light bg for chips, toggles
  buttonPrimaryLight12: 'rgba(101, 68, 111, 0.08)', // Subtle bg
  buttonPrimary40: 'rgba(101, 68, 111, 0.26)',      // Borders, toggle track
  buttonPrimary90: 'rgba(75, 49, 88, 0.92)',        // Solid-ish (e.g. user chat bubble)
  buttonPrimaryDisabled: '#A88BB2',   // Soft Amethyst for disabled primary actions
  buttonPrimaryDisabledLight: 'rgba(168, 139, 178, 0.12)', // Disabled secondary/ghost bg
  buttonPrimaryDisabledBorder: 'rgba(168, 139, 178, 0.26)', // Disabled outlines/text

  // Primary and symbolic accents
  primary: '#A88BB2',                // Soft Amethyst decorative highlights
  light: '#F4EDF4',                  // Pressed Surface / light accent wash
  dark: '#4B3158',                   // Night Plum
  symbol: '#65446F',                 // Ritual Plum icons, symbols, nav accents
  oldGold: '#B58A4A',                // Symbolic gold, ritual highlights
  oxidizedGreen: '#5E7468',          // Earth/shadow support accent
  driedRose: '#A46F78',              // Warm symbolic contrast
  clayBrown: '#8C6B5A',              // Grounded clay support
  
  // Accent with opacity
  primary90: 'rgba(168, 139, 178, 0.82)', // Semi-transparent accent
  primary60: 'rgba(168, 139, 178, 0.42)', // Light accent overlay
  primary20: 'rgba(168, 139, 178, 0.14)', // Very light accent overlay
  
  // Warm accent (used in calendar)
  orange: '#B58A4A', // Old Gold for calendar/sun contrast
} as const;

// ==================== BRAND ICON COLORS ====================
// Used by the generated splash/icon assets and documented here so the
// visual identity stays versioned beside the app palette.
export const brandIcon = {
  plum: '#2D2430',         // Deep Ink icon background + wordmark tone
  plumShadow: '#1F1A23',   // Deeper vignette / adaptive icon background shadow
  glow: '#65446F',         // Ritual Plum core glow + accent contour highlights
  contour: '#DED3DF',      // Hairline contour/light stroke
  contourSoft: '#A88BB2',  // Soft Amethyst supporting stroke tint
  mist: '#F4EFEA',         // Soft warm cream splash/light brand backdrop
} as const;

// ==================== BRAND SURFACES ====================
export const surfaces = {
  glass: 'rgba(237, 230, 223, 0.7)',        // Default transparent warm paper card
  glassStrong: 'rgba(240, 229, 223, 0.82)', // Search bars / dropdowns / strong surfaces
  glassSoft: 'rgba(240, 229, 223, 0.5)',    // Chat / atmospheric surfaces
  field: 'rgba(244, 239, 232, 0.9)',        // Inputs and inline controls
  nav: 'rgba(237, 230, 223, 0.94)',         // Bottom nav / header chrome
  navBorder: 'rgba(226, 216, 204, 0.8)',    // Navigation border tone
  edgeGlow: 'rgba(244, 239, 234, 0.76)',    // Soft warm top edge
} as const;

// ==================== CONTOUR SYSTEM ====================
export const contours = {
  line: 'rgba(58, 47, 42, 0.16)',       // Main warm paper contour stroke
  lineSoft: 'rgba(58, 47, 42, 0.1)',    // Supporting contour stroke
  lineFaint: 'rgba(58, 47, 42, 0.06)',  // Very soft full-screen texture
  fill: 'rgba(218, 210, 200, 0.22)',    // Sand contour fill
  glow: 'rgba(106, 79, 179, 0.1)',      // Subtle plum contour glow
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
  primary: '#E2D8CC',      // Main warm paper border
  input: '#D8CEC2',        // Input border
  divider: '#EAE0D4',      // Divider line
  card: '#E2D8CC',         // Card border
} as const;

// ==================== SHADOW COLORS ====================
export const shadows = {
  primary: 'rgba(45, 36, 48, 0.08)',  // Main shadow
  card: 'rgba(45, 36, 48, 0.1)',      // Card shadow
  button: 'rgba(75, 49, 88, 0.18)',   // Button shadow
  overlay: 'rgba(45, 36, 48, 0.2)',   // Overlay shadow
} as const;

// ==================== SUN CYCLE (moving sun gradient) ====================
// Sun color varies from FC2947 → FE6244. See useSunCycleColor().
export const sunCyclePalette = ['#FC2947', '#FE6244'] as const;
export const SUN_CYCLE_DURATION_MS = 60 * 1000; // 1 minute per step

// ==================== GRADIENT COLORS ====================
export const gradients = {
  // Mountain wave gradients
  mountainStart: '#E8D5B7',            // Sand highlight
  mountainStart90: 'rgba(232, 213, 183, 0.9)', // With opacity
  mountainMid: '#DAD2C8',              // Gentle sand wave
  mountainMid60: 'rgba(218, 210, 200, 0.6)',  // With opacity
  mountainMid20: 'rgba(218, 210, 200, 0.2)',  // With opacity
  mountainEnd: '#CFC6BA',              // Deeper grounding wave
  mountainEnd20: 'rgba(207, 198, 186, 0.2)', // With opacity
  
  // Sun/Moon gradients
  sunMoonStart: '#DAD2C8',            // Gentle sand wave
  sunMoonStart60: 'rgba(218, 210, 200, 0.42)', // With opacity
  sunMoonMid: '#F4EFEA',              // Soft warm cream
  sunMoonMid40: 'rgba(244, 239, 234, 0.4)', // With opacity
  sunMoonEnd: '#CFC6BA',              // Deeper grounding wave
  sunMoonEnd20: 'rgba(207, 198, 186, 0.18)', // With opacity

  // Primary action treatment
  buttonTop: '#4B3158',
  buttonBottom: '#65446F',
  buttonEdge: 'rgba(255, 253, 249, 0.5)',
  buttonGlow: 'rgba(75, 49, 88, 0.2)',
  
  // Paper/carve effect
  paper: 'rgba(244, 239, 232, 0.9)',  // Paper color for "carve" effect
  paperLight: 'rgba(240, 229, 223, 0.4)', // Light beige for calendar
} as const;

// ==================== CALENDAR COLORS ====================
export const calendar = {
  noDreams: 'rgba(240, 229, 223, 0.4)', // No dreams - light beige
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
  accentOldGold: accent.oldGold,
  accentOxidizedGreen: accent.oxidizedGreen,
  accentDriedRose: accent.driedRose,
  accentClayBrown: accent.clayBrown,
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
