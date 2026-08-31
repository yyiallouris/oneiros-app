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
| Ghost Text | `#8C8290` | `text.muted` |
| Muted Tab Ink | `#756A79` | `tabBar.iconInactive` |
| Ritual Plum | `#65446F` | `text.accent` |
| Night Plum | `#4B3158` | `accent.buttonPrimary` |
| Soft Amethyst | `#A88BB2` | `accent.buttonPrimaryDisabled` |
| Subscription Premium CTA | `#FBF5EC` | `subscriptionButtons.premiumBackground` |
| Subscription Free CTA | `transparent` | `subscriptionButtons.freeBackground` |
| Subscription Deeper CTA | `rgba(255,255,255,0.10)` | `subscriptionButtons.deeperBackground` |
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
- `surfaces.nav`, `navBorder` — translucent parchment floating tab shelf (`86%` opaque / `14%` transparent) and its faint contour

### Text

- `text.primary`, `secondary`, `muted`, `title`, `accent`
- `text.white`, `onAccent`

### Tab navigation

- `tabBar.iconActive` uses Deep Ink.
- `tabBar.iconInactive` uses `#756A79`, muted enough to preserve hierarchy while retaining 4.5:1+ contrast against the parchment shelf for the 12dp labels. Inactive PNG glyphs also reduce opacity; no selection pill is used.

### Primary actions

Styles: **`buttons.ts`**. Loading: **`loading.ts`**. Press: shared `Button` uses `activeOpacity={0.7}`.

- Active: `buttonPrimary90` + `buttonEdge` + soft plum shadow + `onAccent` label
- Disabled: same plum fill/border at `opacity: 0.68` (Save dream treatment — app-wide for primary)
- Secondary/ghost disabled: keep variant fill, fade with `opacity: 0.68`

Also: `buttonPrimary`, `buttonPrimaryLight`, `buttonPrimaryLight12`, `buttonPrimary40`, `buttonPrimaryDisabled*` (legacy soft lavender — prefer opacity fade on primary CTAs)

### Subscription buttons

Styles: **`SubscriptionPlanCard.tsx`**. These tokens are a separate CTA category for subscription plan cards only; changing them must not alter shared app buttons in `buttons.ts`.

- Premium default: `premiumBackground` (`#FBF5EC`) + `premiumText` (`#4E4053`)
- Premium pressed: `premiumBackgroundPressed`
- Premium border/shadow: `premiumBorder` + `premiumShadow`
- Free default: `freeBackground` (`transparent`) + `freeText` (`#403744`)
- Free pressed: `freeBackgroundPressed` + `freeTextPressed`
- Free border/shadow: `freeBorder` (`#817682`) + `freeShadow`
- Deeper default: `deeperBackground` (`rgba(255,255,255,0.10)`) + `deeperText` (`#F8F1FA`)
- Deeper pressed: `deeperBackgroundPressed`
- Deeper border/shadow: `deeperBorder` + `deeperShadow`
- Store-price loading or unavailable: keep the selected plan variant's palette, move the state into secondary typography, and hide unavailable purchase CTAs in favor of the shared retry notice.

### Subscription cards

- `subscriptionCards.free*` — warm parchment / stone card, calm and fully respectable
- `subscriptionCards.premium*` — one continuous muted dusk-plum surface (top and body share the same token value), readable secondary copy, recommended badge, restrained raised depth
- `subscriptionCards.deeper*` — one continuous midnight plum / ink surface, quieter and more serious than Premium

### Contours

- `contours.line`, `lineSoft`, `lineFaint`
- Shared paper cards use a single `lineFaint` contour. Do not stack a second inset border or decorative top glow; spacing or one hairline should do the separating whenever possible.

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

`PaperBackground` now tiles the paper texture with `resizeMode="repeat"` instead of stretching/cropping a single phone-sized image. This keeps the paper feel consistent on taller Android screens, long content areas, and navigation transitions where a scaled image could wash out into a flatter white field.

Legacy wave exports stay in the repo for reference only (`LegacyWaveBackground`, `LegacyMountainWaveBackground`).
