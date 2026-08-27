const mockGetPending = jest.fn();
const mockGetQueueCleanupState = jest.fn();
const mockSavePending = jest.fn();
const mockGetSession = jest.fn();
const mockIsOnline = jest.fn();
const mockTranscribeAudio = jest.fn();
const mockDiscardPendingClip = jest.fn();
const mockDiscardPendingClipStrict = jest.fn();
const mockGetInbox = jest.fn();
const mockGetInboxCleanupState = jest.fn();
const mockSaveInbox = jest.fn();
const mockRemoveInbox = jest.fn();
const mockRemoveInboxStrict = jest.fn();
const mockAbortActiveTranscriptions = jest.fn();
const mockAbortActiveTranscriptionsForUser = jest.fn();
const mockGetFileManifests = jest.fn();
const mockRemoveFileManifests = jest.fn();
const mockCommitVoiceTranscript = jest.fn();
const mockCommitComposerTranscript = jest.fn();
const mockAcknowledgeComposerDeliveries = jest.fn();
const mockMigrateLegacyPendingClipFiles = jest.fn();
const mockMigrateLegacyPendingClipUri = jest.fn();

jest.mock('../src/services/localStorage', () => ({
  LocalStorage: {
    getPendingVoiceTranscriptions: (...args: unknown[]) => mockGetPending(...args),
    getPendingVoiceTranscriptionsStrict: (...args: unknown[]) => mockGetPending(...args),
    getPendingVoiceTranscriptionCleanupState: (...args: unknown[]) => mockGetQueueCleanupState(...args),
    savePendingVoiceTranscriptions: (...args: unknown[]) => mockSavePending(...args),
    getPendingVoiceClipInbox: (...args: unknown[]) => mockGetInbox(...args),
    getPendingVoiceClipInboxStrict: (...args: unknown[]) => mockGetInbox(...args),
    getPendingVoiceClipInboxCleanupState: (...args: unknown[]) => mockGetInboxCleanupState(...args),
    savePendingVoiceClipInbox: (...args: unknown[]) => mockSaveInbox(...args),
    removePendingVoiceClipsFromInbox: (...args: unknown[]) => mockRemoveInbox(...args),
    removePendingVoiceClipsFromInboxStrict: (...args: unknown[]) => mockRemoveInboxStrict(...args),
    commitVoiceTranscript: (...args: unknown[]) => mockCommitVoiceTranscript(...args),
  },
}));

jest.mock('../src/services/voiceComposerService', () => ({
  VoiceComposerService: {
    commitTranscriptForUser: (...args: unknown[]) => mockCommitComposerTranscript(...args),
    acknowledgeVisibleDeliveries: (...args: unknown[]) => mockAcknowledgeComposerDeliveries(...args),
  },
}));

jest.mock('../src/services/supabaseClient', () => ({
  supabase: {
    auth: { getSession: (...args: unknown[]) => mockGetSession(...args) },
  },
}));

jest.mock('../src/utils/network', () => ({
  isOnline: (...args: unknown[]) => mockIsOnline(...args),
}));

jest.mock('../src/utils/voiceRecording', () => ({
  transcribeAudio: (...args: unknown[]) => mockTranscribeAudio(...args),
  discardPendingClip: (...args: unknown[]) => mockDiscardPendingClip(...args),
  discardPendingClipStrict: (...args: unknown[]) => mockDiscardPendingClipStrict(...args),
  abortActiveTranscriptions: (...args: unknown[]) => mockAbortActiveTranscriptions(...args),
  abortActiveTranscriptionsForUser: (...args: unknown[]) => mockAbortActiveTranscriptionsForUser(...args),
  getPendingVoiceClipFileManifests: (...args: unknown[]) => mockGetFileManifests(...args),
  getPendingVoiceClipFileManifestsStrict: (...args: unknown[]) => mockGetFileManifests(...args),
  migrateLegacyPendingClipFiles: (...args: unknown[]) => mockMigrateLegacyPendingClipFiles(...args),
  migrateLegacyPendingClipUri: (...args: unknown[]) => mockMigrateLegacyPendingClipUri(...args),
  removePendingVoiceClipFileManifests: (...args: unknown[]) => mockRemoveFileManifests(...args),
  removePendingVoiceClipFileManifestsStrict: (...args: unknown[]) => mockRemoveFileManifests(...args),
  TRANSCRIPTION_ATTEMPT_TIMEOUT_MS: 90_000,
  MAX_TRANSCRIPTION_ATTEMPTS: 2,
  TRANSCRIPTION_CLIENT_BUDGET_MS: 2 * 90_000 + 60_000,
}));

