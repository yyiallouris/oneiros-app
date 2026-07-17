# App icon – spec for designer

For the icon to feel like the Oneiros droplet on a quiet paper field, while still **filling the entire app-icon frame** on device.

---

## If the file is already full-bleed but a white gap appears

The gap may come from **rendering** (Expo/Android), not from the file:

1. **Android adaptive icon** clips the icon into a **circle or squircle**. The **corners** of the square may appear as gaps if they are **transparent** in the PNG. Solution: the adaptive **background image must be fully filled** with the paper field, with **no transparency** at the edges.
2. **Expo prebuild** may have stale assets. Try: `npx expo prebuild --clean` and then a new build, so that Android icon assets are regenerated from the current `icon.png`.

---

## Dimensions

- **1024 × 1024 px** or **1200 × 1200 px** (square) — both OK, the build will resize
- Format: **PNG**, 32-bit (RGB + alpha if needed)
- **Important:** Pixel dimensions alone will not fix the white gap. The **graphic must fill the entire frame** (see below).

## How to fill the frame

1. **Full bleed background**  
   The paper background must extend **to the edges** of the 1024×1024.  
   **No** transparent padding around the adaptive/icon background image.

2. **Safe zone (Android)**  
   The droplet symbol is best kept **inside a central circle ~66%** of the side (approx. 672px diameter at 1024px).  
   This way they won’t be cut off on round/squircle masks. Colors/waves can extend to the corners.

3. **Background**  
   Use the paper field (`BG_paper.png`) behind the droplet for full-bleed icon outputs.  
   Do not leave transparency at the edges of the adaptive background.

## Current Oneiros splash direction

### Native splash

- Background: `#F8F3EA` warm paper.
- Emblem: the droplet mark from `assets/branding/oneiros_logo.png`.
- Native splash image width: around 180px (`app.config.js` `expo-splash-screen` `imageWidth`).
- No splash text; the emblem should feel like a quiet dream portal, not a poster.

### In-app loading screen

- Appears after the native splash while app resources/session state finish loading.
- Uses the same paper field, a larger droplet emblem, and the `Oneiros` wordmark below it.
- This is the fuller brand moment; the native splash stays calmer.

## Summary

| Correct                         | Wrong                    |
|---------------------------------|---------------------------|
| 1024×1024, graphic to the edges | Padding / margin around  |
| Entire background frame filled  | Transparency at edges     |
| Key elements in central 66%     | Logo too close to corners |

After changing the source assets, regenerate the outputs in `assets/branding/` and run a new build for changes to apply.
