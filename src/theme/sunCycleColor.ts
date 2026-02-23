/**
 * Moving sun color: cycles between sunCyclePalette colors (e.g. FC2947 ↔ FE6244).
 * Used by MountainWaveBackground. Palette and duration in colors.ts.
 */

import { useEffect, useState } from 'react';
import { sunCyclePalette, SUN_CYCLE_DURATION_MS } from './colors';

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0'))
      .join('')
  );
}

function lerpHex(hexA: string, hexB: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexB);
  const r = r1 + (r2 - r1) * t;
  const g = g1 + (g2 - g1) * t;
  const b = b1 + (b2 - b1) * t;
  return rgbToHex(r, g, b);
}

const PALETTE_LEN = sunCyclePalette.length;

/** Phase 0–1 over the full cycle (length × 1 minute). */
function getCyclePhase(): number {
  const totalMs = PALETTE_LEN * SUN_CYCLE_DURATION_MS;
  const ms = Date.now() % totalMs;
  return ms / totalMs;
}

/** Current sun color (lerped between sunCyclePalette steps). Updates every 500ms for smooth transition. */
export function useSunCycleColor(): string {
  const [color, setColor] = useState(() => {
    const phase = getCyclePhase();
    const segment = Math.floor(phase * PALETTE_LEN) % PALETTE_LEN;
    const t = (phase * PALETTE_LEN) % 1;
    const a = sunCyclePalette[segment];
    const b = sunCyclePalette[(segment + 1) % PALETTE_LEN];
    return lerpHex(a, b, t);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const phase = getCyclePhase();
      const segment = Math.floor(phase * PALETTE_LEN) % PALETTE_LEN;
      const t = (phase * PALETTE_LEN) % 1;
      const a = sunCyclePalette[segment];
      const b = sunCyclePalette[(segment + 1) % PALETTE_LEN];
      setColor(lerpHex(a, b, t));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return color;
}
