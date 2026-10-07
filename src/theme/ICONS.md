# Oneiros Icon System

Oneiros keeps the concepts, silhouettes, and character of its existing icons. Approved D1 is a controlled **stroke-harmonization and optical-normalization pass**, not an icon redesign. Write stays a feather, Journal stays the existing open book, and Insights stays the existing eye. New concepts or silhouettes require a separate, explicit phase approval.

## Active 1.3.0 family contract

- Use the existing 24-unit reference grid only as a sizing aid; D1 does not
  produce new construction proofs or force unrelated symbols into one geometry.
- Prefer medium pressure, soft round joins, slightly tapered gestures and
  controlled organic asymmetry. Avoid both dead geometric vectors and noisy
  grunge simulation.
- Preserve the existing medium: Write and Insights remain raster assets;
  Journal remains code-native paths. Do not redraw them to manufacture media
  consistency.
- Detached dots require a semantic role. Navigation uses none.
- Each icon keeps its own geometry. Active/inactive state for that icon comes from the
  established ink, opacity, label emphasis and one-pixel lift.
- Final icon artwork is authored deterministically. Generative redraw is not a
  source for runtime identity or UI assets.

## Shared character

- D2.5 `INK` (`iconography.ink.primary`) is the locked default for code-native
  functional icons. Navigation has its own state ink: active marks use `PLUM`
  (`iconography.navigation.activeInk`) and inactive marks use `PLUM_SOFT`
  (`iconography.navigation.inactiveInk`). Authored symbolic raster artwork
  keeps its source pixels unchanged; defining `iconInks.symbolic` does not
  authorize a family-wide tint. No texture is added to UI icons.
- Routine code-native functional icons use `iconography.stroke.functional`. Signature calendar and microphone controls use per-path pressure variation instead. Both branches keep rounded line endings and joins.
- Raster artwork keeps its original ink and may be optically scaled or cropped at render time. Do not redraw a supplied PNG as a generic SVG merely to make its stroke mathematically uniform.
- Optical size is judged by visible ink mass, not by equal source-canvas dimensions.
- Preserve slight handmade irregularity. Oneiros icons should feel made by the same artist for different roles, not like identical twins.
- Shared colour alone is never evidence of harmonization. Representative icons must still read as one authored system when compared enlarged in the same monochrome ink.

## Subfamilies

### Navigation

Navigation is restrained relative to the logo and is not a duplicate of the denser Insights symbols. Write preserves `write_nav_ink_v2.png` at its original aspect ratio, cropped into the existing 30dp vertical band and rendered once—no horizontal stretching, pressure duplicate, or added texture. Journal preserves the existing open-book path geometry while sharing primary, spine, and detail stroke tokens; two low-opacity shadow-overdraws are omitted because they simulate texture rather than clarify the symbol. Insights preserves the exact `insights_nav_eye_ink.png` source and established crop below its detached source dots; no new eye is invented. Active icons and labels use `PLUM #5E4566` at `0.98`; inactive icons use `PLUM_SOFT #897B8C` at `0.58`, while their small labels use AA-safe `INK_MUTED #6B606C`. The clearer state is carried by hue, contrast, label weight, and the existing one-pixel lift—never by a pill, badge, glow, or added selection dot.

### Insights

The reviewed D2 sheet is normalization-only. It keeps the eight existing meanings and
source alpha silhouettes, and tests optical scale plus one existing Deep Ink
treatment at 42dp overview, 88dp section-state, and wide Period Reflection
contexts. The artifact under
`assets/design-review/v1.3.0/d2-insights-normalization-candidate/` is not a
runtime asset source. It remains review evidence and is not approved for
runtime import. No source PNG, label, palette token, or screen has changed.
Any mark that remains unresolved after real-app review is left unchanged. D3
starts with a diagnostic-only sheet: Current, intended meaning, evidence-based
verdict, exact failure category, and next possible gate. It produces no new
symbol or silhouette. Images, Dream Landscapes, and Thresholds currently have
no demonstrated failure; Motifs, Inner Tensions, and Archetypal Echoes are
geometry-refinement candidates; Emotional Atmosphere and Period Reflection
require metaphor approval before any concept exploration. These are approved
diagnostic working hypotheses, not implementation approval. D2 raster sources
still render unchanged. D2.5 primitives are locked as the visual foundation.
D3 concept exploration is deferred completely to a separately opened future
Icon Redesign Phase; no final artwork or runtime import is authorized here.

Insights keeps the hand-ink PNG family and its original black-ink contrast. Images uses a dedicated half-lidded imaginal eye: two unequal pressure-led lids hold a narrow field around an asymmetric vertical presence, with one detached witness dot. It treats the image as something with its own presence rather than as a photo, file, camera, chart, or decorative dream shorthand. It is deliberately related to, but not a duplicate of, the navigation eye: navigation stays fully open with a round pupil and no dot, while Images is narrower, inward, vertically centred, and visibly more private. Dense glyphs such as Emotional Atmosphere may remain darker and more compact than line-led glyphs. Period Reflection uses a dedicated second-generation hand-ink mark: three uneven dream-stone forms joined by one wandering dry-brush thread, with the family's detached witness dot. Its compact sequence preserves the report's across-time meaning without reading as a constellation, analytics graph, spinner, or generic AI symbol. Individual `opticalScale` values reduce excessive mass without recolouring or redrawing the source: Emotional Atmosphere and Thresholds use `0.92`, Inner Tensions uses `0.94`, and Dream Landscapes uses `0.88`. Full-screen section empty states use the quiet 88dp optical frame: the mark holds the silence without becoming the protagonist.

