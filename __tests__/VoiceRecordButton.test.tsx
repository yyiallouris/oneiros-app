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
const mockRetryNow = jest.fn();
const mockDiscard = jest.fn();
const mockGetForTarget = jest.fn();

jest.mock('../src/utils/voiceRecording', () => ({
  startRecording: (...args: unknown[]) => mockStartRecording(...args),
  stopRecording: (...args: unknown[]) => mockStopRecording(...args),
  getRecordingStatus: (...args: unknown[]) => mockGetRecordingStatus(...args),
  cleanupRecording: (...args: unknown[]) => mockCleanupRecording(...args),
  transcribeAudio: (...args: unknown[]) => mockTranscribeAudio(...args),
  discardPendingClip: (...args: unknown[]) => mockDiscardPendingClip(...args),
}));

jest.mock('../src/services/logger', () => ({
  logEvent: jest.fn(),
}));
jest.mock('../src/utils/network', () => ({ isOnline: jest.fn().mockResolvedValue(true) }));
jest.mock('../src/services/voiceTranscriptionQueueService', () => ({
  voiceTranscriptionQueueService: {
    enqueue: jest.fn(),
    subscribe: jest.fn(() => () => undefined),
    getForTarget: (...args: unknown[]) => mockGetForTarget(...args),
    claimCompleted: jest.fn().mockResolvedValue([]),
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
      value: { id: 'voice-test', uri: 'file://clip.m4a', sizeBytes: 12, durationMs: 1_000 },
    });
    mockGetRecordingStatus.mockResolvedValue({ isRecording: false, duration: 0 });
    mockTranscribeAudio.mockResolvedValue({ ok: true, value: 'transcribed' });
    mockDiscardPendingClip.mockResolvedValue(undefined);
    mockGetForTarget.mockResolvedValue([]);
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
});
