import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { VoiceRecordButton } from '../src/components/ui/VoiceRecordButton';

jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

const mockStartRecording = jest.fn();
const mockStopRecording = jest.fn();
const mockGetRecordingStatus = jest.fn();
const mockCleanupRecording = jest.fn();
const mockTranscribeAudio = jest.fn();
const mockDiscardPendingClip = jest.fn();
const mockIsInsufficientStorageFailure = jest.fn();
const mockRetryNow = jest.fn();
const mockDiscard = jest.fn();
const mockGetForTarget = jest.fn();
const mockSubscribe = jest.fn();

jest.mock('../src/utils/voiceRecording', () => ({
  startRecording: (...args: unknown[]) => mockStartRecording(...args),
  stopRecording: (...args: unknown[]) => mockStopRecording(...args),
  getRecordingStatus: (...args: unknown[]) => mockGetRecordingStatus(...args),
  cleanupRecording: (...args: unknown[]) => mockCleanupRecording(...args),
  transcribeAudio: (...args: unknown[]) => mockTranscribeAudio(...args),
  discardPendingClip: (...args: unknown[]) => mockDiscardPendingClip(...args),
  isInsufficientStorageFailure: (...args: unknown[]) => mockIsInsufficientStorageFailure(...args),
}));

jest.mock('../src/services/logger', () => ({
  logEvent: jest.fn(),
  logError: jest.fn(),
}));
jest.mock('../src/utils/network', () => ({ isOnline: jest.fn().mockResolvedValue(true) }));
jest.mock('../src/services/voiceTranscriptionQueueService', () => ({
  voiceTranscriptionQueueService: {
    enqueue: jest.fn(),
    subscribe: (...args: unknown[]) => mockSubscribe(...args),
    getForTarget: (...args: unknown[]) => mockGetForTarget(...args),
    peekCompleted: jest.fn().mockResolvedValue([]),
    commitCompleted: jest.fn().mockResolvedValue({ text: '', composerRevision: 0 }),
    acknowledgeComposerIntegration: jest.fn(),
    acknowledge: jest.fn(),
    retryNow: (...args: unknown[]) => mockRetryNow(...args),
    discard: (...args: unknown[]) => mockDiscard(...args),
  },
}));

