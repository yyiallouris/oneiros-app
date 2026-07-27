/**
 * Feature flag for closed Mythic catalog selection.
 * Default ON. Set MYTHIC_CLOSED_CATALOG_V1=0 to force amplifications:[] (no open-world fallback).
 */
function readEnvFlag(): string | undefined {
  try {
    // Deno edge
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const denoEnv = (globalThis as any)?.Deno?.env;
    if (denoEnv && typeof denoEnv.get === 'function') {
      const v = denoEnv.get('MYTHIC_CLOSED_CATALOG_V1');
      if (typeof v === 'string') return v;
    }
  } catch {
    // ignore
  }
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.MYTHIC_CLOSED_CATALOG_V1 ?? process.env.EXPO_PUBLIC_MYTHIC_CLOSED_CATALOG_V1;
    }
  } catch {
    // ignore
  }
  return undefined;
}

/** When true: closed-catalog Mythic Echo only. When false: return []. Never open-world. */
export function isMythicClosedCatalogV1Enabled(): boolean {
  const raw = readEnvFlag();
  if (raw == null || raw === '') return true;
  const normalized = raw.trim().toLowerCase();
  if (normalized === '0' || normalized === 'false' || normalized === 'off') return false;
  return true;
}

export const MYTHIC_CLOSED_CATALOG_FLAG = 'MYTHIC_CLOSED_CATALOG_V1';
