const mockGetInfoAsync = jest.fn();
const mockDeleteAsync = jest.fn();
const mockCopyAsync = jest.fn();
const mockGetSession = jest.fn();
const mockRefreshSession = jest.fn();
const mockFetch = jest.fn();

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///documents/',
  getInfoAsync: (...args: unknown[]) => mockGetInfoAsync(...args),
  deleteAsync: (...args: unknown[]) => mockDeleteAsync(...args),
  copyAsync: (...args: unknown[]) => mockCopyAsync(...args),
}));

jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn(),
    setAudioModeAsync: jest.fn(),
    Recording: {
      createAsync: jest.fn(),
    },
    RecordingOptionsPresets: {
      HIGH_QUALITY: {},
    },
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

jest.mock('../src/services/logger', () => ({
  logEvent: jest.fn(),
  logError: jest.fn(),
}));

global.fetch = mockFetch as any;

import { transcribeAudio } from '../src/utils/voiceRecording';

describe('voice recording transcription', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
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

    const resultPromise = transcribeAudio('file:///missing.m4a');
    await jest.runAllTimersAsync();

    await expect(resultPromise).resolves.toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('waits for the local audio file before uploading', async () => {
    let infoCalls = 0;
    mockGetInfoAsync.mockImplementation(async () => {
      infoCalls += 1;
      return infoCalls < 3
        ? { exists: false, isDirectory: false }
        : { exists: true, isDirectory: false, size: 1234 };
    });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ text: 'long spoken note' }),
      text: async () => JSON.stringify({ text: 'long spoken note' }),
    });

    const resultPromise = transcribeAudio('file:///recording.m4a');
    await jest.advanceTimersByTimeAsync(1000);

    await expect(resultPromise).resolves.toBe('long spoken note');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockDeleteAsync).toHaveBeenCalledWith('file:///recording.m4a', { idempotent: true });
  });
});
