import { LocalStorage } from './localStorage';
import { logError, logEvent } from './logger';
import { supabase } from './supabaseClient';
import {
  PendingVoiceClip,
  TRANSCRIPTION_CLIENT_BUDGET_MS,
  discardPendingClip,
  transcribeAudio,
} from '../utils/voiceRecording';
import { isOnline } from '../utils/network';
import { PendingVoiceTranscription, VoiceTranscriptionTarget } from '../types/dream';

const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_BACKOFF_MS = 15 * 60 * 1000;
/** Must exceed a healthy in-process upload budget so reclaim never drops a live result. */
const STUCK_TRANSCRIBING_MS = TRANSCRIPTION_CLIENT_BUDGET_MS + 2 * 60 * 1000;
const listeners = new Set<(item: PendingVoiceTranscription) => void>();
const inFlightClipIds = new Set<string>();
let mutationChain: Promise<void> = Promise.resolve();
let draining = false;
let drainRequested = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

const sameTarget = (a: VoiceTranscriptionTarget, b: VoiceTranscriptionTarget) =>
  a.surface === b.surface && a.key === b.key;

const nextAttempt = (attemptCount: number) =>
  new Date(
    Date.now()
      + Math.min(1_000 * 2 ** Math.max(0, attemptCount), MAX_BACKOFF_MS)
      + Math.floor(Math.random() * 500),
  ).toISOString();

const notify = (item: PendingVoiceTranscription) => {
  listeners.forEach((listener) => listener(item));
};

const runExclusive = async <T>(operation: () => Promise<T>): Promise<T> => {
  const run = mutationChain.then(operation, operation);
  mutationChain = run.then(() => undefined, () => undefined);
  return run;
};

const upsertItemUnlocked = async (item: PendingVoiceTranscription): Promise<void> => {
  const items = await LocalStorage.getPendingVoiceTranscriptions();
  await LocalStorage.savePendingVoiceTranscriptions([
    ...items.filter((candidate) => candidate.id !== item.id),
    item,
  ]);
  notify(item);
};

const removeItemUnlocked = async (id: string): Promise<PendingVoiceTranscription | null> => {
  const items = await LocalStorage.getPendingVoiceTranscriptions();
  const item = items.find((candidate) => candidate.id === id) ?? null;
  if (!item) return null;
  await LocalStorage.savePendingVoiceTranscriptions(items.filter((candidate) => candidate.id !== id));
  await discardPendingClip({
    id: item.id,
    uri: item.audioUri,
    sizeBytes: item.sizeBytes,
    durationMs: item.durationMs,
  });
  return item;
};

const reclaimStuckTranscribing = (
  items: PendingVoiceTranscription[],
  now = Date.now(),
): PendingVoiceTranscription[] => items.map((item) => {
  if (item.status !== 'transcribing') return item;
  // Never reclaim a clip this process is still uploading — finalizeAttempt must own the outcome.
  if (inFlightClipIds.has(item.id)) return item;
  const stuckSince = Date.parse(item.nextAttemptAt || item.createdAt);
  if (!Number.isFinite(stuckSince) || now - stuckSince < STUCK_TRANSCRIBING_MS) return item;
  const recovered: PendingVoiceTranscription = {
    ...item,
    status: 'queued',
    nextAttemptAt: new Date().toISOString(),
    lastErrorCode: 'service_unavailable',
  };
  notify(recovered);
  return recovered;
});

const scheduleNextDrain = async () => {
  if (retryTimer) clearTimeout(retryTimer);
  const items = await LocalStorage.getPendingVoiceTranscriptions();
  const nextAt = items
    .filter((item) => ['queued', 'retrying'].includes(item.status))
    .map((item) => Date.parse(item.nextAttemptAt))
    .filter(Number.isFinite)
    .sort((a, b) => a - b)[0];
  if (nextAt == null) {
    retryTimer = null;
    return;
  }
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void voiceTranscriptionQueueService.drain();
  }, Math.max(0, nextAt - Date.now()));
};

const prepareDueItems = async (userId: string): Promise<PendingVoiceTranscription[]> =>
  runExclusive(async () => {
    let items = reclaimStuckTranscribing(await LocalStorage.getPendingVoiceTranscriptions());
    const now = Date.now();
    const expired = items.filter((item) => now - Date.parse(item.createdAt) > RETENTION_MS);
    await Promise.all(expired.map((item) => discardPendingClip({
      id: item.id,
      uri: item.audioUri,
      sizeBytes: item.sizeBytes,
      durationMs: item.durationMs,
    })));
    items = items.filter((item) => !expired.some((candidate) => candidate.id === item.id));
    await LocalStorage.savePendingVoiceTranscriptions(items);
    return items.filter((candidate) =>
      candidate.userId === userId
      && ['queued', 'retrying'].includes(candidate.status)
      && Date.parse(candidate.nextAttemptAt) <= Date.now(),
    );
  });

const markTranscribing = async (id: string): Promise<PendingVoiceTranscription | null> =>
  runExclusive(async () => {
    const items = await LocalStorage.getPendingVoiceTranscriptions();
    const current = items.find((candidate) => candidate.id === id);
    if (!current || !['queued', 'retrying'].includes(current.status)) return null;
    const transcribing: PendingVoiceTranscription = {
      ...current,
      status: 'transcribing',
      nextAttemptAt: new Date().toISOString(),
      lastErrorCode: undefined,
    };
    await upsertItemUnlocked(transcribing);
    return transcribing;
  });

