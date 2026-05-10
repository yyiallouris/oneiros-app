import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { logError, logEvent } from '../services/logger';
import { supabase } from '../services/supabaseClient';

const AUTH_REFRESH_TIMEOUT_MS = 20_000;
const TRANSCRIPTION_FETCH_TIMEOUT_MS = 6 * 60_000;
const AUDIO_FILE_READY_RETRIES = 12;
const STOP_AUDIO_FILE_READY_RETRIES = 4;
const AUDIO_FILE_READY_DELAY_MS = 250;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

type AudioFileInfo = {
  exists: boolean;
  size: number | null;
  isDirectory: boolean | null;
};

async function getAudioFileInfo(uri: string): Promise<AudioFileInfo> {
  const info = await FileSystem.getInfoAsync(uri);
  return {
    exists: info.exists,
    size: (info as { size?: number }).size ?? null,
    isDirectory: (info as { isDirectory?: boolean }).isDirectory ?? null,
  };
}

async function waitForReadableAudioFile(
  uri: string,
  label: string,
  retries = AUDIO_FILE_READY_RETRIES
): Promise<AudioFileInfo> {
  let lastInfo: AudioFileInfo = { exists: false, size: null, isDirectory: null };

  for (let attempt = 1; attempt <= retries; attempt++) {
    lastInfo = await getAudioFileInfo(uri);
    if (lastInfo.exists && !lastInfo.isDirectory) {
      logEvent(`${label}_ready`, {
        attempt,
        size: lastInfo.size,
        uriLength: uri.length,
      });
      return lastInfo;
    }
    await sleep(AUDIO_FILE_READY_DELAY_MS);
  }

  logError(`${label}_not_ready`, new Error('Audio file is not readable'), {
    exists: lastInfo.exists,
    size: lastInfo.size,
    isDirectory: lastInfo.isDirectory,
    uriLength: uri.length,
  });
  return lastInfo;
}

function audioExtensionFromUri(uri: string): string {
  const path = uri.split('?')[0].split('#')[0];
  const rawExtension = path.split('.').pop()?.toLowerCase() || '';
  return /^[a-z0-9]{2,5}$/.test(rawExtension) ? rawExtension : 'm4a';
}

export interface RecordingStatus {
  isRecording: boolean;
  duration: number; // in milliseconds
  uri: string | null;
}

let recording: Audio.Recording | null = null;
let isStoppingRecording = false;
let statusInterval: NodeJS.Timeout | null = null;

/**
 * Request audio recording permissions
 */
export async function requestRecordingPermissions(): Promise<boolean> {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      logError('voice_recording_permission_denied', new Error('Audio permission not granted'), { status });
      return false;
    }
    return true;
  } catch (error) {
    logError('voice_recording_permission_error', error);
    return false;
  }
}

/**
 * Start audio recording
 */
export async function startRecording(): Promise<boolean> {
  try {
    // Request permissions first
    const hasPermission = await requestRecordingPermissions();
    if (!hasPermission) {
      return false;
    }

    // Configure audio mode for recording
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    // Create and start recording
    // Stick to Expo's tested preset. Custom Android encoder/channel tweaks have
    // caused prepared URIs without a readable output file on some devices.
    const { recording: newRecording, status } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
      (status) => {
        // Status update callback (optional, we use polling instead)
      }
    );

    recording = newRecording;
    logEvent('voice_recording_started', {
      uriLength: newRecording.getURI()?.length ?? null,
      statusUriLength: status.uri?.length ?? null,
    });
    return true;
  } catch (error) {
    logError('voice_recording_start_error', error);
    return false;
  }
}

/**
 * Stop audio recording and return the URI
 */
