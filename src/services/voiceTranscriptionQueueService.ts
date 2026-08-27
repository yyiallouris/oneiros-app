import { LocalStorage } from './localStorage';
import { logError, logEvent } from './logger';
import { supabase } from './supabaseClient';
import {
  PendingVoiceClip,
  TRANSCRIPTION_CLIENT_BUDGET_MS,
  abortActiveTranscriptionsForUser,
  discardPendingClip,
  discardPendingClipStrict,
  getPendingVoiceClipFileManifests,
  getPendingVoiceClipFileManifestsStrict,
  migrateLegacyPendingClipFiles,
  migrateLegacyPendingClipUri,
  removePendingVoiceClipFileManifests,
  removePendingVoiceClipFileManifestsStrict,
  transcribeAudio,
} from '../utils/voiceRecording';
import { isOnline } from '../utils/network';
import { VoiceComposerService } from './voiceComposerService';
import {
  PendingVoiceClipInboxItem,
  PendingVoiceTranscription,
  CompletedVoiceTranscript,
  VoiceComposerCommit,
  VoiceTranscriptionTarget,
} from '../types/dream';

const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_BACKOFF_MS = 15 * 60 * 1000;
const MAX_AUTO_QUEUE_ATTEMPTS = 3;
const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_OPEN_MS = 5 * 60 * 1000;
/** Must exceed a healthy in-process upload budget so reclaim never drops a live result. */
const STUCK_TRANSCRIBING_MS = TRANSCRIPTION_CLIENT_BUDGET_MS + 2 * 60 * 1000;
const listeners = new Set<(item: PendingVoiceTranscription) => void>();
const inFlightClipIds = new Set<string>();
let mutationChain: Promise<void> = Promise.resolve();
let draining = false;
let drainRequested = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
type CircuitState = { consecutiveSystemicFailures: number; openUntil: number };
const circuitStatesByUser = new Map<string, CircuitState>();

export class VoiceOwnerCleanupIncompleteError extends Error {
  readonly code = 'VOICE_OWNER_CLEANUP_INCOMPLETE';
  readonly reason: 'metadata_unreadable' | 'manifest_unreadable' | 'audio_delete_failed' | 'manifest_delete_failed';

  constructor(reason: VoiceOwnerCleanupIncompleteError['reason'] = 'metadata_unreadable') {
    super(`Voice owner cleanup is incomplete: ${reason}`);
    this.name = 'VoiceOwnerCleanupIncompleteError';
    this.reason = reason;
  }
}

export function resetVoiceTranscriptionQueueRuntimeForTests(): void {
  if (process.env.NODE_ENV !== 'test') return;
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  circuitStatesByUser.clear();
  draining = false;
  drainRequested = false;
  inFlightClipIds.clear();
}

const sameTarget = (a: VoiceTranscriptionTarget, b: VoiceTranscriptionTarget) =>
  a.surface === b.surface && a.key === b.key;

const nextAttempt = (attemptCount: number, serverRetryAfterMs?: number) =>
  new Date(
    Date.now()
      + Math.min(
        Math.max(
          Math.min(1_000 * 2 ** Math.max(0, attemptCount), MAX_BACKOFF_MS),
          serverRetryAfterMs ?? 0,
        ),
        24 * 60 * 60 * 1000,
      )
      + Math.floor(Math.random() * 500),
  ).toISOString();

const notify = async (item: PendingVoiceTranscription) => {
  const { data } = await supabase.auth.getSession();
  if (data.session?.user.id !== item.userId) return;
  listeners.forEach((listener) => listener(item));
};

const runExclusive = async <T>(operation: () => Promise<T>): Promise<T> => {
  const run = mutationChain.then(operation, operation);
  mutationChain = run.then(() => undefined, () => undefined);
  return run;
};

const migrateLegacyQueueAudioUnlocked = async (
  items: PendingVoiceTranscription[],
): Promise<PendingVoiceTranscription[]> => {
  const migrated = await Promise.all(items.map(async (item) => {
    const audioUri = await migrateLegacyPendingClipUri(item.audioUri);
    return audioUri === item.audioUri ? item : { ...item, audioUri };
  }));
  if (migrated.some((item, index) => item !== items[index])) {
    // File move happens first. If this snapshot write fails, the next read sees
    // the deterministic destination and repairs the old URI without data loss.
    await LocalStorage.savePendingVoiceTranscriptions(migrated);
    logEvent('voice_transcription_legacy_queue_migrated', {
      clipCount: migrated.filter((item, index) => item !== items[index]).length,
    });
  }
  return migrated;
};