const finalizeAttempt = async (
  id: string,
  result: { ok: true; value: string } | { ok: false; code: string; retryable: boolean },
): Promise<void> => {
  await runExclusive(async () => {
    const items = await LocalStorage.getPendingVoiceTranscriptions();
    const current = items.find((candidate) => candidate.id === id);
    if (!current) return;
    if (result.ok) {
      // Always accept a live in-process success, even if reclaim raced (should not with inFlight guards).
      await upsertItemUnlocked({
        ...current,
        status: 'completed',
        transcript: result.value,
        lastErrorCode: undefined,
      });
      return;
    }
    if (current.status !== 'transcribing') return;
    await upsertItemUnlocked({
      ...current,
      status: result.retryable ? 'retrying' : 'needs_attention',
      attemptCount: current.attemptCount + 1,
      nextAttemptAt: nextAttempt(current.attemptCount),
      lastErrorCode: result.code,
    });
  });
};

export const voiceTranscriptionQueueService = {
  subscribe(listener: (item: PendingVoiceTranscription) => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async getForTarget(target: VoiceTranscriptionTarget): Promise<PendingVoiceTranscription[]> {
    return runExclusive(async () => {
      let items = await LocalStorage.getPendingVoiceTranscriptions();
      const recovered = reclaimStuckTranscribing(items);
      if (recovered.some((item, index) => item !== items[index])) {
        await LocalStorage.savePendingVoiceTranscriptions(recovered);
        items = recovered;
      }
      return items.filter((item) => sameTarget(item.target, target));
    });
  },

  async retryNow(id: string): Promise<void> {
    await runExclusive(async () => {
      if (inFlightClipIds.has(id)) return;
      const items = await LocalStorage.getPendingVoiceTranscriptions();
      const current = items.find((item) => item.id === id);
      if (!current || current.status === 'completed' || current.status === 'transcribing') return;
      await upsertItemUnlocked({
        ...current,
        status: 'queued',
        nextAttemptAt: new Date().toISOString(),
        lastErrorCode: undefined,
      });
    });
    await this.drain();
  },

  async enqueue(clip: PendingVoiceClip, target: VoiceTranscriptionTarget): Promise<PendingVoiceTranscription> {
    const item = await runExclusive(async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;
      if (!userId) throw new Error('Voice transcription requires an authenticated user');

      const pending: PendingVoiceTranscription = {
        id: clip.id,
        userId,
        audioUri: clip.uri,
        sizeBytes: clip.sizeBytes,
        durationMs: clip.durationMs,
        target,
        status: 'queued',
        createdAt: new Date().toISOString(),
        nextAttemptAt: new Date().toISOString(),
        attemptCount: 0,
      };
      await upsertItemUnlocked(pending);
      logEvent('voice_transcription_queued', {
        sizeBytes: clip.sizeBytes,
        durationMs: clip.durationMs,
      });
      return pending;
    });
    void this.drain();
    return item;
  },

  /**
   * Sole delivery path for completed transcripts for a target.
   * Always claim through this method so UI cannot append the same clip twice.
   */
  async claimCompleted(target: VoiceTranscriptionTarget): Promise<string[]> {
    return runExclusive(async () => {
      const items = await LocalStorage.getPendingVoiceTranscriptions();
      const matched = items.filter(
        (item) => item.status === 'completed' && item.transcript && sameTarget(item.target, target),
      );
      if (matched.length === 0) return [];
      await LocalStorage.savePendingVoiceTranscriptions(
        items.filter((item) => !matched.some((match) => match.id === item.id)),
      );
      await Promise.all(matched.map((item) => discardPendingClip({
        id: item.id,
        uri: item.audioUri,
        sizeBytes: item.sizeBytes,
        durationMs: item.durationMs,
      })));
      return matched.map((item) => item.transcript!);
    });
  },

  async acknowledge(id: string): Promise<void> {
    await runExclusive(async () => {
      await removeItemUnlocked(id);
    });
  },

  async discard(id: string): Promise<void> {
    await runExclusive(async () => {
      await removeItemUnlocked(id);
    });
  },

  async discardAll(): Promise<void> {
    await runExclusive(async () => {
      const items = await LocalStorage.getPendingVoiceTranscriptions();
      await Promise.all(items.map((item) => discardPendingClip({
        id: item.id,
        uri: item.audioUri,
        sizeBytes: item.sizeBytes,
        durationMs: item.durationMs,
      })));
      await LocalStorage.savePendingVoiceTranscriptions([]);
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    });
  },

  async drain(): Promise<void> {
    if (draining) {
      drainRequested = true;
      return;
    }
    if (!(await isOnline())) return;

    draining = true;
    try {
      do {
        drainRequested = false;
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user.id;
        if (!userId) return;

        const due = await prepareDueItems(userId);
        for (const item of due) {
          const transcribing = await markTranscribing(item.id);
          if (!transcribing) continue;

          inFlightClipIds.add(transcribing.id);
          try {
            const result = await transcribeAudio({
              id: transcribing.id,
              uri: transcribing.audioUri,
              sizeBytes: transcribing.sizeBytes,
              durationMs: transcribing.durationMs,
            });
            await finalizeAttempt(transcribing.id, result);
          } finally {
            inFlightClipIds.delete(transcribing.id);
          }
        }
        await scheduleNextDrain();
      } while (drainRequested);
    } catch (error) {
      logError('voice_transcription_queue_drain_error', error);
    } finally {
      draining = false;
      if (drainRequested) {
        drainRequested = false;
        void this.drain();
      }
    }
  },
};
