# Color System Guide

## Overview

All app colors live in **`src/theme/colors.ts`**. The current visual direction is:

```txt
Soft Warm Cream / Deep Ink / dirtied plum / old-paper symbolic accents
```

The palette should feel like paper, ash, clay, moonlight, old gold, and a muted dream archive. Keep purple as a Jungian plum role, not a generic lavender wellness wash.

**Never use hardcoded colors in components** unless the color is truly local and cannot be expressed as a reusable token.

## Core Palette

| Color name | Value | Token | Usage |
|------------|-------|-------|-------|
| Soft Warm Cream | `#F4EFEA` | `backgrounds.primary`, `brandIcon.mist` | Main app background |
| Warm Paper | `#EDE6DF` | `backgrounds.secondary`, `backgrounds.card` | Cards and secondary screen wash |
| Warm Paper Light | `#F4EFE8` | `backgrounds.tertiary` | Raised writing/card surfaces |
| Gentle Sand Wave | `#DAD2C8` | `backgrounds.wave1` | Atmospheric depth, background waves |
| Deeper Grounding Wave | `#CFC6BA` | `backgrounds.wave2` | Lower/background wave depth |
| Pressed Surface | `#F4EDF4` | `accent.light` | Light pressed/control backgrounds |
| Warm Paper Border | `#E2D8CC` | `borders.primary`, `borders.card` | Borders and card edges |
| Deep Ink | `#2D2430` | `text.primary`, `text.title`, `brandIcon.plum` | Main text, titles, wordmark tone |
| Muted Ink | `#5E5263` | `text.secondary` | Supporting text |
| Ghost Text | `#8C8290` | `text.muted`, `tabBar.iconInactive` | Placeholders, subdued metadata |
| Night Plum | `#4B3158` | `accent.buttonPrimary`, `accent.dark` | Buttons, selected controls, active UI |
| Night Plum Splash | `#4B3158` | `backgrounds.splash` | Native splash and in-app loading background |
| Ritual Plum | `#65446F` | `text.accent`, `accent.symbol`, `brandIcon.glow` | Symbol accents, subtle emphasis |
| Soft Amethyst | `#A88BB2` | `accent.primary`, `accent.buttonPrimaryDisabled`, `calendar.hasDreams` | Decorative highlights, disabled primary states |
| Old Gold | `#B58A4A` | `accent.oldGold`, `accent.orange`, `calendar.orange` | Ritual highlights, calendar/sun contrast |
| Oxidized Green | `#5E7468` | `accent.oxidizedGreen`, `waveTints.A` | Earth/shadow support accent |
| Dried Rose | `#A46F78` | `accent.driedRose` | Warm symbolic contrast |
| Clay Brown | `#8C6B5A` | `accent.clayBrown` | Grounded clay support accent |

## Main Token Groups

### Backgrounds

- `backgrounds.primary`: Soft Warm Cream app base.
- `backgrounds.secondary`: Warm Paper support wash.
- `backgrounds.tertiary`: Warm Paper Light for raised writing surfaces.
- `backgrounds.splash`: Night Plum splash/loading background.
- `backgrounds.card`: Warm Paper card background.
- `backgrounds.cardTransparent`, `cardSemiTransparent`, `cardMoreTransparent`: translucent paper surfaces.
- `backgrounds.wave1`, `wave2`: Gentle Sand Wave and Deeper Grounding Wave.
- `backgrounds.overlay`, `overlayLight`, `backdrop`: ink-based overlays.

### Text

- `text.primary`: Deep Ink.
- `text.secondary`: Muted Ink.
- `text.muted`: Ghost Text placeholders and lower-priority metadata.
- `text.title`: Deep Ink title tone.
- `text.accent`: Ritual Plum emphasis.
- `text.white`, `text.onAccent`: text on dark/accent surfaces.

### Primary Action

Change `accent.buttonPrimary` in `colors.ts` to update the main action family across the app.

- `accent.buttonPrimary`: Night Plum buttons, active controls, microphone, selected calendar states, send/edit icons.
- `accent.buttonPrimaryLight`: Ritual Plum light chip/toggle backgrounds.
- `accent.buttonPrimaryLight12`: subtle action-tinted backgrounds.
- `accent.buttonPrimary40`: action borders and toggle tracks.
- `accent.buttonPrimary90`: solid chat/action surfaces.
- `accent.buttonPrimaryDisabled*`: disabled primary-action states.