const readPendingQueueUnlocked = async (): Promise<PendingVoiceTranscription[]> =>
  migrateLegacyQueueAudioUnlocked(await LocalStorage.getPendingVoiceTranscriptions());

const upsertItemUnlocked = async (item: PendingVoiceTranscription): Promise<void> => {
  const items = await readPendingQueueUnlocked();
  await LocalStorage.savePendingVoiceTranscriptions([
    ...items.filter((candidate) => candidate.id !== item.id),
    item,
  ]);
  await notify(item);
};

const clearClipInboxCopies = async (ids: string[]): Promise<void> => {
  const results = await Promise.allSettled([
    LocalStorage.removePendingVoiceClipsFromInbox(ids),
    removePendingVoiceClipFileManifests(ids),
  ]);
  results.forEach((result) => {
    if (result.status === 'rejected') {
      logError('voice_transcription_inbox_cleanup_error', result.reason);
    }
  });
};

const readClipInboxCopies = async (): Promise<{
  storageInbox: PendingVoiceClipInboxItem[];
  storageReadable: boolean;
  fileInbox: PendingVoiceClipInboxItem[];
}> => {
  const [storageResult, fileResult] = await Promise.allSettled([
    LocalStorage.getPendingVoiceClipInbox(),
    getPendingVoiceClipFileManifests(),
  ]);
  if (storageResult.status === 'rejected') {
    logError('voice_transcription_storage_inbox_read_error', storageResult.reason);
  }
  if (fileResult.status === 'rejected') {
    logError('voice_transcription_file_inbox_read_error', fileResult.reason);
  }
  return {
    storageInbox: storageResult.status === 'fulfilled' ? storageResult.value : [],
    storageReadable: storageResult.status === 'fulfilled',
    fileInbox: fileResult.status === 'fulfilled' ? fileResult.value : [],
  };
};

const recoverClipInboxUnlocked = async (): Promise<PendingVoiceTranscription[]> => {
  const { storageInbox, fileInbox } = await readClipInboxCopies();
  const inbox = [...new Map([...storageInbox, ...fileInbox]
    .map((clip) => [clip.id, clip])).values()];
  if (inbox.length === 0) return [];
  let items: PendingVoiceTranscription[] = [];
  let queueReadable = true;
  try {
    items = await readPendingQueueUnlocked();
  } catch (error) {
    queueReadable = false;
    logError('voice_transcription_queue_read_during_recovery_error', error);
  }
  let recovered = inbox.reduce<PendingVoiceTranscription[]>((current, clip) => {
    if (current.some((item) => item.id === clip.id)) return current;
    return [...current, {
      id: clip.id,
      userId: clip.userId,
      audioUri: clip.audioUri,
      sizeBytes: clip.sizeBytes,
      durationMs: clip.durationMs,
      target: clip.target,
      status: 'queued',
      createdAt: clip.createdAt,
      nextAttemptAt: new Date().toISOString(),
      attemptCount: 0,
    }];
  }, items);
  if (queueReadable) recovered = await migrateLegacyQueueAudioUnlocked(recovered);
  if (queueReadable) {
    try {
      await LocalStorage.savePendingVoiceTranscriptions(recovered);
      // Remove only after the queue snapshot is durable. A crash before this line is harmless:
      // recovery is idempotent by clip id.
      await clearClipInboxCopies(inbox.map((clip) => clip.id));
      logEvent('voice_transcription_inbox_recovered', { clipCount: inbox.length });
    } catch (error) {
      // Keep both inbox copies. getForTarget can still surface the file-backed
      // rows and a later foreground/drain can promote them once storage returns.
      logError('voice_transcription_inbox_promotion_error', error);
    }
  }
  return recovered;
};

