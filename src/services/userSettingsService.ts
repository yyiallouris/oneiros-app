import { UserService } from './userService';
import {
  remoteGetInterpretationDepth,
  remoteSetInterpretationDepth,
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

export type { InterpretationDepth };
