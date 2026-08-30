/**
 * Flow coverage: documentation/flows-08-support-legal-contact.md
 * (support delivery feedback, retained drafts, and post-success routing).
 */
import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockNavigate = jest.fn();
const mockReset = jest.fn();
const mockGoBack = jest.fn();
const mockSendContactMessage = jest.fn();
const mockSendSupportRequest = jest.fn();

jest.mock('@react-navigation/native', () => ({
  __esModule: true,
  useNavigation: () => ({
    navigate: mockNavigate,
    reset: mockReset,
    goBack: mockGoBack,
  }),
  useRoute: () => ({ params: undefined }),
}));

jest.mock('../../src/components/ui', () => {
  const React = require('react');
  const { Text, TouchableOpacity, View } = require('react-native');
  return {
    PaperBackground: () => null,
    DesignExportForeground: ({ children }: any) => <View>{children}</View>,
    ActionLoadingSlot: ({ children }: any) => <View>{children}</View>,
    Button: ({ title, onPress, disabled }: any) => (
      <TouchableOpacity onPress={onPress} disabled={disabled} accessibilityRole="button">
        <Text>{title}</Text>
      </TouchableOpacity>
    ),
    FormFeedback: ({ title, message, testID }: any) => (
      <View testID={testID}>
        <Text>{title}</Text>
        <Text>{message}</Text>
      </View>
    ),
  };
});

jest.mock('../../src/services/contact', () => ({
  sendContactMessage: (...args: unknown[]) => mockSendContactMessage(...args),
}));

jest.mock('../../src/services/supportRequest', () => ({
  sendSupportRequest: (...args: unknown[]) => mockSendSupportRequest(...args),
}));

jest.mock('../../src/services/logger', () => ({
  logEvent: jest.fn(),
  logError: jest.fn(),
}));

import ContactScreen from '../../src/screens/ContactScreen';
import LoginSupportScreen from '../../src/screens/LoginSupportScreen';

describe('support submission feedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows signed-in success before returning to Write', async () => {
    jest.useFakeTimers();
    mockSendContactMessage.mockResolvedValue(undefined);
    const screen = render(<ContactScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Write your message...'), 'Please help.');
    fireEvent.press(screen.getByText('Send'));

    await waitFor(() => expect(screen.getByText('Message sent')).toBeTruthy());
    expect(mockNavigate).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1200);
    });

    expect(mockNavigate).toHaveBeenCalledWith('MainTabs', { screen: 'Write' });
  });

  it('keeps the signed-in draft and shows inline feedback when delivery fails', async () => {
    mockSendContactMessage.mockRejectedValue(new Error('network'));
    const screen = render(<ContactScreen />);
    const messageInput = screen.getByPlaceholderText('Write your message...');

    fireEvent.changeText(messageInput, 'Do not lose this message.');
    fireEvent.press(screen.getByText('Send'));

    await waitFor(() => expect(screen.getByText('Message not sent')).toBeTruthy());
    expect(screen.getByDisplayValue('Do not lose this message.')).toBeTruthy();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows signed-out success before resetting navigation to Auth', async () => {
    jest.useFakeTimers();
    mockSendSupportRequest.mockResolvedValue(undefined);
    const screen = render(<LoginSupportScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'dreamer@example.com');
    fireEvent.changeText(
      screen.getByPlaceholderText('e.g. Can’t reset password, didn’t receive verification email...'),
      'I cannot sign in.'
    );
    fireEvent.press(screen.getByText('Send'));

    await waitFor(() => expect(screen.getByText('Message sent')).toBeTruthy());
    expect(mockReset).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1200);
    });

    expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Auth' }] });
  });

  it('rejects an invalid signed-out email inline without making a request', async () => {
    const screen = render(<LoginSupportScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'not-an-email');
    fireEvent.changeText(
      screen.getByPlaceholderText('e.g. Can’t reset password, didn’t receive verification email...'),
      'I cannot sign in.'
    );
    fireEvent.press(screen.getByText('Send'));

    expect(screen.getByText('Check your email')).toBeTruthy();
    expect(mockSendSupportRequest).not.toHaveBeenCalled();
  });
});
