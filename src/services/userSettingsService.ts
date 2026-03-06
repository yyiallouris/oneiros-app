import { UserService } from './userService';
import {
  remoteGetInterpretationDepth,
  remoteSetInterpretationDepth,
  remoteGetMythicResonance,
  remoteSetMythicResonance,
  type InterpretationDepth,
} from './remoteStorage';
import { LocalStorage } from './localStorage';

const VALID_DEPTHS: InterpretationDepth[] = ['quick', 'standard', 'advanced'];
const DEFAULT_DEPTH: InterpretationDepth = 'standard';

function toDepth(raw: string | null): InterpretationDepth {
  if (raw === 'quick' || raw === 'standard' || raw === 'advanced') return raw;
  return DEFAULT_DEPTH;
}

/**
 * Get effective interpretation depth: from Supabase when logged in, else local cache, else default (standard).
 */
export async function getInterpretationDepth(): Promise<InterpretationDepth> {
  const userId = await UserService.getCurrentUserId();
  if (userId) {
    const remote = await remoteGetInterpretationDepth();
    if (remote) {
      await LocalStorage.setInterpretationDepth(remote);
      return remote;
    }
  }
  const cached = await LocalStorage.getInterpretationDepth();
  return toDepth(cached);
}

/**
 * Set interpretation depth: save to Supabase when logged in and always cache locally.
 */
export async function setInterpretationDepth(depth: InterpretationDepth): Promise<void> {
  if (!VALID_DEPTHS.includes(depth)) return;
  const userId = await UserService.getCurrentUserId();
  if (userId) await remoteSetInterpretationDepth(depth);
  await LocalStorage.setInterpretationDepth(depth);
}

/**
 * Get mythic resonance (Advanced only): local-first, prefer newer by updated_at.
 * If remote has newer updated_at, use remote and update local. Else use local (avoids stale remote overwriting fresh local).
 */
export async function getMythicResonance(): Promise<boolean> {
  const local = await LocalStorage.getMythicResonance();
  const userId = await UserService.getCurrentUserId();
  if (!userId) return local.value;

  const remote = await remoteGetMythicResonance();
  if (!remote) return local.value;

  // Prefer newer: if local is newer (or remote has no timestamp), keep local
  if (local.updatedAt && (!remote.updated_at || local.updatedAt >= remote.updated_at)) {
    return local.value;
  }
  // Remote is newer: use it and update local
  await LocalStorage.setMythicResonance(remote.value, remote.updated_at);
  return remote.value;
}

/**
 * Set mythic resonance: write local first (immediate UI), then remote.
 * After remote succeeds, re-read canonical updated_at and update local — avoids sync edge cases.
 */
export async function setMythicResonance(enabled: boolean): Promise<void> {
  await LocalStorage.setMythicResonance(enabled, new Date().toISOString());
  const userId = await UserService.getCurrentUserId();
  if (userId) {
    const canonicalUpdatedAt = await remoteSetMythicResonance(enabled);
    if (canonicalUpdatedAt) {
      await LocalStorage.setMythicResonance(enabled, canonicalUpdatedAt);
    }
  }
}

export type { InterpretationDepth };
