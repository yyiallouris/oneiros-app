# Color System Guide

## Overview

All app colors live in **`src/theme/colors.ts`**. The current visual direction is:

```txt
Warm bone / mist gray / dirty lilac
```

The palette should feel like paper, ash, moonlight, and a muted dream archive. Avoid returning the UI to soft wellness tones or bright decorative accent systems.

**Never use hardcoded colors in components** unless the color is truly local and cannot be expressed as a reusable token.

## Core Palette

| Color name | Value | Token | Usage |
|------------|-------|-------|-------|
| Warm bone | `#F7F3F0` | `backgrounds.primary` | Main app background, splash background |
| Dirty lilac wash | `#EFE8F1` | `backgrounds.secondary`, `backgrounds.wave1`, `accent.light` | Secondary screen wash, soft panels, background waves |
| Paper surface | `#FFFCFA` | `backgrounds.tertiary`, `backgrounds.card` | Raised surfaces, clean cards |
| Ash-lilac border | `#DDD3DD` | `backgrounds.wave2`, `borders.primary`, `borders.input`, `borders.card` | Borders, dividers, wave depth |
| Primary ink | `#2B2430` | `text.primary`, `text.title`, `brandIcon.plum` | Main text, titles, wordmark tone |
| Muted plum-gray | `#55485D` | `text.secondary` | Supporting text |
| Muted text | `#807384` | `text.muted` | Placeholders, subdued metadata |
| Muted violet | `#6E4D78` | `text.accent`, `accent.symbol`, `brandIcon.glow` | Symbol accents, subtle emphasis |
| Deep violet action | `#4F3A58` | `accent.buttonPrimary`, `accent.dark` | Buttons, selected controls, active UI |
| Decorative violet | `#8B6A93` | `accent.primary`, `calendar.hasDreams` | Non-interactive highlights, dream-count marks |

## Main Token Groups

### Backgrounds

- `backgrounds.primary`: warm bone app base.
- `backgrounds.secondary`: dirty lilac support wash.
- `backgrounds.tertiary`: clean paper for raised sections.
- `backgrounds.card`: paper card surface.
- `backgrounds.cardTransparent`, `cardSemiTransparent`, `cardMoreTransparent`: translucent paper surfaces.
- `backgrounds.wave1`, `wave2`: muted wave/background depth.
- `backgrounds.overlay`, `overlayLight`, `backdrop`: ink-based overlays.

### Text

- `text.primary`: primary ink.
- `text.secondary`: muted plum-gray.
- `text.muted`: placeholders and lower-priority metadata.
- `text.title`: title ink.
- `text.accent`: muted violet emphasis.
- `text.white`, `text.onAccent`: text on dark/accent surfaces.

### Primary Action

Change `accent.buttonPrimary` in `colors.ts` to update the main action family across the app.

- `accent.buttonPrimary`: buttons, active controls, microphone, selected calendar states, send/edit icons.
- `accent.buttonPrimaryLight`: light chip/toggle backgrounds.
- `accent.buttonPrimaryLight12`: subtle action-tinted backgrounds.
- `accent.buttonPrimary40`: action borders and toggle tracks.
- `accent.buttonPrimary90`: solid chat/action surfaces.
- `accent.buttonPrimaryDisabled*`: disabled primary-action states.

### Decorative Accents

- `accent.primary`: non-interactive decorative violet, including `calendar.hasDreams`.
- `accent.light`: dirty lilac accent wash.
- `accent.dark`: deep violet.
- `accent.symbol`: symbol and nav accent tone.
- `accent.orange`: warm calendar/sun contrast. Use sparingly.

### Brand Icon

- `brandIcon.plum`: dark icon and wordmark tone.
- `brandIcon.plumShadow`: deep vignette/shadow.
- `brandIcon.glow`: core muted-violet glow.
- `brandIcon.contour`: primary contour/light stroke.
- `brandIcon.contourSoft`: softer supporting contour.
- `brandIcon.mist`: splash/light brand backdrop.

### Surfaces

- `surfaces.glass`: default translucent paper card.
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
- `contours.fill`: atmospheric fill.
- `contours.glow`: muted violet glow.

### Semantics

Semantic colors stay conventional:

- `semantic.success`: green success state.
- `semantic.error`, `errorLight`, `errorDark`: destructive/error states.
- `semantic.warning`: warning state.
- `semantic.info`: informational state.
- `semantic.*Background`: low-opacity status backgrounds.

### Gradients

- `gradients.mountain*`: warm bone to dirty/ash lilac background depth.
- `gradients.sunMoon*`: subtle moon/sun atmospheric wash.
- `gradients.screen*`: full-screen atmosphere for `PsycheScreenBackground`.
- `gradients.button*`: primary action treatment.
- `gradients.paper`, `paperLight`: carve/paper effects.

### Calendar

- `calendar.noDreams`: light paper-mist day state.
- `calendar.hasDreams`: decorative violet from `accent.primary`.
- `calendar.orange`: warm optional variant.

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
    backgroundColor: '#F7F3F0',
    color: '#2B2430',
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
