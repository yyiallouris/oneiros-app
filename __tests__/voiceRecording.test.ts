const mockGetInfoAsync = jest.fn();
const mockDeleteAsync = jest.fn();
const mockCopyAsync = jest.fn();
const mockMoveAsync = jest.fn();
const mockGetFreeDiskStorageAsync = jest.fn();
const mockGetSession = jest.fn();
const mockRefreshSession = jest.fn();
const mockFetch = jest.fn();
const mockIsOnline = jest.fn();
const mockAudioRecorderConstructor = jest.fn();
const mockRequestRecordingPermissions = jest.fn();
const mockSetAudioMode = jest.fn();
const mockAddPendingVoiceClipToInbox = jest.fn();
const mockGetQueueCleanupState = jest.fn();
const mockGetInboxCleanupState = jest.fn();
const mockWriteAsStringAsync = jest.fn();
const mockReadAsStringAsync = jest.fn();
const mockReadDirectoryAsync = jest.fn();
const mockMakeDirectoryAsync = jest.fn();

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///documents/',
  getInfoAsync: (...args: unknown[]) => mockGetInfoAsync(...args),
  deleteAsync: (...args: unknown[]) => mockDeleteAsync(...args),
  copyAsync: (...args: unknown[]) => mockCopyAsync(...args),
  moveAsync: (...args: unknown[]) => mockMoveAsync(...args),
  getFreeDiskStorageAsync: (...args: unknown[]) => mockGetFreeDiskStorageAsync(...args),
  readDirectoryAsync: (...args: unknown[]) => mockReadDirectoryAsync(...args),
  writeAsStringAsync: (...args: unknown[]) => mockWriteAsStringAsync(...args),
  readAsStringAsync: (...args: unknown[]) => mockReadAsStringAsync(...args),
  makeDirectoryAsync: (...args: unknown[]) => mockMakeDirectoryAsync(...args),
}));

jest.mock('expo-audio', () => ({
  AudioModule: {
    AudioRecorder: function AudioRecorderMock(...args: unknown[]) {
      return mockAudioRecorderConstructor(...args);
    },
  },
  requestRecordingPermissionsAsync: (...args: unknown[]) => mockRequestRecordingPermissions(...args),
  setAudioModeAsync: (...args: unknown[]) => mockSetAudioMode(...args),
  RecordingPresets: {
    HIGH_QUALITY: { android: {}, ios: {}, web: {} },
  },
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        supabaseAnonKey: 'anon-key',
        supabaseUrl: 'https://example.supabase.co',
        customGptEndpoint: 'https://example.supabase.co/functions/v1/openai-proxy',
      },
    },
  },
}));

jest.mock('../src/services/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      refreshSession: (...args: unknown[]) => mockRefreshSession(...args),
    },
  },
}));

jest.mock('../src/services/localStorage', () => ({
  LocalStorage: {
    addPendingVoiceClipToInbox: (...args: unknown[]) => mockAddPendingVoiceClipToInbox(...args),
    getPendingVoiceTranscriptionCleanupState: (...args: unknown[]) => mockGetQueueCleanupState(...args),
    getPendingVoiceClipInboxCleanupState: (...args: unknown[]) => mockGetInboxCleanupState(...args),
  },
}));

jest.mock('../src/utils/network', () => ({
  isOnline: (...args: unknown[]) => mockIsOnline(...args),
}));

jest.mock('../src/services/logger', () => ({
  logEvent: jest.fn(),
  logError: jest.fn(),
}));

global.fetch = mockFetch as any;

import {
  abortActiveTranscriptions,
  abortActiveTranscriptionsForUser,
  cleanupRecording,
  cleanupStalePendingClips,
  discardPendingClip,
  discardPendingClipStrict,
  getPendingVoiceClipFileManifests,
  getPendingVoiceClipFileManifestsStrict,
  getRecordingStatus,
  migrateLegacyPendingClipFiles,
  migrateLegacyPendingClipUri,
  MIN_VOICE_RECORDING_FREE_BYTES,
  removePendingVoiceClipFileManifests,
  removePendingVoiceClipFileManifestsStrict,
  startRecording,
  stopRecording,
  transcribeAudio,
} from '../src/utils/voiceRecording';

const clip = {
  id: 'voice-1234-test',
  userId: 'user-1',
  uri: 'file:///recording.m4a',
  sizeBytes: 1234,
  durationMs: 10_000,
};
const target = { surface: 'write' as const, key: 'active' };
const auth = { expectedUserId: 'user-1', accessToken: 'jwt-token' };

