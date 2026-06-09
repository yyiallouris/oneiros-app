# App icon – spec for designer

For the icon to **fill the entire space** on the phone (no white border / background).

---

## If the file is already full-bleed but a white gap appears

The gap may come from **rendering** (Expo/Android), not from the file:

1. **Android adaptive icon** clips the icon into a **circle or squircle**. The **corners** of the square (e.g. the 4 corners) may appear as gaps if they are **transparent** in the PNG. Solution: **the entire 1024×1024 (or 1200×1200) should be filled with color** — even the corners should be covered by the Night Plum icon background color, **no transparency**.
2. **Expo prebuild** may have stale assets. Try: `npx expo prebuild --clean` and then a new build, so that Android icon assets are regenerated from the current `icon.png`.

---

## Dimensions

- **1024 × 1024 px** or **1200 × 1200 px** (square) — both OK, the build will resize
- Format: **PNG**, 32-bit (RGB + alpha if needed)
- **Important:** Pixel dimensions alone will not fix the white gap. The **graphic must fill the entire frame** (see below).

## How to fill the frame

1. **Full bleed**  
   The graphic (waves, sun/moon, colors) must extend **to the edges** of the 1024×1024.  
   **No** white margin, **no** transparent padding around the design.

2. **Safe zone (Android)**  
   Key elements (e.g. sun/moon, central logo) are best kept **inside a central circle ~66%** of the side (approx. 672px diameter at 1024px).  
   This way they won’t be cut off on round/squircle masks. Colors/waves can extend to the corners.

3. **Background**  
   If the icon has its own “sky” or color to the edges, **don’t leave transparency** at the edges.  
   Fill the entire square (e.g. with Night Plum) so a white border never appears.

## Current Oneiros splash direction

### Native splash

- Background: `#4B3158` Night Plum.
- Emblem: warm white `#F8F3EA`.
- Native splash image width: around 180px (`app.json` `imageWidth`).
- No splash text; the emblem should feel like a quiet dream portal, not a poster.

### In-app loading screen

- Appears after the native splash while app resources/session state finish loading.
- Uses the same Night Plum field, a larger emblem, and the `Oneiros` wordmark below it.
- This is the fuller brand moment; the native splash stays calmer.

## Summary

| Correct                         | Wrong                    |
|---------------------------------|---------------------------|
| 1024×1024, graphic to the edges | Padding / margin around  |
| Entire frame filled with color  | Transparency at edges     |
| Key elements in central 66%     | Logo too close to corners |

After export, replace `assets/icon.png` and run a new build for changes to apply.