jest.mock('../src/services/logger', () => ({
  logEvent: jest.fn(),
  logError: jest.fn(),
}));

import {
  resetVoiceTranscriptionQueueRuntimeForTests,
  voiceTranscriptionQueueService,
} from '../src/services/voiceTranscriptionQueueService';
import type { PendingVoiceTranscription } from '../src/types/dream';

const target = { surface: 'write' as const, key: 'active' };
const queued: PendingVoiceTranscription = {
  id: 'voice-queue-test',
  userId: 'user-1',
  audioUri: 'file:///voice.m4a',
  sizeBytes: 1000,
  durationMs: 5000,
  target,
  status: 'queued',
  createdAt: new Date().toISOString(),
  nextAttemptAt: new Date(0).toISOString(),
  attemptCount: 0,
};

describe('voiceTranscriptionQueueService', () => {
  let stored: PendingVoiceTranscription[];

  beforeEach(() => {
    resetVoiceTranscriptionQueueRuntimeForTests();
    jest.useFakeTimers();
    jest.clearAllMocks();
    stored = [];
    mockGetPending.mockImplementation(async () => stored);
    mockGetQueueCleanupState.mockImplementation(async () => {
      const canonical = await mockGetPending();
      return { canonical, attributionEvidence: canonical };
    });
    mockGetInbox.mockResolvedValue([]);
    mockGetInboxCleanupState.mockImplementation(async () => {
      const canonical = await mockGetInbox();
      return { canonical, attributionEvidence: canonical };
    });
    mockSaveInbox.mockResolvedValue(undefined);
    mockRemoveInbox.mockResolvedValue(undefined);
    mockRemoveInboxStrict.mockResolvedValue(undefined);
    mockGetFileManifests.mockResolvedValue([]);
    mockRemoveFileManifests.mockResolvedValue(undefined);
    mockMigrateLegacyPendingClipFiles.mockResolvedValue(undefined);
    mockMigrateLegacyPendingClipUri.mockImplementation(async (uri: string) => uri);
    mockSavePending.mockImplementation(async (items: PendingVoiceTranscription[]) => {
      stored = items;
    });
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' }, access_token: 'user-1-token' } },
    });
    mockDiscardPendingClip.mockResolvedValue(undefined);
    mockDiscardPendingClipStrict.mockResolvedValue(undefined);
    mockCommitVoiceTranscript.mockImplementation(async (
      _userId: string,
      _target: unknown,
      delivery: { transcript: string },
      currentText: string,
    ) => `${currentText}\n${delivery.transcript}`.trim());
    mockCommitComposerTranscript.mockImplementation(async (
      userId: string,
      deliveryTarget: unknown,
      delivery: { id: string; transcript: string },
      currentText: string,
    ) => ({
      id: `${userId}:write:active`,
      userId,
      target: deliveryTarget,
      text: `${currentText}\n${delivery.transcript}`.trim(),
      deliveredClipIds: [delivery.id],
      revision: 1,
      pendingDeliveries: [delivery],
      updatedAt: new Date().toISOString(),
    }));
    mockAcknowledgeComposerDeliveries.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('persists an offline clip before any transcription attempt', async () => {
    mockIsOnline.mockResolvedValue(false);
    await voiceTranscriptionQueueService.enqueue(
      {
        id: queued.id,
        userId: queued.userId,
        uri: queued.audioUri,
        sizeBytes: queued.sizeBytes,
        durationMs: queued.durationMs,
      },
      target,
    );

    expect(stored).toEqual([expect.objectContaining({ id: queued.id, status: 'queued', target })]);
    expect(mockTranscribeAudio).not.toHaveBeenCalled();
  });

  it('publishes transcribing then completed and preserves the result until claimed', async () => {
    stored = [queued];
    mockIsOnline.mockResolvedValue(true);
    mockTranscribeAudio.mockResolvedValue({ ok: true, value: 'remembered scene' });
    const observed: string[] = [];
    const unsubscribe = voiceTranscriptionQueueService.subscribe((item) => observed.push(item.status));

    await voiceTranscriptionQueueService.drain();
    unsubscribe();

    expect(observed).toEqual(['transcribing', 'completed']);
    expect(stored[0]).toEqual(expect.objectContaining({
      status: 'completed',
      transcript: 'remembered scene',
    }));
    expect(mockDiscardPendingClip).not.toHaveBeenCalled();
    expect(mockTranscribeAudio).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1' }),
      expect.objectContaining({ expectedUserId: 'user-1' }),
    );
  });

  it('keeps a failed clip and exposes retrying state', async () => {
    stored = [queued];
    mockIsOnline.mockResolvedValue(true);
    mockTranscribeAudio.mockResolvedValue({
      ok: false,
      code: 'service_unavailable',
      retryable: true,
    });

    await voiceTranscriptionQueueService.drain();

    expect(stored[0]).toEqual(expect.objectContaining({
      status: 'retrying',
      attemptCount: 1,
      lastErrorCode: 'service_unavailable',
    }));
    expect(mockDiscardPendingClip).not.toHaveBeenCalled();
  });

  it('persists a server rate-limit delay instead of hammering the endpoint', async () => {
    stored = [queued];
    mockIsOnline.mockResolvedValue(true);
    mockTranscribeAudio.mockResolvedValue({
      ok: false,
      code: 'rate_limited',
      retryable: true,
      retryAfterMs: 60 * 60 * 1000,
    });

    const before = Date.now();
    await voiceTranscriptionQueueService.drain();

    expect(Date.parse(stored[0].nextAttemptAt)).toBeGreaterThanOrEqual(before + 60 * 60 * 1000);
  });

  it('schedules completion-fence conflicts after the remaining lease', async () => {
    stored = [queued];
    mockIsOnline.mockResolvedValue(true);
    mockTranscribeAudio.mockResolvedValue({
      ok: false,
      code: 'transcription_in_progress',
      retryable: true,
      retryAfterMs: 240_000,
    });

    const before = Date.now();
    await voiceTranscriptionQueueService.drain();

    expect(stored[0]).toEqual(expect.objectContaining({
      status: 'retrying',
      attemptCount: 1,
      lastErrorCode: 'transcription_in_progress',
    }));
    expect(Date.parse(stored[0].nextAttemptAt)).toBeGreaterThanOrEqual(before + 240_000);
  });

  it('stops automatic retries after the bounded queue budget', async () => {
    stored = [{ ...queued, attemptCount: 2 }];
    mockIsOnline.mockResolvedValue(true);
    mockTranscribeAudio.mockResolvedValue({
      ok: false,
      code: 'service_unavailable',
      retryable: true,
    });

    await voiceTranscriptionQueueService.drain();

    expect(stored[0]).toEqual(expect.objectContaining({
      status: 'needs_attention',
      attemptCount: 3,
    }));
  });

  it('does not let one user circuit-break a newly signed-in user', async () => {
    mockIsOnline.mockResolvedValue(true);
    mockTranscribeAudio.mockResolvedValue({
      ok: false,
      code: 'service_unavailable',
      retryable: true,
    });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      stored = [{
        ...queued,
        id: `voice-user-one-${attempt}`,
        status: 'queued',
        attemptCount: 0,
        nextAttemptAt: new Date(0).toISOString(),
      }];
      await voiceTranscriptionQueueService.drain();
    }

    const userTwo = {
      ...queued,
      id: 'voice-user-two-circuit',
      userId: 'user-2',
      audioUri: 'file:///user-two-circuit.m4a',
    };
    stored = [userTwo];
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-2' }, access_token: 'user-2-token' } },
    });
    mockTranscribeAudio.mockResolvedValueOnce({ ok: true, value: 'user two transcript' });

    await voiceTranscriptionQueueService.drain();

    expect(mockTranscribeAudio).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 'voice-user-two-circuit', userId: 'user-2' }),
      expect.objectContaining({ expectedUserId: 'user-2' }),
    );
    expect(stored[0]).toEqual(expect.objectContaining({
      status: 'completed',
      transcript: 'user two transcript',
    }));
  });

  it('recovers a finalized inbox clip into the durable queue before target lookup', async () => {
    mockGetInbox.mockResolvedValueOnce([{
      id: 'voice-inbox',
      userId: 'user-1',
      audioUri: 'file:///voice-inbox.m4a',
      sizeBytes: 222,
      durationMs: 2_000,
      target,
      createdAt: new Date().toISOString(),
    }]).mockResolvedValue([]);

    await expect(voiceTranscriptionQueueService.getForTarget(target)).resolves.toEqual([
      expect.objectContaining({ id: 'voice-inbox', status: 'queued', userId: 'user-1' }),
    ]);
    expect(mockSavePending).toHaveBeenCalled();
    expect(mockRemoveInbox).toHaveBeenCalledWith(['voice-inbox']);
  });

  it('recovers from the file manifest when the AsyncStorage inbox was unavailable', async () => {
    mockGetInbox.mockRejectedValueOnce(new Error('AsyncStorage unavailable'));
    mockGetFileManifests.mockResolvedValueOnce([{
      id: 'voice-123-filefallback',
      userId: 'user-1',
      audioUri: 'file:///voice-file-fallback.m4a',
      sizeBytes: 333,
      durationMs: 3_000,
      target,
      createdAt: new Date().toISOString(),
    }]).mockResolvedValue([]);

    await expect(voiceTranscriptionQueueService.getForTarget(target)).resolves.toEqual([
      expect.objectContaining({ id: 'voice-123-filefallback', status: 'queued' }),
    ]);
    expect(mockRemoveFileManifests).toHaveBeenCalledWith(['voice-123-filefallback']);
  });

  it('surfaces the file-sidecar row when all queue AsyncStorage reads are unavailable', async () => {
    mockGetInbox.mockRejectedValue(new Error('AsyncStorage unavailable'));
    mockGetPending.mockRejectedValue(new Error('AsyncStorage unavailable'));
    mockGetFileManifests.mockResolvedValue([{
      id: 'voice-123-fileonly',
      userId: 'user-1',
      audioUri: 'file:///voice-file-only.m4a',
      sizeBytes: 444,
      durationMs: 4_000,
      target,
      createdAt: new Date().toISOString(),
    }]);

    await expect(voiceTranscriptionQueueService.getForTarget(target)).resolves.toEqual([
      expect.objectContaining({ id: 'voice-123-fileonly', status: 'queued' }),
    ]);
    expect(mockRemoveFileManifests).not.toHaveBeenCalled();
  });

  it('rejects enqueue after an account switch instead of rebinding the clip owner', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-2' }, access_token: 'user-2-token' } },
    });

    await expect(voiceTranscriptionQueueService.enqueue({
      id: queued.id,
      userId: 'user-1',
      uri: queued.audioUri,
      sizeBytes: queued.sizeBytes,
      durationMs: queued.durationMs,
    }, target)).rejects.toThrow('owner changed');
    expect(stored).toEqual([]);
    expect(mockRemoveInbox).not.toHaveBeenCalled();
  });

  it('turns an unexpected item exception into retrying instead of leaving it stuck', async () => {
    stored = [queued];
    mockIsOnline.mockResolvedValue(true);
    mockTranscribeAudio.mockRejectedValue(new Error('filesystem bridge failed'));

    await voiceTranscriptionQueueService.drain();

    expect(stored[0]).toEqual(expect.objectContaining({
      status: 'retrying',
      attemptCount: 1,
      lastErrorCode: 'service_unavailable',
    }));
  });

  it('peeks, durably commits, then acknowledges a completed transcript', async () => {
    stored = [{ ...queued, status: 'completed', transcript: 'one transcript' }];

    const delivery = { id: queued.id, transcript: 'one transcript' };
    await expect(voiceTranscriptionQueueService.peekCompleted(target)).resolves.toEqual([delivery]);
    expect(stored).toHaveLength(1);
    await expect(voiceTranscriptionQueueService.commitCompleted(target, delivery, 'written')).resolves
      .toEqual({ text: 'written\none transcript', composerRevision: 1 });
    expect(stored).toHaveLength(1);
    await voiceTranscriptionQueueService.acknowledgeComposerIntegration(target, delivery.id, 1);
    expect(mockAcknowledgeComposerDeliveries).toHaveBeenCalledWith(
      'user-1',
      target,
      [delivery.id],
      1,
    );
    await voiceTranscriptionQueueService.acknowledge(queued.id);
    expect(stored).toEqual([]);
    expect(mockDiscardPendingClipStrict).toHaveBeenCalledTimes(1);
    await expect(voiceTranscriptionQueueService.peekCompleted(target)).resolves.toEqual([]);
  });

  it('never exposes or claims another user’s queued transcript', async () => {
    stored = [{
      ...queued,
      userId: 'user-2',
      status: 'completed',
      transcript: 'private transcript from another account',
    }];

    await expect(voiceTranscriptionQueueService.getForTarget(target)).resolves.toEqual([]);
    await expect(voiceTranscriptionQueueService.peekCompleted(target)).resolves.toEqual([]);
    expect(stored).toHaveLength(1);
    expect(mockDiscardPendingClipStrict).not.toHaveBeenCalled();
  });

  it('does not schedule a drain loop from another user’s due item', async () => {
    stored = [{ ...queued, userId: 'user-2' }];
    mockIsOnline.mockResolvedValue(true);

    await voiceTranscriptionQueueService.drain();

    expect(mockTranscribeAudio).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('manual discard removes queue metadata and local audio', async () => {
    stored = [queued];
    await voiceTranscriptionQueueService.discard(queued.id);
    expect(stored).toEqual([]);
    expect(mockDiscardPendingClipStrict).toHaveBeenCalledWith(expect.objectContaining({ id: queued.id }));
  });

  it('discards only the logged-out owner and preserves a newly signed-in user', async () => {
    const userTwo = {
      ...queued,
      id: 'voice-user-two',
      userId: 'user-2',
      audioUri: 'file:///user-two.m4a',
    };
    stored = [queued, userTwo];
    mockGetInbox.mockResolvedValue([
      {
        id: 'voice-user-one-inbox',
        userId: 'user-1',
        audioUri: 'file:///user-one-inbox.m4a',
        sizeBytes: 100,
        durationMs: 1_000,
        target,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'voice-user-two-inbox',
        userId: 'user-2',
        audioUri: 'file:///user-two-inbox.m4a',
        sizeBytes: 100,
        durationMs: 1_000,
        target,
        createdAt: new Date().toISOString(),
      },
    ]);

    await voiceTranscriptionQueueService.discardAllForUser('user-1');

    expect(stored).toEqual([userTwo]);
    expect(mockSaveInbox).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'voice-user-two-inbox', userId: 'user-2' }),
    ]);
    expect(mockAbortActiveTranscriptionsForUser).toHaveBeenCalledWith('user-1');
    expect(mockDiscardPendingClipStrict).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1' }));
    expect(mockDiscardPendingClipStrict).not.toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-2' }));
  });

  it('fails owner cleanup when the queue is unreadable so the owner fence can be retried', async () => {
    mockGetPending.mockRejectedValueOnce(new Error('AsyncStorage queue unavailable'));
    mockGetInbox.mockResolvedValue([]);
    mockGetFileManifests.mockResolvedValue([]);

    await expect(voiceTranscriptionQueueService.discardAllForUser('user-1')).rejects.toMatchObject({
      name: 'VoiceOwnerCleanupIncompleteError',
      code: 'VOICE_OWNER_CLEANUP_INCOMPLETE',
    });

    expect(mockAbortActiveTranscriptionsForUser).toHaveBeenCalledWith('user-1');
    expect(mockDiscardPendingClip).not.toHaveBeenCalled();
    expect(mockDiscardPendingClipStrict).not.toHaveBeenCalled();
    expect(mockSavePending).not.toHaveBeenCalled();
    expect(mockSaveInbox).not.toHaveBeenCalled();
    expect(mockRemoveFileManifests).not.toHaveBeenCalled();
  });

  it('fails owner cleanup when strict inbox metadata is unreadable', async () => {
    mockGetInbox.mockRejectedValueOnce(new Error('corrupt inbox snapshot'));

    await expect(voiceTranscriptionQueueService.discardAllForUser('user-1')).rejects.toMatchObject({
      code: 'VOICE_OWNER_CLEANUP_INCOMPLETE',
      reason: 'metadata_unreadable',
    });
    expect(mockSavePending).not.toHaveBeenCalled();
  });

  it('fails owner cleanup when a sidecar directory or manifest cannot be read', async () => {
    mockGetFileManifests.mockRejectedValueOnce(new Error('sidecar scan failed'));

    await expect(voiceTranscriptionQueueService.discardAllForUser('user-1')).rejects.toMatchObject({
      code: 'VOICE_OWNER_CLEANUP_INCOMPLETE',
      reason: 'manifest_unreadable',
    });
    expect(mockSavePending).not.toHaveBeenCalled();
  });

  it('keeps owner metadata when strict sidecar deletion cannot be verified', async () => {
    const inboxItem = {
      id: 'voice-user-one-inbox',
      userId: 'user-1',
      audioUri: 'file:///user-one-inbox.m4a',
      sizeBytes: 100,
      durationMs: 1_000,
      target,
      createdAt: new Date().toISOString(),
    };
    mockGetInbox.mockResolvedValue([inboxItem]);
    mockGetFileManifests.mockResolvedValue([inboxItem]);
    mockRemoveFileManifests.mockRejectedValueOnce(new Error('sidecar remains'));

    await expect(voiceTranscriptionQueueService.discardAllForUser('user-1')).rejects.toMatchObject({
      code: 'VOICE_OWNER_CLEANUP_INCOMPLETE',
      reason: 'manifest_delete_failed',
    });
    expect(mockSavePending).not.toHaveBeenCalled();
    expect(mockSaveInbox).not.toHaveBeenCalled();
  });

  it('keeps queue and inbox metadata when strict audio deletion fails', async () => {
    stored = [queued];
    const inboxItem = {
      id: 'voice-user-one-inbox',
      userId: 'user-1',
      audioUri: 'file:///user-one-inbox.m4a',
      sizeBytes: 100,
      durationMs: 1_000,
      target,
      createdAt: new Date().toISOString(),
    };
    mockGetInbox.mockResolvedValue([inboxItem]);
    mockDiscardPendingClipStrict.mockRejectedValueOnce(new Error('voice_clip_delete_failed'));

    await expect(voiceTranscriptionQueueService.discardAllForUser('user-1')).rejects.toMatchObject({
      name: 'VoiceOwnerCleanupIncompleteError',
      code: 'VOICE_OWNER_CLEANUP_INCOMPLETE',
      reason: 'audio_delete_failed',
    });

    expect(stored).toEqual([queued]);
    expect(mockSavePending).not.toHaveBeenCalled();
    expect(mockSaveInbox).not.toHaveBeenCalled();
    expect(mockRemoveFileManifests).not.toHaveBeenCalled();
  });

  it('moves legacy root audio and commits the repaired queue URI before use', async () => {
    stored = [{ ...queued, audioUri: 'file:///documents/voice-1234-legacy.m4a' }];
    mockMigrateLegacyPendingClipUri.mockResolvedValue(
      'file:///documents/voice_pending/voice-1234-legacy.m4a',
    );

    await expect(voiceTranscriptionQueueService.getForTarget(target)).resolves.toEqual([
      expect.objectContaining({
        audioUri: 'file:///documents/voice_pending/voice-1234-legacy.m4a',
      }),
    ]);

    expect(stored).toEqual([
      expect.objectContaining({
        audioUri: 'file:///documents/voice_pending/voice-1234-legacy.m4a',
      }),
    ]);
  });

  it('sweeps orphan legacy root audio before queue-backed migration', async () => {
    await voiceTranscriptionQueueService.migrateLegacyPendingClips();

    expect(mockMigrateLegacyPendingClipFiles).toHaveBeenCalledTimes(1);
    expect(mockGetPending).toHaveBeenCalled();
  });

  it('repairs a legacy URI on the next read when the post-move queue commit fails', async () => {
    stored = [{ ...queued, audioUri: 'file:///documents/voice-1234-legacy.m4a' }];
    mockMigrateLegacyPendingClipUri.mockResolvedValue(
      'file:///documents/voice_pending/voice-1234-legacy.m4a',
    );
    mockSavePending.mockRejectedValueOnce(new Error('snapshot write interrupted'));

    await expect(voiceTranscriptionQueueService.getForTarget(target)).resolves.toEqual([]);
    expect(stored[0].audioUri).toBe('file:///documents/voice-1234-legacy.m4a');

    await expect(voiceTranscriptionQueueService.getForTarget(target)).resolves.toEqual([
      expect.objectContaining({
        audioUri: 'file:///documents/voice_pending/voice-1234-legacy.m4a',
      }),
    ]);
    expect(stored[0].audioUri).toBe(
      'file:///documents/voice_pending/voice-1234-legacy.m4a',
    );
  });

  it('Retry now clears the delay while preserving the saved clip', async () => {
    stored = [{
      ...queued,
      status: 'retrying',
      nextAttemptAt: new Date(Date.now() + 60_000).toISOString(),
      attemptCount: 2,
      lastErrorCode: 'service_unavailable',
    }];
    mockIsOnline.mockResolvedValue(false);

    await voiceTranscriptionQueueService.retryNow(queued.id);

    expect(stored[0]).toEqual(expect.objectContaining({
      status: 'queued',
      lastErrorCode: undefined,
    }));
    expect(Date.parse(stored[0].nextAttemptAt)).toBeLessThanOrEqual(Date.now());
    expect(mockDiscardPendingClip).not.toHaveBeenCalled();
  });

  it('expires seven-day-old queue entries and deletes their local audio', async () => {
    stored = [{
      ...queued,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    }];
    mockIsOnline.mockResolvedValue(true);

    await voiceTranscriptionQueueService.drain();

    expect(stored).toEqual([]);
    expect(mockDiscardPendingClipStrict).toHaveBeenCalledWith(expect.objectContaining({ id: queued.id }));
    expect(mockTranscribeAudio).not.toHaveBeenCalled();
  });

  it('retains an expired row as a deletion tombstone when strict audio deletion fails', async () => {
    const expired = {
      ...queued,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    };
    stored = [expired];
    mockIsOnline.mockResolvedValue(true);
    mockDiscardPendingClipStrict.mockRejectedValueOnce(new Error('ENOSPC bridge failure'));

    await voiceTranscriptionQueueService.drain();

    expect(stored).toEqual([expect.objectContaining({
      ...expired,
      status: 'deletion_pending',
    })]);
    expect(mockTranscribeAudio).not.toHaveBeenCalled();
  });

  it('retains the completed row when strict sidecar cleanup fails during acknowledge', async () => {
    const completed = { ...queued, status: 'completed' as const, transcript: 'durable words' };
    stored = [completed];
    mockRemoveFileManifests.mockRejectedValueOnce(new Error('sidecar delete failed'));

    await expect(voiceTranscriptionQueueService.acknowledge(completed.id)).rejects.toThrow(
      'sidecar delete failed',
    );

    expect(stored).toEqual([expect.objectContaining({
      ...completed,
      status: 'deletion_pending',
    })]);
    expect(mockSavePending).toHaveBeenCalledTimes(1);

    await expect(voiceTranscriptionQueueService.getForTarget(target)).resolves.toEqual([]);
    expect(stored).toEqual([]);
  });

  it('retains a deletion tombstone when AsyncStorage inbox absence cannot be verified', async () => {
    const completed = { ...queued, status: 'completed' as const, transcript: 'durable words' };
    stored = [completed];
    mockRemoveInboxStrict.mockRejectedValueOnce(new Error('inbox snapshot write interrupted'));

    await expect(voiceTranscriptionQueueService.acknowledge(completed.id)).rejects.toThrow(
      'inbox snapshot write interrupted',
    );

    expect(stored).toEqual([expect.objectContaining({
      id: completed.id,
      status: 'deletion_pending',
      transcript: completed.transcript,
    })]);
  });

  it('reclaims stuck transcribing clips back to queued', async () => {
    stored = [{
      ...queued,
      status: 'transcribing',
      // Older than TRANSCRIPTION_CLIENT_BUDGET_MS + safety buffer (~9+ minutes).
      nextAttemptAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    }];
    mockIsOnline.mockResolvedValue(true);
    mockTranscribeAudio.mockResolvedValue({ ok: true, value: 'recovered' });

    await voiceTranscriptionQueueService.drain();

    expect(mockTranscribeAudio).toHaveBeenCalled();
    expect(stored[0]).toEqual(expect.objectContaining({
      status: 'completed',
      transcript: 'recovered',
    }));
  });

  it('does not reclaim an in-flight transcription before the client budget elapses', async () => {
    stored = [{
      ...queued,
      status: 'transcribing',
      nextAttemptAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    }];
    mockIsOnline.mockResolvedValue(true);

    await voiceTranscriptionQueueService.drain();

    expect(mockTranscribeAudio).not.toHaveBeenCalled();
    expect(stored[0]).toEqual(expect.objectContaining({ status: 'transcribing' }));
  });

  it('keeps a newly enqueued clip when drain is already running', async () => {
    let resolveFirst!: (value: { ok: true; value: string }) => void;
    mockIsOnline.mockResolvedValue(true);
    mockTranscribeAudio
      .mockImplementationOnce(() => new Promise<{ ok: true; value: string }>((resolve) => {
        resolveFirst = resolve;
      }))
      .mockResolvedValueOnce({ ok: true, value: 'second clip' });

    stored = [queued];
    const firstDrain = voiceTranscriptionQueueService.drain();
    await waitForTranscribeCall();

    await voiceTranscriptionQueueService.enqueue(
      {
        id: 'voice-second',
        userId: 'user-1',
        uri: 'file:///second.m4a',
        sizeBytes: 50,
        durationMs: 1000,
      },
      target,
    );
    expect(stored.map((item) => item.id).sort()).toEqual(['voice-queue-test', 'voice-second']);

    resolveFirst({ ok: true, value: 'first clip' });
    await firstDrain;

    expect(stored.map((item) => item.id).sort()).toEqual(['voice-queue-test', 'voice-second']);
    expect(stored.every((item) => item.status === 'completed')).toBe(true);
  });
});

async function waitForTranscribeCall(): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (mockTranscribeAudio.mock.calls.length > 0) return;
    await Promise.resolve();
  }
  throw new Error('transcribeAudio was never called');
}
