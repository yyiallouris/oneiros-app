import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { logError, logEvent } from '../services/logger';
import { supabase } from '../services/supabaseClient';
import { isOnline } from './network';

const AUTH_REFRESH_TIMEOUT_MS = 20_000;
export const TRANSCRIPTION_ATTEMPT_TIMEOUT_MS = 90_000;
export const MAX_TRANSCRIPTION_ATTEMPTS = 3;
/** Upper bound for one transcribeAudio call including retries/backoff (not wall-clock exact). */
export const TRANSCRIPTION_CLIENT_BUDGET_MS =
  MAX_TRANSCRIPTION_ATTEMPTS * TRANSCRIPTION_ATTEMPT_TIMEOUT_MS + 60_000;
const MAX_AUDIO_FILE_BYTES = 20 * 1024 * 1024;
const MAX_PENDING_CLIP_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const AUDIO_FILE_READY_RETRIES = 12;
const STOP_AUDIO_FILE_READY_RETRIES = 4;
const AUDIO_FILE_READY_DELAY_MS = 250;
const RETRY_BASE_DELAY_MS = 800;

export type VoiceErrorCode =
  | 'offline'
  | 'permission_denied'
  | 'recording_in_progress'
  | 'recording_failed'
  | 'audio_unavailable'
  | 'audio_too_large'
  | 'unauthenticated'
  | 'misconfigured'
  | 'rate_limited'
  | 'transcription_in_progress'
  | 'service_unavailable'
  | 'request_timeout'
  | 'invalid_audio'
  | 'unknown';

export type VoiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: VoiceErrorCode; retryable: boolean };

export interface PendingVoiceClip {
  id: string;
  uri: string;
  sizeBytes: number;
  durationMs: number | null;
}

export interface RecordingStatus {
  isRecording: boolean;
  duration: number;
  uri: string | null;
}

type AudioFileInfo = {
  exists: boolean;
  size: number | null;
  isDirectory: boolean | null;
  modificationTime: number | null;
};

let recording: Audio.Recording | null = null;
let isStoppingRecording = false;
let staleClipsCleaned = false;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

