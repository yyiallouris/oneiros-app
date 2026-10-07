# Oneiros app-brand asset specification

The active app `1.3.0` identity is the approved eye/river mark. Its exact
masters, export hashes, and platform decisions are recorded in
[`../documentation/oneiros-v130-brand-release.md`](../documentation/oneiros-v130-brand-release.md)
and `assets/branding/releases/v1.3.0/manifest.json`.

## Source policy

- Never redraw, vectorize, smooth, replace, or generatively reinterpret the
  supplied symbol.
- Preserve the two canonical 1254px PNG masters byte-for-byte under `source/`.
- Produce store assets only through `npm run brand:export:v1.3.0`, then verify
  their hashes.
- A later visual change requires a new versioned release directory, manifest,
  app/design version, documentation, and product approval.

## Platform outputs

### Apple

- `icon-ios-1024.png` is opaque RGB at `1024×1024`; App Store icons must not
  contain an alpha channel.
- The supplied transparent presentation margin is cropped. Only pixels hidden
  beneath Apple's owned corner mask receive an opaque plum fill.
- Do not bake another rounded-square mask or extra margin into the submitted
  source.

### Android

- Legacy icon and adaptive background are opaque `1024×1024` versions of the
  complete approved composition.
- The adaptive foreground is intentionally transparent: the composition stays
  in the background layer to preserve the exact watercolor texture instead of
  reconstructing it for parallax.
- The monochrome layer uses the exact eye/river silhouette inside Android's
  safe zone. Near-zero alpha export speckles are removed so system tinting
  cannot amplify invisible source noise.
- Verify circle and squircle masks in the release platform preview and on a
  generated Android build.

### Splash and in-app loading

- Background: warm paper `#F8F3EA`.
- Native splash: exact transparent eye/river symbol, `imageWidth: 180`, no text.
- In-app `LoadingScreen`: the same source pixels plus the `Oneiros` wordmark.
  Transparent canvas whitespace is removed only with a render-time optical
  crop; the PNG itself is not altered.

### Web and public site

- Expo web uses the deterministic `favicon-256.png` export.
- The public site uses a byte-equal copy of the transparent symbol and the same
  favicon export.

## Active paths

All app runtime references resolve from:

```text
assets/branding/releases/v1.3.0/exports/
```

The previous flat `assets/branding/*.png` files remain unchanged as historical
`1.2.0` material and are not active runtime inputs.
