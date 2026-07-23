import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { logEvent } from '../../services/logger';
import {
  cleanupRecording,
  getRecordingStatus,
  startRecording,
  stopRecording,
  VoiceErrorCode,
} from '../../utils/voiceRecording';
import { voiceTranscriptionQueueService } from '../../services/voiceTranscriptionQueueService';
import { PendingVoiceTranscription, VoiceTranscriptionTarget } from '../../types/dream';
import { isOnline } from '../../utils/network';

const micPlayIcon = require('../../assets/icons/action_icons/mic_play.png');
const micStopIcon = require('../../assets/icons/action_icons/mic_stop.png');
const MAX_RECORDING_MS = 5 * 60 * 1000;
const LONG_RECORDING_NOTICE_MS = 4.5 * 60 * 1000;

interface VoiceRecordButtonProps {
  onTranscriptionComplete: (text: string) => void;
  disabled?: boolean;
  surface?: 'plain' | 'field';
  target: VoiceTranscriptionTarget;
}

const messageForError = (code: VoiceErrorCode): { title: string; message: string } => {
  switch (code) {
    case 'offline':
      return { title: 'Saved safely', message: 'We’ll turn your voice note into text when you’re back online.' };
    case 'permission_denied':
      return { title: 'Microphone access needed', message: 'Allow microphone access in Settings to record a dream note.' };
    case 'recording_in_progress':
      return { title: 'Recording already active', message: 'Finish the current recording before starting another one.' };
    case 'audio_too_large':
      return { title: 'Recording is too large', message: 'Keep each voice note under five minutes, then try again.' };
    case 'unauthenticated':
      return { title: 'Please sign in again', message: 'Your session could not be verified. Sign in again, then retry this recording.' };
    case 'rate_limited':
      return { title: 'Please try again shortly', message: 'Transcription is temporarily busy. Your recording is saved and ready to retry.' };
    case 'transcription_in_progress':
      return { title: 'Transcription in progress', message: 'Your saved voice note is already being processed.' };
    case 'request_timeout':
      return { title: 'Transcription took too long', message: 'Your recording is saved. Check your connection and retry without recording again.' };
    case 'invalid_audio':
    case 'audio_unavailable':
      return { title: 'Recording could not be prepared', message: 'The audio file was not available. Please record it again.' };
    case 'misconfigured':
      return { title: 'Voice transcription unavailable', message: 'Voice transcription is temporarily unavailable. You can still type your dream.' };
    case 'recording_failed':
      return { title: 'Could not record', message: 'Please try recording again.' };
    case 'service_unavailable':
    case 'unknown':
    default:
      return { title: 'Transcription unavailable', message: 'Your recording is saved. Please retry in a moment.' };
  }
};