function createClipId(): string {
  return `voice-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function errorResult(code: VoiceErrorCode, retryable = false): VoiceResult<never> {
  return { ok: false, code, retryable };
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

async function getAudioFileInfo(uri: string): Promise<AudioFileInfo> {
  const info = await FileSystem.getInfoAsync(uri);
  return {
    exists: info.exists,
    size: (info as { size?: number }).size ?? null,
    isDirectory: (info as { isDirectory?: boolean }).isDirectory ?? null,
    modificationTime: (info as { modificationTime?: number }).modificationTime ?? null,
  };
}

async function waitForReadableAudioFile(
  uri: string,
  retries = AUDIO_FILE_READY_RETRIES,
): Promise<AudioFileInfo> {
  let lastInfo: AudioFileInfo = {
    exists: false,
    size: null,
    isDirectory: null,
    modificationTime: null,
  };

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    lastInfo = await getAudioFileInfo(uri);
    if (lastInfo.exists && !lastInfo.isDirectory && (lastInfo.size ?? 0) > 0) {
      return lastInfo;
    }
    await sleep(AUDIO_FILE_READY_DELAY_MS);
  }
  return lastInfo;
}

function audioExtensionFromUri(uri: string): string {
  const extension = uri.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase() ?? '';
  return /^[a-z0-9]{2,5}$/.test(extension) ? extension : 'm4a';
}

function mimeTypeForExtension(extension: string): string {
  switch (extension) {
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'aac':
      return 'audio/aac';
    case 'm4a':
    default:
      return 'audio/mp4';
  }
}

function retryDelay(attempt: number): number {
  const exponential = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
  const jitter = Math.floor(Math.random() * 300);
  return exponential + jitter;
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 429 || status >= 500;
}

function errorCodeForStatus(status: number, serverCode?: unknown): VoiceErrorCode {
  if (typeof serverCode === 'string') {
    switch (serverCode) {
      case 'AUDIO_TOO_LARGE':
        return 'audio_too_large';
      case 'INVALID_AUDIO':
        return 'invalid_audio';
      case 'UNAUTHENTICATED':
        return 'unauthenticated';
      case 'RATE_LIMITED':
        return 'rate_limited';
      case 'TRANSCRIPTION_IN_PROGRESS':
        return 'transcription_in_progress';
      case 'UPSTREAM_TIMEOUT':
        return 'request_timeout';
      default:
        break;
    }
  }
  if (status === 401 || status === 403) return 'unauthenticated';
  if (status === 413) return 'audio_too_large';
  if (status === 429) return 'rate_limited';
  if (status === 400 || status === 415 || status === 422) return 'invalid_audio';
  return 'service_unavailable';
}

async function getAccessTokenForFunctions(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) return data.session.access_token;

  try {
    const { data: refreshed } = await withTimeout(
      supabase.auth.refreshSession(),
      AUTH_REFRESH_TIMEOUT_MS,
      'supabase.auth.refreshSession',
    );
    return refreshed.session?.access_token ?? null;
  } catch (error) {
    logError('voice_transcription_session_refresh_failed', error);
    return null;
  }
}

function getConfig(key: string, fallback: string | null = null): string | null {
  try {
    const Constants = require('expo-constants').default;
    return Constants.expoConfig?.extra?.[key]
      ?? (Constants.manifest as { extra?: Record<string, string> } | undefined)?.extra?.[key]
      ?? fallback;
  } catch {
    return fallback;
  }
}

function getTranscriptionUrl(): string | null {
  const endpoint = getConfig('customGptEndpoint');
  if (endpoint?.includes('/functions/v1/')) {
    return endpoint.replace(/\/functions\/v1\/[^/]+/, '/functions/v1/whisper-transcription');
  }
  const supabaseUrl = getConfig('supabaseUrl');
  return supabaseUrl ? `${supabaseUrl}/functions/v1/whisper-transcription` : null;
}

async function refreshTokenAfterUnauthorized(): Promise<string | null> {
  try {
    await withTimeout(
      supabase.auth.refreshSession(),
      AUTH_REFRESH_TIMEOUT_MS,
      'supabase.auth.refreshSession_401',
    );
  } catch {
    // getSession below provides the last available session.
  }
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function requestRecordingPermissions(): Promise<VoiceResult<void>> {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      logEvent('voice_recording_permission_denied', { status });
      return errorResult('permission_denied');
    }
    return { ok: true, value: undefined };
  } catch (error) {
    logError('voice_recording_permission_error', error);
    return errorResult('recording_failed', true);
  }
}

export async function startRecording(): Promise<VoiceResult<void>> {
  if (recording || isStoppingRecording) return errorResult('recording_in_progress');

  const permission = await requestRecordingPermissions();
  if (!permission.ok) return permission;

  try {
    if (!staleClipsCleaned) {
      staleClipsCleaned = true;
      void cleanupStalePendingClips();
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    const { recording: created } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
    );
    recording = created;
    logEvent('voice_recording_started');
    return { ok: true, value: undefined };
  } catch (error) {
    logError('voice_recording_start_error', error);
    await resetAudioMode();
    return errorResult('recording_failed', true);
  }
}

async function resetAudioMode(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: false,
    });
  } catch (error) {
    logError('voice_recording_audio_mode_reset_error', error);
  }
}

export async function stopRecording(): Promise<VoiceResult<PendingVoiceClip>> {
  const activeRecording = recording;
  if (!activeRecording || isStoppingRecording) return errorResult('audio_unavailable', true);

  isStoppingRecording = true;
  try {
    const candidateUris = new Set<string>();
    const preStopUri = activeRecording.getURI();
    if (preStopUri) candidateUris.add(preStopUri);

    let durationMs: number | null = null;
    try {
      const status = await activeRecording.getStatusAsync();
      durationMs = status.durationMillis ?? null;
      if (status.uri) candidateUris.add(status.uri);
    } catch (error) {
      logError('voice_recording_pre_stop_status_error', error);
    }

    const stopStatus = await activeRecording.stopAndUnloadAsync();
    if (stopStatus.uri) candidateUris.add(stopStatus.uri);
    const postStopUri = activeRecording.getURI();
    if (postStopUri) candidateUris.add(postStopUri);
    recording = null;
    const documentDirectory = FileSystem.documentDirectory;
    if (!documentDirectory) return errorResult('audio_unavailable', true);

    for (const candidate of candidateUris) {
      const sourceInfo = await waitForReadableAudioFile(candidate, STOP_AUDIO_FILE_READY_RETRIES);
      if (!sourceInfo.exists || sourceInfo.isDirectory || !sourceInfo.size) continue;
      if (sourceInfo.size > MAX_AUDIO_FILE_BYTES) return errorResult('audio_too_large');

      const extension = audioExtensionFromUri(candidate);
      const clipId = createClipId();
      const destination = `${documentDirectory}${clipId}.${extension}`;
      try {
        await FileSystem.copyAsync({ from: candidate, to: destination });
        const copiedInfo = await waitForReadableAudioFile(destination);
        if (!copiedInfo.exists || copiedInfo.isDirectory || !copiedInfo.size) {
          await FileSystem.deleteAsync(destination, { idempotent: true });
          continue;
        }
        if (copiedInfo.size > MAX_AUDIO_FILE_BYTES) {
          await FileSystem.deleteAsync(destination, { idempotent: true });
          return errorResult('audio_too_large');
        }
        logEvent('voice_recording_finalized', {
          durationMs,
          sizeBytes: copiedInfo.size,
        });
        return {
          ok: true,
          value: { id: clipId, uri: destination, sizeBytes: copiedInfo.size, durationMs },
        };
      } catch (error) {
        logError('voice_recording_copy_error', error);
      }
    }
    return errorResult('audio_unavailable', true);
  } catch (error) {
    recording = null;
    logError('voice_recording_stop_error', error);
    return errorResult('recording_failed', true);
  } finally {
    isStoppingRecording = false;
    await resetAudioMode();
  }
}

export async function getRecordingStatus(): Promise<RecordingStatus> {
  if (!recording) return { isRecording: false, duration: 0, uri: null };
  try {
    const status = await recording.getStatusAsync();
    return {
      isRecording: status.isRecording ?? false,
      duration: status.durationMillis ?? 0,
      uri: null,
    };
  } catch (error) {
    logError('voice_recording_status_error', error);
    return { isRecording: false, duration: 0, uri: null };
  }
}

export async function discardPendingClip(clip: PendingVoiceClip | null): Promise<void> {
  if (!clip) return;
  try {
    await FileSystem.deleteAsync(clip.uri, { idempotent: true });
    logEvent('voice_recording_discarded', { sizeBytes: clip.sizeBytes });
  } catch (error) {
    logError('voice_recording_discard_error', error);
  }
}

export async function cleanupStalePendingClips(): Promise<void> {
  try {
    const documentDirectory = FileSystem.documentDirectory;
    if (!documentDirectory) return;
    const files = await FileSystem.readDirectoryAsync(documentDirectory);
    const now = Date.now();
    await Promise.all(files
      .filter((name) => /^voice-\d+-[a-z0-9]+\.[a-z0-9]{2,5}$/i.test(name))
      .map(async (name) => {
        const uri = `${documentDirectory}${name}`;
        const info = await getAudioFileInfo(uri);
        const modifiedAtMs = info.modificationTime ? info.modificationTime * 1000 : 0;
        if (info.exists && !info.isDirectory && modifiedAtMs > 0 && now - modifiedAtMs > MAX_PENDING_CLIP_AGE_MS) {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        }
      }));
  } catch (error) {
    logError('voice_recording_stale_cleanup_error', error);
  }
}

export async function transcribeAudio(clip: PendingVoiceClip): Promise<VoiceResult<string>> {
  const readable = await waitForReadableAudioFile(clip.uri);
  if (!readable.exists || readable.isDirectory || !readable.size) return errorResult('audio_unavailable', true);
  if (readable.size > MAX_AUDIO_FILE_BYTES) return errorResult('audio_too_large');
  if (!(await isOnline())) return errorResult('offline', true);

  const transcriptionUrl = getTranscriptionUrl();
  const anonKey = getConfig('supabaseAnonKey');
  if (!transcriptionUrl || !anonKey) return errorResult('misconfigured');

  let accessToken = await getAccessTokenForFunctions();
  if (!accessToken) return errorResult('unauthenticated', true);

  const extension = audioExtensionFromUri(clip.uri);
  for (let attempt = 1; attempt <= MAX_TRANSCRIPTION_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TRANSCRIPTION_ATTEMPT_TIMEOUT_MS);
    try {
      const postTranscription = (token: string) => {
        const formData = new FormData();
        formData.append('file', {
          uri: clip.uri,
          type: mimeTypeForExtension(extension),
          name: `${clip.id}.${extension}`,
        } as unknown as Blob);
        formData.append('model', 'whisper-1');
        formData.append('prompt', 'Transcribe in the same language as spoken. Do not translate.');
        return fetch(transcriptionUrl, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
          apikey: anonKey,
          'X-Idempotency-Key': clip.id,
        },
        body: formData,
        signal: controller.signal,
        });
      };
      let response = await postTranscription(accessToken);

      if (response.status === 401) {
        const refreshedToken = await refreshTokenAfterUnauthorized();
        if (!refreshedToken) return errorResult('unauthenticated', true);
        accessToken = refreshedToken;
        response = await postTranscription(accessToken);
      }

      const payload = await response.json().catch(() => ({}));
      if (response.ok && typeof payload.text === 'string' && payload.text.trim()) {
        logEvent('voice_transcription_success', { attempt, sizeBytes: readable.size });
        return { ok: true, value: payload.text.trim() };
      }

      const code = errorCodeForStatus(response.status, payload.code);
      const retryable = isRetryableStatus(response.status);
      logError('voice_transcription_response_error', new Error(code), {
        attempt,
        statusCode: response.status,
        retryable,
      });
      if (!retryable || attempt === MAX_TRANSCRIPTION_ATTEMPTS) return errorResult(code, retryable);
    } catch (error) {
      const isTimeout = error instanceof Error && (error.name === 'AbortError' || error.message.includes('timed out'));
      const code: VoiceErrorCode = isTimeout ? 'request_timeout' : 'service_unavailable';
      logError('voice_transcription_request_error', error, { attempt, code });
      if (attempt === MAX_TRANSCRIPTION_ATTEMPTS) return errorResult(code, true);
    } finally {
      clearTimeout(timeout);
    }

    await sleep(retryDelay(attempt));
  }
  return errorResult('unknown', true);
}

export async function cleanupRecording(): Promise<void> {
  const activeRecording = recording;
  recording = null;
  if (!activeRecording || isStoppingRecording) return;
  try {
    await activeRecording.stopAndUnloadAsync();
  } catch (error) {
    logError('voice_recording_cleanup_error', error);
  } finally {
    await resetAudioMode();
  }
}
