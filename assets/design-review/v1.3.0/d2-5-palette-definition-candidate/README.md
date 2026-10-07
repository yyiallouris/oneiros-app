# Oneiros 1.3.0 — D2.5 R2 palette refinement candidate

The product owner approved the D2.5 direction on 2026-10-07: refine the current
identity, do not replace it. This R2 board compares the active D1 palette with a
seven-primitive candidate inside faithful Write and Insights UI contexts.

Direction approval is final. The exact hexes are provisional-final and are now
integrated through the seven shared primitives only so they can be checked on
real iPhone and Android displays. D2.5 remains non-final until that device gate.

- The approved logo is shown from the exact locked source.
- Current navigation and Insights silhouettes are reused unchanged.
- Typography, copy, layout and component geometry are unchanged.
- The seven primitives are present in runtime; there are no component-local
  palette overrides or screen-by-screen polish changes.
- Warm paper and cream remain the surfaces; purple is not the default UI ink.
- Primary text and primary icons share dark `INK`; signature `PLUM` is an accent.
- Logo texture is preserved exactly; no texture is added to UI icons.
- D3 is approved only as a diagnostic artifact and authorizes no redesign.

The candidate has seven actual colours: `PAPER`, `SURFACE`, `INK`, `INK_MUTED`,
`PLUM`, `PLUM_SOFT`, and `BORDER`. Canvas, cards, text, icons, navigation and
dividers reference these primitives through semantic aliases rather than
creating separate colours for every role. Explicit approval of the final
values is required before D2.5 checkpoint promotion.
