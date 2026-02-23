# Color System Guide

## Overview

All colors are defined in **`src/theme/colors.ts`** — this is the **single place** to adjust the app palette when trying new palettes. Sandy/cream backgrounds are fixed; other accents (buttons, sun, etc.) can be changed here.

**Never use hardcoded colors in components** — always import from the theme.

---

## Palette — color name, hex, token, usage

(Excluding legacy tokens.)

| Color name | Hex / RGBA | Token | Where it goes |
|------------|------------|-------|---------------|
| **White** | `#FFFFFF` | `baseColors.white`, `text.white`, `text.onAccent` | Text on accent, icon fills. |
| **Black** | `#000000` | `baseColors.black` | Base for overlays (with opacity). |
| **Cream** | `#F4EFEA` | `backgrounds.primary` | Main app background. |
| **Beige / tan** | `#EDE6DF` | `backgrounds.secondary`, `backgrounds.card` | Card backgrounds. |
| **Paper** | `#F4EFE8` | `backgrounds.tertiary` | LoadingScreen background, etc. |
| **Semi-transparent card** | `rgba(237,230,223,0.7)` / `0.5` | `backgrounds.cardTransparent`, `cardSemiTransparent`, `cardMoreTransparent` | Semi-transparent card backgrounds, overlays. |
| **Sand cream** | `#DAD2C8` | `backgrounds.wave1` | Waves / gradients (first tone). |
| **Dark sand cream** | `#CFC6BA` | `backgrounds.wave2` | Waves / gradients (second). |
| **Dark overlay** | `rgba(58,47,42,0.25)` | `backgrounds.overlay` | Dark overlay over screen. |
| **Light overlay** | `rgba(0,0,0,0.2)` | `backgrounds.overlayLight`, `backgrounds.backdrop` | Menu overlay, modal backdrop. |
| **Dark brown-gray (text)** | `#3A2F2A` | `text.primary` | Main text. |
| **Taupe (text)** | `#6E625B` | `text.secondary` | Secondary text. |
| **Muted gray-brown** | `#9A8F88` | `text.muted` | Placeholder, muted text. |
| **Warm gray** | `rgba(40,35,30,0.8)` | `text.warmGray` | Loading screen text. |
| **Violet (primary action)** | `#6A4FB3` | `accent.buttonPrimary`, `accent.symbol` | Buttons, tabs, microphone, calendar icon, nav, chips, toggles, symbols. |
| **Light violet (20%)** | `rgba(106,79,179,0.2)` | `accent.buttonPrimaryLight` | Chip, toggle backgrounds. |
| **Light violet (12%)** | `rgba(106,79,179,0.12)` | `accent.buttonPrimaryLight12` | Very subtle background. |
| **Violet (40%)** | `rgba(106,79,179,0.4)` | `accent.buttonPrimary40` | Borders, toggle track. |
| **Violet (90%)** | `rgba(106,79,179,0.9)` | `accent.buttonPrimary90` | User chat bubble. |
| **Turquoise** | `rgba(30,95,90,1)` | `accent.turquoise` | Full turquoise (loading, animations). |
| **Light turquoise** | `0.55` / `0.45` / `0.25` / `0.2` / `0.15` / `0.14` | `accent.turquoise55` … `turquoise14` | Lines, tracks, fills in loading/animations. |
| **Orange** | `rgb(220,150,100)` | `accent.orange` | Calendar (warm variant). |
| **Green** | `#4CAF50` | `semantic.success` | Success states. |
| **Red** | `#FF3B30` | `semantic.error` | Errors. |
| **Warning orange** | `#FFA726` | `semantic.warning` | Warnings. |
| **Blue** | `#2196F3` | `semantic.info` | Info. |
| **Light red** | `#FF5252` | `semantic.errorLight` | Light error. |
| **Dark red** | `#D32F2F` | `semantic.errorDark` | Delete buttons. |
| **Green/red/orange light (10%)** | `rgba(…,0.1)` | `semantic.successBackground` etc. | Status backgrounds. |
| **Beige border** | `#E2D8CC` | `borders.primary`, `borders.card` | Main borders, card. |
| **Beige input** | `#D8CEC2` | `borders.input` | Input borders. |
| **Divider** | `#EAE0D4` | `borders.divider` | Divider lines. |
| **Primary shadow** | `rgba(58,47,42,0.08)` | `shadows.primary` | General shadows. |
| **Card shadow** | `rgba(0,0,0,0.1)` | `shadows.card` | Card shadows. |
| **Button shadow** | `rgba(0,0,0,0.15)` | `shadows.button` | Button shadows. |
| **Overlay shadow** | `rgba(0,0,0,0.25)` | `shadows.overlay` | Overlay shadows. |
| **Sun / sun cycle** | `#FC2947`, `#FE6244` | `sunCyclePalette` | Moving sun gradient (if used). |
| **Warm beige (gradient)** | `#E8D5B7` | `gradients.mountainStart`, `sunMoonMid` | Mountain wave start, sun/moon mid. |
| **Lavender (gradient)** | `#C3B8E0` | `gradients.mountainMid`, `mountainEnd`, `sunMoonStart`, `sunMoonEnd` | Mid/end waves, sun/moon gradients. |
| **Opacity gradients** | `rgba(232,213,183,…)`, `rgba(195,184,224,…)` | `gradients.mountainStart90`, `mountainMid60`, `mountainMid20`, `mountainEnd20`, `sunMoon*` | Mountain/sun-moon with transparency. |
| **Paper carve** | `rgba(244,239,232,0.9)` | `gradients.paper` | Carve effect. |
| **Light beige** | `rgba(240,229,223,0.4)` | `gradients.paperLight`, `calendar.noDreams` | Calendar, paper. |
| **Calendar orange** | (same as `accent.orange`) | `calendar.orange` | Calendar warm variant. |

