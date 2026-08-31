# Visual Review Checklist

Use this checklist when a Oneiros screen feels off but the problem is not obvious from the code alone.

## 1. Surface continuity

Look for:

- horizontal bands that make one card read like two stacked colors
- abrupt opacity steps
- a decorative layer that begins too high inside a vessel

Prefer:

- one full-surface atmosphere gradient
- a lower, softer decorative layer
- transitions carried by gradient, not by a visible overlay boundary

Quick fix:

- lower the internal landscape height
- reduce landscape opacity
- replace a bounded fade with a full-card atmosphere layer

## 2. Decorative ownership

Ask:

- Which component owns the waves, fog, or landscape?
- Is that atmosphere clipped to the owner?
- Is any decorative layer visible under the CTA or nav?

Prefer:

- card-owned atmosphere inside the card only
- quiet background outside the vessel

Quick fix:

- remove the global background layer
- move the decorative layer inside the card
- clip with `overflow: 'hidden'`

## 3. Lower-zone hierarchy

Check the path from card to CTA to nav.

Prefer:

- breathing space between card and CTA
- CTA sitting on calm background
- nav shelf quieter than the CTA

Warning signs:

- button feels like another layer of the card
- nav pill competes with the CTA
- too many shapes or shadows in the lower third

Quick fix:

- increase card-to-CTA spacing
- flatten or soften nav shadows
- remove shapes behind the CTA

## 4. Palette continuity

Look for:

- two adjacent creams or beiges that read like separate ice-cream flavors
- one warm zone switching tone without a clear reason

Prefer:

- one dominant base tone per zone
- a support tone only when carried by intentional gradient or decorative layer

Quick fix:

- simplify to one base surface color
- fade support tones through full-surface gradient
- avoid stacking multiple semitransparent fills with different undertones

## 5. CTA and disabled states

Prefer:

- active CTA as the strongest interactive object
- disabled CTA as the same object with lower intensity

Avoid:

- disabled state that swaps to a different hue family
- disabled state that collapses visually into a line or washed rectangle

Quick fix:

- keep the active fill family
- reduce opacity or contrast instead of changing hue identity

## 6. Screenshot pass

Always inspect:

- the full screen
- a crop of the lower 45%
- any reference screenshot beside the current result when available

If the lower crop looks busier than the upper half, keep simplifying until the hierarchy reads instantly.

## 7. Icon-system pass

Separate the review into four questions:

1. **Concept and silhouette:** Did an established symbol change when the brief only requested harmonization? If yes, revert unless that icon was explicitly approved for redesign.
2. **Drawing character:** In one common monochrome ink, do endings, joins, curvature, irregularity, and visual pressure suggest the same artist working at different densities?
3. **Optical mass:** At real UI size, does any outline disappear or any filled detail become a badge, stain, eye, or button? Correct crop, scale, stroke, or small details without equalizing every icon mathematically.
4. **State behavior:** Do active and inactive variants preserve the icon's character without relying on a large dot, pill, glow, or global recolour to communicate selection?

For a pass spanning multiple icon subfamilies, prepare an enlarged before/after sheet with at least one representative navigation icon, one lighter symbolic icon, and one denser symbolic or functional icon. Render both columns in the same monochrome ink. Approve the family based on drawing character first; apply product-state colour only after that test passes.

Common false positives:

- all icons look related only because they received the same tint
- smaller rendering hides mismatched stroke construction
- a generic replacement is cleaner but no longer feels authored by Oneiros
- deliberate filled-versus-outline density is mistaken for inconsistency
- an active witness dot becomes the dominant feature instead of a quiet detail
