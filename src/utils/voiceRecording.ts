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
      logEvent('voice_recording_stopped', { uri });
    }

    return uri;
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
 * Transcribe audio using OpenAI Whisper API via proxy
 * This function sends the audio file to the Supabase Edge Function proxy
 */
export async function transcribeAudio(audioUri: string): Promise<string | null> {
  try {
    // Get the Supabase session for authentication
    const { supabase } = await import('../services/supabaseClient');
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
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

    // Create form data for React Native
    // React Native FormData requires specific format
    const formData = new FormData();
    formData.append('file', {
      uri: audioUri,
      type: mimeType,
      name: `recording.${fileExtension}`,
    } as any);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en'); // Can be made configurable

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
      });
      return null;
    }

    const data = await response.json();
    const transcript = data.text || null;

    if (transcript) {
      logEvent('voice_transcription_success', { length: transcript.length });
    }

    return transcript;
  } catch (error) {
    logError('voice_transcription_error', error);
    return null;
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

