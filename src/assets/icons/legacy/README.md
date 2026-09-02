# Legacy icon assets

These files are retained only as visual history. They have no live UI consumer
and must not be used as design references for new Oneiros icon work.

- `navigation/` contains superseded Write, Journal, and radial Insights tab
  assets. The current open-brush Write artwork remains live under `tab-icons/`.
- `insights_reports/oneiros_pattern_recognition_essay.png` is the replaced
  Pattern Recognition essay mark.
- `action-controls/` contains the superseded raster Calendar/Microphone artwork
  and unused alternate microphone SVG. Current Calendar and recording-start
  marks are native paths; only `action_icons/mic_stop.png` remains a live raster.
- `subscription/` contains the unused pre-current free/premium graphics. The
  three `oneiros_glyph_*` tier assets remain live under `subscription/`.
- `providers-original-baked-bg/` contains the original backed provider marks.
  The transparent provider assets remain live under `providers_icons/`.

The generated pre-current Insights components under
`src/components/icons/generated/legacy/` follow the same rule: history only,
never runtime imports or references for new artwork.

Current icon ownership and visual contracts live in `src/theme/ICONS.md`.
