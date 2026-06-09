# Typography System Guide

## Overview

All app type tokens live in **`src/theme/typography.ts`**. Oneiros uses a strict two-family system:

```txt
Brand serif + restrained UI sans
```

The goal is to keep the Oneiros wordmark expressive without making the app feel like a font moodboard. In-product hierarchy should come mostly from size, weight, color, spacing, and line-height, not from switching fonts.

## Font Families

| Role | Font | Token | Usage |
|------|------|-------|-------|
| Brand / logo / splash | Cormorant Garamond | `typography.display`, `typography.roles.brand` | Oneiros wordmark, splash title, rare short poetic title |
| App UI | Alegreya Sans | `typography.regular`, `medium`, `bold`, `typography.roles.ui*` | Navigation, buttons, labels, inputs, cards, screen headings |
| Reflection text | Alegreya Sans | `typography.roles.reflection` | Dream reflections, interpretation copy, reports, essays |

## Rules

- UI labels, controls, navigation titles, and section labels use sans.
- Dream reflections and reports use the sans family with relaxed line-height.
- The expressive serif is for the logo/splash brand moment only, unless a short poetic title truly benefits from it.
- Keep app headings restrained. Avoid making every card title feel like a screen title.
- Use two fonts max. Do not add Inter, Satoshi, Avenir Next, IBM Plex Sans, Source Serif, or Literata unless the whole type system is intentionally migrated.

## Hierarchy

| Level | Recommended treatment | Examples |
|-------|-----------------------|----------|
| Brand | Serif, 34px, loose letter spacing | Loading splash `Oneiros` |
| Screen title | Sans medium, 22px | Main in-app header title |
| Navigation title | Sans medium, 18px | Stack header title |
| Card / section title | Sans medium, 18px or label-style 12-14px | Insights cards, dream detail sections |
| UI label | Sans medium, 12px uppercase when needed | Report block titles, metadata labels |
| Body / reflection | Sans regular, 16px, relaxed line-height | Dream content, symbolic reflection |

## Import

```typescript
import { typography } from '../theme';

fontFamily: typography.medium;
fontSize: typography.sizes.lg;
lineHeight: typography.sizes.md * typography.lineHeights.relaxed;
```

## Adding Type Styles

1. Reuse `typography.ts` tokens first.
2. Prefer semantic role comments/docs over one-off local font decisions.
3. Add a new font only as a deliberate system migration, not for a single screen.
4. Update this guide and `design-exports/figma/oneiros-typography.tokens.json` when typography roles change.
