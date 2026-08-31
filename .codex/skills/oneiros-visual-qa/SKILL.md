---
name: oneiros-visual-qa
description: Review and refine Oneiros screen visuals after UI, layout, theme, iconography, or component styling changes, especially when editing backgrounds, cards, gradients, waves, CTA placement, bottom navigation, or an icon family. Use this skill to catch seams, stacked translucent surfaces, muddy lower zones, clipped-background mistakes, weak visual hierarchy, and false icon consistency before finalizing a screen.
---

# Oneiros Visual QA

Use this skill after a visual pass on a Oneiros screen. Pair it with `.codex/skills/oneiros-repo/SKILL.md`: that skill governs repo workflow, while this skill governs visual judgment and screenshot-level QA.

## First Reads

1. Read `AGENTS.md`.
2. Read `.codex/skills/oneiros-repo/SKILL.md`.
3. Read `src/theme/colors.ts` and `src/theme/COLORS.md`.
4. Read `src/theme/typography.ts` and `src/theme/TYPOGRAPHY.md`.
5. Inspect any screenshot, mock, or Figma reference before editing.
6. For icon-system work, also read `src/theme/ICONS.md` and inspect the original assets at enlarged size before changing their rendering.

If the task starts from Figma, use the Figma skills to translate the design first, then use this skill as the final visual QA pass.

## Workflow

### 1. Define the visual planes

Identify three planes before editing:

- `background plane`: the quiet field behind everything
- `content vessel`: the card or surface that owns the atmospheric detail
- `interactive plane`: CTA, navigation, floating controls

Keep one main visual anchor per plane.

### 2. Audit the risk zones first

Inspect the areas most likely to break hierarchy:

- the lower 45% of the screen
- the bottom edge of the main card
- the CTA surroundings
- the bottom nav shelf

When translucent layers are involved, inspect for horizontal seams, abrupt tone jumps, and decorative layers leaking outside their owner.

### 3. Apply Oneiros composition rules

- Clip decorative atmosphere inside the component that owns it.
- Keep the area under the main card quiet unless the design explicitly calls for a second scene.
- Let the CTA read as a ritual object: isolated, legible, and not sitting on top of busy texture.
- Keep the nav shelf softer than the CTA.
- Prefer one atmospheric layer plus one subtle texture layer over multiple bounded fades.

### 4. Verify with screenshots

- Review the full screen at 100% zoom.
- Review a cropped card-to-CTA-to-nav region.
- If the change touches gradients or absolute-positioned layers, check both the full composition and the lower-zone crop.

For the detailed checklist and symptom-to-fix mapping, read [references/visual-review-checklist.md](references/visual-review-checklist.md).

### 5. Audit icon harmonization separately from colour

For icon-system work, judge concept, silhouette, drawing character, and optical mass independently from colour.

- Shared tint is not evidence of shared drawing character.
- Default to preserving every established concept, silhouette, and authored irregularity. Redesign only the specific icon the user has explicitly placed in redesign scope.
- Treat navigation, symbolic/Insights, and functional icons as related subfamilies. They may keep different stroke weights, detail levels, and fill density while sharing line endings, joins, curvature, ink behavior, and degree of organic irregularity.
- Do not replace authored raster artwork with a generic library or geometric SVG as a shortcut to consistency.
- Before rolling a change across several icons, compare representative icons enlarged and in the same monochrome ink so colour cannot create a false sense of unity. Include active-state details such as witness dots in this optical review.
- Verify the final icons both enlarged and at actual device size; a detail that reads poetic at source size can become a badge, stain, or visual hole in navigation.

## Hard Rules

- Do not start a semi-opaque overlay halfway through a surface.
- Do not let waves, fog, mountains, or organic shapes continue behind the CTA or nav unless the design explicitly calls for it.
- Do not mix two warm base colors in the same flat zone unless an intentional gradient carries the transition.
- Do not solve hierarchy problems by adding more shadow, blur, or extra shapes.
- Do not change the identity of a disabled CTA; mute the active family instead.
- Do not approve an icon pass merely because all icons now share one colour.
- Do not normalize deliberate density differences until distinct subfamilies look mechanically identical.

## Verification

- Add or update focused source-level tests when the visual rule is structural.
- Run the smallest meaningful verification command for the change.
- Run `npm run typecheck` when the skill leads to code edits.
- State what you visually checked, what remains unverified, and whether the preview came from screenshot, simulator, or web build.