### Secondary / Symbolic Accents

- `accent.primary`: Soft Amethyst non-interactive highlight, including `calendar.hasDreams`.
- `accent.light`: Pressed Surface accent wash.
- `accent.dark`: Night Plum.
- `accent.symbol`: Ritual Plum symbol and nav accent tone.
- `accent.oldGold`: ritual highlight and sun/calendar contrast.
- `accent.oxidizedGreen`: grounded earth/shadow support accent.
- `accent.driedRose`: warm symbolic contrast.
- `accent.clayBrown`: grounded clay support accent.
- `accent.orange`: Old Gold compatibility alias for calendar/sun contrast.

### Brand Icon

- `brandIcon.plum`: Deep Ink icon and wordmark tone.
- `brandIcon.plumShadow`: deep vignette/shadow.
- `brandIcon.glow`: Ritual Plum core glow.
- `brandIcon.contour`: hairline contour/light stroke.
- `brandIcon.contourSoft`: Soft Amethyst supporting contour.
- `brandIcon.mist`: Soft Warm Cream splash/light brand backdrop.

### Surfaces

- `surfaces.glass`: default transparent warm paper card.
- `surfaces.glassStrong`: strong search/dropdown surface.
- `surfaces.glassSoft`: soft chat/atmospheric surface.
- `surfaces.field`: inputs and inline controls.
- `surfaces.nav`: bottom nav/header chrome.
- `surfaces.navBorder`: navigation outline.
- `surfaces.edgeGlow`: subtle paper edge glow.

### Contours

- `contours.line`: main contour stroke.
- `contours.lineSoft`: softer supporting stroke.
- `contours.lineFaint`: very soft background texture.
- `contours.fill`: sand-toned atmospheric fill.
- `contours.glow`: muted violet glow.

### Semantics

Semantic colors stay conventional:

- `semantic.success`: green success state.
- `semantic.error`, `errorLight`, `errorDark`: destructive/error states.
- `semantic.warning`: warning state.
- `semantic.info`: informational state.
- `semantic.*Background`: low-opacity status backgrounds.

### Gradients

- `gradients.mountain*`: sand and warm-paper background depth.
- `gradients.sunMoon*`: subtle moon/sun atmospheric wash.
- `gradients.button*`: primary action treatment.
- `gradients.paper`, `paperLight`: carve/paper effects.

### Calendar

- `calendar.noDreams`: light beige day state.
- `calendar.hasDreams`: Soft Amethyst from `accent.primary`.
- `calendar.orange`: Old Gold optional variant.

## Import Methods

### Flat Object

```typescript
import { colors } from '../theme';

backgroundColor: colors.background;
color: colors.textPrimary;
borderColor: colors.border;
```

### Grouped Exports

```typescript
import { backgrounds, text, accent, borders } from '../theme';

backgroundColor: backgrounds.primary;
color: text.primary;
borderColor: borders.primary;
```

Use grouped exports for new shared UI. The flat `colors` object remains for existing screens and compatibility.

## Best Practices

### Do

```typescript
import { backgrounds, text, borders } from '../theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: backgrounds.primary,
    borderColor: borders.primary,
  },
  label: {
    color: text.secondary,
  },
});
```

### Don't

```typescript
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F4EFEA',
    color: '#2D2430',
  },
});
```

## Where To Edit

| What | File / export |
|------|---------------|
| Main app base | `colors.ts` -> `backgrounds.primary` |
| Secondary wash | `colors.ts` -> `backgrounds.secondary` |
| Text | `colors.ts` -> `text.*` |
| Buttons / mic / active controls | `colors.ts` -> `accent.buttonPrimary` |
| Symbol accents | `colors.ts` -> `accent.symbol` |
| Borders | `colors.ts` -> `borders.*` |
| Screen atmosphere | `colors.ts` -> `gradients.screen*` |
| Brand splash/icon palette | `colors.ts` -> `brandIcon.*` |

## Adding Colors

1. Add the color to the most specific group in `colors.ts`.
2. Prefer role names over literal color names.
3. Add a flat `colors.*` alias only when an existing component needs it.
4. Update this guide if the color becomes part of the shared design system.
