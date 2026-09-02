# Design System Index

Centralized visual rules for Oneiros. **Do not add one-off colors or loading patterns in screens.**

## Oneiros v1 release lock

The complete current app design is final and frozen as
`oneiros-design-v1.0.1`, approved on 2026-09-02. The immutable scope, source
fingerprint, platform boundary and versioning rules are documented in
[`../../documentation/oneiros-v1-design-release.md`](../../documentation/oneiros-v1-design-release.md).
Any user-visible design change requires explicit product approval and a new
design-release identity; do not silently overwrite the v1 baseline.

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
6. **Icons:** follow `ICONS.md`. Preserve existing concepts and silhouettes unless a specific redesign is approved. Judge harmonization in a common monochrome proof before product-state colour. The navigation branch shares pressure-led ink and authored asymmetry across the compact cropped raster feather, reinforced native open journal, and dot-free cropped seeing mark; active navigation uses the existing Night Plum palette token while inactive marks recede in Muted Tab Ink. Images uses its own half-lidded imaginal-eye raster: narrow unequal lids, a vertical organic presence, and one witness dot distinguish it from the fully open, round-pupil navigation eye while keeping both in one authored family. The remaining denser Insights artwork retains its authored black ink. Microphone/calendar form the pressure-led functional branch: microphone uses unequal rounded native strokes, while Calendar uses a tintable transparent raster built from irregular filled ink masses, dry breaks, and low-alpha filaments. The other code-native functional paths keep the quieter rounded 1.7 stroke. Preserve at least a 44dp parent touch target. Runtime code must never import artwork from an `assets/legacy` directory.
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
