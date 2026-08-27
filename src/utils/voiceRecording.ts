import {
  AudioModule,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  type AudioRecorder,
  type RecordingOptions,
  type RecordingStatus as NativeRecordingStatus,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { logError, logEvent } from '../services/logger';
import { LocalStorage } from '../services/localStorage';
import { supabase } from '../services/supabaseClient';
import type { PendingVoiceClipInboxItem, VoiceTranscriptionTarget } from '../types/dream';
import { assessTranscriptQuality } from './transcriptionQuality';
import { isOnline } from './network';

const AUTH_REFRESH_TIMEOUT_MS = 20_000;
export const TRANSCRIPTION_ATTEMPT_TIMEOUT_MS = 180_000;
export const MAX_TRANSCRIPTION_ATTEMPTS = 2;
/** Upper bound for one transcribeAudio call including retries/backoff (not wall-clock exact). */
export const TRANSCRIPTION_CLIENT_BUDGET_MS =
  MAX_TRANSCRIPTION_ATTEMPTS * TRANSCRIPTION_ATTEMPT_TIMEOUT_MS + 60_000;
const MAX_AUDIO_FILE_BYTES = 20 * 1024 * 1024;
const MAX_PENDING_CLIP_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const AUDIO_FILE_READY_RETRIES = 12;
const STOP_AUDIO_FILE_READY_RETRIES = 4;
const AUDIO_FILE_READY_DELAY_MS = 250;
const RETRY_BASE_DELAY_MS = 800;
const MAX_SERVER_RETRY_DELAY_MS = 60_000;
const MIN_RECORDING_DURATION_MS = 500;
// AAC/container headers vary by platform. Requiring at least 8 KiB before
// salvaging a native-error clip is conservative at the configured 64 kbps.
const MIN_PARTIAL_SALVAGE_FILE_BYTES = 8 * 1024;
const MAX_RECORDING_DURATION_SECONDS = 5 * 60;
const VOICE_PENDING_DIRECTORY_NAME = 'voice_pending';
/**
 * The encoded five-minute clip is normally ~2.4 MB at 64 kbps. Keep a much
 * larger floor for recorder/container overhead, manifests, AsyncStorage, and
 * storage consumed by other apps while recording is in progress.
 */
export const MIN_VOICE_RECORDING_FREE_BYTES = 50 * 1024 * 1024;

const VOICE_RECORDING_OPTIONS: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  sampleRate: 16_000,
  numberOfChannels: 1,
  bitRate: 64_000,
  isMeteringEnabled: true,
  android: {
    ...RecordingPresets.HIGH_QUALITY.android,
    maxFileSize: MAX_AUDIO_FILE_BYTES,
  },
  web: {
    ...RecordingPresets.HIGH_QUALITY.web,
    bitsPerSecond: 64_000,
  },
};

export type VoiceErrorCode =
  | 'offline'
  | 'permission_denied'
  | 'recording_in_progress'
  | 'recording_failed'
  | 'insufficient_storage'
  | 'audio_unavailable'
  | 'audio_too_large'
  | 'unauthenticated'
  | 'misconfigured'
  | 'rate_limited'
  | 'transcription_in_progress'
  | 'service_unavailable'
  | 'request_timeout'
  | 'invalid_audio'
  | 'low_confidence_transcript'
  | 'unknown';

export type VoiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: VoiceErrorCode; retryable: boolean; retryAfterMs?: number };

export interface PendingVoiceClip {
  id: string;
  userId: string;
  uri: string;
  sizeBytes: number;
  durationMs: number | null;
}

export interface VoiceUploadAuthContext {
  expectedUserId: string;
  accessToken: string;
}

export interface RecordingStatus {
  isRecording: boolean;
  duration: number;
  uri: string | null;
  hasError: boolean;
  error: string | null;
}

type AudioFileInfo = {
  exists: boolean;
  size: number | null;
  isDirectory: boolean | null;
  modificationTime: number | null;
  md5: string | null;
};

let recording: AudioRecorder | null = null;
let recordingOwnerId: string | null = null;
let isStartingRecording = false;
let isStoppingRecording = false;
let staleClipsCleaned = false;
let recordingStatusSubscription: { remove(): void } | null = null;
let recordingNativeError: string | null = null;
let recordingEventUri: string | null = null;
let recordingLastDurationMs: number | null = null;
// cleanupRecording invalidates an in-flight async start even before the native
// recorder has been published to `recording`.
let recordingLifecycleGeneration = 0;
// Last-resort process-lifetime recovery when a completely full disk cannot
// accept even a tiny sidecar or AsyncStorage snapshot.
const volatilePendingClipInbox = new Map<string, PendingVoiceClipInboxItem>();
const activeUploadControllers = new Map<AbortController, string>();
const ownerUploadCancellationEpochs = new Map<string, number>();
let globalUploadCancellationEpoch = 0;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

