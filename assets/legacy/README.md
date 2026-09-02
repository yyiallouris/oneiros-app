# Legacy visual assets

This directory contains visual files that have no runtime consumer in the
current Oneiros application. They are retained only so earlier design work can
be traced without mixing it with active assets.

- `pre-redesign-insights/` contains the superseded root-level Insights and
  dashboard artwork.
- `loading/` contains unused pre-current loading illustrations.
- `app-icon/` contains the superseded root-level app icon.

Do not import files from this directory into application code. Current app,
splash, and favicon ownership is declared in `app.config.js`; current in-app
icon ownership is documented in `src/theme/ICONS.md`.