const removeItemUnlocked = async (id: string): Promise<PendingVoiceTranscription | null> => {
  const items = await readPendingQueueUnlocked();
  let item = items.find((candidate) => candidate.id === id) ?? null;
  if (!item) return null;
  if (item.status !== 'deletion_pending') {
    item = { ...item, status: 'deletion_pending' };
    // Establish the tombstone before the first destructive side effect. If the
    // process dies later, this row is never eligible for upload or delivery.
    await LocalStorage.savePendingVoiceTranscriptions(
      items.map((candidate) => candidate.id === id ? item! : candidate),
    );
  }
  // Keep the durable row as the retry handle until raw audio deletion is
  // confirmed. This makes delivery acknowledgement and explicit discard
  // fail-closed instead of creating an unattributed orphan file.
  await discardPendingClipStrict({
    id: item.id,
    uri: item.audioUri,
    sizeBytes: item.sizeBytes,
    durationMs: item.durationMs,
  });
  // Queue row remains the tombstone/deletion handle until every independent
  // inbox copy is confirmed absent. Recovery therefore cannot resurrect a
  // ghost row pointing at already-deleted audio.
  await removePendingVoiceClipFileManifestsStrict([id]);
  await LocalStorage.removePendingVoiceClipsFromInboxStrict([id]);
  const latest = await readPendingQueueUnlocked();
  await LocalStorage.savePendingVoiceTranscriptions(latest.filter((candidate) => candidate.id !== id));
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
  return recovered;
});

const scheduleNextDrain = async (userId: string, notBefore = 0) => {
  if (retryTimer) clearTimeout(retryTimer);
  const items = await readPendingQueueUnlocked();
  const nextAt = items
    .filter((item) => item.userId === userId && ['queued', 'retrying'].includes(item.status))
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
  }, Math.max(0, Math.max(nextAt, notBefore) - Date.now()));
};

const prepareDueItems = async (userId: string): Promise<PendingVoiceTranscription[]> =>
  runExclusive(async () => {
    await recoverClipInboxUnlocked();
    const loaded = await readPendingQueueUnlocked();
    let items = reclaimStuckTranscribing(loaded);
    if (items.some((item, index) => item !== loaded[index])) {
      await LocalStorage.savePendingVoiceTranscriptions(items);
    }
    const now = Date.now();
    const pendingDeletion = items.filter((item) => item.status === 'deletion_pending');
    const expired = items.filter((item) => item.status !== 'deletion_pending'
      && now - Date.parse(item.createdAt) > RETENTION_MS);
    for (const item of [...pendingDeletion, ...expired]) {
      try {
        await removeItemUnlocked(item.id);
      } catch (error) {
        // The expired row is intentionally retained as a deletion tombstone.
        // It is excluded from upload below and retried on the next drain.
        logError('voice_transcription_expiry_delete_deferred', error);
      }
    }
    items = await readPendingQueueUnlocked();
    return items.filter((candidate) =>
      candidate.userId === userId
      && now - Date.parse(candidate.createdAt) <= RETENTION_MS
      && ['queued', 'retrying'].includes(candidate.status)
      && Date.parse(candidate.nextAttemptAt) <= Date.now(),
    );
  });

