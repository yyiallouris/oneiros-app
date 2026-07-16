import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { VoiceRecordButton } from '../src/components/ui/VoiceRecordButton';

const mockStartRecording = jest.fn();
const mockStopRecording = jest.fn();
const mockGetRecordingStatus = jest.fn();
const mockCleanupRecording = jest.fn();
const mockTranscribeAudio = jest.fn();

jest.mock('../src/utils/voiceRecording', () => ({
  startRecording: (...args: unknown[]) => mockStartRecording(...args),
  stopRecording: (...args: unknown[]) => mockStopRecording(...args),
  getRecordingStatus: (...args: unknown[]) => mockGetRecordingStatus(...args),
  cleanupRecording: (...args: unknown[]) => mockCleanupRecording(...args),
  transcribeAudio: (...args: unknown[]) => mockTranscribeAudio(...args),
}));

jest.mock('../src/services/logger', () => ({
  logEvent: jest.fn(),
}));

describe('VoiceRecordButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStartRecording.mockResolvedValue(true);
    mockStopRecording.mockResolvedValue('file://clip.m4a');
    mockGetRecordingStatus.mockResolvedValue({ isRecording: false, duration: 0 });
    mockTranscribeAudio.mockResolvedValue('transcribed');
  });

  it('shows play by default and swaps to stop while recording', async () => {
    const onTranscriptionComplete = jest.fn();
    const screen = render(
      <VoiceRecordButton onTranscriptionComplete={onTranscriptionComplete} />
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
});
