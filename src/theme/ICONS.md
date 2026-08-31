# Oneiros Icon System

Oneiros keeps the concepts, silhouettes, and character of its existing icons. Icon work is a controlled **stroke-harmonization and optical-normalization pass**, not an invitation to redesign or replace artwork.

## Shared character

- Deep Ink (`iconography.ink.primary`) is the default for code-native active icons. Supplied raster artwork keeps its authored black ink unless a state-specific treatment is part of the original asset.
- Code-native functional icons use `iconography.stroke.functional`, rounded line endings, rounded joins, and the existing geometry.
- Raster artwork keeps its original ink and may be optically scaled or cropped at render time. Do not redraw a supplied PNG as a generic SVG merely to make its stroke mathematically uniform.
- Optical size is judged by visible ink mass, not by equal source-canvas dimensions.
- Preserve slight handmade irregularity. Oneiros icons should feel made by the same artist for different roles, not like identical twins.
- Shared colour alone is never evidence of harmonization. Representative icons must still read as one authored system when compared enlarged in the same monochrome ink.

## Subfamilies

### Navigation

The feather and sun retain their supplied active/inactive PNG pairs. Journal is the only approved navigation redesign: it keeps the open-journal concept and lightness but lets one outer page edge drift subtly upward, supported by unequal lower-curve cadence, variable ink pressure, and a softly wandering central spine. The movement comes from the page form itself—never an added moon, star, spiral, dot, or badge—and should feel like something beginning to emerge from a dream archive rather than a generic mirrored library glyph. Active state comes from ink strength and opacity only.

### Insights

Insights keeps the supplied hand-ink PNG family and its original black-ink contrast. Dense glyphs such as Emotional Atmosphere may remain darker and more compact than line-led glyphs. Individual `opticalScale` values reduce excessive mass without recolouring or redrawing the source: Emotional Atmosphere and Thresholds use `0.92`, Inner Tensions uses `0.94`, and Dream Landscapes uses `0.88`. Full-screen section empty states use the quiet 88dp optical frame: the mark holds the silence without becoming the protagonist.

### Functional controls

Microphone and calendar use the original non-bold Oneiros PNG artwork, not replacement SVG concepts or bold substitutes. They retain their authored transparent canvas and render at quiet 29dp / 30dp proportions without tint or forced crop. Search, edit, send, copy, and disclosure chevron preserve their existing paths while sharing the same 1.7 rounded stroke character.

The parent control—not the visible glyph—owns the minimum 44dp touch target.

### Semantic and tier glyphs

Recording-stop, subscription-tier, provider, and dream-symbol glyphs keep their established semantic or reverse-palette treatment. They should not be recolored into Deep Ink when doing so would erase state meaning or contrast.

## Do not

- replace an established silhouette with a library icon
- equalize every icon to the same visual density
- add a selection dot, badge, or pill as part of harmonization
- edit source PNG pixels when crop or optical scale solves the mismatch
- recolour an entire icon family to manufacture a superficial sense of consistency
