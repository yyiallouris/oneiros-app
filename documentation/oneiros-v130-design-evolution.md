# Oneiros 1.3.0 visual-system evolution

**Status:** FINAL — VISUAL FOUNDATION LOCKED

**App version:** `1.3.0`

**Design release:** `oneiros-design-v1.1.0`

**Active checkpoint:** `v1.3.0-d5-final`

**Final fingerprint:** `ccb14cde6e5716cd2843d96377dde5043cc49fa4023dae145a8cbe03d97cb775`

**Open visual work:** none inside this phase; icon redesign is deferred to a separately opened future phase

**Finalized:** 2026-10-07

## Release boundary

The product-owner-approved eye/river symbol, app-icon composition and their
deterministic platform exports remain final exact-source artifacts. The
paper/ink/plum foundation, semantic typography roles, shared surfaces,
navigation treatment and responsive web shell are now also locked under the
same `1.3.0` marketing version and `oneiros-design-v1.1.0` release. The
superseded `1.2.0` / `oneiros-design-v1.0.2` release remains immutable history.

Candidate directories end in `-candidate`; they stay outside the final
fingerprint and runtime imports. The D2 and D3 icon artifacts remain review and
diagnostic evidence only. They do not authorize concept exploration, new
silhouettes or runtime artwork. Any later icon work must begin as a separate
**Icon Redesign Phase** with its own approval boundary.

## Checkpoints

| Checkpoint | State | Deliverable |
|---|---|---|
| `v1.3.0-d0-brand-baseline` | approved | Locked brand masters plus the initial application baseline |
| `v1.3.0-d1-navigation` | approved | Existing Write / Journal / Insights marks, normalized in the bottom bar only |
| `v1.3.0-d2-insights` | reviewed / not runtime | Existing eight Insights marks reviewed without concept or silhouette changes |
| `v1.3.0-d2.5-palette` | approved | Seven shared primitives promoted through semantic aliases; small essential copy uses `INK_MUTED`, not `PLUM_SOFT` |
| `v1.3.0-d3-icons` | diagnostic approved / redesign deferred | Diagnostic evidence retained; no concept exploration or artwork is authorized in this phase |
| `v1.3.0-d4-screens` | closed / not required | No texture, component or screen redesign was necessary for foundation closure |
| `v1.3.0-d5-final` | approved | Runtime consistency, responsive browser QA, accessibility corrections and final source fingerprint |

## Locked direction

- Warm textured paper remains the background plane.
- Warm neutral surfaces own interaction and writing.
- `INK` is the primary text/functional language; `INK_MUTED` owns readable
  secondary and muted essential copy.
- `PLUM` is the signature active/CTA accent. `PLUM_SOFT` is reserved for
  inactive or non-text artwork because it is not AA-safe for small essential
  labels on `SURFACE`.
- Inter owns UI, controls, metadata and navigation. Cormorant retains dream
  titles, short inward voice and reflective/poetic roles.
- The approved logo stays the expressive textured hero. UI remains flat and
  restrained; no UI-icon texture was added.
- Information architecture, labels, content, navigation behavior, AI flows and
  the locked reflection streaming/phased typing experience remain unchanged.

## D1 — navigation normalization

**Approved:** 2026-10-06  
**Fingerprint:** `24450147e3fa2b8d104245ea6c5c8aa4753f695524da54434bcadefbeca0f980`

D1 preserved the existing semantic identities and silhouettes: Write feather,
Journal open book and Insights eye. Only visual grammar and optical rendering
were normalized. The rejected conceptual board remains audit evidence under
`assets/design-review/v1.3.0/d1-navigation-candidate/`; the approved
normalization artifact remains under
`assets/design-review/v1.3.0/d1-navigation-normalization-candidate/`.

The final navigation treatment keeps `PLUM` active artwork and `PLUM_SOFT`
inactive artwork. Active labels use `PLUM`; inactive labels use AA-safe
`INK_MUTED`. Focus still uses label weight and the existing one-pixel lift—never
a pill, badge, glow or selection dot.

## D2 — Insights normalization evidence

D2 preserved the eight current meanings and source silhouettes: Images,
Motifs, Emotional Atmosphere, Dream Landscapes, Thresholds, Inner Tensions,
Archetypal Echoes and Period Reflection. Its artifact at
`assets/design-review/v1.3.0/d2-insights-normalization-candidate/` remains
outside runtime. No D2 source PNG, colour treatment or normalization candidate
was promoted.

## D2.5 — approved palette foundation

D2.5's restrained direction and exact values were approved on 2026-10-07:

| Primitive | Value | Role |
|---|---|---|
| `PAPER` | `#F3ECE2` | canvas / parchment |
| `SURFACE` | `#FAF7F1` | cards, fields and navigation shelf |
| `INK` | `#342A38` | primary copy and functional ink |
| `INK_MUTED` | `#6B606C` | secondary and muted essential copy |
| `PLUM` | `#5E4566` | active navigation, CTA and brand accent |
| `PLUM_SOFT` | `#897B8C` | inactive/non-text artwork only |
| `BORDER` | `#E4DCD2` | borders, dividers and quiet contours |

The R2 comparison remains at
`assets/design-review/v1.3.0/d2-5-palette-definition-candidate/`. Its historical
integrated-candidate fingerprint is
`0b0a2ff921f11f1f311e6479c1a90ccbc07fce0804824deb26a67027e37adbe2`.

Contrast decisions on `SURFACE`:

- `INK`: `12.80:1`
- `INK_MUTED`: `5.59:1`
- `PLUM`: `7.80:1`
- white on `PLUM`: `8.34:1`
- `PLUM_SOFT`: `3.72:1`, therefore not small essential text

## D3 — diagnostic retained, redesign deferred

The diagnostic artifact at
`assets/design-review/v1.3.0/d3-icon-diagnostic-candidate/` remains approved as
diagnosis only. It contains no replacement drawing, silhouette or concept.
Emotional Atmosphere and Period Reflection stay noted as possible future icon
candidates, but the earlier concept-exploration authorization is withdrawn
from this phase. Every current icon remains unchanged.

## D5 — Visual Foundation Final Gate

The final review artifact lives at
`assets/design-review/v1.3.0/visual-foundation-final-gate/`. Runtime QA covered
Write and Insights at `320×667`, `360×800`, `390×844`, and `430×932`, plus the
normal centered web shell at `1440×900`. The audited routes showed no
horizontal overflow and retained the approved card/navigation proportions.
After minimal corrections, measured interaction targets are at least 44dp; at
`320×667`, the Write CTA clears the floating tab bar by 25px.

The only final corrections were semantic normalization:

- small essential muted copy and inactive navigation labels use `INK_MUTED`;
- inactive icon artwork continues to use `PLUM_SOFT`;
- the Write title/menu and Insights scope/locked CTA targets are at least 44dp;
- active Write/Journal surfaces and the desktop shell use shared
  radius/colour/shadow tokens.

No logo, icon source, icon concept, silhouette, typography family, visible
label, content, texture direction, layout structure, AI flow or locked motion
behavior changed.

Browser QA does not prove native-only safe-area rendering, microphone,
biometric, haptic or store behavior. Those remain release-verification checks,
not permission to reopen the visual foundation without a confirmed defect.
The store build remains `8` and marketing version remains `1.3.0`. No Supabase
migration or function deploy belongs to this visual-only release.