export async function stopRecording(): Promise<string | null> {
  try {
    const activeRecording = recording;
    if (!activeRecording || isStoppingRecording) {
      return null;
    }

    isStoppingRecording = true;

    const candidateUris = new Set<string>();
    const preStopUri = activeRecording.getURI();
    if (preStopUri) candidateUris.add(preStopUri);

    let preStopDurationMillis: number | null = null;
    try {
      const preStopStatus = await activeRecording.getStatusAsync();
      preStopDurationMillis = preStopStatus.durationMillis ?? null;
      if (preStopStatus.uri) candidateUris.add(preStopStatus.uri);
    } catch (statusError) {
      logError('voice_recording_pre_stop_status_error', statusError);
    }

    logEvent('voice_recording_stop_begin', {
      preStopDurationMillis,
      preStopUriLength: preStopUri?.length ?? null,
    });

    const stopStatus = await activeRecording.stopAndUnloadAsync();
    recording = null;
    logEvent('voice_recording_stop_status', {
      durationMillis: stopStatus.durationMillis,
      isDoneRecording: stopStatus.isDoneRecording,
      statusUriLength: stopStatus.uri?.length ?? null,
      mediaServicesDidReset: stopStatus.mediaServicesDidReset ?? false,
    });
    if (stopStatus.uri) candidateUris.add(stopStatus.uri);

    const postStopUri = activeRecording.getURI();
    if (postStopUri) candidateUris.add(postStopUri);

    // Reset audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: false,
    });

    const uri = [...candidateUris][0] ?? null;
    if (uri) {
      logEvent('voice_recording_uri_candidates', {
        count: candidateUris.size,
        uriLengths: [...candidateUris].map((candidate) => candidate.length),
      });

      // DEV DEBUG: log raw URI and file info at source path
      let rawInfo: AudioFileInfo | null = null;
      let readableUri: string | null = null;
      try {
        for (const candidate of candidateUris) {
          logEvent('voice_recording_raw_uri', { uri: candidate, uriLength: candidate.length });
          const candidateInfo = await waitForReadableAudioFile(
            candidate,
            'voice_recording_raw_file',
            STOP_AUDIO_FILE_READY_RETRIES
          );
          if (candidateInfo.exists && !candidateInfo.isDirectory) {
            rawInfo = candidateInfo;
            readableUri = candidate;
            break;
          }
          rawInfo = candidateInfo;
        }
        logEvent('voice_recording_raw_info', {
          exists: rawInfo?.exists ?? false,
          size: rawInfo?.size ?? null,
          isDirectory: rawInfo?.isDirectory ?? null,
        });
      } catch (rawInfoError) {
        logError('voice_recording_raw_info_error', rawInfoError, { uriLength: uri.length });
      }

      if (!readableUri) return null;

      // Try to copy to app-managed location to ensure a stable, readable file path
      try {
        const extension = audioExtensionFromUri(readableUri);
        const targetPath = `${FileSystem.documentDirectory}voice-${Date.now()}.${extension}`;
        await FileSystem.copyAsync({ from: readableUri, to: targetPath });

        // Log copied file info
        try {
          const copiedInfo = await waitForReadableAudioFile(targetPath, 'voice_recording_copied_file');
          logEvent('voice_recording_copied_info', {
            targetPath,
            exists: copiedInfo.exists,
            size: copiedInfo.size,
            isDirectory: copiedInfo.isDirectory,
          });
          if (!copiedInfo.exists || copiedInfo.isDirectory) {
            throw new Error('Copied recording file is not readable');
          }
        } catch (copiedInfoError) {
          logError('voice_recording_copied_info_error', copiedInfoError, {
            targetPathLength: targetPath.length,
          });
        }

        logEvent('voice_recording_stopped', {
          uriLength: readableUri.length,
          targetPathLength: targetPath.length,
        });
        return targetPath;
      } catch (copyError) {
        logError('voice_recording_copy_error', copyError, { uriLength: uri.length });
        // Fallback only when the original file is still readable.
        if (rawInfo?.exists && !rawInfo.isDirectory) return readableUri;
        return null;
      }
    }

    return null;
  } catch (error) {
    recording = null;
    logError('voice_recording_stop_error', error);
    return null;
  } finally {
    isStoppingRecording = false;
  }
}

/**
 * Get current recording status
 */
export async function getRecordingStatus(): Promise<RecordingStatus> {
  try {
    if (!recording) {
      return { isRecording: false, duration: 0, uri: null };
    }

    const status = await recording.getStatusAsync();
    return {
      isRecording: status.isRecording || false,
      duration: status.durationMillis || 0,
      uri: null, // URI only available after stopping
    };
  } catch (error) {
    logError('voice_recording_status_error', error);
    return { isRecording: false, duration: 0, uri: null };
  }
}