function createClipId(): string {
  return `voice-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function errorResult(code: VoiceErrorCode, retryable = false, retryAfterMs?: number | null): VoiceResult<never> {
  return {
    ok: false,
    code,
    retryable,
    ...(retryAfterMs && retryAfterMs > 0 ? { retryAfterMs } : {}),
  };
}

class ClipInboxPersistenceError extends Error {
  readonly failures: unknown[];

  constructor(failures: unknown[]) {
    super('Failed to persist finalized voice clip manifest');
    this.name = 'ClipInboxPersistenceError';
    this.failures = failures;
  }
}

function storageErrorText(error: unknown, seen = new Set<unknown>()): string {
  if (error == null || seen.has(error)) return '';
  if (typeof error === 'string' || typeof error === 'number') return String(error);
  if (typeof error !== 'object') return '';
  seen.add(error);
  const record = error as Record<string, unknown>;
  const direct = ['name', 'message', 'code', 'domain', 'reason', 'localizedDescription']
    .map((key) => record[key])
    .filter((value) => typeof value === 'string' || typeof value === 'number')
    .join(' ');
  const nested = [record.cause, ...(Array.isArray(record.failures) ? record.failures : [])]
    .map((value) => storageErrorText(value, seen))
    .filter(Boolean)
    .join(' ');
  return `${direct} ${nested}`.trim();
}

function hasOutOfSpaceSignature(error: unknown): boolean {
  const text = storageErrorText(error).toLowerCase();
  return /\benospc\b|no space left|not enough (?:free )?(?:disk )?(?:space|storage)|insufficient (?:disk )?(?:space|storage)|disk (?:is )?full|storage (?:is )?full|quota exceeded|sqlite_full|database or disk is full|nsfilewriteoutofspace|cocoa(?:error)?domain[^\n]*\b640\b/.test(text);
}

function logVoiceOperationError(
  name: string,
  error: unknown,
  context?: Parameters<typeof logError>[2],
): void {
  const record = error && typeof error === 'object' ? error as Record<string, unknown> : null;
  const rawCode = record?.code;
  const safeCode = (typeof rawCode === 'string' && /^[A-Z0-9_-]{1,48}$/i.test(rawCode))
    || typeof rawCode === 'number'
    ? rawCode
    : undefined;
  const safeError = new Error(hasOutOfSpaceSignature(error)
    ? 'insufficient_storage'
    : 'voice_operation_failed');
  safeError.name = 'VoiceOperationError';
  if (safeCode != null) Object.assign(safeError, { code: safeCode });
  logError(name, safeError, context);
}

async function getAvailableDiskSpaceBytes(): Promise<number | null> {
  if (Platform.OS === 'web') return null;
  try {
    const freeBytes = await FileSystem.getFreeDiskStorageAsync();
    return Number.isFinite(freeBytes) && freeBytes >= 0 ? freeBytes : null;
  } catch (error) {
    // An unavailable measurement must not disable recording on an otherwise
    // healthy device. Every later filesystem boundary still classifies errors.
    logVoiceOperationError('voice_recording_storage_measurement_error', error);
    return null;
  }
}

export async function isInsufficientStorageFailure(error?: unknown): Promise<boolean> {
  if (hasOutOfSpaceSignature(error)) return true;
  const freeBytes = await getAvailableDiskSpaceBytes();
  return freeBytes != null && freeBytes < MIN_VOICE_RECORDING_FREE_BYTES;
}

function clearRecordingStatusListener(): void {
  try {
    recordingStatusSubscription?.remove();
  } catch (error) {
    logVoiceOperationError('voice_recording_status_listener_remove_error', error);
  }
  recordingStatusSubscription = null;
}

function attachRecordingStatusListener(recorder: AudioRecorder): void {
  clearRecordingStatusListener();
  recordingNativeError = null;
  recordingEventUri = null;
  recordingLastDurationMs = null;
  if (typeof recorder.addListener !== 'function') {
    logEvent('voice_recording_status_listener_unavailable');
    return;
  }
  recordingStatusSubscription = recorder.addListener(
    'recordingStatusUpdate',
    (status: NativeRecordingStatus) => {
      if (status.url) recordingEventUri = status.url;
      if (status.hasError) {
        recordingNativeError = status.error || 'native_recording_error';
        logEvent('voice_recording_native_error', {
          hasRecoverableUri: Boolean(status.url || recorder.uri),
        });
      }
    },
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

async function getAudioFileInfo(uri: string, includeMd5 = false): Promise<AudioFileInfo> {
  const info = await FileSystem.getInfoAsync(uri, includeMd5 ? { md5: true } : undefined);
  return {
    exists: info.exists,
    size: (info as { size?: number }).size ?? null,
    isDirectory: (info as { isDirectory?: boolean }).isDirectory ?? null,
    modificationTime: (info as { modificationTime?: number }).modificationTime ?? null,
    md5: (info as { md5?: string }).md5 ?? null,
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
    md5: null,
  };

  let lastError: unknown = null;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      lastInfo = await getAudioFileInfo(uri);
      lastError = null;
    } catch (error) {
      // Native filesystem metadata can briefly fail immediately after a move.
      // Keep polling instead of misclassifying a completed move as a failed one.
      lastError = error;
    }
    if (lastInfo.exists && !lastInfo.isDirectory && (lastInfo.size ?? 0) > 0) {
      return lastInfo;
    }
    await sleep(AUDIO_FILE_READY_DELAY_MS);
  }
  if (lastError) throw lastError;
  return lastInfo;
}

function audioExtensionFromUri(uri: string): string {
  const extension = uri.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase() ?? '';
  return /^[a-z0-9]{2,5}$/.test(extension) ? extension : Platform.OS === 'web' ? 'webm' : 'm4a';
}

function audioFilesEquivalent(source: AudioFileInfo, candidate: AudioFileInfo): boolean {
  if (!source.exists || source.isDirectory || !source.size) return false;
  if (!candidate.exists || candidate.isDirectory || candidate.size !== source.size) return false;
  return !source.md5 || !candidate.md5 || source.md5 === candidate.md5;
}

function mimeTypeForExtension(extension: string): string {
  switch (extension) {
    case 'mp4':
    case 'm4a':
      return 'audio/mp4';
    case 'mp3':
    case 'mpga':
    case 'mpeg':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'aac':
      return 'audio/aac';
    case 'webm':
      return 'audio/webm';
    default:
      return 'audio/mp4';
  }
}

function voicePendingDirectoryUri(): string | null {
  return FileSystem.documentDirectory
    ? `${FileSystem.documentDirectory}${VOICE_PENDING_DIRECTORY_NAME}/`
    : null;
}

async function ensureVoicePendingDirectory(): Promise<string | null> {
  const directory = voicePendingDirectoryUri();
  if (!directory) return null;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  // A successful mkdir can still be followed by a bridge/filesystem failure.
  // Reading the directory confirms the durable destination is usable before
  // native capture starts and consumes the storage safety margin.
  await FileSystem.readDirectoryAsync(directory);
  return directory;
}

export async function migrateLegacyPendingClipUri(uri: string): Promise<string> {
  const documentDirectory = FileSystem.documentDirectory;
  if (!documentDirectory || !uri.startsWith(documentDirectory)) return uri;
  const relativeName = uri.slice(documentDirectory.length);
  if (!/^voice-\d+-[a-z0-9]+\.[a-z0-9]{2,5}$/i.test(relativeName)) return uri;

  try {
    const pendingDirectory = await ensureVoicePendingDirectory();
    if (!pendingDirectory) return uri;
    const destination = `${pendingDirectory}${relativeName}`;
    const destinationInfo = await getAudioFileInfo(destination, true).catch(() => null);
    let sourceInfo: AudioFileInfo | null = null;
    if (destinationInfo?.exists && !destinationInfo.isDirectory) {
      // A bridge error is not proof that the source is absent. Let the outer
      // fail-safe retain the source URI and retry later in that case.
      sourceInfo = await getAudioFileInfo(uri, true);
      if (!sourceInfo.exists) {
        // A prior atomic move completed and only the queue snapshot was lost.
        return destinationInfo.size ? destination : uri;
      }
      if (sourceInfo.isDirectory || !sourceInfo.size) return uri;

      if (audioFilesEquivalent(sourceInfo, destinationInfo)) {
        // Both copies are equivalent. Delete the backup-eligible source only
        // after size equality and, when the native bridge provides them, MD5
        // equality have been established.
        await FileSystem.deleteAsync(uri, { idempotent: true });
        return destination;
      }

      // The queue still points at the root source, so it is authoritative. A
      // partial/corrupt destination must never cause that source to be deleted.
      // Build and verify a repair copy inside the no-backup directory first.
      // The source is retained until the final canonical destination has also
      // been verified, making every failure before that point retryable.
      const repairDestination = `${destination}.repair`;
      await FileSystem.deleteAsync(repairDestination, { idempotent: true });
      await FileSystem.copyAsync({ from: uri, to: repairDestination });
      const repairInfo = await getAudioFileInfo(repairDestination, true);
      if (!audioFilesEquivalent(sourceInfo, repairInfo)) {
        await FileSystem.deleteAsync(repairDestination, { idempotent: true }).catch(() => undefined);
        throw new Error('legacy_repair_verification_failed');
      }
      await FileSystem.deleteAsync(destination, { idempotent: true });
      await FileSystem.moveAsync({ from: repairDestination, to: destination });
      const repairedDestinationInfo = await getAudioFileInfo(destination, true);
      if (!audioFilesEquivalent(sourceInfo, repairedDestinationInfo)) {
        throw new Error('legacy_destination_verification_failed');
      }
      await FileSystem.deleteAsync(uri, { idempotent: true });
      logEvent('voice_recording_legacy_destination_replaced', {
        sourceSizeBytes: sourceInfo.size,
        destinationSizeBytes: destinationInfo.size ?? 0,
        checksumCompared: Boolean(sourceInfo.md5 && destinationInfo.md5),
      });
      return destination;
    } else if (destinationInfo?.exists) {
      // Never replace an unexpected directory with an audio file.
      return uri;
    }

    sourceInfo ??= await waitForReadableAudioFile(uri, STOP_AUDIO_FILE_READY_RETRIES);
    if (!sourceInfo.exists || sourceInfo.isDirectory || !sourceInfo.size) return uri;
    await FileSystem.moveAsync({ from: uri, to: destination });
    try {
      const movedInfo = await waitForReadableAudioFile(destination, STOP_AUDIO_FILE_READY_RETRIES);
      if (!movedInfo.exists || movedInfo.isDirectory || !movedInfo.size) {
        logEvent('voice_recording_legacy_move_verification_deferred', {
          sizeBytes: sourceInfo.size,
        });
      }
    } catch (error) {
      // moveAsync completed, so the deterministic destination is now canonical
      // even if the metadata bridge cannot immediately verify it.
      logVoiceOperationError('voice_recording_legacy_move_verification_error', error);
    }
    logEvent('voice_recording_legacy_clip_migrated', { sizeBytes: sourceInfo.size });
    return destination;
  } catch (error) {
    // Leave the queue pointing at the readable legacy source. A later queue read
    // retries migration; cleanup can still delete the original URI on logout.
    logVoiceOperationError('voice_recording_legacy_clip_migration_error', error);
    return uri;
  }
}

export async function migrateLegacyPendingClipFiles(): Promise<void> {
  const documentDirectory = FileSystem.documentDirectory;
  if (!documentDirectory) return;
  const names = await FileSystem.readDirectoryAsync(documentDirectory);
  await Promise.all(names
    // Sweep raw legacy audio independently of AsyncStorage. This also covers
    // orphan clips and keeps privacy repair possible while the queue is
    // temporarily unreadable; deterministic destinations let queue URIs heal
    // on a later successful read.
    .filter((name) => /^voice-\d+-[a-z0-9]+\.[a-z0-9]{2,5}$/i.test(name))
    .map((name) => migrateLegacyPendingClipUri(`${documentDirectory}${name}`)));
}

function inboxManifestUris(clipId: string): string[] {
  if (!FileSystem.documentDirectory) return [];
  return [
    `${FileSystem.documentDirectory}${VOICE_PENDING_DIRECTORY_NAME}/${clipId}.inbox.json`,
    // Legacy root location remains readable/removable for clips created before
    // the privacy-scoped directory migration.
    `${FileSystem.documentDirectory}${clipId}.inbox.json`,
  ];
}

function isInboxManifest(value: unknown): value is PendingVoiceClipInboxItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<PendingVoiceClipInboxItem>;
  return typeof item.id === 'string'
    && /^voice-\d+-[a-z0-9]+$/i.test(item.id)
    && typeof item.userId === 'string'
    && item.userId.length > 0
    && typeof item.audioUri === 'string'
    && item.audioUri.length > 0
    && typeof item.sizeBytes === 'number'
    && Number.isFinite(item.sizeBytes)
    && item.sizeBytes > 0
    && (item.durationMs == null || (typeof item.durationMs === 'number' && Number.isFinite(item.durationMs)))
    && !!item.target
    && ['write', 'dream-chat', 'interpretation-chat'].includes(item.target.surface)
    && typeof item.target.key === 'string'
    && item.target.key.length > 0
    && typeof item.createdAt === 'string'
    && Number.isFinite(Date.parse(item.createdAt));
}

async function persistFinalizedClipInbox(
  clip: PendingVoiceClip,
  target: VoiceTranscriptionTarget,
): Promise<void> {
  const item: PendingVoiceClipInboxItem = {
    id: clip.id,
    userId: clip.userId,
    audioUri: clip.uri,
    sizeBytes: clip.sizeBytes,
    durationMs: clip.durationMs,
    target,
    createdAt: new Date().toISOString(),
  };
  let fileManifestPersisted = false;
  let storageManifestPersisted = false;
  const failures: unknown[] = [];
  let manifestUri: string | null = null;
  try {
    const directory = await ensureVoicePendingDirectory();
    manifestUri = directory ? `${directory}${clip.id}.inbox.json` : null;
  } catch (error) {
    failures.push(error);
    logVoiceOperationError('voice_recording_pending_directory_error', error);
  }
  if (manifestUri) {
    try {
      await FileSystem.writeAsStringAsync(manifestUri, JSON.stringify(item));
      fileManifestPersisted = true;
    } catch (error) {
      failures.push(error);
      logVoiceOperationError('voice_recording_file_manifest_write_error', error);
    }
  }
  try {
    await LocalStorage.addPendingVoiceClipToInbox(item);
    storageManifestPersisted = true;
  } catch (error) {
    failures.push(error);
    logVoiceOperationError('voice_recording_storage_manifest_write_error', error);
  }
  if (!fileManifestPersisted && !storageManifestPersisted) {
    volatilePendingClipInbox.set(item.id, item);
    throw new ClipInboxPersistenceError(failures);
  }
  volatilePendingClipInbox.delete(item.id);
}

export async function getPendingVoiceClipFileManifests(): Promise<PendingVoiceClipInboxItem[]> {
  const documentDirectory = FileSystem.documentDirectory;
  const volatileItems = [...volatilePendingClipInbox.values()];
  if (!documentDirectory) return volatileItems;
  const directories = [voicePendingDirectoryUri(), documentDirectory]
    .filter((directory): directory is string => directory != null);
  const scans = await Promise.allSettled(directories.map(async (directory) => {
    const names = await FileSystem.readDirectoryAsync(directory);
    return Promise.all(names
      .filter((name) => /^voice-\d+-[a-z0-9]+\.inbox\.json$/i.test(name))
      .map(async (name) => {
        try {
          const parsed = JSON.parse(await FileSystem.readAsStringAsync(`${directory}${name}`));
          return isInboxManifest(parsed) ? parsed : null;
        } catch (error) {
          logVoiceOperationError('voice_recording_file_manifest_read_error', error);
          return null;
        }
      }));
  }));
  const merged = new Map(volatileItems.map((item) => [item.id, item]));
  scans.forEach((scan) => {
    if (scan.status === 'rejected') {
      logVoiceOperationError('voice_recording_file_manifest_scan_error', scan.reason);
      return;
    }
    scan.value
      .filter((item): item is PendingVoiceClipInboxItem => item != null)
      .forEach((item) => merged.set(item.id, item));
  });
  return [...merged.values()];
}

export async function getPendingVoiceClipFileManifestsStrict(): Promise<PendingVoiceClipInboxItem[]> {
  const documentDirectory = FileSystem.documentDirectory;
  const merged = new Map([...volatilePendingClipInbox.values()].map((item) => [item.id, item]));
  if (!documentDirectory) return [...merged.values()];
  const directories = [voicePendingDirectoryUri(), documentDirectory]
    .filter((directory): directory is string => directory != null);
  for (const directory of directories) {
    const directoryInfo = await FileSystem.getInfoAsync(directory);
    if (!directoryInfo.exists) continue;
    if (!directoryInfo.isDirectory) throw new Error('voice_manifest_path_not_directory');
    const names = await FileSystem.readDirectoryAsync(directory);
    for (const name of names.filter((entry) => /^voice-\d+-[a-z0-9]+\.inbox\.json$/i.test(entry))) {
      const parsed = JSON.parse(await FileSystem.readAsStringAsync(`${directory}${name}`));
      if (!isInboxManifest(parsed)) throw new Error('voice_manifest_invalid');
      merged.set(parsed.id, parsed);
    }
  }
  return [...merged.values()];
}

export async function removePendingVoiceClipFileManifests(ids: string[]): Promise<void> {
  await Promise.all(ids.map(async (id) => {
    volatilePendingClipInbox.delete(id);
    await Promise.all(inboxManifestUris(id).map(async (uri) => {
      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      } catch (error) {
        logVoiceOperationError('voice_recording_file_manifest_remove_error', error);
      }
    }));
  }));
}

export async function removePendingVoiceClipFileManifestsStrict(ids: string[]): Promise<void> {
  const uniqueIds = [...new Set(ids)];
  const uris = uniqueIds.flatMap(inboxManifestUris);
  await Promise.all(uris.map((uri) => FileSystem.deleteAsync(uri, { idempotent: true })));
  const verification = await Promise.all(uris.map((uri) => FileSystem.getInfoAsync(uri)));
  if (verification.some((info) => info.exists)) throw new Error('voice_manifest_delete_unverified');
  uniqueIds.forEach((id) => volatilePendingClipInbox.delete(id));
}

function retryDelay(attempt: number, serverDelayMs?: number | null): number {
  if (serverDelayMs && Number.isFinite(serverDelayMs)) {
    return Math.min(Math.max(serverDelayMs, RETRY_BASE_DELAY_MS), MAX_SERVER_RETRY_DELAY_MS);
  }
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
      case 'LOW_CONFIDENCE_TRANSCRIPT':
        return 'low_confidence_transcript';
      case 'UNAUTHENTICATED':
        return 'unauthenticated';
      case 'RATE_LIMITED':
        return 'rate_limited';
      case 'TRANSCRIPTION_IN_PROGRESS':
        return 'transcription_in_progress';
      case 'INVALID_IDEMPOTENCY_KEY':
        return 'misconfigured';
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

async function sessionStillOwnedBy(expectedUserId: string): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id === expectedUserId;
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

async function refreshTokenAfterUnauthorized(expectedUserId: string): Promise<string | null> {
  try {
    const { data } = await withTimeout(
      supabase.auth.refreshSession(),
      AUTH_REFRESH_TIMEOUT_MS,
      'supabase.auth.refreshSession_401',
    );
    return data.session?.user.id === expectedUserId
      ? data.session.access_token
      : null;
  } catch {
    return null;
  }
}

export async function requestRecordingPermissions(): Promise<VoiceResult<void>> {
  try {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      const { status } = permission;
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
  if (recording || isStartingRecording || isStoppingRecording) return errorResult('recording_in_progress');
  isStartingRecording = true;
  const startGeneration = recordingLifecycleGeneration;
  const startWasCancelled = () => startGeneration !== recordingLifecycleGeneration;
  let created: AudioRecorder | null = null;
  const abandonCancelledStart = async (): Promise<VoiceResult<void>> => {
    clearRecordingStatusListener();
    recordingNativeError = null;
    recordingEventUri = null;
    recordingLastDurationMs = null;
    try {
      created?.release();
    } catch (error) {
      logVoiceOperationError('voice_recording_cancelled_start_release_error', error);
    }
    await resetAudioMode();
    return errorResult('audio_unavailable', true);
  };
  try {
    const { data } = await supabase.auth.getSession();
    if (startWasCancelled()) return await abandonCancelledStart();
    const ownerId = data.session?.user.id;
    if (!ownerId) return errorResult('unauthenticated', true);

    if (!staleClipsCleaned) {
      await cleanupStalePendingClips();
      if (startWasCancelled()) return await abandonCancelledStart();
      staleClipsCleaned = true;
    }
    const freeBytes = await getAvailableDiskSpaceBytes();
    if (startWasCancelled()) return await abandonCancelledStart();
    if (freeBytes != null && freeBytes < MIN_VOICE_RECORDING_FREE_BYTES) {
      logEvent('voice_recording_insufficient_storage_preflight');
      return errorResult('insufficient_storage');
    }

    // Prepare and verify the recovery boundary before the native recorder can
    // create a cache file. This is especially important on the first Android
    // capture, where no launch-time native helper creates the directory.
    const pendingDirectory = await ensureVoicePendingDirectory();
    if (startWasCancelled()) return await abandonCancelledStart();
    if (!pendingDirectory) return errorResult('audio_unavailable', true);

    const permission = await requestRecordingPermissions();
    if (startWasCancelled()) return await abandonCancelledStart();
    if (!permission.ok) return permission;

    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
      interruptionMode: 'doNotMix',
      allowsBackgroundRecording: false,
    });
    if (startWasCancelled()) return await abandonCancelledStart();
    created = new AudioModule.AudioRecorder(VOICE_RECORDING_OPTIONS);
    attachRecordingStatusListener(created);
    await created.prepareToRecordAsync();
    if (startWasCancelled()) return await abandonCancelledStart();
    if (!(await sessionStillOwnedBy(ownerId))) {
      clearRecordingStatusListener();
      created.release();
      await resetAudioMode();
      return errorResult('unauthenticated');
    }
    if (startWasCancelled()) return await abandonCancelledStart();
    created.record({ forDuration: MAX_RECORDING_DURATION_SECONDS });
    if (startWasCancelled()) return await abandonCancelledStart();
    recording = created;
    recordingOwnerId = ownerId;
    logEvent('voice_recording_started');
    return { ok: true, value: undefined };
  } catch (error) {
    logVoiceOperationError('voice_recording_start_error', error);
    const insufficientStorage = await isInsufficientStorageFailure(error);
    clearRecordingStatusListener();
    recordingNativeError = null;
    recordingEventUri = null;
    recordingLastDurationMs = null;
    try {
      created?.release();
    } catch (releaseError) {
      logVoiceOperationError('voice_recording_start_release_error', releaseError);
    }
    await resetAudioMode();
    return insufficientStorage
      ? errorResult('insufficient_storage')
      : errorResult('recording_failed', true);
  } finally {
    isStartingRecording = false;
  }
}

async function resetAudioMode(): Promise<void> {
  try {
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: false,
    });
  } catch (error) {
    logError('voice_recording_audio_mode_reset_error', error);
  }
}

export async function stopRecording(target: VoiceTranscriptionTarget): Promise<VoiceResult<PendingVoiceClip>> {
  const activeRecording = recording;
  const ownerId = recordingOwnerId;
  if (!activeRecording || !ownerId || isStoppingRecording) return errorResult('audio_unavailable', true);

  isStoppingRecording = true;
  let terminalFailure: unknown = recordingNativeError;
  let storageFailureDetected = false;
  try {
    const candidateUris = new Set<string>();
    const preStopUri = activeRecording.uri;
    if (preStopUri) candidateUris.add(preStopUri);
    if (recordingEventUri) candidateUris.add(recordingEventUri);

    let durationMs: number | null = recordingLastDurationMs;
    let preStopStatus: ReturnType<AudioRecorder['getStatus']> | null = null;
    try {
      preStopStatus = activeRecording.getStatus();
      durationMs = Math.max(durationMs ?? 0, preStopStatus.durationMillis ?? 0);
      if (preStopStatus.url) candidateUris.add(preStopStatus.url);
    } catch (error) {
      logVoiceOperationError('voice_recording_pre_stop_status_error', error);
      terminalFailure ??= error;
    }

    try {
      if (preStopStatus?.isRecording !== false) await activeRecording.stop();
    } catch (error) {
      // stop() may throw after the encoder has already written a usable partial
      // file (notably when the disk fills). Keep inspecting all known URIs.
      terminalFailure = error;
      storageFailureDetected = await isInsufficientStorageFailure(error);
      logVoiceOperationError('voice_recording_native_stop_error', error);
    }

    try {
      const stopStatus = activeRecording.getStatus();
      if (stopStatus.url) candidateUris.add(stopStatus.url);
      durationMs = Math.max(durationMs ?? 0, stopStatus.durationMillis ?? 0);
    } catch (error) {
      terminalFailure ??= error;
      logVoiceOperationError('voice_recording_post_stop_status_error', error);
    }
    const postStopUri = activeRecording.uri;
    if (postStopUri) candidateUris.add(postStopUri);
    if (recordingEventUri) candidateUris.add(recordingEventUri);
    recording = null;
    recordingOwnerId = null;
    const reportedDurationTooShort = durationMs != null && durationMs < MIN_RECORDING_DURATION_MS;
    if (reportedDurationTooShort && !terminalFailure) {
      await Promise.allSettled([...candidateUris].map((uri) => FileSystem.deleteAsync(uri, { idempotent: true })));
      return errorResult('invalid_audio');
    }
    let pendingDirectory: string | null = null;
    try {
      pendingDirectory = await ensureVoicePendingDirectory();
    } catch (error) {
      logVoiceOperationError('voice_recording_pending_directory_error', error);
      terminalFailure ??= error;
      storageFailureDetected ||= await isInsufficientStorageFailure(error);
    }

    for (const candidate of candidateUris) {
      let sourceInfo: AudioFileInfo;
      try {
        sourceInfo = await waitForReadableAudioFile(candidate, STOP_AUDIO_FILE_READY_RETRIES);
      } catch (error) {
        terminalFailure ??= error;
        storageFailureDetected ||= await isInsufficientStorageFailure(error);
        logVoiceOperationError('voice_recording_source_read_error', error);
        continue;
      }
      if (!sourceInfo.exists || sourceInfo.isDirectory || !sourceInfo.size) continue;
      if (reportedDurationTooShort && sourceInfo.size < MIN_PARTIAL_SALVAGE_FILE_BYTES) continue;
      if (sourceInfo.size > MAX_AUDIO_FILE_BYTES) return errorResult('audio_too_large');

      const extension = audioExtensionFromUri(candidate);
      const clipId = createClipId();
      const destination = pendingDirectory ? `${pendingDirectory}${clipId}.${extension}` : null;
      let durableUri = candidate;
      let durableInfo: AudioFileInfo | null = sourceInfo;
      let copiedSource = false;
      let moveCompleted = false;
      if (destination) {
        durableUri = destination;
        durableInfo = null;
        try {
          // Cache and documents are app-private locations on the same device. A
          // move/rename avoids temporarily requiring a second full audio copy.
          await FileSystem.moveAsync({ from: candidate, to: destination });
          moveCompleted = true;
        } catch (moveError) {
          logVoiceOperationError('voice_recording_move_error', moveError);
          const moveWasStorageFailure = await isInsufficientStorageFailure(moveError);
          storageFailureDetected ||= moveWasStorageFailure;
          terminalFailure ??= moveError;

          if (moveWasStorageFailure) {
            // A partial clip in cache is still better than deleting or replacing it.
            // The inbox can point at this source until the user frees storage.
            durableUri = candidate;
            durableInfo = sourceInfo;
          } else {
            try {
              await FileSystem.copyAsync({ from: candidate, to: destination });
              copiedSource = true;
              durableInfo = await waitForReadableAudioFile(destination);
            } catch (copyError) {
              logVoiceOperationError('voice_recording_copy_error', copyError);
              const copyWasStorageFailure = await isInsufficientStorageFailure(copyError);
              storageFailureDetected ||= copyWasStorageFailure;
              terminalFailure = copyError;
              if (copyWasStorageFailure) {
                durableUri = candidate;
                durableInfo = sourceInfo;
              } else {
                continue;
              }
            }
          }
        }

        if (moveCompleted) {
          try {
            durableInfo = await waitForReadableAudioFile(destination);
          } catch (verificationError) {
            // moveAsync already transferred ownership to destination. Never fall
            // back to copying the now-missing source. Persist the destination with
            // the verified pre-move size so launch recovery can retry it later.
            terminalFailure ??= verificationError;
            storageFailureDetected ||= await isInsufficientStorageFailure(verificationError);
            logVoiceOperationError('voice_recording_move_verification_error', verificationError);
            durableInfo = sourceInfo;
          }
          if (!durableInfo.exists || durableInfo.isDirectory || !durableInfo.size) {
            logEvent('voice_recording_move_verification_deferred', {
              sizeBytes: sourceInfo.size,
            });
            durableInfo = sourceInfo;
          }
        }
      } else {
        logEvent('voice_recording_pending_directory_deferred', {
          sizeBytes: sourceInfo.size,
        });
      }

      if (!durableInfo?.exists || durableInfo.isDirectory || !durableInfo.size) {
        if (destination && durableUri === destination) {
          await FileSystem.deleteAsync(destination, { idempotent: true }).catch(() => undefined);
        }
        continue;
      }
      if (durableInfo.size > MAX_AUDIO_FILE_BYTES) {
        await FileSystem.deleteAsync(durableUri, { idempotent: true }).catch(() => undefined);
        return errorResult('audio_too_large');
      }
      const clip: PendingVoiceClip = {
        id: clipId,
        userId: ownerId,
        uri: durableUri,
        sizeBytes: durableInfo.size,
        // Native encoders can reset their duration counter on failure. Do not
        // persist a misleading 0 ms value for a conservatively salvaged file.
        durationMs: reportedDurationTooShort ? null : durationMs,
      };
      if (!(await sessionStillOwnedBy(ownerId))) {
        await FileSystem.deleteAsync(durableUri, { idempotent: true }).catch(() => undefined);
        return errorResult('unauthenticated');
      }
      try {
        // This durable inbox is committed before the clip is handed back to UI code. If
        // queue persistence later fails or the surface unmounts, launch recovery can replay it.
        await persistFinalizedClipInbox(clip, target);
      } catch (manifestError) {
        terminalFailure = manifestError;
        const manifestWasStorageFailure = await isInsufficientStorageFailure(manifestError);
        storageFailureDetected ||= manifestWasStorageFailure;

        // Regardless of error classification, both manifest writes failing must
        // never strand the live clip inside this module. Hand it to the UI for a
        // queue attempt while the process-lifetime inbox retains owner + target.
        // Storage classification controls messaging only, not salvage behavior.
        logEvent(manifestWasStorageFailure
          ? 'voice_recording_manifest_deferred_low_storage'
          : 'voice_recording_manifest_deferred', {
          durationMs,
          sizeBytes: durableInfo.size,
        });
      }
      if (!(await sessionStillOwnedBy(ownerId))) {
        await Promise.allSettled([
          LocalStorage.removePendingVoiceClipsFromInbox([clip.id]),
          removePendingVoiceClipFileManifests([clip.id]),
          FileSystem.deleteAsync(durableUri, { idempotent: true }),
        ]);
        return errorResult('unauthenticated');
      }
      logEvent('voice_recording_finalized', {
        durationMs,
        sizeBytes: durableInfo.size,
        salvagedAfterNativeFailure: Boolean(terminalFailure),
        retainedInCache: durableUri === candidate,
      });
      if (copiedSource) {
        try {
          await FileSystem.deleteAsync(candidate, { idempotent: true });
        } catch (error) {
          logVoiceOperationError('voice_recording_source_cleanup_error', error);
        }
      }
      return { ok: true, value: clip };
    }
    if (reportedDurationTooShort) return errorResult('invalid_audio');
    if (storageFailureDetected || await isInsufficientStorageFailure(terminalFailure)) {
      return errorResult('insufficient_storage');
    }
    return terminalFailure
      ? errorResult('recording_failed', true)
      : errorResult('audio_unavailable', true);
  } catch (error) {
    recording = null;
    recordingOwnerId = null;
    logVoiceOperationError('voice_recording_stop_error', error);
    return await isInsufficientStorageFailure(error)
      ? errorResult('insufficient_storage')
      : errorResult('recording_failed', true);
  } finally {
    clearRecordingStatusListener();
    recordingNativeError = null;
    recordingEventUri = null;
    recordingLastDurationMs = null;
    try {
      activeRecording.release();
    } catch (error) {
      logError('voice_recording_release_error', error);
    }
    isStoppingRecording = false;
    await resetAudioMode();
  }
}

export async function getRecordingStatus(): Promise<RecordingStatus> {
  if (!recording) {
    return {
      isRecording: false,
      duration: recordingLastDurationMs ?? 0,
      uri: recordingEventUri,
      hasError: Boolean(recordingNativeError),
      error: recordingNativeError,
    };
  }
  try {
    const status = recording.getStatus();
    recordingLastDurationMs = Math.max(recordingLastDurationMs ?? 0, status.durationMillis ?? 0);
    if (status.url) recordingEventUri = status.url;
    return {
      isRecording: recordingNativeError ? false : (status.isRecording ?? false),
      duration: recordingLastDurationMs,
      uri: status.url ?? recordingEventUri,
      hasError: Boolean(recordingNativeError),
      error: recordingNativeError,
    };
  } catch (error) {
    logVoiceOperationError('voice_recording_status_error', error);
    return {
      isRecording: false,
      duration: recordingLastDurationMs ?? 0,
      uri: recordingEventUri ?? recording.uri,
      hasError: true,
      error: 'recording_status_unavailable',
    };
  }
}

export async function discardPendingClip(
  clip: Pick<PendingVoiceClip, 'id' | 'uri' | 'sizeBytes' | 'durationMs'> | null,
): Promise<void> {
  if (!clip) return;
  try {
    await FileSystem.deleteAsync(clip.uri, { idempotent: true });
    logEvent('voice_recording_discarded', { sizeBytes: clip.sizeBytes });
  } catch (error) {
    logVoiceOperationError('voice_recording_discard_error', error);
  }
}

export async function discardPendingClipStrict(
  clip: Pick<PendingVoiceClip, 'id' | 'uri' | 'sizeBytes' | 'durationMs'> | null,
): Promise<void> {
  if (!clip) return;
  try {
    await FileSystem.deleteAsync(clip.uri, { idempotent: true });
    const afterDelete = await getAudioFileInfo(clip.uri);
    if (afterDelete.exists) throw new Error('voice_clip_delete_not_confirmed');
    logEvent('voice_recording_discarded_strict', { sizeBytes: clip.sizeBytes });
  } catch (error) {
    // Sanitize the native error before logging so an audio URI never leaks.
    logVoiceOperationError('voice_recording_strict_discard_error', error);
    throw new Error('voice_clip_delete_failed');
  }
}

export async function cleanupStalePendingClips(): Promise<void> {
  const documentDirectory = FileSystem.documentDirectory;
  if (!documentDirectory) return;
  const directories = [voicePendingDirectoryUri(), documentDirectory]
    .filter((directory): directory is string => directory != null);
  try {
    const [queueState, inboxState, scans] = await Promise.all([
      LocalStorage.getPendingVoiceTranscriptionCleanupState(),
      LocalStorage.getPendingVoiceClipInboxCleanupState(),
      Promise.all(directories.map(async (directory) => ({
        directory,
        names: await FileSystem.readDirectoryAsync(directory),
      }))),
    ]);
    const sidecars: PendingVoiceClipInboxItem[] = [];
    for (const scan of scans) {
      for (const name of scan.names.filter((entry) => /^voice-\d+-[a-z0-9]+\.inbox\.json$/i.test(entry))) {
        const parsed = JSON.parse(await FileSystem.readAsStringAsync(`${scan.directory}${name}`));
        if (!isInboxManifest(parsed)) throw new Error('voice_manifest_invalid');
        sidecars.push(parsed);
      }
    }
    const protectedItems = [
      ...queueState.attributionEvidence,
      ...inboxState.attributionEvidence,
      ...sidecars,
    ];
    const protectedUris = new Set(protectedItems.map((item) => item.audioUri));
    const protectedIds = new Set(protectedItems.map((item) => item.id));
    const now = Date.now();
    await Promise.all(scans.flatMap(({ directory, names }) => names
      .filter((name) => /^voice-\d+-[a-z0-9]+\.[a-z0-9]{2,5}(?:\.repair)?$/i.test(name))
      .map(async (name) => {
        const uri = `${directory}${name}`;
        const clipId = name.match(/^(voice-\d+-[a-z0-9]+)/i)?.[1] ?? '';
        if (protectedUris.has(uri) || protectedIds.has(clipId)) return;
        const info = await getAudioFileInfo(uri);
        const modifiedAtMs = info.modificationTime ? info.modificationTime * 1000 : 0;
        if (info.exists && !info.isDirectory && modifiedAtMs > 0
          && now - modifiedAtMs > MAX_PENDING_CLIP_AGE_MS) {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        }
      })));
  } catch (error) {
    // Unknown/corrupt metadata means ownership cannot be proven. Fail closed:
    // queue/tombstone recovery may retry, while blind deletion could orphan it.
    logVoiceOperationError('voice_recording_stale_cleanup_error', error);
  }
}

export async function transcribeAudio(
  clip: PendingVoiceClip,
  auth: VoiceUploadAuthContext,
): Promise<VoiceResult<string>> {
  if (clip.userId !== auth.expectedUserId) return errorResult('unauthenticated');
  const attemptGlobalEpoch = globalUploadCancellationEpoch;
  const attemptOwnerEpoch = ownerUploadCancellationEpochs.get(auth.expectedUserId) ?? 0;
  const uploadWasCancelled = () => attemptGlobalEpoch !== globalUploadCancellationEpoch
    || attemptOwnerEpoch !== (ownerUploadCancellationEpochs.get(auth.expectedUserId) ?? 0);
  let readable: AudioFileInfo;
  try {
    readable = await waitForReadableAudioFile(clip.uri);
  } catch (error) {
    logVoiceOperationError('voice_transcription_file_read_error', error);
    return errorResult('audio_unavailable', true);
  }
  if (!readable.exists || readable.isDirectory || !readable.size) return errorResult('audio_unavailable', true);
  if (readable.size > MAX_AUDIO_FILE_BYTES) return errorResult('audio_too_large');
  if (!(await isOnline())) return errorResult('offline', true);

  const transcriptionUrl = getTranscriptionUrl();
  const anonKey = getConfig('supabaseAnonKey');
  if (!transcriptionUrl || !anonKey) return errorResult('misconfigured');

  let accessToken = auth.accessToken;

  const extension = audioExtensionFromUri(clip.uri);
  for (let attempt = 1; attempt <= MAX_TRANSCRIPTION_ATTEMPTS; attempt += 1) {
    // Bind every network attempt to the owner selected by the queue. A token from a
    // newly signed-in account can therefore never be paired with this clip.
    if (uploadWasCancelled()
      || !(await sessionStillOwnedBy(auth.expectedUserId))
      || uploadWasCancelled()) {
      return errorResult('unauthenticated');
    }
    let serverRetryDelayMs: number | null = null;
    const controller = new AbortController();
    activeUploadControllers.set(controller, auth.expectedUserId);
    const timeout = setTimeout(() => controller.abort(), TRANSCRIPTION_ATTEMPT_TIMEOUT_MS);
    try {
      const postTranscription = (token: string) => {
        if (uploadWasCancelled()) {
          const cancellation = new Error('Voice upload cancelled');
          cancellation.name = 'AbortError';
          throw cancellation;
        }
        const formData = new FormData();
        formData.append('file', {
          uri: clip.uri,
          type: mimeTypeForExtension(extension),
          name: `${clip.id}.${extension}`,
        } as unknown as Blob);
        if (clip.durationMs != null) formData.append('duration_ms', String(Math.round(clip.durationMs)));
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
        const refreshedToken = await refreshTokenAfterUnauthorized(auth.expectedUserId);
        if (!refreshedToken) return errorResult('unauthenticated');
        accessToken = refreshedToken;
        if (!(await sessionStillOwnedBy(auth.expectedUserId))) {
          return errorResult('unauthenticated');
        }
        response = await postTranscription(accessToken);
      }

      const payload = await response.json().catch(() => ({}));
      if (response.ok && typeof payload.text === 'string' && payload.text.trim()) {
        const transcript = payload.text.trim();
        const quality = assessTranscriptQuality({ text: transcript, durationMs: clip.durationMs });
        if (!quality.accepted) {
          logError('voice_transcription_client_quality_rejected', new Error(quality.issue), {
            attempt,
            sizeBytes: readable.size,
          });
          return errorResult('low_confidence_transcript');
        }
        logEvent('voice_transcription_success', {
          attempt,
          sizeBytes: readable.size,
          qualityRecoveryUsed: payload.quality_recovery_used === true,
          cached: payload.cached === true,
        });
        return { ok: true, value: transcript };
      }

      const code = errorCodeForStatus(response.status, payload.code);
      const retryable = isRetryableStatus(response.status);
      const retryAfterHeaderSeconds = Number(response.headers?.get?.('Retry-After'));
      serverRetryDelayMs = typeof payload.retry_after_ms === 'number'
        ? payload.retry_after_ms
        : (Number.isFinite(retryAfterHeaderSeconds) && retryAfterHeaderSeconds > 0
          ? retryAfterHeaderSeconds * 1000
          : null);
      logError('voice_transcription_response_error', new Error(code), {
        attempt,
        statusCode: response.status,
        retryable,
      });
      // An active server lease is a scheduling signal, not an immediate retry.
      // Return it to the durable queue so this clip consumes only one attempt
      // and is retried at/after the actual reclaim boundary.
      if (code === 'transcription_in_progress' && serverRetryDelayMs) {
        return errorResult(code, true, serverRetryDelayMs);
      }
      if (!retryable || attempt === MAX_TRANSCRIPTION_ATTEMPTS) {
        return errorResult(code, retryable, serverRetryDelayMs);
      }
    } catch (error) {
      const isTimeout = error instanceof Error && (error.name === 'AbortError' || error.message.includes('timed out'));
      const code: VoiceErrorCode = isTimeout ? 'request_timeout' : 'service_unavailable';
      logError('voice_transcription_request_error', error, { attempt, code });
      if (attempt === MAX_TRANSCRIPTION_ATTEMPTS) return errorResult(code, true);
    } finally {
      clearTimeout(timeout);
      activeUploadControllers.delete(controller);
    }

    await sleep(retryDelay(attempt, serverRetryDelayMs));
  }
  return errorResult('unknown', true);
}

export function abortActiveTranscriptions(): void {
  globalUploadCancellationEpoch += 1;
  activeUploadControllers.forEach((_ownerId, controller) => controller.abort());
  activeUploadControllers.clear();
}

export function abortActiveTranscriptionsForUser(userId: string): void {
  ownerUploadCancellationEpochs.set(
    userId,
    (ownerUploadCancellationEpochs.get(userId) ?? 0) + 1,
  );
  activeUploadControllers.forEach((ownerId, controller) => {
    if (ownerId !== userId) return;
    controller.abort();
    activeUploadControllers.delete(controller);
  });
}

export async function cleanupRecording(): Promise<void> {
  recordingLifecycleGeneration += 1;
  const activeRecording = recording;
  recording = null;
  recordingOwnerId = null;
  if (!activeRecording || isStoppingRecording) {
    if (!isStoppingRecording) clearRecordingStatusListener();
    return;
  }
  try {
    await activeRecording.stop();
  } catch (error) {
    logError('voice_recording_cleanup_error', error);
  } finally {
    clearRecordingStatusListener();
    recordingNativeError = null;
    recordingEventUri = null;
    recordingLastDurationMs = null;
    try {
      activeRecording.release();
    } catch (error) {
      logError('voice_recording_cleanup_release_error', error);
    }
    await resetAudioMode();
  }
}