*(For `calendar.hasDreams` a decorative dot is used — color is defined in the theme as a reference to the accent group.)*

## Import Methods

### Method 1: Flat Object (Backward Compatible)
```typescript
import { colors } from '../theme';

// Usage
backgroundColor: colors.background
color: colors.textPrimary
borderColor: colors.border
```

### Method 2: Grouped Exports (Recommended)
```typescript
import { backgrounds, text, accent, semantic, borders } from '../theme';

// Usage
backgroundColor: backgrounds.primary
color: text.primary
borderColor: borders.primary
```

## Color Groups

### 🎨 Backgrounds (sandy/cream — keep as is)
- `backgrounds.primary` - Main app background (#F4EFEA)
- `backgrounds.secondary` - Card backgrounds (#EDE6DF)
- `backgrounds.cardTransparent` - Semi-transparent cards
- `backgrounds.overlay` - Dark overlays
- `backgrounds.backdrop` - Light backdrops

### 📝 Text
- `text.primary` - Main text color (#3A2F2A)
- `text.secondary` - Secondary text (#6E625B)
- `text.muted` - Placeholder/muted text (#9A8F88)
- `text.white` - White text for dark backgrounds

### ✨ Primary action (one token for all UI)
**Change `accent.buttonPrimary` in `colors.ts` to update every button-like element.**

- `accent.buttonPrimary` (#6A4FB3) – **Buttons**, tab bar active tint, **microphone**, **calendar icon**, **sidebar/nav**, calendar selected/today, **symbol icons**, send/edit icons, chips, toggles, links, loading indicators.
- `accent.buttonPrimaryLight` – Light backgrounds (chips, toggles, cards).
- `accent.buttonPrimaryLight12` – Subtle backgrounds.
- `accent.buttonPrimary40` – Borders, toggle track.

**Legacy (decorative only, not for buttons):**
- `accent.primary` / `accent.light` / `accent.dark` – Lavender; use only for non-interactive accents (e.g. calendar dream-count gradient).
- `accent.symbol` – Same as buttonPrimary (icons/symbols).
- `accent.turquoise*`, `accent.orange` – Other accents.

### 🌅 Moving sun (MountainWaveBackground)
- **Palette:** `sunCyclePalette` in `colors.ts` — `['#FC2947', '#FE6244']`. Color varies between these, 1 min per step.
- **Duration:** `SUN_CYCLE_DURATION_MS` (60_000 ms per step). Change in `colors.ts`.
- **Hook:** `useSunCycleColor()` from `theme/sunCycleColor.ts` — use in the sun gradient.

### 🚦 Semantic
- `semantic.success` - Success states (#4CAF50)
- `semantic.error` - Error states (#FF3B30)
- `semantic.warning` - Warning states (#FFA726)
- `semantic.info` - Info states (#2196F3)

### 🔲 Borders
- `borders.primary` - Main border (#E2D8CC)
- `borders.input` - Input borders (#D8CEC2)
- `borders.divider` - Divider lines (#EAE0D4)

### 🌈 Gradients
- `gradients.mountainStart` - Mountain wave start
- `gradients.mountainMid` - Mountain wave middle
- `gradients.mountainEnd` - Mountain wave end
- `gradients.sunMoon*` - Sun/Moon gradient variants

### 📅 Calendar
- `calendar.noDreams` - No dreams state
- `calendar.hasDreams` - Has dreams state
- `calendar.orange` - Orange variant

## Best Practices

### ✅ DO
```typescript
// Use centralized colors
import { colors, backgrounds, text } from '../theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: backgrounds.primary,
    borderColor: borders.primary,
  },
  text: {
    color: text.primary,
  },
});
```

### ❌ DON'T
```typescript
// Never use hardcoded colors
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F4EFEA', // ❌ BAD
    color: '#3A2F2A',            // ❌ BAD
  },
});
```

## Migration Guide

If you find hardcoded colors in components:

1. **Find the color** in the component
2. **Check if it exists** in `colors.ts`
3. **If it exists**: Replace with import
4. **If it doesn't exist**: Add it to the appropriate group in `colors.ts`
5. **Update the component** to use the centralized color

## Examples

### Before (Bad)
```typescript
backgroundColor: '#F4EFEA'
color: 'rgba(58, 47, 42, 0.08)'
borderColor: '#E2D8CC'
```

### After (Good)
```typescript
import { backgrounds, text, borders } from '../theme';

backgroundColor: backgrounds.primary
color: text.primary
borderColor: borders.primary
```

## Where to edit the palette

| What                    | File / export                         |
|-------------------------|----------------------------------------|
| **All buttons / tabs / mic / calendar / nav** | `colors.ts` → `accent.buttonPrimary` |
| Sun cycle colors        | `colors.ts` → `sunCyclePalette`        |
| Sun step duration       | `colors.ts` → `SUN_CYCLE_DURATION_MS`  |
| Backgrounds (sandy/cream) | `colors.ts` → `backgrounds.*` (keep as is) |
| Text, borders, etc.     | `colors.ts` → respective groups        |

## Adding New Colors

When adding a new color:

1. **Determine the group** (background, text, accent, semantic, etc.)
2. **Add to the appropriate group** in `colors.ts`
3. **Add to legacy `colors` object** if needed for backward compatibility
4. **Use descriptive name** that indicates purpose
5. **Add comment** explaining usage if needed

Example:
```typescript
// In colors.ts
export const semantic = {
  // ... existing colors
  danger: '#FF0000', // For critical errors
} as const;
```
