# Oneiros 1.3.0 brand release

**Status:** FINAL BRAND ARTIFACTS / ACTIVE RUNTIME

**App version:** `1.3.0`

**Design release:** `oneiros-design-v1.1.0`

**Approved:** 2026-10-06

**Previous frozen release:** app `1.2.0` / `oneiros-design-v1.0.2`

**Wider design-train status:** active; see
[`oneiros-v130-design-evolution.md`](./oneiros-v130-design-evolution.md)

**D0 approved runtime checkpoint fingerprint:**
`53b9930c80b1697f060ca6a3756a7c58ef517a6f6e607fcf581a72bc9d67f581`

## Exact-source contract

The release uses the two product-owner-supplied PNG masters without a
generative redraw, vector reinterpretation, silhouette cleanup, or replacement
symbol. Duplicate uploads were byte-identical. Their canonical SHA-256 values
are locked in
[`manifest.json`](../assets/branding/releases/v1.3.0/manifest.json):

- transparent eye/river symbol: `c185b917…afb60c`
- textured app-icon composition: `6f7ccce5…bde536`

The canonical source files remain untouched under `source/`. Every platform
asset is deterministic and reproducible from them.

At the D0 checkpoint, the design-release fingerprint additionally binds the active app shell,
screens, navigation, theme, shared components, backgrounds, branding assets,
and runtime icon sources. The wider design train remains active. Review-only
previews are excluded because they are not shipped and may encode host
rendering details; candidate directories remain excluded until explicit
product approval promotes their contents into active ownership.

## Active exports

- iOS: opaque RGB `1024×1024` source. The supplied transparent presentation
  margin is removed; only pixels hidden beneath Apple's platform mask are
  filled so the submitted icon contains no alpha channel.
- Android legacy: the same opaque `1024×1024` composition.
- Android adaptive: the complete approved composition lives in the opaque
  background layer and the foreground layer is transparent. This intentionally
  trades parallax for visual fidelity and avoids reconstructing the supplied
  watercolor texture. The monochrome layer uses the exact symbol silhouette,
  centered inside Android's safe zone.
- Splash/loading: the symbol master is copied byte-for-byte.
- Web: a deterministic `256×256` favicon export.

The review sheet shows Apple rounded-square, Android circle, Android squircle,
small-icon, and splash treatments:
[`platform-preview.png`](../assets/branding/releases/v1.3.0/review/platform-preview.png).

Runtime ownership is explicit in `app.config.js`: iOS, Android legacy,
Android adaptive, monochrome, Expo web favicon, and native splash all resolve
from the versioned `assets/branding/releases/v1.3.0/exports/` directory.
`LoadingScreen` uses the same exact transparent symbol master with a render-time
optical crop; its source pixels are not edited. The public site uses byte-equal
copies of the approved symbol and favicon; its superseded SVG favicon is kept
under `site/assets/legacy/v1.2.0/` as release history.

## Reproduce and verify

```bash
npm run brand:export:v1.3.0
npm test -- --runInBand __tests__/brandV130Release.test.ts __tests__/designRelease.test.ts
```

The active app metadata is version `1.3.0`, iOS build `7`, Android version code
`7`, and design release `oneiros-design-v1.1.0`. The previous flat branding
files remain unchanged as historical `1.2.0` source material; runtime imports
do not overwrite or depend on them.
