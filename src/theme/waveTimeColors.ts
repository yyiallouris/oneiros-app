/**
 * Time-of-day wave colors: purple → soft red.
 * Phase 0 = start of day (more purple), phase 1 = end of day (more red).
 * Used by WaveBackground for smooth, gradual shift as the hour passes.
 */

// Palette: mauve → violet → magenta → pink → deep red → soft terracotta (smooth stages)
const WAVE_TIME_PALETTE = [
  '#9B8BB5', // Deep lavender
  '#A89CCF', // Accent purple
  '#B8A5C9', // Soft violet
  '#C4A4B8', // Violet-magenta
  '#CE9FA8', // Blush
  '#D49A9A', // Dusty rose
  '#B85A54', // Deep warm red (subtle transition)
  '#C99B8B', // Soft terracotta
] as const;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
}

function lerpHex(hexA: string, hexB: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexB);
  const r = r1 + (r2 - r1) * t;
  const g = g1 + (g2 - g1) * t;
  const b = b1 + (b2 - b1) * t;
  return rgbToHex(r, g, b);
}

/** Ease in-out for smooth transitions between stages */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Returns phase 0–1 over the day (00:00 → 1 at next 00:00).
 * Uses hours + minutes for smooth progression.
 */
function getTimeOfDayPhase(): number {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  return totalMinutes / (24 * 60);
}

const TOP_WAVE_RED = '#B85A54'; // Deep warm red — blended into top wave for contrast vs middle/front

/**
 * Get wave colors for current time. wave1 and wave2 are slightly offset
 * for depth (wave2 a bit "ahead" in the palette so they don't match exactly).
 * topWave: wave1 blended with red for the top (back) wave so it has warm contrast.
 */
export function getWaveColorsForTime(): { wave1: string; wave2: string; topWave: string } {
  const phase = getTimeOfDayPhase();
  const eased = easeInOutCubic(phase);
  const n = WAVE_TIME_PALETTE.length - 1;
  const index = eased * n;
  const i0 = Math.floor(index) % WAVE_TIME_PALETTE.length;
  const i1 = Math.min(i0 + 1, WAVE_TIME_PALETTE.length - 1);
  const t = index - Math.floor(index);

  const wave1 = lerpHex(WAVE_TIME_PALETTE[i0], WAVE_TIME_PALETTE[i1], t);
  // Slight offset for wave2 (about 0.15 phase) for subtle variation
  const phase2 = (eased + 0.08) % 1;
  const index2 = phase2 * n;
  const j0 = Math.floor(index2) % WAVE_TIME_PALETTE.length;
  const j1 = Math.min(j0 + 1, WAVE_TIME_PALETTE.length - 1);
  const t2 = index2 - Math.floor(index2);
  const wave2 = lerpHex(WAVE_TIME_PALETTE[j0], WAVE_TIME_PALETTE[j1], t2);

  // Top wave: blend with red so the top hill always has warm contrast vs middle/sand
  const topWave = lerpHex(wave1, TOP_WAVE_RED, 0.22);

  return { wave1, wave2, topWave };
}
