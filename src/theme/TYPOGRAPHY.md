# Typography System Guide

## Overview

All app type tokens live in **`src/theme/typography.ts`**. Oneiros uses the restored pre-Alegreya two-family system:

```txt
Brand serif + Inter UI sans
```

The two families have semantic jobs rather than decorative ones. Cormorant marks dream material and the inward voice; Inter carries the interface and sustained reading. Hierarchy still comes primarily from size, weight, color, spacing, and line-height.

## Font Families

| Role | Font | Token | Usage |
|------|------|-------|-------|
| Brand | Cormorant Garamond | `typography.display`, `typography.roles.brand` | Oneiros wordmark and splash title |
| Dream title / inner voice | Cormorant Garamond | `typography.roles.dreamTitle`, `innerVoice`, `reflection`, `poeticShortTitle` | User-authored dream titles, short reflective questions, emotionally important empty states |
| App UI | Inter | `typography.roles.ui`, `uiEmphasis`, `uiStrong`, `screenTitle`, `navigationTitle`, `control`, `metadata` | Navigation, controls, settings, timestamps, search, utility labels and system/configuration headings |
| Sustained reading | Inter | `typography.regular` with relaxed leading | Long dream entries, interpretations, reports and essays where reading comfort matters more than display voice |

## Rules

- UI labels, controls, metadata, navigation titles, settings and system/configuration headings use sans.
- User-authored dream titles, the dream voice, short reflective prompts and emotionally important empty states use serif.
- Long reflection/report prose stays Inter with relaxed line-height. Serif identifies the inward voice; it is not forced across long passages at the cost of readability.
- Never use serif merely to make a generic screen feel poetic.
- Keep app headings restrained. Avoid making every card title feel like a screen title.
- Use two fonts max. Do not add Alegreya Sans, Satoshi, Avenir Next, IBM Plex Sans, Source Serif, or Literata unless the whole type system is intentionally migrated.

## Hierarchy

| Level | Recommended treatment | Examples |
|-------|-----------------------|----------|
| Brand | Serif, 34px, loose letter spacing | Loading splash `Oneiros` |
| System/configuration title | Inter medium, 22–28px | Security, language, privacy, subscription |
| Navigation title | Inter medium, 18px | Stack header title |
| Dream title / short inward voice | Cormorant SemiBold, 16–22px | Journal entries, dream detail, reflective question, poetic empty state |
| Card / section title | Inter medium, 18px or label-style 12–14px | Insights cards, dream detail sections |
| UI label | Inter medium, 12px uppercase when needed | Report block titles, metadata labels |
| Sustained reading | Inter regular, 16px, relaxed line-height | Dream content, symbolic interpretation and reports |

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