describe('voice recording transcription', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockIsOnline.mockResolvedValue(true);
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' }, access_token: 'jwt-token' } },
    });
    mockRefreshSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' }, access_token: 'jwt-token' } },
    });
    mockDeleteAsync.mockResolvedValue(undefined);
    mockCopyAsync.mockResolvedValue(undefined);
    mockMoveAsync.mockResolvedValue(undefined);
    mockGetFreeDiskStorageAsync.mockResolvedValue(1024 * 1024 * 1024);
    mockRequestRecordingPermissions.mockResolvedValue({ granted: true, status: 'granted' });
    mockSetAudioMode.mockResolvedValue(undefined);
    mockAddPendingVoiceClipToInbox.mockResolvedValue(undefined);
    mockGetQueueCleanupState.mockResolvedValue({ canonical: [], attributionEvidence: [] });
    mockGetInboxCleanupState.mockResolvedValue({ canonical: [], attributionEvidence: [] });
    mockWriteAsStringAsync.mockResolvedValue(undefined);
    mockReadAsStringAsync.mockResolvedValue('{}');
    mockReadDirectoryAsync.mockResolvedValue([]);
    mockMakeDirectoryAsync.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await cleanupRecording();
    jest.useRealTimers();
  });

  it('does not upload when the local audio file never becomes readable', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: false, isDirectory: false });

    const resultPromise = transcribeAudio(clip, auth);
    await jest.runAllTimersAsync();

    await expect(resultPromise).resolves.toEqual({
      ok: false,
      code: 'audio_unavailable',
      retryable: true,
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('prepares and verifies the pending directory before native recording starts', async () => {
    let finishCleanup!: (names: string[]) => void;
    mockReadDirectoryAsync.mockImplementationOnce(() => new Promise((resolve) => {
      finishCleanup = resolve;
    }));
    const recorder = {
      prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
      record: jest.fn(),
      stop: jest.fn().mockResolvedValue(undefined),
      release: jest.fn(),
    };
    mockAudioRecorderConstructor.mockReturnValue(recorder);

    const result = startRecording();
    await Promise.resolve();
    await Promise.resolve();
    expect(mockGetFreeDiskStorageAsync).not.toHaveBeenCalled();
    expect(mockRequestRecordingPermissions).not.toHaveBeenCalled();

    finishCleanup([]);
    await expect(result).resolves.toEqual({ ok: true, value: undefined });
    expect(mockGetFreeDiskStorageAsync.mock.invocationCallOrder[0])
      .toBeLessThan(mockRequestRecordingPermissions.mock.invocationCallOrder[0]);
    const directoryCreateOrder = mockMakeDirectoryAsync.mock.invocationCallOrder[0];
    const confirmedDirectoryReadOrder = mockReadDirectoryAsync.mock.calls
      .map((args, index) => ({ args, order: mockReadDirectoryAsync.mock.invocationCallOrder[index] }))
      .find(({ args, order }) => args[0] === 'file:///documents/voice_pending/'
        && order > directoryCreateOrder)?.order;
    expect(mockMakeDirectoryAsync).toHaveBeenCalledWith(
      'file:///documents/voice_pending/',
      { intermediates: true },
    );
    expect(confirmedDirectoryReadOrder).toBeDefined();
    expect(directoryCreateOrder).toBeLessThan(confirmedDirectoryReadOrder!);
    expect(confirmedDirectoryReadOrder!).toBeLessThan(recorder.record.mock.invocationCallOrder[0]);
    await cleanupRecording();
  });

  it('blocks recording before permission/native setup when free storage is below the safety floor', async () => {
    mockGetFreeDiskStorageAsync.mockResolvedValue(MIN_VOICE_RECORDING_FREE_BYTES - 1);

    await expect(startRecording()).resolves.toEqual({
      ok: false,
      code: 'insufficient_storage',
      retryable: false,
    });
    expect(mockRequestRecordingPermissions).not.toHaveBeenCalled();
    expect(mockAudioRecorderConstructor).not.toHaveBeenCalled();
  });

  it('classifies ENOSPC during native preparation as insufficient storage', async () => {
    const recorder = {
      prepareToRecordAsync: jest.fn().mockRejectedValue(Object.assign(new Error('prepare failed'), { code: 'ENOSPC' })),
      record: jest.fn(),
      release: jest.fn(),
    };
    mockAudioRecorderConstructor.mockReturnValue(recorder);

    await expect(startRecording()).resolves.toEqual({
      ok: false,
      code: 'insufficient_storage',
      retryable: false,
    });
    expect(recorder.release).toHaveBeenCalledTimes(1);
  });

  it('releases a partially prepared native recorder when start fails', async () => {
    const recorder = {
      prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
      record: jest.fn(() => { throw new Error('native start failed'); }),
      release: jest.fn(),
    };
    mockAudioRecorderConstructor.mockReturnValue(recorder);

    await expect(startRecording()).resolves.toEqual({
      ok: false,
      code: 'recording_failed',
      retryable: true,
    });
    expect(recorder.release).toHaveBeenCalledTimes(1);
  });

  it('rejects a second start synchronously while the first recorder is still preparing', async () => {
    let resolveSession!: (value: unknown) => void;
    mockGetSession.mockImplementationOnce(() => new Promise((resolve) => {
      resolveSession = resolve;
    }));
    const recorder = {
      prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
      record: jest.fn(),
      release: jest.fn(),
    };
    mockAudioRecorderConstructor.mockReturnValue(recorder);

    const firstStart = startRecording();
    await expect(startRecording()).resolves.toEqual({
      ok: false,
      code: 'recording_in_progress',
      retryable: false,
    });
    resolveSession({ data: { session: { user: { id: 'user-1' }, access_token: 'jwt-token' } } });
    await expect(firstStart).resolves.toEqual({ ok: true, value: undefined });
    await stopRecording(target);
  });

  it('abandons native preparation if the authenticated owner changes before record starts', async () => {
    const recorder = {
      prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
      record: jest.fn(),
      release: jest.fn(),
    };
    mockAudioRecorderConstructor.mockReturnValue(recorder);
    mockGetSession
      .mockResolvedValueOnce({
        data: { session: { user: { id: 'user-1' }, access_token: 'user-1-token' } },
      })
      .mockResolvedValueOnce({
        data: { session: { user: { id: 'user-2' }, access_token: 'user-2-token' } },
      });

    await expect(startRecording()).resolves.toEqual({
      ok: false,
      code: 'unauthenticated',
      retryable: false,
    });
    expect(recorder.record).not.toHaveBeenCalled();
    expect(recorder.release).toHaveBeenCalledTimes(1);
  });

  it('cancels and releases a deferred native start when cleanup runs during preparation', async () => {
    let finishPreparation!: () => void;
    const recorder = {
      prepareToRecordAsync: jest.fn(() => new Promise<void>((resolve) => {
        finishPreparation = resolve;
      })),
      record: jest.fn(),
      release: jest.fn(),
    };
    mockAudioRecorderConstructor.mockReturnValue(recorder);

    const startPromise = startRecording();
    for (let index = 0; index < 20 && recorder.prepareToRecordAsync.mock.calls.length === 0; index += 1) {
      await Promise.resolve();
    }
    expect(recorder.prepareToRecordAsync).toHaveBeenCalledTimes(1);

    await cleanupRecording();
    finishPreparation();

    await expect(startPromise).resolves.toEqual({
      ok: false,
      code: 'audio_unavailable',
      retryable: true,
    });
    expect(recorder.record).not.toHaveBeenCalled();
    expect(recorder.release).toHaveBeenCalledTimes(1);
  });

  it('uses the finalized duration and moves the clip durably without doubling storage', async () => {
    const recorder = {
      uri: 'file:///cache/source.m4a',
      prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
      record: jest.fn(),
      stop: jest.fn().mockResolvedValue(undefined),
      getStatus: jest.fn()
        .mockReturnValueOnce({ isRecording: true, durationMillis: 100, url: 'file:///cache/source.m4a' })
        .mockReturnValueOnce({ isRecording: false, durationMillis: 1_200, url: 'file:///cache/source.m4a' }),
      release: jest.fn(),
    };
    mockAudioRecorderConstructor.mockReturnValue(recorder);
    mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: false, size: 1234 });

    await expect(startRecording()).resolves.toEqual({ ok: true, value: undefined });
    await expect(stopRecording(target)).resolves.toEqual({
      ok: true,
      value: expect.objectContaining({
        userId: 'user-1',
        uri: expect.stringMatching(/^file:\/\/\/documents\/voice_pending\/voice-.+\.m4a$/),
        sizeBytes: 1234,
        durationMs: 1_200,
      }),
    });
    expect(mockMoveAsync).toHaveBeenCalledWith(expect.objectContaining({
      from: 'file:///cache/source.m4a',
    }));
    expect(mockCopyAsync).not.toHaveBeenCalled();
    expect(mockAddPendingVoiceClipToInbox).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-1',
      target,
    }));
    expect(mockWriteAsStringAsync).toHaveBeenCalledWith(
      expect.stringMatching(/voice-.+\.inbox\.json$/),
      expect.any(String),
    );
    expect(recorder.release).toHaveBeenCalledTimes(1);
  });

  it('moves a legacy root clip into the backup-excluded pending directory', async () => {
    mockGetInfoAsync
      .mockResolvedValueOnce({ exists: false, isDirectory: false })
      .mockResolvedValueOnce({ exists: true, isDirectory: false, size: 1234 })
      .mockResolvedValueOnce({ exists: true, isDirectory: false, size: 1234 });

    await expect(migrateLegacyPendingClipUri(
      'file:///documents/voice-1234-legacy.m4a',
    )).resolves.toBe(
      'file:///documents/voice_pending/voice-1234-legacy.m4a',
    );

    expect(mockMoveAsync).toHaveBeenCalledWith({
      from: 'file:///documents/voice-1234-legacy.m4a',
      to: 'file:///documents/voice_pending/voice-1234-legacy.m4a',
    });
  });

  it('sweeps orphan legacy root clips without relying on queue metadata', async () => {
    mockReadDirectoryAsync.mockImplementation(async (uri: string) => (
      uri === 'file:///documents/'
        ? ['voice-1234-orphan.m4a', 'voice-1234-orphan.inbox.json', 'notes.json']
        : []
    ));
    mockGetInfoAsync
      .mockResolvedValueOnce({ exists: false, isDirectory: false })
      .mockResolvedValueOnce({ exists: true, isDirectory: false, size: 1234 })
      .mockResolvedValueOnce({ exists: true, isDirectory: false, size: 1234 });

    await migrateLegacyPendingClipFiles();

    expect(mockMoveAsync).toHaveBeenCalledTimes(1);
    expect(mockMoveAsync).toHaveBeenCalledWith({
      from: 'file:///documents/voice-1234-orphan.m4a',
      to: 'file:///documents/voice_pending/voice-1234-orphan.m4a',
    });
  });

  it('repairs a legacy queue URI when a previous run already moved the file', async () => {
    mockGetInfoAsync
      .mockResolvedValueOnce({ exists: true, isDirectory: false, size: 1234, md5: 'same' })
      .mockResolvedValueOnce({ exists: true, isDirectory: false, size: 1234, md5: 'same' });

    await expect(migrateLegacyPendingClipUri(
      'file:///documents/voice-1234-legacy.m4a',
    )).resolves.toBe(
      'file:///documents/voice_pending/voice-1234-legacy.m4a',
    );

    expect(mockMoveAsync).not.toHaveBeenCalled();
    expect(mockDeleteAsync).toHaveBeenCalledWith(
      'file:///documents/voice-1234-legacy.m4a',
      { idempotent: true },
    );
  });

  it('preserves the authoritative source and replaces a partial legacy destination', async () => {
    mockGetInfoAsync
      .mockResolvedValueOnce({ exists: true, isDirectory: false, size: 400, md5: 'partial' })
      .mockResolvedValueOnce({ exists: true, isDirectory: false, size: 1234, md5: 'source' })
      .mockResolvedValueOnce({ exists: true, isDirectory: false, size: 1234, md5: 'source' })
      .mockResolvedValueOnce({ exists: true, isDirectory: false, size: 1234, md5: 'source' });

    await expect(migrateLegacyPendingClipUri(
      'file:///documents/voice-1234-legacy.m4a',
    )).resolves.toBe(
      'file:///documents/voice_pending/voice-1234-legacy.m4a',
    );

    expect(mockCopyAsync).toHaveBeenCalledWith({
      from: 'file:///documents/voice-1234-legacy.m4a',
      to: 'file:///documents/voice_pending/voice-1234-legacy.m4a.repair',
    });
    expect(mockDeleteAsync).toHaveBeenCalledWith(
      'file:///documents/voice_pending/voice-1234-legacy.m4a',
      { idempotent: true },
    );
    expect(mockMoveAsync).toHaveBeenCalledWith({
      from: 'file:///documents/voice_pending/voice-1234-legacy.m4a.repair',
      to: 'file:///documents/voice_pending/voice-1234-legacy.m4a',
    });
    expect(mockDeleteAsync).toHaveBeenCalledWith(
      'file:///documents/voice-1234-legacy.m4a',
      { idempotent: true },
    );
  });

  it('does not delete a legacy source when equal-sized destinations have different checksums', async () => {
    mockGetInfoAsync
      .mockResolvedValueOnce({ exists: true, isDirectory: false, size: 1234, md5: 'destination' })
      .mockResolvedValueOnce({ exists: true, isDirectory: false, size: 1234, md5: 'source' })
      .mockResolvedValueOnce({ exists: true, isDirectory: false, size: 1234, md5: 'source' })
      .mockResolvedValueOnce({ exists: true, isDirectory: false, size: 1234, md5: 'source' });

    await migrateLegacyPendingClipUri('file:///documents/voice-1234-legacy.m4a');

    expect(mockMoveAsync).toHaveBeenCalled();
    expect(mockDeleteAsync).toHaveBeenCalledWith(
      'file:///documents/voice-1234-legacy.m4a',
      { idempotent: true },
    );
  });

  it('retains the legacy source when repair-copy verification fails', async () => {
    mockGetInfoAsync
      .mockResolvedValueOnce({ exists: true, isDirectory: false, size: 400, md5: 'partial' })
      .mockResolvedValueOnce({ exists: true, isDirectory: false, size: 1234, md5: 'source' })
      .mockResolvedValueOnce({ exists: true, isDirectory: false, size: 600, md5: 'partial-copy' });

    await expect(migrateLegacyPendingClipUri(
      'file:///documents/voice-1234-legacy.m4a',
    )).resolves.toBe('file:///documents/voice-1234-legacy.m4a');

    expect(mockDeleteAsync).not.toHaveBeenCalledWith(
      'file:///documents/voice-1234-legacy.m4a',
      expect.anything(),
    );
  });

  it('retains the legacy source URI when source metadata cannot be verified', async () => {
    mockGetInfoAsync
      .mockResolvedValueOnce({ exists: true, isDirectory: false, size: 1234, md5: 'destination' })
      .mockRejectedValueOnce(new Error('source metadata unavailable'));

    await expect(migrateLegacyPendingClipUri(
      'file:///documents/voice-1234-legacy.m4a',
    )).resolves.toBe('file:///documents/voice-1234-legacy.m4a');

    expect(mockDeleteAsync).not.toHaveBeenCalled();
    expect(mockMoveAsync).not.toHaveBeenCalled();
  });

  it('keeps the moved destination when post-move verification fails transiently', async () => {
    const recorder = {
      uri: 'file:///cache/source.m4a',
      prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
      record: jest.fn(),
      stop: jest.fn().mockResolvedValue(undefined),
      getStatus: jest.fn()
        .mockReturnValueOnce({ isRecording: true, durationMillis: 1_200, url: 'file:///cache/source.m4a' })
        .mockReturnValueOnce({ isRecording: false, durationMillis: 1_200, url: 'file:///cache/source.m4a' }),
      release: jest.fn(),
    };
    mockAudioRecorderConstructor.mockReturnValue(recorder);
    mockGetInfoAsync
      .mockResolvedValueOnce({ exists: true, isDirectory: false, size: 1234 })
      .mockRejectedValue(new Error('metadata bridge temporarily unavailable'));

    await expect(startRecording()).resolves.toEqual({ ok: true, value: undefined });
    const stopPromise = stopRecording(target);
    await jest.runAllTimersAsync();

    await expect(stopPromise).resolves.toEqual({
      ok: true,
      value: expect.objectContaining({
        uri: expect.stringMatching(/^file:\/\/\/documents\/voice_pending\/voice-.+\.m4a$/),
        sizeBytes: 1234,
      }),
    });
    expect(mockMoveAsync).toHaveBeenCalledTimes(1);
    expect(mockCopyAsync).not.toHaveBeenCalled();
    expect(mockAddPendingVoiceClipToInbox).toHaveBeenCalledWith(expect.objectContaining({
      audioUri: expect.stringMatching(/^file:\/\/\/documents\/voice_pending\/voice-.+\.m4a$/),
    }));
  });

  it('falls back to verified copy when move is unavailable for a non-storage reason', async () => {
    const recorder = {
      uri: 'file:///cache/source.m4a',
      prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
      record: jest.fn(),
      stop: jest.fn().mockResolvedValue(undefined),
      getStatus: jest.fn()
        .mockReturnValueOnce({ isRecording: true, durationMillis: 1_200, url: 'file:///cache/source.m4a' })
        .mockReturnValueOnce({ isRecording: false, durationMillis: 1_200, url: 'file:///cache/source.m4a' }),
      release: jest.fn(),
    };
    mockAudioRecorderConstructor.mockReturnValue(recorder);
    mockMoveAsync.mockRejectedValueOnce(new Error('move not supported'));
    mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: false, size: 1234 });

    await expect(startRecording()).resolves.toEqual({ ok: true, value: undefined });
    await expect(stopRecording(target)).resolves.toEqual({ ok: true, value: expect.any(Object) });
    expect(mockCopyAsync).toHaveBeenCalledWith(expect.objectContaining({
      from: 'file:///cache/source.m4a',
    }));
    expect(mockDeleteAsync).toHaveBeenCalledWith('file:///cache/source.m4a', { idempotent: true });
  });

  it('salvages a readable partial clip when native stop throws ENOSPC', async () => {
    const recorder = {
      uri: 'file:///cache/partial.m4a',
      prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
      record: jest.fn(),
      stop: jest.fn().mockRejectedValue(Object.assign(new Error('No space left on device'), { code: 'ENOSPC' })),
      getStatus: jest.fn()
        .mockReturnValueOnce({ isRecording: true, durationMillis: 2_000, url: 'file:///cache/partial.m4a' })
        .mockReturnValueOnce({ isRecording: false, durationMillis: 2_000, url: 'file:///cache/partial.m4a' }),
      release: jest.fn(),
    };
    mockAudioRecorderConstructor.mockReturnValue(recorder);
    mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: false, size: 16000 });

    await expect(startRecording()).resolves.toEqual({ ok: true, value: undefined });
    await expect(stopRecording(target)).resolves.toEqual({
      ok: true,
      value: expect.objectContaining({ durationMs: 2_000, sizeBytes: 16000 }),
    });
    expect(mockAddPendingVoiceClipToInbox).toHaveBeenCalled();
  });

  it('keeps and manifests the source clip when move fails with ENOSPC', async () => {
    const recorder = {
      uri: 'file:///cache/source.m4a',
      prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
      record: jest.fn(),
      stop: jest.fn().mockResolvedValue(undefined),
      getStatus: jest.fn()
        .mockReturnValueOnce({ isRecording: true, durationMillis: 2_000, url: 'file:///cache/source.m4a' })
        .mockReturnValueOnce({ isRecording: false, durationMillis: 2_000, url: 'file:///cache/source.m4a' }),
      release: jest.fn(),
    };
    mockAudioRecorderConstructor.mockReturnValue(recorder);
    mockMoveAsync.mockRejectedValueOnce(Object.assign(new Error('disk full'), { code: 'ENOSPC' }));
    mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: false, size: 16000 });

    await expect(startRecording()).resolves.toEqual({ ok: true, value: undefined });
    await expect(stopRecording(target)).resolves.toEqual({
      ok: true,
      value: expect.objectContaining({ uri: 'file:///cache/source.m4a' }),
    });
    expect(mockCopyAsync).not.toHaveBeenCalled();
    expect(mockDeleteAsync).not.toHaveBeenCalledWith('file:///cache/source.m4a', expect.anything());
    expect(mockAddPendingVoiceClipToInbox).toHaveBeenCalledWith(expect.objectContaining({
      audioUri: 'file:///cache/source.m4a',
    }));
  });

  it('inspects and returns the source clip if the pending directory becomes unavailable after start', async () => {
    const recorder = {
      uri: 'file:///cache/source.m4a',
      prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
      record: jest.fn(),
      stop: jest.fn().mockResolvedValue(undefined),
      getStatus: jest.fn()
        .mockReturnValueOnce({ isRecording: true, durationMillis: 2_000, url: 'file:///cache/source.m4a' })
        .mockReturnValueOnce({ isRecording: false, durationMillis: 2_000, url: 'file:///cache/source.m4a' }),
      release: jest.fn(),
    };
    mockAudioRecorderConstructor.mockReturnValue(recorder);
    mockMakeDirectoryAsync
      .mockResolvedValueOnce(undefined)
      .mockRejectedValue(new Error('filesystem bridge unavailable'));
    mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: false, size: 16000 });

    await expect(startRecording()).resolves.toEqual({ ok: true, value: undefined });
    await expect(stopRecording(target)).resolves.toEqual({
      ok: true,
      value: expect.objectContaining({ uri: 'file:///cache/source.m4a', sizeBytes: 16000 }),
    });
    expect(mockMoveAsync).not.toHaveBeenCalled();
    expect(mockAddPendingVoiceClipToInbox).toHaveBeenCalledWith(expect.objectContaining({
      audioUri: 'file:///cache/source.m4a',
      target,
    }));
    expect(mockDeleteAsync).not.toHaveBeenCalledWith('file:///cache/source.m4a', expect.anything());
  });

  it('keeps and manifests the source when fallback copy runs out of space', async () => {
    const recorder = {
      uri: 'file:///cache/source.m4a',
      prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
      record: jest.fn(),
      stop: jest.fn().mockResolvedValue(undefined),
      getStatus: jest.fn()
        .mockReturnValueOnce({ isRecording: true, durationMillis: 2_000, url: 'file:///cache/source.m4a' })
        .mockReturnValueOnce({ isRecording: false, durationMillis: 2_000, url: 'file:///cache/source.m4a' }),
      release: jest.fn(),
    };
    mockAudioRecorderConstructor.mockReturnValue(recorder);
    mockMoveAsync.mockRejectedValueOnce(new Error('rename unavailable'));
    mockCopyAsync.mockRejectedValueOnce(Object.assign(new Error('NSCocoaErrorDomain Code=640'), {
      code: 640,
    }));
    mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: false, size: 16000 });

    await expect(startRecording()).resolves.toEqual({ ok: true, value: undefined });
    await expect(stopRecording(target)).resolves.toEqual({
      ok: true,
      value: expect.objectContaining({ uri: 'file:///cache/source.m4a' }),
    });
    expect(mockCopyAsync).toHaveBeenCalled();
    expect(mockDeleteAsync).not.toHaveBeenCalledWith('file:///cache/source.m4a', expect.anything());
  });

  it('surfaces native recorder error events so the UI can stop and salvage once', async () => {
    let statusListener!: (status: unknown) => void;
    const recorder = {
      uri: 'file:///cache/source.m4a',
      addListener: jest.fn((_event, listener) => {
        statusListener = listener;
        return { remove: jest.fn() };
      }),
      prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
      record: jest.fn(),
      stop: jest.fn().mockResolvedValue(undefined),
      getStatus: jest.fn(() => ({
        isRecording: true,
        durationMillis: 2_000,
        url: 'file:///cache/source.m4a',
      })),
      release: jest.fn(),
    };
    mockAudioRecorderConstructor.mockReturnValue(recorder);
    mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: false, size: 16000 });

    await expect(startRecording()).resolves.toEqual({ ok: true, value: undefined });
    statusListener({ hasError: true, error: 'An unknown recording error occurred', url: null });

    await expect(getRecordingStatus()).resolves.toEqual(expect.objectContaining({
      isRecording: false,
      duration: 2_000,
      hasError: true,
      error: 'An unknown recording error occurred',
    }));
    await expect(stopRecording(target)).resolves.toEqual({ ok: true, value: expect.any(Object) });
  });

  it('salvages a substantial native-error clip even when the platform resets duration to zero', async () => {
    let statusListener!: (status: unknown) => void;
    const recorder = {
      uri: 'file:///cache/partial.m4a',
      addListener: jest.fn((_event, listener) => {
        statusListener = listener;
        return { remove: jest.fn() };
      }),
      prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
      record: jest.fn(),
      stop: jest.fn().mockResolvedValue(undefined),
      getStatus: jest.fn(() => ({
        isRecording: false,
        durationMillis: 0,
        url: 'file:///cache/partial.m4a',
      })),
      release: jest.fn(),
    };
    mockAudioRecorderConstructor.mockReturnValue(recorder);
    mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: false, size: 16_000 });

    await expect(startRecording()).resolves.toEqual({ ok: true, value: undefined });
    statusListener({ hasError: true, error: 'encoder failed', url: null });

    await expect(stopRecording(target)).resolves.toEqual({
      ok: true,
      value: expect.objectContaining({ durationMs: null, sizeBytes: 16_000 }),
    });
  });

  it('keeps the clip live when both inbox manifests fail because storage is full', async () => {
    const recorder = {
      uri: 'file:///cache/source.m4a',
      prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
      record: jest.fn(),
      stop: jest.fn().mockResolvedValue(undefined),
      getStatus: jest.fn()
        .mockReturnValueOnce({ isRecording: true, durationMillis: 2_000, url: 'file:///cache/source.m4a' })
        .mockReturnValueOnce({ isRecording: false, durationMillis: 2_000, url: 'file:///cache/source.m4a' }),
      release: jest.fn(),
    };
    mockAudioRecorderConstructor.mockReturnValue(recorder);
    mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: false, size: 16000 });
    const fullError = Object.assign(new Error('database or disk is full'), { code: 'SQLITE_FULL' });
    mockWriteAsStringAsync.mockRejectedValueOnce(fullError);
    mockAddPendingVoiceClipToInbox.mockRejectedValueOnce(fullError);

    await expect(startRecording()).resolves.toEqual({ ok: true, value: undefined });
    const result = await stopRecording(target);
    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({
        uri: expect.stringMatching(/^file:\/\/\/documents\/voice_pending\/voice-.+\.m4a$/),
      }),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      await expect(getPendingVoiceClipFileManifests()).resolves.toContainEqual(expect.objectContaining({
        id: result.value.id,
        audioUri: result.value.uri,
        target,
      }));
      await removePendingVoiceClipFileManifests([result.value.id]);
    }
    expect(mockDeleteAsync).not.toHaveBeenCalledWith(
      expect.stringMatching(/^file:\/\/\/documents\/voice_pending\/voice-.+\.m4a$/),
      expect.anything(),
    );
  });

  it('returns the live clip when both inbox manifests fail for a generic bridge error', async () => {
    const recorder = {
      uri: 'file:///cache/source.m4a',
      prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
      record: jest.fn(),
      stop: jest.fn().mockResolvedValue(undefined),
      getStatus: jest.fn()
        .mockReturnValueOnce({ isRecording: true, durationMillis: 2_000, url: 'file:///cache/source.m4a' })
        .mockReturnValueOnce({ isRecording: false, durationMillis: 2_000, url: 'file:///cache/source.m4a' }),
      release: jest.fn(),
    };
    mockAudioRecorderConstructor.mockReturnValue(recorder);
    mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: false, size: 16000 });
    mockWriteAsStringAsync.mockRejectedValueOnce(new Error('filesystem bridge unavailable'));
    mockAddPendingVoiceClipToInbox.mockRejectedValueOnce(new Error('AsyncStorage bridge unavailable'));

    await expect(startRecording()).resolves.toEqual({ ok: true, value: undefined });
    const result = await stopRecording(target);

    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({
        uri: expect.stringMatching(/^file:\/\/\/documents\/voice_pending\/voice-.+\.m4a$/),
      }),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      await expect(getPendingVoiceClipFileManifests()).resolves.toContainEqual(expect.objectContaining({
        id: result.value.id,
        audioUri: result.value.uri,
        target,
      }));
      await removePendingVoiceClipFileManifests([result.value.id]);
    }
    expect(mockDeleteAsync).not.toHaveBeenCalledWith(
      expect.stringMatching(/^file:\/\/\/documents\/voice_pending\/voice-.+\.m4a$/),
      expect.anything(),
    );
  });

  it('transcribes a readable file without deleting the retryable clip', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: false, size: 1234 });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ text: 'long spoken note' }),
    });

    await expect(transcribeAudio(clip, auth)).resolves.toEqual({ ok: true, value: 'long spoken note' });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockDeleteAsync).not.toHaveBeenCalled();
  });

  it('rejects a cached subtitle hallucination before it can reach dream text', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: false, size: 1234 });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ text: 'Υπότιτλοι AUTHORWAVE', cached: true }),
    });

    await expect(transcribeAudio({ ...clip, durationMs: 180_000 }, auth)).resolves.toEqual({
      ok: false,
      code: 'low_confidence_transcript',
      retryable: false,
    });
    expect(mockDeleteAsync).not.toHaveBeenCalled();
  });

  it('keeps the clip after a transient error so it can be retried', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: false, size: 1234 });
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ code: 'SERVICE_UNAVAILABLE' }),
    });

    const resultPromise = transcribeAudio(clip, auth);
    await jest.runAllTimersAsync();

    await expect(resultPromise).resolves.toEqual({
      ok: false,
      code: 'service_unavailable',
      retryable: true,
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockDeleteAsync).not.toHaveBeenCalled();
  });

  it('returns a lease-aware 409 delay to the durable queue without an immediate retry', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: false, size: 1234 });
    mockFetch.mockResolvedValue({
      ok: false,
      status: 409,
      headers: { get: (name: string) => (name === 'Retry-After' ? '240' : null) },
      json: async () => ({ code: 'TRANSCRIPTION_IN_PROGRESS', retry_after_ms: 240_000 }),
    });

    await expect(transcribeAudio(clip, auth)).resolves.toEqual({
      ok: false,
      code: 'transcription_in_progress',
      retryable: true,
      retryAfterMs: 240_000,
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('refreshes an expired session once before retrying the same clip', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: false, size: 1234 });
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ code: 'UNAUTHENTICATED' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ text: 'recovered transcript' }) });

    await expect(transcribeAudio(clip, auth)).resolves.toEqual({ ok: true, value: 'recovered transcript' });
    expect(mockRefreshSession).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('refuses to pair a saved clip with a newly signed-in account token', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: false, size: 1234 });
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-2' }, access_token: 'user-2-token' } },
    });

    await expect(transcribeAudio(clip, auth)).resolves.toEqual({
      ok: false,
      code: 'unauthenticated',
      retryable: false,
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('cancels the pre-fetch gap when logout happens before a controller exists', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: false, size: 1234 });
    let resolveSession!: (value: unknown) => void;
    mockGetSession.mockImplementationOnce(() => new Promise((resolve) => {
      resolveSession = resolve;
    }));

    const resultPromise = transcribeAudio(clip, auth);
    for (let index = 0; index < 20 && mockGetSession.mock.calls.length === 0; index += 1) {
      await Promise.resolve();
    }
    abortActiveTranscriptions();
    resolveSession({
      data: { session: { user: { id: 'user-1' }, access_token: 'jwt-token' } },
    });

    await expect(resultPromise).resolves.toEqual({
      ok: false,
      code: 'unauthenticated',
      retryable: false,
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does not cancel another owner upload when account cleanup is scoped', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: false, size: 1234 });
    let resolveSession!: (value: unknown) => void;
    mockGetSession.mockImplementationOnce(() => new Promise((resolve) => {
      resolveSession = resolve;
    }));
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ text: 'owner one remains active' }),
    });

    const resultPromise = transcribeAudio(clip, auth);
    for (let index = 0; index < 20 && mockGetSession.mock.calls.length === 0; index += 1) {
      await Promise.resolve();
    }
    abortActiveTranscriptionsForUser('user-2');
    resolveSession({
      data: { session: { user: { id: 'user-1' }, access_token: 'jwt-token' } },
    });

    await expect(resultPromise).resolves.toEqual({ ok: true, value: 'owner one remains active' });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('deletes a pending clip only when the user discards it', async () => {
    await discardPendingClip(clip);
    expect(mockDeleteAsync).toHaveBeenCalledWith(clip.uri, { idempotent: true });
  });

  it('propagates strict deletion failures and requires absence verification', async () => {
    mockDeleteAsync.mockRejectedValueOnce(new Error('native delete failed'));

    await expect(discardPendingClipStrict(clip)).rejects.toThrow('voice_clip_delete_failed');
    expect(mockGetInfoAsync).not.toHaveBeenCalled();
  });

  it('fails strict deletion when the file still exists after deleteAsync resolves', async () => {
    mockGetInfoAsync.mockResolvedValueOnce({ exists: true, isDirectory: false, size: 1234 });

    await expect(discardPendingClipStrict(clip)).rejects.toThrow('voice_clip_delete_failed');
    expect(mockDeleteAsync).toHaveBeenCalledWith(clip.uri, { idempotent: true });
  });

  it('never stale-deletes audio that remains attributable to an intact queue snapshot', async () => {
    const protectedUri = 'file:///documents/voice_pending/voice-1234-protected.m4a';
    mockGetQueueCleanupState.mockResolvedValueOnce({
      canonical: [{
        id: 'voice-1234-protected',
        userId: 'user-1',
        audioUri: protectedUri,
        sizeBytes: 1234,
        durationMs: 10_000,
        target,
        status: 'deletion_pending',
        createdAt: '2026-08-01T00:00:00.000Z',
        nextAttemptAt: '2026-08-01T00:00:00.000Z',
        attemptCount: 0,
      }],
      attributionEvidence: [{
        id: 'voice-1234-protected',
        userId: 'user-1',
        audioUri: protectedUri,
        sizeBytes: 1234,
        durationMs: 10_000,
        target,
        status: 'deletion_pending',
        createdAt: '2026-08-01T00:00:00.000Z',
        nextAttemptAt: '2026-08-01T00:00:00.000Z',
        attemptCount: 0,
      }],
    });
    mockReadDirectoryAsync.mockImplementation(async (directory: string) =>
      directory.endsWith('/voice_pending/') ? ['voice-1234-protected.m4a'] : []);
    mockGetInfoAsync.mockResolvedValue({
      exists: true,
      isDirectory: false,
      size: 1234,
      modificationTime: 1,
    });

    await cleanupStalePendingClips();

    expect(mockDeleteAsync).not.toHaveBeenCalledWith(protectedUri, expect.anything());
  });

  it('stale-deletes only an old audio file with no queue, inbox, or sidecar attribution', async () => {
    const orphanUri = 'file:///documents/voice_pending/voice-1234-orphan.m4a';
    mockReadDirectoryAsync.mockImplementation(async (directory: string) =>
      directory.endsWith('/voice_pending/') ? ['voice-1234-orphan.m4a'] : []);
    mockGetInfoAsync.mockResolvedValue({
      exists: true,
      isDirectory: false,
      size: 1234,
      modificationTime: 1,
    });

    await cleanupStalePendingClips();

    expect(mockDeleteAsync).toHaveBeenCalledWith(orphanUri, { idempotent: true });
  });

  it('fails strict manifest discovery on a malformed sidecar', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: true });
    mockReadDirectoryAsync.mockImplementation(async (directory: string) =>
      directory.includes('voice_pending') ? ['voice-1234-test.inbox.json'] : []);
    mockReadAsStringAsync.mockResolvedValue('{broken-json');

    await expect(getPendingVoiceClipFileManifestsStrict()).rejects.toThrow();
  });

  it('propagates and verifies strict manifest deletion', async () => {
    mockDeleteAsync.mockRejectedValueOnce(new Error('sidecar delete failed'));
    await expect(removePendingVoiceClipFileManifestsStrict([clip.id])).rejects.toThrow(
      'sidecar delete failed',
    );

    mockDeleteAsync.mockResolvedValue(undefined);
    mockGetInfoAsync.mockResolvedValueOnce({ exists: true, isDirectory: false });
    await expect(removePendingVoiceClipFileManifestsStrict([clip.id])).rejects.toThrow(
      'voice_manifest_delete_unverified',
    );
  });
});