/**
 * Clean up recording resources
 */
export async function cleanupRecording(): Promise<void> {
  try {
    if (recording && !isStoppingRecording) {
      const activeRecording = recording;
      recording = null;
      await activeRecording.stopAndUnloadAsync();
    }
    if (statusInterval) {
      clearInterval(statusInterval);
      statusInterval = null;
    }
  } catch (error) {
    logError('voice_recording_cleanup_error', error);
  }
}

/**
 * Valid session for Edge Functions: prefer cached session (fast); refresh only when missing.
 * Always bound refresh with a timeout so the UI cannot spin forever on a stalled auth call.
 */
async function getAccessTokenForFunctions(): Promise<string | null> {
  const { data: first } = await supabase.auth.getSession();
  let session = first?.session;
  if (session?.access_token) {
    return session.access_token;
  }
  try {
    const { data: refreshed } = await withTimeout(
      supabase.auth.refreshSession(),
      AUTH_REFRESH_TIMEOUT_MS,
      'supabase.auth.refreshSession',
    );
    session = refreshed?.session ?? null;
  } catch (e) {
    logError('voice_transcription_refresh_timeout', e instanceof Error ? e : new Error(String(e)));
    const { data: again } = await supabase.auth.getSession();
    session = again?.session ?? null;
  }
  return session?.access_token ?? null;
}

/**
 * Transcribe audio using OpenAI Whisper API via proxy.
 */
