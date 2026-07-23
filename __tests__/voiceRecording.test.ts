const mockGetInfoAsync = jest.fn();
const mockDeleteAsync = jest.fn();
const mockCopyAsync = jest.fn();
const mockGetSession = jest.fn();
const mockRefreshSession = jest.fn();
const mockFetch = jest.fn();
const mockIsOnline = jest.fn();

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///documents/',
  getInfoAsync: (...args: unknown[]) => mockGetInfoAsync(...args),
  deleteAsync: (...args: unknown[]) => mockDeleteAsync(...args),
  copyAsync: (...args: unknown[]) => mockCopyAsync(...args),
  readDirectoryAsync: jest.fn(),
}));

jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn(),
    setAudioModeAsync: jest.fn(),
    Recording: { createAsync: jest.fn() },
    RecordingOptionsPresets: { HIGH_QUALITY: {} },
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

jest.mock('../src/utils/network', () => ({
  isOnline: (...args: unknown[]) => mockIsOnline(...args),
}));

jest.mock('../src/services/logger', () => ({
  logEvent: jest.fn(),
  logError: jest.fn(),
}));

global.fetch = mockFetch as any;

import { discardPendingClip, transcribeAudio } from '../src/utils/voiceRecording';

const clip = {
  id: 'voice-1234-test',
  uri: 'file:///recording.m4a',
  sizeBytes: 1234,
  durationMs: 10_000,
};

describe('voice recording transcription', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockIsOnline.mockResolvedValue(true);
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'jwt-token' } } });
    mockRefreshSession.mockResolvedValue({ data: { session: { access_token: 'jwt-token' } } });
    mockDeleteAsync.mockResolvedValue(undefined);
    mockCopyAsync.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not upload when the local audio file never becomes readable', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: false, isDirectory: false });

    const resultPromise = transcribeAudio(clip);
    await jest.runAllTimersAsync();

    await expect(resultPromise).resolves.toEqual({
      ok: false,
      code: 'audio_unavailable',
      retryable: true,
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('transcribes a readable file without deleting the retryable clip', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: false, size: 1234 });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ text: 'long spoken note' }),
    });

    await expect(transcribeAudio(clip)).resolves.toEqual({ ok: true, value: 'long spoken note' });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockDeleteAsync).not.toHaveBeenCalled();
  });

  it('keeps the clip after a transient error so it can be retried', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: false, size: 1234 });
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ code: 'SERVICE_UNAVAILABLE' }),
    });

    const resultPromise = transcribeAudio(clip);
    await jest.runAllTimersAsync();

    await expect(resultPromise).resolves.toEqual({
      ok: false,
      code: 'service_unavailable',
      retryable: true,
    });
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockDeleteAsync).not.toHaveBeenCalled();
  });

  it('refreshes an expired session once before retrying the same clip', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: false, size: 1234 });
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ code: 'UNAUTHENTICATED' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ text: 'recovered transcript' }) });

    await expect(transcribeAudio(clip)).resolves.toEqual({ ok: true, value: 'recovered transcript' });
    expect(mockRefreshSession).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('deletes a pending clip only when the user discards it', async () => {
    await discardPendingClip(clip);
    expect(mockDeleteAsync).toHaveBeenCalledWith(clip.uri, { idempotent: true });
  });
});