### Functional controls

Microphone and calendar share a 31dp frame and `iconography.ink.secondary` (Muted Ink), but they no longer fake family resemblance through identical smooth SVG strokes. Microphone remains code-native: its narrow capsule and open cradle use an uneven `1.9` body, separate `1.7` / `1.85` cradle gestures, a wandering stem, short pressure-led base, a `16%` side overdraw, and a faint inner breath trace. Calendar uses the transparent `calendar_date_leaf_ink_v1.png` raster, constructed from hand-shaped filled ink masses rather than uniform centre-line strokes. Its uneven perimeters, deliberate dry breaks, sparse low-alpha filaments, and softly lifted lower corner give it real pixel-level ink behaviour related to the navigation and Insights rasters. The page lift quietly relates it to Journal without duplicating the open-book silhouette; unequal bindings, one broken header gesture, one main date trace, and one fading memory trace preserve calendar recognition without a mini-grid. Tinting applies only the shared Muted Ink colour and preserves the authored alpha texture. Neither icon uses looped notepad rings, dense grids, moons, stars, sparkles, sound waves, or other dream-app shorthand. Search, edit, send, copy, and disclosure chevron preserve their existing paths and the quieter shared rounded functional stroke.

### App-brand and inherited icon artifact locks

The approved D0 runtime checkpoint belongs to the active
`oneiros-design-v1.1.0` train. Its app-brand
eye/river masters and Apple/Android/web/splash exports live under
`assets/branding/releases/v1.3.0/` and are locked by their manifest plus the
brand-release contract test. The visual foundation is final; wider icon-system
work requires a separately opened phase plus explicit approval. Calendar is inherited byte-for-byte from the
previous release: its artifact identity remains
`oneiros-calendar-date-leaf-v1.0.0`, approved under
`oneiros-design-v1.0.2` on 2026-09-02. The runtime file is
`action_icons/calendar_date_leaf_ink_v1.png`: a 512 × 512 transparent source
rendered at a 31dp optical size, with SHA-256
`6f275899ec569cacf75b15c1d05ebbbbc0172ddcd18d042d4ccb66da34a038a8`.
The same identity is exported by `ONEIROS_V1_CALENDAR_ICON_RELEASE` and
enforced by the icon ownership contract test.

Do not overwrite this file when refining the design. Any change to silhouette, crop, ink texture, alpha field, optical size, or state treatment requires explicit product approval plus a new release id, filename, digest, documentation entry, and contract expectation.

The parent control—not the visible glyph—owns the minimum 44dp touch target.

Superseded navigation artwork and the replaced Pattern Recognition essay mark
live under `src/assets/icons/legacy/`. They are visual history only, have no
runtime consumer, and must not be used as current-family references.

## Runtime asset ownership

The current app loads only these raster icon assets:

- Navigation: `tab-icons/write_nav_ink_v2.png` and
  `tab-icons/insights_nav_eye_ink.png`; Journal is code-native.
- Insights: the six top-level `oneiros_insight_*` hand-ink files,
  `oneiros_isnights_archetypes.png`, and
  `pattern_recognition_essay/oneiros_period_reflection_v2.png`.
- Functional artwork: `action_icons/calendar_date_leaf_ink_v1.png`; recording-stop state: `action_icons/mic_stop.png`.
- Subscription: `subscription/oneiros_glyph_free.png`,
  `oneiros_glyph_premium.png`, and `oneiros_glyph_deeper.png`.
- Sign-in providers: the transparent `providers_icons/apple.png`, `google.png`,
  and `discord.png` files.

Recording-start microphone, Journal navigation, and the remaining functional
controls are code-native; Calendar is the textured raster exception above. Root-level pre-redesign images and unused
raster alternatives live under `assets/legacy/` or
`src/assets/icons/legacy/`; nothing in either legacy directory may be imported
by runtime code. Retired code-native marks, including the unused moon-in-cup
Oracle glyph, live under `src/components/icons/generated/legacy/` with the same
no-import rule.

### Semantic and tier glyphs

Recording-stop, subscription-tier, provider, and dream-symbol glyphs keep their established semantic or reverse-palette treatment. They should not be recolored into Deep Ink when doing so would erase state meaning or contrast.

## Do not

- replace an established silhouette with a library icon
- invent a second eye or mini-logo for navigation
- stretch, duplicate, or shadow-overdraw an asset to simulate visual weight
- equalize every icon to the same visual density
- add a selection dot, badge, or pill as part of harmonization
- edit source PNG pixels when crop or optical scale solves the mismatch
- recolour an entire icon family to manufacture a superficial sense of consistency
