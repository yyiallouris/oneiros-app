# Oneiros v1 final design release

**Decision:** FINAL / FROZEN FOR ONEIROS V1

**Lifecycle:** SUPERSEDED AS ACTIVE RUNTIME, PRESERVED IMMUTABLY

**Release id:** `oneiros-design-v1.0.2`

**Approved:** 2026-09-02

**App version at approval:** `1.2.0`

App `1.3.0` promotes the separately versioned eye/river identity under
`oneiros-design-v1.1.0`; see
[`oneiros-v130-brand-release.md`](./oneiros-v130-brand-release.md). This record
and its fingerprint remain the exact historical `1.2.0` baseline.

## Product decision

The complete current application—not only Calendar or the icon family—is the
approved final visual and UX baseline for Oneiros v1. This covers the full
journey from entry, authentication and onboarding through Write, Journal,
Calendar, Dream Detail, reflection/chat, Insights, subscription, account,
support and legal surfaces.

The release preserves the current paper-first post-Jungian direction: warm
textured field, semantic two-family typography, quiet paper surfaces,
pressure-led icon subfamilies, restrained plum interaction states, fully opaque
floating navigation, and the current hierarchy, spacing and motion contracts.

## Immutable identity

At approval, runtime metadata and theme code exposed
`oneiros-design-v1.0.2`. A deterministic
SHA-256 fingerprint binds that identity to the active application shell,
screens, navigation, layout, theme, shared components, backgrounds, branding
and runtime icon assets. Paths and bytes are hashed in sorted order; legacy
assets and the release declaration itself are excluded.

**Source fingerprint:**
`844ad6349dd39a928c2a8308739f4f2ab2329a8b5e2915f4edb4ecfcb7923dca`

The fingerprint is a change detector, not a claim that every source file has
the same visual role. It ensures a later user-visible edit cannot silently keep
the same final-v1 identity.

## Change boundary

- Do not change a user-visible v1 design while retaining this release id.
- A corrective v1 visual change requires explicit product approval, a new
  semantic design-release id, a new fingerprint, and updated documentation and
  contract expectations.
- A new aesthetic direction belongs to Oneiros v2 rather than being folded
  into this baseline.
- Functional bug fixes that do not alter visible design may update code outside
  the fingerprinted visual scope without bumping this design release.
- Existing locked product contracts—especially reflection streaming and phased
  typing—remain separately protected and are not weakened by this freeze.

## Platform boundary

The same design system is the v1 baseline for iPhone, Android phones and the
phone-scale Expo web shell. Oneiros v1 remains intentionally iPhone-only on iOS
(`supportsTablet: false`); iPad design is not implied by this approval.

## Verification

Run:

```bash
npm run verify:design-release
npm test -- --runInBand __tests__/designRelease.test.ts
npm run typecheck
```

The contract fails when any fingerprinted active visual source or asset no
longer matches the final-v1 baseline.

## Release history

- `oneiros-design-v1.0.2` — approved store-compliance refinement: discreet AI
  report actions, quiet paid-plan purchase disclosures, and contextual account-
  deletion subscription messaging. Core paper atmosphere, navigation, layout,
  reflection streaming, motion, iconography, and typography remain unchanged.
- `oneiros-design-v1.0.1` — approved copy patch: both dream-entry surfaces use
  exact **“Write it as you remember it.”**; no visual geometry or behavior
  changed.
- `oneiros-design-v1.0.0` — initial complete-app final-v1 freeze; source
  fingerprint `e6c798f8453dcb260213a07639297cbbcba069d3974a9d0e54a45fe8fd78d2c2`.
