# Design System Index

Centralized visual rules for Oneiros. **Do not add one-off colors or loading patterns in screens.**

## Files

| Layer | Source | Guide |
|-------|--------|-------|
| Colors | `colors.ts` | `COLORS.md` |
| Buttons | `buttons.ts` + `Button.tsx` | `COLORS.md` → Primary Action |
| Loading | `loading.ts` + `LoadingState.tsx` | `LOADING.md` |
| Typography | `typography.ts` | `TYPOGRAPHY.md` |
| Spacing / radius | `spacing.ts` | values in file |
| Web layout | `layout.ts` + `WebContentShell` | values in file + this index |

## Shared UI components

Import from `src/components/ui/`:

- `Button`, `PrimaryIconButton` — actions
- `ActionLoadingSlot`, `LoadingState`, `ContentSkeleton` — async feedback
- `Card`, `Chip`, `PaperBackground` — surfaces
- `WebContentShell` — Expo web centered content column (no-op on native / design-export)
- `BreathingLine`, `PrintPatchLoader` — loading visuals (via `LoadingState` only in screens)

## Rules

1. **Colors:** import from `../theme` — no hardcoded hex in components.
2. **Buttons:** use `Button` + `buttons.ts` tokens for enabled / disabled / press. Do not override primary colors or disabled opacity in screens (layout-only styles are fine). Subscription plan CTAs and text links are exceptions.
3. **Responsive actions:** button labels should stay readable as whole words on narrow devices. Prefer single-line labels, and if side-by-side actions cannot fit cleanly, stack them vertically instead of letting words split awkwardly across lines.
4. **Web layout:** Expo web keeps the mobile single-column UI. `WebContentShell` (mounted in `App.tsx`) centers a phone-scale column (`layout.contentMaxWidth` / tablet comfort width) on wide browsers. Prefer `useContentWidth()` over `Dimensions.get('window')` for horizontal pagers and size-bound chrome so they track the shell, not the full desktop viewport. Design-export phone-frame mode bypasses the shell.
5. **Loading:** hide the CTA, show `LoadingState` — never `ActivityIndicator` inside buttons.
6. **Background:** `PaperBackground` + `BG_paper.png` — no new global gradients or waves on active screens.
7. **Legacy:** `LegacyWaveBackground` / `LegacyMountainWaveBackground` are reference-only; not for new screens.

## Adding something new

1. Check this index and the relevant guide.
2. Extend the closest existing token file (`colors.ts`, `buttons.ts`, or `loading.ts`).
3. Update the matching `.md` in the same PR.
