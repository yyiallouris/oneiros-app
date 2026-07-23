const mockGetPending = jest.fn();
const mockSavePending = jest.fn();
const mockGetSession = jest.fn();
const mockIsOnline = jest.fn();
const mockTranscribeAudio = jest.fn();
const mockDiscardPendingClip = jest.fn();

jest.mock('../src/services/localStorage', () => ({
  LocalStorage: {
    getPendingVoiceTranscriptions: (...args: unknown[]) => mockGetPending(...args),
    savePendingVoiceTranscriptions: (...args: unknown[]) => mockSavePending(...args),
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
  TRANSCRIPTION_ATTEMPT_TIMEOUT_MS: 90_000,
  MAX_TRANSCRIPTION_ATTEMPTS: 3,
  TRANSCRIPTION_CLIENT_BUDGET_MS: 3 * 90_000 + 60_000,
}));

jest.mock('../src/services/logger', () => ({
  logEvent: jest.fn(),
  logError: jest.fn(),
}));

import { voiceTranscriptionQueueService } from '../src/services/voiceTranscriptionQueueService';
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
    jest.useFakeTimers();
    jest.clearAllMocks();
    stored = [];
    mockGetPending.mockImplementation(async () => stored);
    mockSavePending.mockImplementation(async (items: PendingVoiceTranscription[]) => {
      stored = items;
    });
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    });
    mockDiscardPendingClip.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('persists an offline clip before any transcription attempt', async () => {
    mockIsOnline.mockResolvedValue(false);
    await voiceTranscriptionQueueService.enqueue(
      { id: queued.id, uri: queued.audioUri, sizeBytes: queued.sizeBytes, durationMs: queued.durationMs },
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

  it('claims a completed transcript exactly once and then deletes its local clip', async () => {
    stored = [{ ...queued, status: 'completed', transcript: 'one transcript' }];

    await expect(voiceTranscriptionQueueService.claimCompleted(target)).resolves.toEqual(['one transcript']);
    expect(stored).toEqual([]);
    expect(mockDiscardPendingClip).toHaveBeenCalledTimes(1);
    await expect(voiceTranscriptionQueueService.claimCompleted(target)).resolves.toEqual([]);
  });

  it('manual discard removes queue metadata and local audio', async () => {
    stored = [queued];
    await voiceTranscriptionQueueService.discard(queued.id);
    expect(stored).toEqual([]);
    expect(mockDiscardPendingClip).toHaveBeenCalledWith(expect.objectContaining({ id: queued.id }));
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
    expect(mockDiscardPendingClip).toHaveBeenCalledWith(expect.objectContaining({ id: queued.id }));
    expect(mockTranscribeAudio).not.toHaveBeenCalled();
  });

  it('reclaims stuck transcribing clips back to queued', async () => {
    stored = [{
      ...queued,
      status: 'transcribing',
      // Older than TRANSCRIPTION_CLIENT_BUDGET_MS + buffer (~7+ minutes).
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
      { id: 'voice-second', uri: 'file:///second.m4a', sizeBytes: 50, durationMs: 1000 },
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
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (mockTranscribeAudio.mock.calls.length > 0) return;
    await Promise.resolve();
  }
  throw new Error('transcribeAudio was never called');
}