export const VoiceRecordButton: React.FC<VoiceRecordButtonProps> = ({
  onTranscriptionComplete,
  disabled = false,
  surface = 'plain',
  target,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mountedRef = useRef(true);
  const stopInProgressRef = useRef(false);
  const longRecordingNoticeShownRef = useRef(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [pendingItem, setPendingItem] = useState<PendingVoiceTranscription | null>(null);
  const [retrySeconds, setRetrySeconds] = useState<number | null>(null);
  const completionCallbackRef = useRef(onTranscriptionComplete);
  completionCallbackRef.current = onTranscriptionComplete;

  const safelySetState = (callback: () => void) => {
    if (mountedRef.current) callback();
  };

  const showFailure = (code: VoiceErrorCode, retryable: boolean) => {
    const copy = messageForError(code);
    if (code === 'permission_denied') {
      Alert.alert(copy.title, copy.message, [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open Settings', onPress: () => void Linking.openSettings() },
      ]);
      return;
    }

    Alert.alert(copy.title, retryable
      ? `${copy.message} Your saved voice note will keep trying automatically.`
      : copy.message);
  };

  const stopAndQueue = async () => {
    if (stopInProgressRef.current) return;
    stopInProgressRef.current = true;
    safelySetState(() => setIsRecording(false));
    try {
      const result = await stopRecording();
      if (!result.ok) {
        showFailure(result.code, result.retryable);
        return;
      }
      const queued = await voiceTranscriptionQueueService.enqueue(result.value, target);
      setPendingItem(queued);
      const online = await isOnline();
      safelySetState(() => {
        setStatusMessage(online
          ? 'Saved safely. We’re turning your voice note into text now.'
          : 'Saved safely. We’ll turn it into text when you’re back online.');
        setDuration(0);
      });
    } finally {
      stopInProgressRef.current = false;
    }
  };

  useEffect(() => {
    if (!isRecording) return undefined;

    const interval = setInterval(async () => {
      const status = await getRecordingStatus();
      if (!mountedRef.current) return;
      if (!status.isRecording) {
        setIsRecording(false);
        return;
      }
      setDuration(status.duration);
      if (status.duration >= LONG_RECORDING_NOTICE_MS && !longRecordingNoticeShownRef.current) {
        longRecordingNoticeShownRef.current = true;
        setStatusMessage('Almost there — Oneiros will save this note at five minutes.');
      }
      if (status.duration >= MAX_RECORDING_MS) {
        logEvent('voice_recording_max_duration_reached', { durationMs: status.duration });
        void stopAndQueue();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    let claimInFlight = false;
    let deliverRequested = false;

    const applyStatus = (item: PendingVoiceTranscription | null) => {
      if (!item) {
        setPendingItem(null);
        setIsTranscribing(false);
        return;
      }
      setPendingItem(item);
      if (item.status === 'transcribing') {
        setIsTranscribing(true);
        setStatusMessage('You’re back online — transcribing your saved voice note…');
      } else if (item.status === 'retrying') {
        setIsTranscribing(false);
        setStatusMessage('Your voice note is still saved safely. We’ll try again automatically.');
      } else if (item.status === 'needs_attention') {
        setIsTranscribing(false);
        setStatusMessage('Your voice note is saved safely. Choose Retry now whenever you’re ready.');
      } else if (item.status === 'queued') {
        setIsTranscribing(false);
        setStatusMessage('Saved safely. We’ll keep trying when your connection is ready.');
      } else if (item.status === 'completed') {
        setIsTranscribing(false);
      }
    };

    // Sole append path: claimCompleted removes the row, so concurrent calls cannot double-append.
    const deliverCompleted = async () => {
      if (!mountedRef.current) return;
      if (claimInFlight) {
        deliverRequested = true;
        return;
      }
      claimInFlight = true;
      try {
        do {
          deliverRequested = false;
          const transcripts = await voiceTranscriptionQueueService.claimCompleted(target);
          if (!mountedRef.current || transcripts.length === 0) continue;
          transcripts.forEach((transcript) => completionCallbackRef.current(transcript));
          setPendingItem(null);
          setIsTranscribing(false);
          setStatusMessage('Your saved voice note is ready in your text.');
        } while (deliverRequested && mountedRef.current);
      } finally {
        claimInFlight = false;
        if (deliverRequested && mountedRef.current) {
          void deliverCompleted();
        }
      }
    };

    const unsubscribe = voiceTranscriptionQueueService.subscribe((item) => {
      if (item.target.surface !== target.surface || item.target.key !== target.key || !mountedRef.current) return;
      applyStatus(item);
      if (item.status === 'completed') {
        void deliverCompleted();
      }
    });

    void voiceTranscriptionQueueService.getForTarget(target).then((items) => {
      if (!mountedRef.current) return;
      applyStatus(items.at(-1) ?? null);
      return deliverCompleted();
    });

    return unsubscribe;
  }, [target.surface, target.key]);

  useEffect(() => {
    if (pendingItem?.status !== 'retrying') {
      setRetrySeconds(null);
      return undefined;
    }
    const updateCountdown = () => {
      setRetrySeconds(Math.max(0, Math.ceil((Date.parse(pendingItem.nextAttemptAt) - Date.now()) / 1000)));
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [pendingItem?.id, pendingItem?.status, pendingItem?.nextAttemptAt]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      void cleanupRecording();
    };
  }, []);

  const handlePress = async () => {
    if (isRecording) {
      await stopAndQueue();
      return;
    }
    const result = await startRecording();
    if (!result.ok) {
      showFailure(result.code, result.retryable);
      return;
    }
    safelySetState(() => {
      setDuration(0);
      setStatusMessage('Keep speaking — Oneiros is recording.');
      longRecordingNoticeShownRef.current = false;
      setIsRecording(true);
    });
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const retryNow = async () => {
    if (!pendingItem) return;
    setStatusMessage('Trying your safely saved voice note now…');
    await voiceTranscriptionQueueService.retryNow(pendingItem.id);
  };

  const confirmDiscard = () => {
    if (!pendingItem) return;
    Alert.alert(
      'Discard saved voice note?',
      'The local recording will be permanently deleted.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            await voiceTranscriptionQueueService.discard(pendingItem.id);
            if (!mountedRef.current) return;
            setPendingItem(null);
            setStatusMessage(null);
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {isRecording && (
        <View style={styles.durationContainer}>
          <Text accessibilityLiveRegion="polite" style={styles.durationText}>
            {formatDuration(duration)}
          </Text>
        </View>
      )}
      {statusMessage && <Text accessibilityLiveRegion="polite" style={styles.statusText}>{statusMessage}</Text>}
      {retrySeconds != null && (
        <Text accessibilityLiveRegion="polite" style={styles.retryCountdown}>
          {retrySeconds > 0 ? `Automatic retry in ${retrySeconds}s` : 'Automatic retry starting…'}
        </Text>
      )}
      {pendingItem && ['queued', 'retrying', 'needs_attention'].includes(pendingItem.status) && (
        <View style={styles.recoveryActions}>
          <TouchableOpacity accessibilityRole="button" onPress={retryNow} testID="voice-retry-now">
            <Text style={styles.recoveryActionText}>Retry now</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={confirmDiscard} testID="voice-discard">
            <Text style={styles.discardActionText}>Discard</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity
        accessibilityHint={isRecording ? 'Stops recording and begins transcription' : 'Starts a voice recording'}
        accessibilityLabel={isRecording ? 'Stop voice recording' : 'Start voice recording'}
        accessibilityRole="button"
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
          <ActivityIndicator accessibilityLabel="Transcribing voice recording" size="small" color={colors.buttonPrimary} />
        ) : isRecording ? (
          <Image source={micStopIcon} style={styles.stopIconImage} resizeMode="contain" testID="voice-record-stop-icon" />
        ) : (
          <Image source={micPlayIcon} style={styles.playIconImage} resizeMode="contain" testID="voice-record-play-icon" />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  recordButton: { alignItems: 'center', justifyContent: 'center', padding: spacing.xs },
  fieldRecordButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'transparent' },
  recordButtonActive: { opacity: 0.92 },
  recordButtonDisabled: { opacity: 0.45 },
  playIconImage: { width: 29, height: 29 },
  stopIconImage: { width: 40, height: 40 },
  durationContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  durationText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  statusText: {
    maxWidth: 180,
    marginBottom: spacing.xs,
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
  },
  recoveryActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  retryCountdown: {
    marginBottom: spacing.xs,
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
  recoveryActionText: {
    color: colors.textAccent,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  discardActionText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
});
