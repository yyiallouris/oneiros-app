/**
 * Centralized Color System — single source of truth for the app palette.
 *
 * Edit this file to try new palettes. Sandy/cream backgrounds stay fixed.
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
  primary: '#F4EFEA',      // Soft warm cream - main app background
  secondary: '#EDE6DF',    // Slightly darker for cards
  tertiary: '#F4EFE8',     // Warm paper tone (LoadingScreen)
  card: '#EDE6DF',         // Card background
  cardTransparent: 'rgba(237, 230, 223, 0.7)', // Semi-transparent card
  cardSemiTransparent: 'rgba(240, 229, 223, 0.7)', // Semi-transparent for sun visibility
  cardMoreTransparent: 'rgba(240, 229, 223, 0.5)', // More transparent
  
  // Wave backgrounds (for gradients)
  wave1: '#DAD2C8',        // Gentle sand tone
  wave2: '#CFC6BA',        // Deeper grounding tone
  
  // Overlays
  overlay: 'rgba(58, 47, 42, 0.25)', // Dark overlay
  overlayLight: 'rgba(0, 0, 0, 0.2)', // Light overlay for menus
  backdrop: 'rgba(0, 0, 0, 0.2)', // Backdrop for modals/menus
} as const;

// ==================== WAVES (MYSTICAL TINTS) ====================
export const waveTints = {
  A: '#4B4266', // deep mystic indigo
  B: '#6E5160', // dusky mauve-brown
  accentMist: 'rgba(106, 79, 179, 0.12)', // ultra-subtle tie-in with primary accent
} as const;

// ==================== TEXT COLORS ====================
export const text = {
  primary: '#3A2F2A',      // Deep brown-gray - main text
  secondary: '#6E625B',    // Muted taupe - secondary text
  muted: '#9A8F88',        // Soft gray-brown - placeholder/muted text
  warmGray: 'rgba(40, 35, 30, 0.8)', // Warm gray for loading screen
  white: baseColors.white,
  onAccent: baseColors.white, // Text on accent backgrounds
} as const;

// ==================== ACCENT COLORS ====================
// Primary action color: buttons, tabs, microphone, calendar icon, sidebar, toggles, chips.
// Change buttonPrimary here to update all of them.
export const accent = {
  buttonPrimary: '#6A4FB3',           // Primary actions (buttons, tabs, mic, calendar, etc.)
  buttonPrimaryLight: 'rgba(106, 79, 179, 0.2)',   // Light bg for chips, toggles
  buttonPrimaryLight12: 'rgba(106, 79, 179, 0.12)', // Subtle bg
  buttonPrimary40: 'rgba(106, 79, 179, 0.4)',       // Borders, toggle track
  buttonPrimary90: 'rgba(106, 79, 179, 0.9)',      // Solid-ish (e.g. user chat bubble)

  // Legacy lavender (non-UI: e.g. calendar hasDreams dot, decorative only)
  primary: '#A89CCF',
  light: '#C3B8E0',
  dark: '#7E70A8',
  symbol: '#6A4FB3',                 // Same as buttonPrimary - icons, symbols, nav
  
  // Accent with opacity
  primary90: 'rgba(168, 156, 207, 0.9)', // Semi-transparent accent
  primary60: 'rgba(168, 156, 207, 0.6)',  // Light accent overlay
  primary20: 'rgba(168, 156, 207, 0.2)',  // Very light accent overlay
  
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
  primary: '#E2D8CC',      // Main border color
  input: '#D8CEC2',        // Input border
  divider: '#EAE0D4',      // Divider line
  card: '#E2D8CC',         // Card border
} as const;

// ==================== SHADOW COLORS ====================
export const shadows = {
  primary: 'rgba(58, 47, 42, 0.08)',  // Main shadow
  card: 'rgba(0, 0, 0, 0.1)',         // Card shadow
  button: 'rgba(0, 0, 0, 0.15)',      // Button shadow
  overlay: 'rgba(0, 0, 0, 0.25)',     // Overlay shadow
} as const;

// ==================== SUN CYCLE (moving sun gradient) ====================
// Sun color varies from FC2947 → FE6244. See useSunCycleColor().
export const sunCyclePalette = ['#FC2947', '#FE6244'] as const;
export const SUN_CYCLE_DURATION_MS = 60 * 1000; // 1 minute per step

// ==================== GRADIENT COLORS ====================
export const gradients = {
  // Mountain wave gradients
  mountainStart: '#E8D5B7',           // Start color
  mountainStart90: 'rgba(232, 213, 183, 0.9)', // With opacity
  mountainMid: '#C3B8E0',              // Mid color (accent light)
  mountainMid60: 'rgba(195, 184, 224, 0.6)',  // With opacity
  mountainMid20: 'rgba(195, 184, 224, 0.2)',   // With opacity
  mountainEnd: '#C3B8E0',              // End color
  mountainEnd20: 'rgba(195, 184, 224, 0.2)', // With opacity
  
  // Sun/Moon gradients
  sunMoonStart: '#C3B8E0',            // Start (accent light)
  sunMoonStart60: 'rgba(195, 184, 224, 0.6)', // With opacity
  sunMoonMid: '#E8D5B7',               // Mid (mountain start)
  sunMoonMid40: 'rgba(232, 213, 183, 0.4)',  // With opacity
  sunMoonEnd: '#C3B8E0',               // End (accent light)
  sunMoonEnd20: 'rgba(195, 184, 224, 0.2)', // With opacity
  
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
  wave1: backgrounds.wave1,
  wave2: backgrounds.wave2,
  waveTintA: waveTints.A,
  waveTintB: waveTints.B,
  waveAccentMist: waveTints.accentMist,
  
  // Text
  textPrimary: text.primary,
  textSecondary: text.secondary,
  textMuted: text.muted,
  
  // Accent & Buttons (primary action = buttonPrimary everywhere)
  accent: accent.primary,
  accentLight: accent.light,
  accentDark: accent.dark,
  buttonPrimary: accent.buttonPrimary,
  buttonPrimaryLight: accent.buttonPrimaryLight,
  buttonPrimaryLight12: accent.buttonPrimaryLight12,
  buttonPrimary40: accent.buttonPrimary40,
  buttonPrimary90: accent.buttonPrimary90,
  
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
