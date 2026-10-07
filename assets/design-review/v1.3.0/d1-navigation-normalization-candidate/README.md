# D1 bottom-navigation normalization candidate

This round changes only the rendering grammar of the existing Write, Journal,
and Insights navigation marks. It does not introduce a new icon, silhouette,
semantic concept, colour, logo relative, or construction board.

## Preserved exactly

- Write remains the existing authored feather asset.
- Journal keeps the existing six meaningful path gestures and their `d` data.
- Insights remains the existing cropped eye asset; no second eye is invented.
- Existing active/inactive colour, opacity, label weight, and one-pixel lift.

## Normalized only

- Write uses uniform source scaling and one render layer, eliminating the
  horizontal distortion and synthetic pressure duplicate.
- Journal uses shared primary/spine/detail weights and drops two low-opacity
  shadow-overdraw paths that simulated texture.
- All three remain within the existing optical navigation band.

This exact review artifact was approved on 2026-10-06 and promoted as
`v1.3.0-d1-navigation`. Its runtime fingerprint is recorded in the manifest;
the directory remains immutable review evidence and is never imported.

Open `index.html` through a local web server for the required Current →
Normalized comparison and the two actual-size navigation shelves. It is a
review artifact only and is never imported by runtime code.
