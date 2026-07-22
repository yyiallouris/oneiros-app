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

## Shared UI components

Import from `src/components/ui/`:

- `Button`, `PrimaryIconButton` — actions
- `ActionLoadingSlot`, `LoadingState`, `ContentSkeleton` — async feedback
- `Card`, `Chip`, `PaperBackground` — surfaces
- `BreathingLine`, `PrintPatchLoader` — loading visuals (via `LoadingState` only in screens)

## Rules

1. **Colors:** import from `../theme` — no hardcoded hex in components.
2. **Buttons:** use `Button` + `buttons.ts` tokens; Save dream on Write keeps local inactive fade (see `WriteScreen`).
3. **Responsive actions:** button labels should stay readable as whole words on narrow devices. Prefer single-line labels, and if side-by-side actions cannot fit cleanly, stack them vertically instead of letting words split awkwardly across lines.
4. **Loading:** hide the CTA, show `LoadingState` — never `ActivityIndicator` inside buttons.
5. **Background:** `PaperBackground` + `BG_paper.png` — no new global gradients or waves on active screens.
6. **Legacy:** `LegacyWaveBackground` / `LegacyMountainWaveBackground` are reference-only; not for new screens.

## Adding something new

1. Check this index and the relevant guide.
2. Extend the closest existing token file (`colors.ts`, `buttons.ts`, or `loading.ts`).
3. Update the matching `.md` in the same PR.