export async function transcribeAudio(audioUri: string): Promise<string | null> {
  const MAX_RETRIES = 3;
  let transcript: string | null = null;

  try {
    const accessToken = await getAccessTokenForFunctions();

    // Get Supabase anon key
    const Constants = require('expo-constants').default;
    const anonKey = 
      getConfig('supabaseAnonKey') || 
      Constants.expoConfig?.extra?.supabaseAnonKey ||
      (Constants.manifest as any)?.extra?.supabaseAnonKey ||
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '';
    
    if (!accessToken || !anonKey) {
      logError('voice_transcription_auth_error', new Error('Missing auth tokens'));
      return null;
    }
    
    // Get the proxy URL - use same pattern as ai.ts
    const customEndpoint = getConfig('customGptEndpoint', null);
    const apiUrl = customEndpoint || 'https://api.openai.com/v1/chat/completions';
    
    // Build transcription URL from the proxy URL
    let transcriptionUrl: string;
    if (apiUrl.includes('/functions/v1/openai-proxy')) {
      // Replace openai-proxy with whisper-transcription
      transcriptionUrl = apiUrl.replace('/openai-proxy', '/whisper-transcription');
    } else if (apiUrl.includes('/functions/v1/')) {
      // Already a Supabase function URL, replace function name
      transcriptionUrl = apiUrl.replace(/\/functions\/v1\/[^/]+/, '/functions/v1/whisper-transcription');
    } else {
      // Fallback: try to construct from Supabase URL
      const Constants = require('expo-constants').default;
      const supabaseUrl = 
        getConfig('supabaseUrl') || 
        Constants.expoConfig?.extra?.supabaseUrl ||
        (Constants.manifest as any)?.extra?.supabaseUrl ||
        process.env.EXPO_PUBLIC_SUPABASE_URL ||
        '';
      
      if (supabaseUrl) {
        transcriptionUrl = `${supabaseUrl}/functions/v1/whisper-transcription`;
      } else {
        logError('voice_transcription_config_error', new Error('Cannot determine transcription URL from config'));
        return null;
      }
    }

    // Determine file extension from URI
    const fileExtension = audioExtensionFromUri(audioUri);
    const mimeType = fileExtension === 'm4a' ? 'audio/m4a' : 
                     fileExtension === 'mp3' ? 'audio/mp3' : 
                     'audio/m4a';

    // SUPER DEBUG: log transcription URL + file info
    logEvent('voice_transcription_config', {
      transcriptionUrl,
      hasAccessToken: !!accessToken,
      anonKeyLength: anonKey.length,
      audioUri,
      audioUriLength: audioUri.length,
    });

    // Get file info for debugging (size, exists)
    try {
      const fileInfo = await waitForReadableAudioFile(audioUri, 'voice_transcription_file');
      logEvent('voice_transcription_file_info', {
        exists: fileInfo.exists,
        size: fileInfo.size,
        isDirectory: fileInfo.isDirectory,
        uriLength: audioUri.length,
      });
      if (!fileInfo.exists || fileInfo.isDirectory) {
        return null;
      }
    } catch (infoError) {
      logError('voice_transcription_file_info_error', infoError, {
        audioUri,
        audioUriLength: audioUri.length,
      });
      return null;
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        logEvent('voice_transcription_attempt', {
          attempt,
          maxRetries: MAX_RETRIES,
        });

        const buildForm = (): FormData => {
          const fd = new FormData();
          fd.append('file', {
            uri: audioUri,
            type: mimeType,
            name: `recording.${fileExtension}`,
          } as any);
          fd.append('model', 'whisper-1');
          fd.append('prompt', 'Transcribe in the same language as spoken. Do not translate.');
          return fd;
        };

        const postTranscription = async (bearer: string): Promise<Response> => {
          const controller = new AbortController();
          const tid = setTimeout(() => controller.abort(), TRANSCRIPTION_FETCH_TIMEOUT_MS);
          try {
            return await fetch(transcriptionUrl, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${bearer}`,
                apikey: anonKey,
              },
              body: buildForm() as any,
              signal: controller.signal,
            });
          } finally {
            clearTimeout(tid);
          }
        };

        let response = await postTranscription(accessToken);

        if (response.status === 401) {
          logEvent('voice_transcription_unauthorized_retry', { attempt });
          try {
            await withTimeout(
              supabase.auth.refreshSession(),
              AUTH_REFRESH_TIMEOUT_MS,
              'supabase.auth.refreshSession_401',
            );
          } catch {
            /* fall through to getSession */
          }
          const { data: retrySession } = await supabase.auth.getSession();
          const newToken = retrySession?.session?.access_token;
          if (newToken) {
            response = await postTranscription(newToken);
          }
        }

        if (!response.ok) {
          const errorText = await response.text();
          logError('voice_transcription_api_error', new Error(`API error: ${response.status}`), {
            status: response.status,
            error: errorText.substring(0, 200),
            attempt,
          });
          if (response.status === 429 || response.status >= 500) {
            continue;
          }
          break;
        }

        const data = await response.json();
        const maybeTranscript = data.text || null;

        if (maybeTranscript) {
          transcript = maybeTranscript;
          logEvent('voice_transcription_success', {
            length: maybeTranscript.length,
            attempt,
          });
        }

        break;
      } catch (error) {
        const name = error instanceof Error ? error.name : '';
        const message = error instanceof Error ? error.message : String(error);
        const isAbort = name === 'AbortError' || message.includes('aborted');
        logError('voice_transcription_error', error instanceof Error ? error : new Error(String(error)), {
          uriLength: audioUri.length,
          attempt,
          isAbort,
        });
        if (isAbort) {
          break;
        }
      }
    }

    return transcript;
  } finally {
    // Cleanup: delete local audio file to avoid storage bloat
    try {
      const info = await FileSystem.getInfoAsync(audioUri);
      if (info.exists && !info.isDirectory) {
        await FileSystem.deleteAsync(audioUri, { idempotent: true });
        logEvent('voice_transcription_cleanup_deleted', {
          uriLength: audioUri.length,
        });
      }
    } catch (cleanupError) {
      // Non-fatal: log and move on
      logError('voice_transcription_cleanup_error', cleanupError, {
        uriLength: audioUri.length,
      });
    }
  }
}

// Helper to get config (reuse from ai.ts pattern)
function getConfig(key: string, defaultValue: string | null = null): string | null {
  try {
    const Constants = require('expo-constants').default;
    const extraValue = Constants.expoConfig?.extra?.[key];
    if (extraValue && typeof extraValue === 'string') {
      return extraValue;
    }
    const manifestValue = (Constants.manifest as any)?.extra?.[key];
    if (manifestValue && typeof manifestValue === 'string') {
      return manifestValue;
    }
    return defaultValue;
  } catch (error) {
    return defaultValue;
  }
}
