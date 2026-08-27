import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { VoiceRecordButton } from '../../src/components/ui/VoiceRecordButton';

jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

const mockStartRecording = jest.fn();
const mockStopRecording = jest.fn();
const mockGetRecordingStatus = jest.fn();
const mockCleanupRecording = jest.fn();
const mockTranscribeAudio = jest.fn();
const mockDiscardPendingClip = jest.fn();
const mockIsInsufficientStorageFailure = jest.fn();
const mockEnqueue = jest.fn();

jest.mock('../../src/utils/voiceRecording', () => ({
  startRecording: (...args: unknown[]) => mockStartRecording(...args),
  stopRecording: (...args: unknown[]) => mockStopRecording(...args),
  getRecordingStatus: (...args: unknown[]) => mockGetRecordingStatus(...args),
  cleanupRecording: (...args: unknown[]) => mockCleanupRecording(...args),
  transcribeAudio: (...args: unknown[]) => mockTranscribeAudio(...args),
  discardPendingClip: (...args: unknown[]) => mockDiscardPendingClip(...args),
  isInsufficientStorageFailure: (...args: unknown[]) => mockIsInsufficientStorageFailure(...args),
}));

jest.mock('../../src/services/logger', () => ({ logEvent: jest.fn(), logError: jest.fn() }));
jest.mock('../../src/utils/network', () => ({ isOnline: jest.fn().mockResolvedValue(true) }));
jest.mock('../../src/services/voiceTranscriptionQueueService', () => ({
  voiceTranscriptionQueueService: {
    enqueue: (...args: unknown[]) => mockEnqueue(...args),
    subscribe: jest.fn(() => () => undefined),
    getForTarget: jest.fn().mockResolvedValue([]),
    peekCompleted: jest.fn().mockResolvedValue([]),
    commitCompleted: jest.fn().mockResolvedValue({ text: '', composerRevision: 0 }),
    acknowledgeComposerIntegration: jest.fn(),
    acknowledge: jest.fn(),
    retryNow: jest.fn(),
    discard: jest.fn(),
  },
}));

describe('voice transcription flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStartRecording.mockResolvedValue({ ok: true, value: undefined });
    mockStopRecording.mockResolvedValue({
      ok: true,
      value: {
        id: 'voice-flow',
        userId: 'user-1',
        uri: 'file://clip.m4a',
        sizeBytes: 500,
        durationMs: 2_000,
      },
    });
    mockGetRecordingStatus.mockResolvedValue({ isRecording: true, duration: 1_000, uri: null });
    mockTranscribeAudio.mockResolvedValue({ ok: true, value: 'remembered dream scene' });
    mockDiscardPendingClip.mockResolvedValue(undefined);
    mockIsInsufficientStorageFailure.mockResolvedValue(false);
    mockEnqueue.mockResolvedValue({
      id: 'voice-flow',
      userId: 'user-1',
      audioUri: 'file://clip.m4a',
      sizeBytes: 500,
      durationMs: 2_000,
      target: { surface: 'write', key: 'active' },
      status: 'queued',
      createdAt: new Date().toISOString(),
      nextAttemptAt: new Date().toISOString(),
      attemptCount: 0,
    });
  });

  it('records and saves the clip into the durable transcription queue', async () => {
    const onTranscriptionComplete = jest.fn();
    const screen = render(
      <VoiceRecordButton
        target={{ surface: 'write', key: 'active' }}
        onTranscriptionComplete={onTranscriptionComplete}
      />,
    );

    fireEvent.press(screen.getByTestId('voice-record-button'));
    await waitFor(() => expect(screen.getByTestId('voice-record-stop-icon')).toBeTruthy());

    fireEvent.press(screen.getByTestId('voice-record-button'));
    await waitFor(() => expect(mockEnqueue).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'voice-flow' }),
      { surface: 'write', key: 'active' },
    ));
    expect(screen.getByText('Turning your voice note into text…')).toBeTruthy();
  });

  it('shows uninterrupted progress as soon as Stop is pressed', async () => {
    let resolveStop!: (value: Awaited<ReturnType<typeof mockStopRecording>>) => void;
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

    await act(async () => resolveStop({
      ok: false,
      code: 'recording_failed',
      retryable: true,
    }));
  });

  it('blocks capture safely and keeps typing available when device storage is low', async () => {
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
    expect(mockStopRecording).not.toHaveBeenCalled();
    expect(mockEnqueue).not.toHaveBeenCalled();
    expect(screen.getByTestId('voice-record-play-icon')).toBeTruthy();
  });
});
