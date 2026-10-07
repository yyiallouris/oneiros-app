# Color System

All live app colors live in **`src/theme/colors.ts`**. See **`DESIGN.md`** for the full design-system map (buttons, loading, typography).

**Direction:** warm paper + flat dark ink + restrained plum.

## Locked v1.3.0 palette

The D2.5 direction and exact values are approved as the locked v1.3.0 visual
foundation. `oneirosPalette` exports exactly seven
primitives: `PAPER`, `SURFACE`, `INK`, `INK_MUTED`, `PLUM`, `PLUM_SOFT`, and
`BORDER`. Existing semantic roles alias those primitives rather than creating
component-local colours. Dark ink remains the default for text and functional
icons, plum is an accent, and canvas/cards stay warm neutrals. Authored Insights
PNG pixels are unchanged; defining symbolic ink does not tint or redesign them.

## Runtime palette

| Role | Hex | Token |
|------|-----|-------|
| PAPER | `#F3ECE2` | `backgrounds.primary`, `backgrounds.splash` |
| SURFACE | `#FAF7F1` | cards, fields, nav shelf, raised surfaces |
| Sand wave | `#DAD2C8` | `backgrounds.wave1` |
| Deep sand | `#CFC6BA` | `backgrounds.wave2` |
| INK | `#342A38` | primary/title text, functional and symbolic ink token |
| INK_MUTED | `#6B606C` | secondary information and quiet functional controls |
| PLUM | `#5E4566` | active navigation, CTA, text accent |
| PLUM_SOFT | `#897B8C` | inactive/non-text navigation artwork, disabled accent |
| BORDER | `#E4DCD2` | borders, dividers, contours, nav contour |
| Subscription Premium CTA | `#FBF5EC` | `subscriptionButtons.premiumBackground` |
| Subscription Free CTA | `transparent` | `subscriptionButtons.freeBackground` |
| Subscription Deeper CTA | `rgba(255,255,255,0.10)` | `subscriptionButtons.deeperBackground` |
| Old Gold | `#B58A4A` | `accent.oldGold` |
| Clay Brown | `#8C6B5A` | `accent.clayBrown` |

## Token groups (in use)

### Backgrounds & overlays

- `backgrounds.primary` — app base under `BG_paper.png`
- `backgrounds.secondary`, `card`, `tertiary`, `splash`
- `backgrounds.wave1`, `wave2` — skeleton shimmer + legacy wave reference
- `backgrounds.overlay`, `backdrop`

### Surfaces

- `surfaces.glass`, `glassStrong`, `glassSoft` — cards, menus, chat
- `surfaces.field` — inputs, loading panels, chips
- `surfaces.nav`, `navBorder` — `SURFACE` floating tab shelf plus `BORDER` contour
- `surfaces.conversationDock` — the existing translucent parchment (`86%` opaque) retained for the Dream Detail conversation composer; it stays separate so nav-shelf experiments do not leak into reading/chat surfaces

### Text

- `text.primary`, `secondary`, `muted`, `title`, `accent`; both secondary and
  muted essential copy resolve to AA-safe `INK_MUTED`
- `text.white`, `onAccent`
- Functional artwork such as the microphone paths and tintable calendar ink raster uses `text.secondary` (Muted Ink), preserving authored line/alpha variation without introducing asset-local colours.

### Tab navigation

- `tabBar.iconActive` uses `PLUM #5E4566`; active glyphs render at `0.98`.
- `tabBar.iconInactive` uses `PLUM_SOFT #897B8C`; inactive glyphs reduce to
  `0.58` opacity. Small inactive labels use `INK_MUTED`, not `PLUM_SOFT`.
  Hue, contrast, and label weight make state clear without a selection pill or badge.

### Symbolic icons

- `iconInks.symbolic` is `INK #342A38`, ready for separately approved symbolic rendering. Existing authored Insights PNGs remain byte-for-byte and visually unchanged during this token-only pass.

### Primary actions

Styles: **`buttons.ts`**. Loading: **`loading.ts`**. Press: shared `Button` uses `activeOpacity={0.7}`.

- Active: `buttonPrimary90` + `buttonEdge` + soft plum shadow + `onAccent` label
- Disabled: same plum fill/border at `opacity: 0.68` (Save dream treatment — app-wide for primary)
- Secondary/ghost disabled: keep variant fill, fade with `opacity: 0.68`
- Geometry belongs to `buttonSizes`: default actions keep the established pill;
  compact primary, secondary, and ghost actions all resolve to `46dp` height
  with an `18dp` radius. Variant styles do not replace size geometry.

Also: `buttonPrimary`, `buttonPrimaryLight`, `buttonPrimaryLight12`, `buttonPrimary40`, `buttonPrimaryDisabled*`; all shared plum variants derive from `PLUM` or `PLUM_SOFT`.

### Accessibility decision

- `PLUM_SOFT #897B8C` on `SURFACE #FAF7F1` measures `3.72:1`. It is sufficient
  for inactive/non-text artwork but not small essential labels. Those labels
  use `INK_MUTED #6B606C` (`5.59:1`) through the shared semantic role; no
  component-local darkening is permitted.
- `INK` on `SURFACE` is `12.80:1`, `PLUM` on `SURFACE` is `7.80:1`, and white on
  `PLUM` is `8.34:1`.

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

`PaperBackground` tiles the paper texture with `resizeMode="repeat"` instead of
stretching/cropping a single phone-sized image. Its image layer also owns
explicit `100%` width and height so React Native Web cannot fall back to the
asset's intrinsic `393 × 852` CSS size and expose a flat strip on wider or
taller viewports. The same full-plane sizing keeps the paper field continuous
on tall Android/iPhone screens and long content areas.

Legacy wave exports stay in the repo for reference only (`LegacyWaveBackground`, `LegacyMountainWaveBackground`).
