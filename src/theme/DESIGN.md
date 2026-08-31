# Design System Index

Centralized visual rules for Oneiros. **Do not add one-off colors or loading patterns in screens.**

## Files

| Layer | Source | Guide |
|-------|--------|-------|
| Colors | `colors.ts` | `COLORS.md` |
| Buttons | `buttons.ts` + `Button.tsx` | `COLORS.md` → Primary Action |
| Loading | `loading.ts` + `LoadingState.tsx` | `LOADING.md` |
| Typography | `typography.ts` | `TYPOGRAPHY.md` |
| Iconography | `iconography.ts` + `../components/icons/` | `ICONS.md` |
| Spacing / radius | `spacing.ts` | values in file |
| Web / chrome layout | `layout.ts` + `WebContentShell` | values in file + this index |

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
5. **Tab-screen CTAs:** the floating parchment nav is overlay chrome. Dock primary actions (Write **Save dream**) in the layout with `resolveFloatingTabBarContentInset` — never absolutely overlay them with platform-specific fudge offsets that can slip under the shelf on short web/iPhone/Android viewports.
6. **Icons:** follow `ICONS.md`. Preserve existing concepts and silhouettes unless a specific redesign is approved; Journal is the current explicit exception. Judge harmonization in a common monochrome proof before product-state colour. Insights retains original black ink, microphone/calendar retain their original raster canvas, and code-native functional paths share rounded 1.7 strokes. Preserve at least a 44dp parent touch target.
7. **Loading:** hide the CTA, show `LoadingState` — never `ActivityIndicator` inside buttons.
8. **Background:** `PaperBackground` + `BG_paper.png` — no new global gradients or waves on active screens.
9. **Legacy:** `LegacyWaveBackground` / `LegacyMountainWaveBackground` are reference-only; not for new screens.
10. **Calmness before affordance:** optimize for calmness first, discoverability second. If an interactive element draws attention to itself instead of to the dream, it is too loud; prefer editorial disclosures that emerge from the paper over generic card or Material-button chrome. For disclosure rows, remove the chevron mentally: everything left behind should read as a natural part of the page, not as a button.
11. **Subscription cards:** visual density, continuous tier surfaces, status badges, store-price states, explicit CTA-only store actions, and feature expansion belong in shared `SubscriptionPlanCard` / `SubscriptionStoreNotice`; do not patch only one onboarding, paywall, or Subscription consumer.
12. **Tab safe areas:** tab screens must preserve a 24dp editorial top inset while clearing larger device cutouts, use the shared floating-shelf bottom resolver, and hide the shelf while a text-entry keyboard is open.
13. **Semantic typography:** Cormorant identifies dream titles, short inward/reflective voice, and emotionally important empty states. Inter owns navigation, controls, metadata, search, settings, and system/configuration headings. Long reading remains Inter with relaxed leading. Never add serif only as atmosphere.
14. **Quiet surfaces:** shared `Card` uses one faint contour and a restrained paper shadow. Do not add decorative inset borders or top glows. Prefer spacing or one hairline over nested boxes; specialized subscription tier surfaces keep their explicit semantic treatment.
15. **Geometry:** functional pills may remain perfectly rounded, common cards use the shared 16dp paper radius, and featured surfaces may use a larger established radius. Coherence comes from role and contour character, not forcing every surface onto one number.

## Adding something new

1. Check this index and the relevant guide.
2. Extend the closest existing token file (`colors.ts`, `iconography.ts`, `buttons.ts`, `loading.ts`, or `layout.ts`).
3. Update the matching `.md` in the same PR.
