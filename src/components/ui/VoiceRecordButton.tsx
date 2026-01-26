import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { startRecording, stopRecording, getRecordingStatus, cleanupRecording } from '../../utils/voiceRecording';
import { transcribeAudio } from '../../utils/voiceRecording';

interface VoiceRecordButtonProps {
  onTranscriptionComplete: (text: string) => void;
  disabled?: boolean;
}

// Microphone icon
const MicIcon = ({ size = 24, color = colors.white }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
      fill={color}
    />
    <Path
      d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Stop icon
const StopIcon = ({ size = 24, color = colors.white }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 6h12v12H6z"
      fill={color}
    />
  </Svg>
);

export const VoiceRecordButton: React.FC<VoiceRecordButtonProps> = ({
  onTranscriptionComplete,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll recording status while recording
  useEffect(() => {
    if (isRecording) {
      statusIntervalRef.current = setInterval(async () => {
        const status = await getRecordingStatus();
        if (status.isRecording) {
          setDuration(status.duration);
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
      >
        {isTranscribing ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : isRecording ? (
          <StopIcon size={20} color={colors.white} />
        ) : (
          <MicIcon size={20} color={colors.white} />
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  recordButtonActive: {
    backgroundColor: colors.error || '#FF3B30',
  },
  recordButtonDisabled: {
    opacity: 0.5,
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
