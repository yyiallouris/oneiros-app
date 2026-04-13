import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing, typography } from '../../theme';
import { logEvent } from '../../services/logger';
import { startRecording, stopRecording, getRecordingStatus, cleanupRecording } from '../../utils/voiceRecording';
import { transcribeAudio } from '../../utils/voiceRecording';
import MicrophoneAltIcon from '../../assets/icons/microphone-alt.svg';

interface VoiceRecordButtonProps {
  onTranscriptionComplete: (text: string) => void;
  disabled?: boolean;
}

// Stop icon
const StopIcon = ({ size = 24, color = colors.white }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 6h12v12H6z"
      fill={color}
    />
  </Svg>
);

// Hard cap on recording length to avoid very large files / timeouts.
// Allow up to ~3 minutes per clip; on very slow networks this might still hit timeouts.
const MAX_RECORDING_MS = 3 * 60 * 1000; // 3 minutes

export const VoiceRecordButton: React.FC<VoiceRecordButtonProps> = ({
  onTranscriptionComplete,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const transcribeFromUri = async (audioUri: string) => {
    logEvent('voice_transcription_start', {
      // duration here is the last polled duration in ms
      durationMs: duration,
      uriLength: audioUri.length,
    });
    setIsTranscribing(true);
    try {
      const transcript = await transcribeAudio(audioUri);
      if (transcript) {
        onTranscriptionComplete(transcript);
      } else {
        Alert.alert('Transcription failed', 'Could not transcribe audio. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to transcribe audio. Please try again.');
    } finally {
      setIsTranscribing(false);
      setDuration(0);
    }
  };

  // Poll recording status while recording
  useEffect(() => {
    if (isRecording) {
      statusIntervalRef.current = setInterval(async () => {
        const status = await getRecordingStatus();
        if (status.isRecording) {
          setDuration(status.duration);
          // Auto-stop and transcribe when we hit the hard cap
          if (status.duration >= MAX_RECORDING_MS && !isTranscribing) {
            setIsRecording(false);
            const audioUri = await stopRecording();
            if (audioUri) {
              await transcribeFromUri(audioUri);
            }
          }
        } else {
          setIsRecording(false);
        }
      }, 100); // Update every 100ms
    } else {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
        statusIntervalRef.current = null;
      }
    }

    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, [isRecording]);

  const handlePress = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      const audioUri = await stopRecording();
      
      if (audioUri) {
        // Start transcription
        await transcribeFromUri(audioUri);
      }
    } else {
      // Start recording
      const started = await startRecording();
      if (started) {
        setIsRecording(true);
        setDuration(0);
      } else {
        Alert.alert(
          'Permission required',
          'Please allow microphone access to record your voice.'
        );
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRecording();
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, []);

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {isRecording && (
        <View style={styles.durationContainer}>
          <View style={styles.recordingIndicator} />
          <Text style={styles.durationText}>{formatDuration(duration)}</Text>
        </View>
      )}
      <TouchableOpacity
        style={[
          styles.recordButton,
          isRecording && styles.recordButtonActive,
          (disabled || isTranscribing) && styles.recordButtonDisabled,
        ]}
        onPress={handlePress}
        disabled={disabled || isTranscribing}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {isTranscribing ? (
          <ActivityIndicator size="small" color={colors.buttonPrimary} />
        ) : isRecording ? (
          <StopIcon size={18} color={colors.error || '#FF3B30'} />
        ) : (
          <MicrophoneAltIcon width={24} height={24} />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
  },
  recordButtonActive: {
    opacity: 0.92,
  },
  recordButtonDisabled: {
    opacity: 0.45,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  recordingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error || '#FF3B30',
    marginRight: spacing.xs,
  },
  durationText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
});
