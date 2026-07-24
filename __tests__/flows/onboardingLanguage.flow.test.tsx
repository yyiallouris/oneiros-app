/**
 * Flow coverage: documentation/flows-03-onboarding-account-security.md
 * (Insights language preference step between depth and subscription).
 */
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockSetPatternInsightLanguage = jest.fn();
const mockSetInterpretationDepth = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

jest.mock('../../src/components/ui', () => {
  const React = require('react');
  const { Text, TouchableOpacity, View } = require('react-native');
  return {
    PaperBackground: ({ children }: any) => <View>{children}</View>,
    Card: ({ children }: any) => <View>{children}</View>,
    Button: ({ title, onPress }: any) => (
      <TouchableOpacity onPress={onPress}>
        <Text>{title}</Text>
      </TouchableOpacity>
    ),
    DesignExportForeground: ({ children }: any) => <View>{children}</View>,
  };
});

jest.mock('../../src/services/patternInsightLanguageService', () => ({
  setPatternInsightLanguage: (...args: unknown[]) => mockSetPatternInsightLanguage(...args),
}));

jest.mock('../../src/services/userSettingsService', () => ({
  setInterpretationDepth: (...args: unknown[]) => mockSetInterpretationDepth(...args),
}));

jest.mock('../../src/utils/onboardingLanguage', () => ({
  getOnboardingLanguageOptions: () => ({
    defaultCode: 'en',
    languages: [
      { code: 'en', display: 'EN', name: 'English' },
      { code: 'el', display: 'EL', name: 'Ελληνικά' },
    ],
  }),
}));

import OnboardingLanguageScreen from '../../src/screens/onboarding/OnboardingLanguageScreen';
import OnboardingDepthScreen from '../../src/screens/onboarding/OnboardingDepthScreen';

describe('onboarding language flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetPatternInsightLanguage.mockResolvedValue(undefined);
    mockSetInterpretationDepth.mockResolvedValue(undefined);
  });

  it('routes Depth continue into the Insights language step without a Skip escape', async () => {
    const screen = render(<OnboardingDepthScreen />);

    expect(screen.queryByText('Skip')).toBeNull();
    fireEvent.press(screen.getByText('Continue'));
    await waitFor(() => {
      expect(mockSetInterpretationDepth).toHaveBeenCalledWith('standard');
      expect(mockNavigate).toHaveBeenCalledWith('OnboardingLanguage');
    });
  });

  it('persists the selected Insights language and continues to subscription', async () => {
    const screen = render(<OnboardingLanguageScreen />);

    expect(screen.queryByText('Skip')).toBeNull();
    fireEvent.press(screen.getByText('Ελληνικά'));
    fireEvent.press(screen.getByText('Continue'));

    await waitFor(() => {
      expect(mockSetPatternInsightLanguage).toHaveBeenCalledWith('el');
      expect(mockNavigate).toHaveBeenCalledWith('OnboardingSubscription');
    });
  });
});