const markTranscribing = async (id: string): Promise<PendingVoiceTranscription | null> =>
  runExclusive(async () => {
    const items = await readPendingQueueUnlocked();
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
  result: {
    ok: true;
    value: string;
  } | {
    ok: false;
    code: string;
    retryable: boolean;
    retryAfterMs?: number;
  },
): Promise<void> => {
  await runExclusive(async () => {
    const items = await readPendingQueueUnlocked();
    const current = items.find((candidate) => candidate.id === id);
    if (!current) return;
    const circuitState = circuitStatesByUser.get(current.userId) ?? {
      consecutiveSystemicFailures: 0,
      openUntil: 0,
    };
    if (result.ok) {
      circuitStatesByUser.delete(current.userId);
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
    const attemptCount = current.attemptCount + 1;
    const autoRetry = result.retryable && attemptCount < MAX_AUTO_QUEUE_ATTEMPTS;
    if (['service_unavailable', 'request_timeout', 'rate_limited'].includes(result.code)) {
      circuitState.consecutiveSystemicFailures += 1;
      if (circuitState.consecutiveSystemicFailures >= CIRCUIT_FAILURE_THRESHOLD) {
        circuitState.openUntil = Date.now() + CIRCUIT_OPEN_MS;
        logEvent('voice_transcription_circuit_opened', {
          failureCount: circuitState.consecutiveSystemicFailures,
        });
      }
      circuitStatesByUser.set(current.userId, circuitState);
    } else {
      circuitStatesByUser.delete(current.userId);
    }
    await upsertItemUnlocked({
      ...current,
      status: autoRetry ? 'retrying' : 'needs_attention',
      attemptCount,
      nextAttemptAt: autoRetry
        ? nextAttempt(attemptCount, result.retryAfterMs)
        : new Date().toISOString(),
      lastErrorCode: result.code,
    });
  });
};

export const voiceTranscriptionQueueService = {
  subscribe(listener: (item: PendingVoiceTranscription) => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async migrateLegacyPendingClips(): Promise<void> {
    await runExclusive(async () => {
      // Sweep raw root clips without depending on AsyncStorage, including
      // orphans. Then recover legacy inbox sidecars and repair every persisted
      // queue URI. Queue reads repeat URI repair, so interrupted
      // move→snapshot transactions self-heal.
      await migrateLegacyPendingClipFiles();
      await recoverClipInboxUnlocked();
      await readPendingQueueUnlocked();
    });
  },

  async getForTarget(target: VoiceTranscriptionTarget): Promise<PendingVoiceTranscription[]> {
    return runExclusive(async () => {
      const recoveredFromInbox = await recoverClipInboxUnlocked();
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;
      if (!userId) return [];
      let queueReadable = true;
      let items: PendingVoiceTranscription[];
      try {
        items = await readPendingQueueUnlocked();
      } catch (error) {
        queueReadable = false;
        items = recoveredFromInbox;
        logError('voice_transcription_target_queue_read_error', error);
      }
      items = [...new Map([...items, ...recoveredFromInbox]
        .map((item) => [item.id, item])).values()];
      if (queueReadable) {
        for (const tombstone of items.filter((item) => item.status === 'deletion_pending')) {
          try {
            await removeItemUnlocked(tombstone.id);
          } catch (error) {
            logError('voice_transcription_tombstone_delete_deferred', error);
          }
        }
        items = await readPendingQueueUnlocked();
      }
      const recovered = reclaimStuckTranscribing(items);
      if (queueReadable && recovered.some((item, index) => item !== items[index])) {
        try {
          await LocalStorage.savePendingVoiceTranscriptions(recovered);
        } catch (error) {
          logError('voice_transcription_reclaimed_queue_save_error', error);
        }
      }
      items = recovered;
      return items.filter((item) => item.userId === userId
        && item.status !== 'deletion_pending'
        && sameTarget(item.target, target));
    });
  },

  async retryNow(id: string): Promise<void> {
    await runExclusive(async () => {
      if (inFlightClipIds.has(id)) return;
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;
      const items = await readPendingQueueUnlocked();
      const current = items.find((item) => item.id === id);
      if (!current
        || current.userId !== userId
        || current.status === 'completed'
        || current.status === 'transcribing'
        || current.status === 'deletion_pending') return;
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
      if (clip.userId !== userId) throw new Error('Voice transcription owner changed before enqueue');

      const pending: PendingVoiceTranscription = {
        id: clip.id,
        userId: clip.userId,
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
      await clearClipInboxCopies([clip.id]);
      logEvent('voice_transcription_queued', {
        sizeBytes: clip.sizeBytes,
        durationMs: clip.durationMs,
      });
      return pending;
    });
    void this.drain();
    return item;
  },

  async peekCompleted(target: VoiceTranscriptionTarget): Promise<CompletedVoiceTranscript[]> {
    return runExclusive(async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;
      if (!userId) return [];
      const items = await readPendingQueueUnlocked();
      const matched = items.filter(
        (item) => item.userId === userId
          && item.status === 'completed'
          && item.transcript
          && sameTarget(item.target, target),
      );
      return matched.map((item) => ({ id: item.id, transcript: item.transcript! }));
    });
  },

  async commitCompleted(
    target: VoiceTranscriptionTarget,
    delivery: CompletedVoiceTranscript,
    currentText: string,
  ): Promise<VoiceComposerCommit> {
    return runExclusive(async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;
      if (!userId) throw new Error('Voice transcript delivery requires an authenticated user');
      const items = await readPendingQueueUnlocked();
      const item = items.find((candidate) => candidate.id === delivery.id
        && candidate.userId === userId
        && candidate.status === 'completed'
        && candidate.transcript === delivery.transcript
        && sameTarget(candidate.target, target));
      if (!item) throw new Error('Completed voice transcript is no longer available');
      const committed = await VoiceComposerService.commitTranscriptForUser(
        userId,
        target,
        delivery,
        currentText,
      );
      return {
        text: committed.text,
        composerRevision: committed.revision ?? 0,
      };
    });
  },

  async acknowledgeComposerIntegration(
    target: VoiceTranscriptionTarget,
    deliveryId: string,
    visibleRevision: number,
  ): Promise<void> {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) return;
    await VoiceComposerService.acknowledgeVisibleDeliveries(
      userId,
      target,
      [deliveryId],
      visibleRevision,
    );
  },

  async acknowledge(id: string): Promise<void> {
    await runExclusive(async () => {
      const { data } = await supabase.auth.getSession();
      const items = await readPendingQueueUnlocked();
      if (!items.some((item) => item.id === id && item.userId === data.session?.user.id)) return;
      await removeItemUnlocked(id);
    });
  },

  async discard(id: string): Promise<void> {
    await runExclusive(async () => {
      const { data } = await supabase.auth.getSession();
      const items = await readPendingQueueUnlocked();
      if (!items.some((item) => item.id === id && item.userId === data.session?.user.id)) return;
      await removeItemUnlocked(id);
    });
  },

  async discardAllForUser(userId: string): Promise<void> {
    if (!userId) return;
    await runExclusive(async () => {
      abortActiveTranscriptionsForUser(userId);
      let items: PendingVoiceTranscription[];
      let queueAttributionEvidence: PendingVoiceTranscription[];
      let storageInbox: PendingVoiceClipInboxItem[];
      let inboxAttributionEvidence: PendingVoiceClipInboxItem[];
      try {
        const [queueState, inboxState] = await Promise.all([
          LocalStorage.getPendingVoiceTranscriptionCleanupState(),
          LocalStorage.getPendingVoiceClipInboxCleanupState(),
        ]);
        items = await migrateLegacyQueueAudioUnlocked(queueState.canonical);
        // The newest intact snapshot alone defines active state. Older intact
        // rows are retained only as owner-attribution evidence so logout can
        // delete every historical URI without resurrecting acknowledged work.
        queueAttributionEvidence = [
          ...queueState.attributionEvidence,
          ...items,
        ];
        storageInbox = inboxState.canonical;
        inboxAttributionEvidence = inboxState.attributionEvidence;
      } catch (error) {
        logError('voice_transcription_user_discard_metadata_read_error', error);
        throw new VoiceOwnerCleanupIncompleteError('metadata_unreadable');
      }
      let fileInbox: PendingVoiceClipInboxItem[];
      try {
        fileInbox = await getPendingVoiceClipFileManifestsStrict();
      } catch (error) {
        logError('voice_transcription_user_discard_manifest_read_error', error);
        throw new VoiceOwnerCleanupIncompleteError('manifest_unreadable');
      }
      const storageById = new Map([
        ...queueAttributionEvidence,
        ...inboxAttributionEvidence,
        ...items,
        ...storageInbox,
      ].map((clip) => [clip.id, clip]));
      const attributionConflict = fileInbox.some((fileClip) => {
        const storageClip = storageById.get(fileClip.id);
        return storageClip != null && (
          storageClip.userId !== fileClip.userId
          || storageClip.audioUri !== fileClip.audioUri
          || storageClip.sizeBytes !== fileClip.sizeBytes
          || storageClip.target.surface !== fileClip.target.surface
          || storageClip.target.key !== fileClip.target.key
        );
      });
      if (attributionConflict) {
        logError(
          'voice_transcription_user_discard_manifest_conflict',
          new Error('voice_manifest_attribution_conflict'),
        );
        throw new VoiceOwnerCleanupIncompleteError('manifest_unreadable');
      }
      const inbox = [...new Map([...inboxAttributionEvidence, ...storageInbox, ...fileInbox]
        .map((clip) => [`${clip.id}:${clip.audioUri}`, clip])).values()];
      const ownedItems = [...new Map(queueAttributionEvidence
        .filter((item) => item.userId === userId)
        .map((item) => [`${item.id}:${item.audioUri}`, item])).values()];
      const ownedInbox = inbox.filter((item) => item.userId === userId);
      const clips = [...ownedItems.map((item) => ({
        id: item.id,
        userId: item.userId,
        uri: item.audioUri,
        sizeBytes: item.sizeBytes,
        durationMs: item.durationMs,
      })), ...ownedInbox.map((item) => ({
        id: item.id,
        userId: item.userId,
        uri: item.audioUri,
        sizeBytes: item.sizeBytes,
        durationMs: item.durationMs,
      }))];
      const deletionResults = await Promise.allSettled(
        [...new Map(clips.map((clip) => [clip.uri, clip])).values()]
          .map((clip) => discardPendingClipStrict(clip)),
      );
      const deletionFailureCount = deletionResults.filter((result) => result.status === 'rejected').length;
      if (deletionFailureCount > 0) {
        // Metadata is intentionally untouched. The same queue/inbox rows and
        // previous-owner fence must drive an idempotent cleanup retry.
        logError(
          'voice_transcription_user_discard_audio_delete_error',
          new Error('voice_clip_delete_failed'),
          { failureCount: deletionFailureCount },
        );
        throw new VoiceOwnerCleanupIncompleteError('audio_delete_failed');
      }
      try {
        await removePendingVoiceClipFileManifestsStrict(
          [...new Set([...ownedItems, ...ownedInbox].map((clip) => clip.id))],
        );
      } catch (error) {
        logError('voice_transcription_user_discard_manifest_delete_error', error);
        throw new VoiceOwnerCleanupIncompleteError('manifest_delete_failed');
      }
      await LocalStorage.savePendingVoiceTranscriptions(
        items.filter((item) => item.userId !== userId),
      );
      await LocalStorage.savePendingVoiceClipInbox(
        storageInbox.filter((item) => item.userId !== userId),
      );
      ownedItems.forEach((item) => inFlightClipIds.delete(item.id));
      circuitStatesByUser.delete(userId);
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
        const session = data.session;
        const userId = session?.user.id;
        if (!userId || !session?.access_token) return;
        const circuitState = circuitStatesByUser.get(userId);
        if (circuitState && circuitState.openUntil > Date.now()) {
          await scheduleNextDrain(userId, circuitState.openUntil);
          return;
        }
        if (circuitState?.openUntil) circuitStatesByUser.delete(userId);

        const due = await prepareDueItems(userId);
        for (const item of due) {
          const transcribing = await markTranscribing(item.id);
          if (!transcribing) continue;

          inFlightClipIds.add(transcribing.id);
          try {
            const { data: currentAuth } = await supabase.auth.getSession();
            if (currentAuth.session?.user.id !== transcribing.userId) {
              await finalizeAttempt(transcribing.id, {
                ok: false,
                code: 'unauthenticated',
                retryable: false,
              });
              continue;
            }
            const result = await transcribeAudio({
              id: transcribing.id,
              userId: transcribing.userId,
              uri: transcribing.audioUri,
              sizeBytes: transcribing.sizeBytes,
              durationMs: transcribing.durationMs,
            }, {
              expectedUserId: transcribing.userId,
              accessToken: currentAuth.session.access_token,
            });
            await finalizeAttempt(transcribing.id, result);
          } catch (error) {
            logError('voice_transcription_queue_item_error', error, { clipId: transcribing.id });
            await finalizeAttempt(transcribing.id, {
              ok: false,
              code: 'service_unavailable',
              retryable: true,
            });
          } finally {
            inFlightClipIds.delete(transcribing.id);
          }
          if ((circuitStatesByUser.get(userId)?.openUntil ?? 0) > Date.now()) break;
        }
        await scheduleNextDrain(userId, circuitStatesByUser.get(userId)?.openUntil ?? 0);
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
