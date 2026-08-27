import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { logError, logEvent } from '../../services/logger';
import {
  cleanupRecording,
  getRecordingStatus,
  isInsufficientStorageFailure,
  startRecording,
  stopRecording,
  VoiceErrorCode,
  type PendingVoiceClip,
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
  getComposerText?: () => string;
  disabled?: boolean;
  surface?: 'plain' | 'field';
  target: VoiceTranscriptionTarget;
  presentation?: 'full' | 'compact';
}

const messageForError = (code: VoiceErrorCode): { title: string; message: string } => {
  switch (code) {
    case 'offline':
      return { title: 'Saved safely', message: 'We’ll turn your voice note into text when you’re back online.' };
    case 'permission_denied':
      return { title: 'Microphone access needed', message: 'Allow microphone access in Settings to record a dream note.' };
    case 'recording_in_progress':
      return { title: 'Recording already active', message: 'Finish the current recording before starting another one.' };
    case 'insufficient_storage':
      return {
        title: 'Not enough storage',
        message: 'Free up some space and try again. You can still write your dream.',
      };
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
    case 'low_confidence_transcript':
      return {
        title: 'We couldn’t hear this clearly',
        message: 'Your voice note is still saved. You can retry it or record it again.',
      };
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

const getQueueStatusMessage = (item: PendingVoiceTranscription): string | null => {
  switch (item.status) {
    case 'transcribing':
      return 'Turning your voice note into text…';
    case 'retrying':
    case 'queued':
      return 'Saved offline. We’ll keep trying.';
    case 'needs_attention':
      return 'Voice note saved. Retry now or discard.';
    case 'completed':
      return null;
    default:
      return null;
  }
};

export const VoiceRecordButton: React.FC<VoiceRecordButtonProps> = ({
  onTranscriptionComplete,
  getComposerText = () => '',
  disabled = false,
  surface = 'plain',
  target,
  presentation = 'full',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const mountedRef = useRef(true);
  const isRecordingRef = useRef(false);
  const unqueuedClipRef = useRef<PendingVoiceClip | null>(null);
  const stopInProgressRef = useRef(false);
  const startInProgressRef = useRef(false);
  const longRecordingNoticeShownRef = useRef(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [pendingItem, setPendingItem] = useState<PendingVoiceTranscription | null>(null);
  const pendingItemRef = useRef<PendingVoiceTranscription | null>(null);
  const [retrySeconds, setRetrySeconds] = useState<number | null>(null);
  const completionCallbackRef = useRef(onTranscriptionComplete);
  completionCallbackRef.current = onTranscriptionComplete;
  const composerTextRef = useRef(getComposerText);
  composerTextRef.current = getComposerText;

  const safelySetState = (callback: () => void) => {
    if (mountedRef.current) callback();
  };

  const showFailure = (code: VoiceErrorCode) => {
    const copy = messageForError(code);
    if (code === 'permission_denied') {
      Alert.alert(copy.title, copy.message, [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open Settings', onPress: () => void Linking.openSettings() },
      ]);
      return;
    }

    Alert.alert(copy.title, copy.message);
  };

  const showStorageRecovery = () => {
    Alert.alert(
      'Not enough storage',
      'Your voice note is still on this device and may be recoverable after you free up some space. You can still write your dream.',
    );
  };

  const stopAndQueue = async () => {
    if (stopInProgressRef.current) return;
    stopInProgressRef.current = true;
    isRecordingRef.current = false;
    safelySetState(() => {
      setIsRecording(false);
      setIsFinalizing(true);
    });
    try {
      const result = await stopRecording(target);
      if (!result.ok) {
        showFailure(result.code);
        return;
      }
      let queued: PendingVoiceTranscription;
      try {
        queued = await voiceTranscriptionQueueService.enqueue(result.value, target);
        unqueuedClipRef.current = null;
      } catch (error) {
        unqueuedClipRef.current = result.value;
        logError('voice_transcription_enqueue_error', error, {
          sizeBytes: result.value.sizeBytes,
          durationMs: result.value.durationMs,
        });
        if (await isInsufficientStorageFailure(error)) {
          showStorageRecovery();
        } else {
          Alert.alert(
            'Voice note needs attention',
            'The recording is still on this device, but it could not be prepared for transcription. Tap the microphone to retry before leaving this screen.',
          );
        }
        return;
      }
      pendingItemRef.current = queued;
      safelySetState(() => setPendingItem(queued));
      const online = await isOnline();
      safelySetState(() => {
        const current = pendingItemRef.current;
        setIsTranscribing(online
          && current?.id === queued.id
          && ['queued', 'transcribing'].includes(current.status));
        setStatusMessage(online ? 'Turning your voice note into text…' : 'Saved offline. We’ll keep trying.');
        setDuration(0);
      });
    } finally {
      safelySetState(() => setIsFinalizing(false));
      stopInProgressRef.current = false;
    }
  };

  useEffect(() => {
    if (!isRecording) return undefined;

    const interval = setInterval(async () => {
      const status = await getRecordingStatus();
      if (!mountedRef.current) return;
      if (status.hasError) {
        logEvent('voice_recording_native_error_detected', {
          hasRecoverableUri: Boolean(status.uri),
          durationMs: status.duration,
        });
        void stopAndQueue();
        return;
      }
      if (!status.isRecording) {
        void stopAndQueue();
        return;
      }
      setDuration(status.duration);
      if (status.duration >= LONG_RECORDING_NOTICE_MS && !longRecordingNoticeShownRef.current) {
        longRecordingNoticeShownRef.current = true;
        setStatusMessage(null);
      }
      if (status.duration >= MAX_RECORDING_MS) {
        logEvent('voice_recording_max_duration_reached', { durationMs: status.duration });
        void stopAndQueue();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active' && isRecordingRef.current) void stopAndQueue();
    });
    return () => subscription.remove();
  }, [target.surface, target.key]);

  useEffect(() => {
    let claimInFlight = false;
    let deliverRequested = false;

    const applyStatus = (item: PendingVoiceTranscription | null) => {
      pendingItemRef.current = item;
      if (!item) {
        setPendingItem(null);
        setIsTranscribing(false);
        setStatusMessage(null);
        return;
      }
      setPendingItem(item);
      if (item.status === 'transcribing') {
        setIsTranscribing(true);
      } else if (item.status === 'completed') {
        setIsTranscribing(false);
      } else {
        setIsTranscribing(false);
      }
      setStatusMessage(getQueueStatusMessage(item));
    };

    // Delivery is committed durably with clip-id dedupe before queue/audio ack.
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
          const transcripts = await voiceTranscriptionQueueService.peekCompleted(target);
          for (const transcript of transcripts) {
            const committed = await voiceTranscriptionQueueService.commitCompleted(
              target,
              transcript,
              composerTextRef.current(),
            );
            // Durable composer commit is the delivery boundary. Reflect it in
            // the current input immediately; filesystem cleanup is independent
            // and must never hide text that is already safely committed.
            if (mountedRef.current) {
              completionCallbackRef.current(committed.text);
              try {
                await voiceTranscriptionQueueService.acknowledgeComposerIntegration(
                  target,
                  transcript.id,
                  committed.composerRevision,
                );
              } catch (error) {
                // Leave the explicit pending-delivery ledger intact. Hydration
                // can acknowledge it later without substring inference.
                logError('voice_transcription_composer_integration_deferred', error);
              }
            }
            try {
              await voiceTranscriptionQueueService.acknowledge(transcript.id);
            } catch (error) {
              // removeItemUnlocked already persisted deletion_pending before
              // destructive work; retry cleanup without withholding the text.
              logError('voice_transcription_cleanup_deferred', error);
            }
          }
          if (!mountedRef.current || transcripts.length === 0) continue;
          pendingItemRef.current = null;
          setPendingItem(null);
          setIsTranscribing(false);
          setStatusMessage(null);
        } while (deliverRequested && mountedRef.current);
      } catch (error) {
        // The completed queue row remains durable unless acknowledge succeeded;
        // a later foreground/subscription event can safely resume delivery.
        logError('voice_transcription_delivery_deferred', error);
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
    }).catch((error) => {
      // A storage bridge failure must not become an unhandled rejection that
      // destabilizes the Write surface. File-backed recovery remains available
      // on the next foreground/read attempt.
      logError('voice_transcription_target_restore_error', error);
    });

    return unsubscribe;
  }, [target.surface, target.key]);

  useEffect(() => {
    if (pendingItem?.status !== 'retrying') return undefined;
    const updateCountdown = () => {
      setRetrySeconds(Math.max(0, Math.ceil((Date.parse(pendingItem.nextAttemptAt) - Date.now()) / 1000)));
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [pendingItem?.id, pendingItem?.status, pendingItem?.nextAttemptAt]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (isRecordingRef.current && !stopInProgressRef.current) {
        stopInProgressRef.current = true;
        isRecordingRef.current = false;
        void stopRecording(target)
          .then((result) => result.ok
            ? voiceTranscriptionQueueService.enqueue(result.value, target)
            : undefined)
          .catch((error) => logError('voice_recording_unmount_finalize_error', error))
          .finally(() => {
            stopInProgressRef.current = false;
          });
      } else {
        if (unqueuedClipRef.current) {
          void voiceTranscriptionQueueService.enqueue(unqueuedClipRef.current, target)
            .catch((error) => logError('voice_transcription_unmount_enqueue_error', error));
          unqueuedClipRef.current = null;
        }
        void cleanupRecording();
      }
    };
  }, [target.surface, target.key]);

  const handlePress = async () => {
    if (unqueuedClipRef.current) {
      try {
        const queued = await voiceTranscriptionQueueService.enqueue(unqueuedClipRef.current, target);
        unqueuedClipRef.current = null;
        pendingItemRef.current = queued;
        setPendingItem(queued);
        setStatusMessage('Turning your voice note into text…');
      } catch (error) {
        logError('voice_transcription_enqueue_retry_error', error);
        if (await isInsufficientStorageFailure(error)) {
          showStorageRecovery();
        } else {
          Alert.alert('Voice note still needs attention', 'We still couldn’t prepare it. Please keep this screen open and try once more.');
        }
      }
      return;
    }
    if (isRecording) {
      await stopAndQueue();
      return;
    }
    if (startInProgressRef.current) return;
    startInProgressRef.current = true;
    safelySetState(() => setIsStarting(true));
    try {
      const result = await startRecording();
      if (!mountedRef.current) {
        // Module-level generation cancellation is authoritative. This second
        // cleanup is a defensive handoff for older/mocked implementations that
        // may still resolve success after unmount.
        if (result.ok) void cleanupRecording();
        return;
      }
      if (!result.ok) {
        showFailure(result.code);
        return;
      }
      isRecordingRef.current = true;
      safelySetState(() => {
        setDuration(0);
        setStatusMessage(null);
        longRecordingNoticeShownRef.current = false;
        setIsRecording(true);
      });
    } finally {
      startInProgressRef.current = false;
      safelySetState(() => setIsStarting(false));
    }
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const retryNow = async () => {
    if (!pendingItem) return;
    setStatusMessage('Turning your voice note into text…');
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
            pendingItemRef.current = null;
            setPendingItem(null);
            setStatusMessage(null);
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {presentation === 'full' && isRecording && (
        <View style={styles.durationContainer}>
          <Text accessibilityLiveRegion="polite" style={styles.durationText}>
            {formatDuration(duration)}
          </Text>
        </View>
      )}
      {presentation === 'full' && statusMessage && <Text accessibilityLiveRegion="polite" style={styles.statusText}>{statusMessage}</Text>}
      {presentation === 'full' && pendingItem?.status === 'retrying' && retrySeconds != null && (
        <Text accessibilityLiveRegion="polite" style={styles.retryCountdown}>
          {retrySeconds > 0 ? `Automatic retry in ${retrySeconds}s` : 'Automatic retry starting…'}
        </Text>
      )}
      {presentation === 'full' && pendingItem && ['queued', 'retrying', 'needs_attention'].includes(pendingItem.status) && (
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
          (disabled || isStarting || isFinalizing || isTranscribing) && styles.recordButtonDisabled,
        ]}
        onPress={handlePress}
        disabled={disabled || isStarting || isFinalizing || isTranscribing}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        testID="voice-record-button"
      >
        {isStarting || isFinalizing || isTranscribing ? (
          <ActivityIndicator
            accessibilityLabel={isStarting || isFinalizing
              ? 'Preparing voice recording'
              : 'Transcribing voice recording'}
            size="small"
            color={colors.buttonPrimary}
          />
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
