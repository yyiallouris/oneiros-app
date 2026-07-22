# Color System

All live app colors live in **`src/theme/colors.ts`**. See **`DESIGN.md`** for the full design-system map (buttons, loading, typography).

**Direction:** warm paper field + Deep Ink text + Night Plum actions.

## Active palette

| Role | Hex | Token |
|------|-----|-------|
| Paper base | `#F8F3EA` | `backgrounds.primary` |
| Paper wash | `#F3ECE2` | `backgrounds.secondary`, `backgrounds.card` |
| Raised paper | `#FCF7F0` | `backgrounds.tertiary` |
| Sand wave | `#DAD2C8` | `backgrounds.wave1` |
| Deep sand | `#CFC6BA` | `backgrounds.wave2` |
| Deep Ink | `#2D2430` | `text.primary`, `text.title` |
| Muted Ink | `#5E5263` | `text.secondary` |
| Ghost Text | `#8C8290` | `text.muted`, `tabBar.iconInactive` |
| Ritual Plum | `#65446F` | `text.accent` |
| Night Plum | `#4B3158` | `accent.buttonPrimary` |
| Soft Amethyst | `#A88BB2` | `accent.buttonPrimaryDisabled` |
| Subscription Premium | `#4B3158` | `subscriptionButtons.premiumBackground` |
| Subscription Free | `#E6DFE8` | `subscriptionButtons.freeBackground` |
| Old Gold | `#B58A4A` | `accent.oldGold` |
| Clay Brown | `#8C6B5A` | `accent.clayBrown` |
| Paper border | `#E2D8CC` | `borders.primary` |

## Token groups (in use)

### Backgrounds & overlays

- `backgrounds.primary` — app base under `BG_paper.png`
- `backgrounds.secondary`, `card`, `tertiary`, `splash`
- `backgrounds.wave1`, `wave2` — skeleton shimmer + legacy wave reference
- `backgrounds.overlay`, `backdrop`

### Surfaces

- `surfaces.glass`, `glassStrong`, `glassSoft` — cards, menus, chat
- `surfaces.field` — inputs, loading panels, chips
- `surfaces.nav`, `navBorder` — floating tab shelf

### Text

- `text.primary`, `secondary`, `muted`, `title`, `accent`
- `text.white`, `onAccent`

### Primary actions

Styles: **`buttons.ts`**. Loading: **`loading.ts`**.

- Active: `buttonPrimary90` + `buttonEdge` + `buttonGlow` + white label
- Default disabled (most buttons): `buttonPrimaryDisabled*`
- **Write Save dream exception:** same plum active colors + `opacity: 0.68` when empty — see `WriteScreen`

Also: `buttonPrimary`, `buttonPrimaryLight`, `buttonPrimaryLight12`, `buttonPrimary40`

### Subscription buttons

Styles: **`SubscriptionPlanCard.tsx`**. These tokens are a separate CTA category for subscription plan cards only; changing them must not alter shared app buttons in `buttons.ts`.

- Premium default: `premiumBackground` (`#4B3158`) + `premiumText` (`#FFFDF9`)
- Premium pressed: `premiumBackgroundPressed` (`#3F294A`)
- Premium border/shadow: `premiumBorder` (`rgba(255, 255, 255, 0.10)`) + `premiumShadow` (`rgba(45, 36, 48, 0.16)`)
- Free default: `freeBackground` (`#E6DFE8`) + `freeText` (`#4B3158`)
- Free pressed: `freeBackgroundPressed` (`#D9D1DC`) + `freeTextPressed` (`#432C50`)
- Free border/shadow: `freeBorder` (`#D4CAD7`) + `freeShadow` (`rgba(45, 36, 48, 0.08)`)

### Contours

- `contours.line`, `lineSoft`, `lineFaint`

### Semantic

- `semantic.success`, `error`, `warning`, `errorDark`, `errorBackground`

### Calendar

- `calendar.noDreams` — empty day fill (`CircularCalendar`)

### Legacy only

- `waveTints.A`, `waveTints.B` — `LegacyMountainWaveBackground` reference component

## Import patterns

```typescript
import { colors, text, borders } from '../theme';

backgroundColor: colors.background;
color: text.secondary;
borderColor: borders.primary;
```

Flat `colors.*` aliases remain for existing screens. Prefer grouped exports in new code.

## Do not

- Hardcode hex in components
- Add `brandIcon`, `gradients`, or sun-cycle palettes back without a live consumer
- Layer new global waves/gradients on active screens

## Paper background

Full-screen field: `assets/backgrounds/BG_paper.png` via `PaperBackground`.

Legacy wave exports stay in the repo for reference only (`LegacyWaveBackground`, `LegacyMountainWaveBackground`).
