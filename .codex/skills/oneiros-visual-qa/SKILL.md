---
name: oneiros-visual-qa
description: Review and refine Oneiros screen visuals after UI, layout, theme, or component styling changes, especially when editing backgrounds, cards, gradients, waves, CTA placement, or bottom navigation. Use this skill to catch seams, stacked translucent surfaces, muddy lower zones, clipped-background mistakes, and weak visual hierarchy before finalizing a screen.
---

# Oneiros Visual QA

Use this skill after a visual pass on a Oneiros screen. Pair it with `.codex/skills/oneiros-repo/SKILL.md`: that skill governs repo workflow, while this skill governs visual judgment and screenshot-level QA.

## First Reads

1. Read `AGENTS.md`.
2. Read `.codex/skills/oneiros-repo/SKILL.md`.
3. Read `src/theme/colors.ts` and `src/theme/COLORS.md`.
4. Read `src/theme/typography.ts` and `src/theme/TYPOGRAPHY.md`.
5. Inspect any screenshot, mock, or Figma reference before editing.

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

## Hard Rules

- Do not start a semi-opaque overlay halfway through a surface.
- Do not let waves, fog, mountains, or organic shapes continue behind the CTA or nav unless the design explicitly calls for it.
- Do not mix two warm base colors in the same flat zone unless an intentional gradient carries the transition.
- Do not solve hierarchy problems by adding more shadow, blur, or extra shapes.
- Do not change the identity of a disabled CTA; mute the active family instead.

## Verification

- Add or update focused source-level tests when the visual rule is structural.
- Run the smallest meaningful verification command for the change.
- Run `npm run typecheck` when the skill leads to code edits.
- State what you visually checked, what remains unverified, and whether the preview came from screenshot, simulator, or web build.
