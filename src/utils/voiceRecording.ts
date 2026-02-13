import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { logError, logEvent } from '../services/logger';

export interface RecordingStatus {
  isRecording: boolean;
  duration: number; // in milliseconds
  uri: string | null;
}

let recording: Audio.Recording | null = null;
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
    // Use HIGH_QUALITY so 1.5 minute recordings still sound good
    const { recording: newRecording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
      (status) => {
        // Status update callback (optional, we use polling instead)
      }
    );

    recording = newRecording;
    logEvent('voice_recording_started');
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
    if (!recording) {
      return null;
    }

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    recording = null;

    // Reset audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: false,
    });

    if (uri) {
      // DEV DEBUG: log raw URI and file info at source path
      try {
        logEvent('voice_recording_raw_uri', { uri, uriLength: uri.length });
        const rawInfo = await FileSystem.getInfoAsync(uri);
        logEvent('voice_recording_raw_info', {
          exists: rawInfo.exists,
          size: rawInfo.size ?? null,
          isDirectory: rawInfo.isDirectory ?? null,
        });
      } catch (rawInfoError) {
        logError('voice_recording_raw_info_error', rawInfoError, { uriLength: uri.length });
      }

      // Try to copy to app-managed location to ensure a stable, readable file path
      try {
        const extension = uri.split('.').pop() || 'm4a';
        const targetPath = `${FileSystem.documentDirectory}voice-${Date.now()}.${extension}`;
        await FileSystem.copyAsync({ from: uri, to: targetPath });

        // Log copied file info
        try {
          const copiedInfo = await FileSystem.getInfoAsync(targetPath);
          logEvent('voice_recording_copied_info', {
            targetPath,
            exists: copiedInfo.exists,
            size: copiedInfo.size ?? null,
            isDirectory: copiedInfo.isDirectory ?? null,
          });
        } catch (copiedInfoError) {
          logError('voice_recording_copied_info_error', copiedInfoError, {
            targetPathLength: targetPath.length,
          });
        }

        logEvent('voice_recording_stopped', {
          uriLength: uri.length,
          targetPathLength: targetPath.length,
        });
        return targetPath;
      } catch (copyError) {
        logError('voice_recording_copy_error', copyError, { uriLength: uri.length });
        // Fallback: return original URI if copy fails
        return uri;
      }
    }

    return null;
  } catch (error) {
    logError('voice_recording_stop_error', error);
    return null;
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
    if (recording) {
      await recording.stopAndUnloadAsync();
      recording = null;
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
 * Transcribe audio using OpenAI Whisper API via proxy.
 */
export async function transcribeAudio(audioUri: string): Promise<string | null> {
  const MAX_RETRIES = 3;
  let transcript: string | null = null;

  try {
    // Get the Supabase session for authentication (refresh first so JWT is valid for edge function)
    const { supabase } = await import('../services/supabaseClient');
    const { data: refreshData } = await supabase.auth.refreshSession();
    const session = refreshData?.session ?? (await supabase.auth.getSession()).data?.session;
    const accessToken = session?.access_token;
    
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
    const fileExtension = audioUri.split('.').pop() || 'm4a';
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
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      logEvent('voice_transcription_file_info', {
        exists: fileInfo.exists,
        size: fileInfo.size ?? null,
        isDirectory: fileInfo.isDirectory ?? null,
        uriLength: audioUri.length,
      });
    } catch (infoError) {
      logError('voice_transcription_file_info_error', infoError, {
        audioUri,
        audioUriLength: audioUri.length,
      });
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        logEvent('voice_transcription_attempt', {
          attempt,
          maxRetries: MAX_RETRIES,
        });

        // Create form data for React Native
        // React Native FormData requires specific format
        const formData = new FormData();
        formData.append('file', {
          uri: audioUri,
          type: mimeType,
          name: `recording.${fileExtension}`,
        } as any);
        formData.append('model', 'whisper-1');
        // Encourage same-language transcription only (no translation to English)
        formData.append('prompt', 'Transcribe in the same language as spoken. Do not translate.');

        // Make the transcription request with same auth pattern as ai.ts
        const response = await fetch(transcriptionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': anonKey,
            // Don't set Content-Type - React Native FormData will set it with boundary
          },
          body: formData as any, // Type assertion for React Native FormData
        });

        if (!response.ok) {
          const errorText = await response.text();
          logError('voice_transcription_api_error', new Error(`API error: ${response.status}`), {
            status: response.status,
            error: errorText.substring(0, 200),
            attempt,
          });
          continue; // try again
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

        break; // success or empty, don't retry further
      } catch (error) {
        // Log richer context for network/debug issues, then retry if attempts remain
        logError('voice_transcription_error', error, {
          uri: audioUri,
          uriLength: audioUri.length,
          attempt,
        });
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

