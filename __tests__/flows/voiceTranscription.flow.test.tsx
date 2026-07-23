import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { VoiceRecordButton } from '../../src/components/ui/VoiceRecordButton';

const mockStartRecording = jest.fn();
const mockStopRecording = jest.fn();
const mockGetRecordingStatus = jest.fn();
const mockCleanupRecording = jest.fn();
const mockTranscribeAudio = jest.fn();
const mockDiscardPendingClip = jest.fn();
const mockEnqueue = jest.fn();

jest.mock('../../src/utils/voiceRecording', () => ({
  startRecording: (...args: unknown[]) => mockStartRecording(...args),
  stopRecording: (...args: unknown[]) => mockStopRecording(...args),
  getRecordingStatus: (...args: unknown[]) => mockGetRecordingStatus(...args),
  cleanupRecording: (...args: unknown[]) => mockCleanupRecording(...args),
  transcribeAudio: (...args: unknown[]) => mockTranscribeAudio(...args),
  discardPendingClip: (...args: unknown[]) => mockDiscardPendingClip(...args),
}));

jest.mock('../../src/services/logger', () => ({ logEvent: jest.fn() }));
jest.mock('../../src/utils/network', () => ({ isOnline: jest.fn().mockResolvedValue(true) }));
jest.mock('../../src/services/voiceTranscriptionQueueService', () => ({
  voiceTranscriptionQueueService: {
    enqueue: (...args: unknown[]) => mockEnqueue(...args),
    subscribe: jest.fn(() => () => undefined),
    getForTarget: jest.fn().mockResolvedValue([]),
    claimCompleted: jest.fn().mockResolvedValue([]),
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
      value: { id: 'voice-flow', uri: 'file://clip.m4a', sizeBytes: 500, durationMs: 2_000 },
    });
    mockGetRecordingStatus.mockResolvedValue({ isRecording: true, duration: 1_000, uri: null });
    mockTranscribeAudio.mockResolvedValue({ ok: true, value: 'remembered dream scene' });
    mockDiscardPendingClip.mockResolvedValue(undefined);
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
    expect(screen.getByText(/Saved safely/i)).toBeTruthy();
  });
});