describe('VoiceRecordButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStartRecording.mockResolvedValue({ ok: true, value: undefined });
    mockStopRecording.mockResolvedValue({
      ok: true,
      value: {
        id: 'voice-test',
        userId: 'user-1',
        uri: 'file://clip.m4a',
        sizeBytes: 12,
        durationMs: 1_000,
      },
    });
    mockGetRecordingStatus.mockResolvedValue({ isRecording: false, duration: 0 });
    mockTranscribeAudio.mockResolvedValue({ ok: true, value: 'transcribed' });
    mockDiscardPendingClip.mockResolvedValue(undefined);
    mockIsInsufficientStorageFailure.mockResolvedValue(false);
    mockGetForTarget.mockResolvedValue([]);
    mockSubscribe.mockImplementation(() => () => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows play by default and swaps to stop while recording', async () => {
    const onTranscriptionComplete = jest.fn();
    const screen = render(
      <VoiceRecordButton target={{ surface: 'write', key: 'active' }} onTranscriptionComplete={onTranscriptionComplete} />
    );

    expect(screen.getByTestId('voice-record-play-icon')).toBeTruthy();
    expect(screen.queryByTestId('voice-record-stop-icon')).toBeNull();

    fireEvent.press(screen.getByTestId('voice-record-button'));

    await waitFor(() => {
      expect(mockStartRecording).toHaveBeenCalled();
      expect(screen.getByTestId('voice-record-stop-icon')).toBeTruthy();
    });

    expect(screen.queryByTestId('voice-record-play-icon')).toBeNull();
  });

  it('invalidates a deferred native start when the component unmounts', async () => {
    let resolveStart!: (value: { ok: true; value: undefined }) => void;
    mockStartRecording.mockImplementationOnce(() => new Promise((resolve) => {
      resolveStart = resolve;
    }));
    const screen = render(
      <VoiceRecordButton
        target={{ surface: 'write', key: 'active' }}
        onTranscriptionComplete={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId('voice-record-button'));
    await waitFor(() => expect(mockStartRecording).toHaveBeenCalledTimes(1));
    screen.unmount();

    expect(mockCleanupRecording).toHaveBeenCalled();
    await act(async () => resolveStart({ ok: true, value: undefined }));

    expect(mockStopRecording).not.toHaveBeenCalled();
    expect(mockCleanupRecording).toHaveBeenCalledTimes(2);
  });

  it('switches directly from stop to progress without flashing the microphone', async () => {
    let resolveStop!: (value: { ok: false; code: 'recording_failed'; retryable: true }) => void;
    mockStopRecording.mockImplementationOnce(() => new Promise((resolve) => {
      resolveStop = resolve;
    }));
    const screen = render(
      <VoiceRecordButton
        target={{ surface: 'write', key: 'active' }}
        onTranscriptionComplete={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId('voice-record-button'));
    await waitFor(() => expect(screen.getByTestId('voice-record-stop-icon')).toBeTruthy());

    fireEvent.press(screen.getByTestId('voice-record-button'));

    expect(screen.getByLabelText('Preparing voice recording')).toBeTruthy();
    expect(screen.queryByTestId('voice-record-play-icon')).toBeNull();
    expect(screen.queryByTestId('voice-record-stop-icon')).toBeNull();

    await act(async () => resolveStop({ ok: false, code: 'recording_failed', retryable: true }));
    await waitFor(() => expect(screen.getByTestId('voice-record-play-icon')).toBeTruthy());
  });

  it('explains low storage without advising the user to record again', async () => {
    mockStartRecording.mockResolvedValueOnce({
      ok: false,
      code: 'insufficient_storage',
      retryable: false,
    });
    const screen = render(
      <VoiceRecordButton
        target={{ surface: 'write', key: 'active' }}
        onTranscriptionComplete={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId('voice-record-button'));

    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith(
      'Not enough storage',
      'Free up some space and try again. You can still write your dream.',
    ));
    expect(screen.getByTestId('voice-record-play-icon')).toBeTruthy();
  });

  it('keeps a finalized clip recoverable when queue persistence fails on a full disk', async () => {
    const enqueue = jest
      .requireMock('../src/services/voiceTranscriptionQueueService')
      .voiceTranscriptionQueueService.enqueue as jest.Mock;
    enqueue.mockRejectedValueOnce(Object.assign(new Error('database or disk is full'), { code: 'SQLITE_FULL' }));
    mockIsInsufficientStorageFailure.mockResolvedValueOnce(true);
    const screen = render(
      <VoiceRecordButton
        target={{ surface: 'write', key: 'active' }}
        onTranscriptionComplete={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId('voice-record-button'));
    await waitFor(() => expect(screen.getByTestId('voice-record-stop-icon')).toBeTruthy());
    fireEvent.press(screen.getByTestId('voice-record-button'));

    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith(
      'Not enough storage',
      'Your voice note is still on this device and may be recoverable after you free up some space. You can still write your dream.',
    ));
    expect(screen.getByTestId('voice-record-play-icon')).toBeTruthy();

    enqueue.mockResolvedValueOnce({
      id: 'voice-test',
      userId: 'user-1',
      audioUri: 'file://clip.m4a',
      sizeBytes: 12,
      durationMs: 1_000,
      target: { surface: 'write', key: 'active' },
      status: 'queued',
      createdAt: new Date().toISOString(),
      nextAttemptAt: new Date().toISOString(),
      attemptCount: 0,
    });
    fireEvent.press(screen.getByTestId('voice-record-button'));
    await waitFor(() => expect(enqueue).toHaveBeenCalledTimes(2));
  });

  it('finalizes exactly once when the native recorder reports an error', async () => {
    jest.useFakeTimers();
    mockGetRecordingStatus.mockResolvedValue({
      isRecording: false,
      duration: 2_000,
      uri: 'file://partial.m4a',
      hasError: true,
      error: 'native_recording_error',
    });
    const enqueue = jest
      .requireMock('../src/services/voiceTranscriptionQueueService')
      .voiceTranscriptionQueueService.enqueue as jest.Mock;
    enqueue.mockResolvedValue({
      id: 'voice-test',
      userId: 'user-1',
      audioUri: 'file://clip.m4a',
      sizeBytes: 12,
      durationMs: 1_000,
      target: { surface: 'write', key: 'active' },
      status: 'queued',
      createdAt: new Date().toISOString(),
      nextAttemptAt: new Date().toISOString(),
      attemptCount: 0,
    });
    const screen = render(
      <VoiceRecordButton
        target={{ surface: 'write', key: 'active' }}
        onTranscriptionComplete={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId('voice-record-button'));
    await act(async () => {
      await Promise.resolve();
      await jest.advanceTimersByTimeAsync(500);
    });
    await waitFor(() => expect(mockStopRecording).toHaveBeenCalledTimes(1));
    expect(enqueue).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('restores saved queue status and exposes retry and discard actions', async () => {
    mockGetForTarget.mockResolvedValue([{
      id: 'voice-pending',
      userId: 'user-1',
      audioUri: 'file://pending.m4a',
      sizeBytes: 120,
      durationMs: 2_000,
      target: { surface: 'write', key: 'active' },
      status: 'retrying',
      createdAt: new Date().toISOString(),
      nextAttemptAt: new Date(Date.now() + 10_000).toISOString(),
      attemptCount: 1,
    }]);
    const screen = render(
      <VoiceRecordButton
        target={{ surface: 'write', key: 'active' }}
        onTranscriptionComplete={jest.fn()}
      />,
    );

    await waitFor(() => expect(screen.getByTestId('voice-retry-now')).toBeTruthy());
    fireEvent.press(screen.getByTestId('voice-retry-now'));
    await waitFor(() => expect(mockRetryNow).toHaveBeenCalledWith('voice-pending'));

    fireEvent.press(screen.getByTestId('voice-discard'));
    const buttons = (Alert.alert as jest.Mock).mock.calls.at(-1)?.[2];
    await act(async () => buttons[1].onPress());
    expect(mockDiscard).toHaveBeenCalledWith('voice-pending');
  });

  it('contains a target-restore storage rejection without destabilizing the control', async () => {
    mockGetForTarget.mockRejectedValueOnce(new Error('AsyncStorage unavailable'));
    const logError = jest.requireMock('../src/services/logger').logError as jest.Mock;

    const screen = render(
      <VoiceRecordButton
        target={{ surface: 'write', key: 'active' }}
        onTranscriptionComplete={jest.fn()}
      />,
    );

    await waitFor(() => expect(logError).toHaveBeenCalledWith(
      'voice_transcription_target_restore_error',
      expect.any(Error),
    ));
    expect(screen.getByTestId('voice-record-button')).toBeTruthy();
    expect(screen.getByTestId('voice-record-play-icon')).toBeTruthy();
  });

  it('uses neutral transcribing copy on mount instead of reconnect copy', async () => {
    mockGetForTarget.mockResolvedValue([{
      id: 'voice-transcribing',
      userId: 'user-1',
      audioUri: 'file://pending.m4a',
      sizeBytes: 120,
      durationMs: 2_000,
      target: { surface: 'write', key: 'active' },
      status: 'transcribing',
      createdAt: new Date().toISOString(),
      nextAttemptAt: new Date().toISOString(),
      attemptCount: 1,
    }]);

    const screen = render(
      <VoiceRecordButton
        target={{ surface: 'write', key: 'active' }}
        onTranscriptionComplete={jest.fn()}
      />,
    );

    await waitFor(() => expect(screen.getByText('Turning your voice note into text…')).toBeTruthy());
    expect(screen.queryByText('You’re back online — transcribing your saved voice note…')).toBeNull();
  });

  it('shows a durable transcript before failed cleanup and leaves its tombstone for retry', async () => {
    const queue = jest
      .requireMock('../src/services/voiceTranscriptionQueueService')
      .voiceTranscriptionQueueService;
    const deliveryOrder: string[] = [];
    let durableStatus = 'completed';
    const onTranscriptionComplete = jest.fn(() => deliveryOrder.push('visible'));
    queue.peekCompleted.mockResolvedValueOnce([{ id: 'voice-complete', transcript: 'transcribed line' }]);
    queue.commitCompleted.mockResolvedValueOnce({
      text: 'existing\ntranscribed line',
      composerRevision: 4,
    });
    queue.acknowledge.mockImplementationOnce(async () => {
      deliveryOrder.push('cleanup');
      durableStatus = 'deletion_pending';
      throw new Error('sidecar cleanup failed');
    });

    const screen = render(
      <VoiceRecordButton
        target={{ surface: 'write', key: 'active' }}
        getComposerText={() => 'existing'}
        onTranscriptionComplete={onTranscriptionComplete}
      />
    );

    await waitFor(() => expect(onTranscriptionComplete).toHaveBeenCalledWith('existing\ntranscribed line'));
    expect(screen.queryByText('Turning your voice note into text…')).toBeNull();
    expect(deliveryOrder).toEqual(['visible', 'cleanup']);
    expect(durableStatus).toBe('deletion_pending');
    expect(queue.commitCompleted).toHaveBeenCalledWith(
      { surface: 'write', key: 'active' },
      { id: 'voice-complete', transcript: 'transcribed line' },
      'existing',
    );
    expect(queue.acknowledgeComposerIntegration).toHaveBeenCalledWith(
      { surface: 'write', key: 'active' },
      'voice-complete',
      4,
    );
    expect(queue.acknowledge).toHaveBeenCalledWith('voice-complete');
  });

  it('keeps compact presentation icon-only even when queue status exists', async () => {
    mockGetForTarget.mockResolvedValue([{
      id: 'voice-queued',
      userId: 'user-1',
      audioUri: 'file://pending.m4a',
      sizeBytes: 120,
      durationMs: 2_000,
      target: { surface: 'dream-chat', key: 'dream-1' },
      status: 'queued',
      createdAt: new Date().toISOString(),
      nextAttemptAt: new Date(Date.now() + 10_000).toISOString(),
      attemptCount: 1,
    }]);

    const screen = render(
      <VoiceRecordButton
        presentation="compact"
        target={{ surface: 'dream-chat', key: 'dream-1' }}
        onTranscriptionComplete={jest.fn()}
      />,
    );

    await waitFor(() => expect(screen.getByTestId('voice-record-button')).toBeTruthy());
    expect(screen.queryByText(/Saved safely/i)).toBeNull();
    expect(screen.queryByTestId('voice-retry-now')).toBeNull();
    expect(screen.queryByTestId('voice-discard')).toBeNull();
  });

  it('finalizes and queues an active recording when its surface unmounts', async () => {
    const enqueue = jest
      .requireMock('../src/services/voiceTranscriptionQueueService')
      .voiceTranscriptionQueueService.enqueue as jest.Mock;
    const screen = render(
      <VoiceRecordButton
        target={{ surface: 'write', key: 'active' }}
        onTranscriptionComplete={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId('voice-record-button'));
    await waitFor(() => expect(screen.getByTestId('voice-record-stop-icon')).toBeTruthy());
    screen.unmount();

    await waitFor(() => expect(mockStopRecording).toHaveBeenCalled());
    await waitFor(() => expect(enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'voice-test' }),
      { surface: 'write', key: 'active' },
    ));
  });
});
