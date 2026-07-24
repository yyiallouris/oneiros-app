/**
 * Flow coverage: documentation/flows-03-onboarding-account-security.md
 * (Account profile name Save lives in sticky nav headerRight, only when the nickname is dirty).
 */
import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockNavigate = jest.fn();
const mockSetOptions = jest.fn();
const mockGetDisplayName = jest.fn();
const mockSetDisplayName = jest.fn();
const mockGetInterpretationDepth = jest.fn();
const mockSetInterpretationDepth = jest.fn();
const mockGetPatternInsightLanguage = jest.fn();
const mockSetPatternInsightLanguage = jest.fn();
const mockGetBiometricStatus = jest.fn();
const mockIsBiometricEnabled = jest.fn();

jest.mock('@react-navigation/native', () => ({
  __esModule: true,
  useNavigation: () => ({
    navigate: mockNavigate,
    setOptions: mockSetOptions,
  }),
  useFocusEffect: (callback: () => void) => {
    const React = require('react');
    React.useEffect(() => callback(), [callback]);
  },
}));

jest.mock('../../src/components/ui', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    PaperBackground: ({ children }: any) => <View>{children}</View>,
    Card: ({ children }: any) => <View>{children}</View>,
    DesignExportForeground: ({ children }: any) => <View>{children}</View>,
  };
});

jest.mock('../../src/services/userService', () => ({
  UserService: {
    getDisplayName: (...args: unknown[]) => mockGetDisplayName(...args),
    setDisplayName: (...args: unknown[]) => mockSetDisplayName(...args),
  },
}));

jest.mock('../../src/services/userSettingsService', () => ({
  getInterpretationDepth: (...args: unknown[]) => mockGetInterpretationDepth(...args),
  setInterpretationDepth: (...args: unknown[]) => mockSetInterpretationDepth(...args),
}));

jest.mock('../../src/services/patternInsightLanguageService', () => ({
  getPatternInsightLanguage: (...args: unknown[]) => mockGetPatternInsightLanguage(...args),
  setPatternInsightLanguage: (...args: unknown[]) => mockSetPatternInsightLanguage(...args),
}));

jest.mock('../../src/services/biometricAuthService', () => ({
  getBiometricStatus: (...args: unknown[]) => mockGetBiometricStatus(...args),
  isBiometricEnabled: (...args: unknown[]) => mockIsBiometricEnabled(...args),
  enableBiometric: jest.fn(),
  disableBiometric: jest.fn(),
  getBiometricLabel: () => 'Face ID',
}));

jest.mock('../../src/services/accountDeletion', () => ({
  deleteAccountAndData: jest.fn(),
}));

jest.mock('../../src/providers/SubscriptionProvider', () => ({
  useSubscription: () => ({
    status: {
      hasPaidAccess: false,
      entitlementState: 'inactive',
      currentPeriodEnd: null,
    },
    loading: false,
    refreshing: false,
  }),
}));

jest.mock('../../src/services/subscriptionService', () => ({
  getReadOnlyLapseMessage: () => 'Premium lapsed',
}));

import AccountScreen from '../../src/screens/AccountScreen';

function renderLatestHeaderRight() {
  const latestOptions = mockSetOptions.mock.calls.at(-1)?.[0];
  const HeaderRight = latestOptions?.headerRight;
  if (!HeaderRight) return null;
  return render(<HeaderRight />);
}

describe('account profile save flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDisplayName.mockResolvedValue('Yiannis');
    mockSetDisplayName.mockResolvedValue(undefined);
    mockGetInterpretationDepth.mockResolvedValue('standard');
    mockGetPatternInsightLanguage.mockResolvedValue('en');
    mockGetBiometricStatus.mockResolvedValue({ canUse: false, hasHardware: false, type: null });
    mockIsBiometricEnabled.mockResolvedValue(false);
  });

  it('hides sticky Save until the nickname changes, and keeps depth/language as instant saves', async () => {
    const screen = render(<AccountScreen />);

    await waitFor(() => expect(screen.getByDisplayValue('Yiannis')).toBeTruthy());
    expect(renderLatestHeaderRight()).toBeNull();
    expect(screen.getByText('Other Account choices save as soon as you tap them.')).toBeTruthy();

    fireEvent.press(screen.getByText('Quick Glance'));
    expect(mockSetInterpretationDepth).toHaveBeenCalledWith('quick');
    expect(renderLatestHeaderRight()).toBeNull();

    fireEvent.press(screen.getByText('English'));
    fireEvent.press(screen.getByText('Ελληνικά (EL)'));
    expect(mockSetPatternInsightLanguage).toHaveBeenCalledWith('el');
    expect(renderLatestHeaderRight()).toBeNull();
  });

  it('shows sticky header Save only for dirty nickname then redirects to Write', async () => {
    jest.useFakeTimers();
    const screen = render(<AccountScreen />);

    await waitFor(() => expect(screen.getByDisplayValue('Yiannis')).toBeTruthy());
    fireEvent.changeText(screen.getByDisplayValue('Yiannis'), 'Yiannis Y');

    const header = await waitFor(() => {
      const next = renderLatestHeaderRight();
      expect(next?.getByLabelText('Save profile name')).toBeTruthy();
      return next!;
    });

    fireEvent.press(header.getByLabelText('Save profile name'));

    await waitFor(() => {
      expect(mockSetDisplayName).toHaveBeenCalledWith('Yiannis Y');
      expect(renderLatestHeaderRight()?.getByText('Saved')).toBeTruthy();
    });

    await act(async () => {
      jest.advanceTimersByTime(800);
    });

    expect(mockNavigate).toHaveBeenCalledWith('MainTabs', { screen: 'Write' });
    jest.useRealTimers();
  });
});
