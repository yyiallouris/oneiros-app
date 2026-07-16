import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { logEvent } from '../../services/logger';
import { startRecording, stopRecording, getRecordingStatus, cleanupRecording } from '../../utils/voiceRecording';
import { transcribeAudio } from '../../utils/voiceRecording';
const micPlayIcon = require('../../assets/icons/action_icons/mic_play.png');
const micStopIcon = require('../../assets/icons/action_icons/mic_stop.png');

interface VoiceRecordButtonProps {
  onTranscriptionComplete: (text: string) => void;
  disabled?: boolean;
  surface?: 'plain' | 'field';
}

// Hard cap on recording length to avoid very large files / timeouts.
// Allow up to ~3 minutes per clip; on very slow networks this might still hit timeouts.
const MAX_RECORDING_MS = 3 * 60 * 1000; // 3 minutes

export const VoiceRecordButton: React.FC<VoiceRecordButtonProps> = ({
  onTranscriptionComplete,
  disabled = false,
  surface = 'plain',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stopInProgressRef = useRef(false);

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
          if (status.duration >= MAX_RECORDING_MS && !isTranscribing && !stopInProgressRef.current) {
            stopInProgressRef.current = true;
            setIsRecording(false);
            try {
              const audioUri = await stopRecording();
              if (audioUri) {
                await transcribeFromUri(audioUri);
              }
            } finally {
              stopInProgressRef.current = false;
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
      if (stopInProgressRef.current) return;
      stopInProgressRef.current = true;
      setIsRecording(false);
      try {
        const audioUri = await stopRecording();
        
        if (audioUri) {
          // Start transcription
          await transcribeFromUri(audioUri);
        } else {
          Alert.alert('Recording failed', 'The audio file was not saved. Please try again.');
        }
      } finally {
        stopInProgressRef.current = false;
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
          <Text style={styles.durationText}>{formatDuration(duration)}</Text>
        </View>
      )}
      <TouchableOpacity
        style={[
          styles.recordButton,
          surface === 'field' && styles.fieldRecordButton,
          isRecording && styles.recordButtonActive,
          (disabled || isTranscribing) && styles.recordButtonDisabled,
        ]}
        onPress={handlePress}
        disabled={disabled || isTranscribing}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        testID="voice-record-button"
      >
        {isTranscribing ? (
          <ActivityIndicator size="small" color={colors.buttonPrimary} />
        ) : isRecording ? (
          <Image
            source={micStopIcon}
            style={styles.stopIconImage}
            resizeMode="contain"
            testID="voice-record-stop-icon"
          />
        ) : (
          <Image
            source={micPlayIcon}
            style={styles.playIconImage}
            resizeMode="contain"
            testID="voice-record-play-icon"
          />
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
  fieldRecordButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  recordButtonActive: {
    opacity: 0.92,
  },
  recordButtonDisabled: {
    opacity: 0.45,
  },
  playIconImage: {
    width: 29,
    height: 29,
  },
  stopIconImage: {
    width: 40,
    height: 40,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  durationText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
});
