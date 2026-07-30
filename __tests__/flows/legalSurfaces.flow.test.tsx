/**
 * Flow coverage: documentation/flows-08-support-legal-contact.md
 */
import React from 'react';
import { render } from '@testing-library/react-native';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  __esModule: true,
  useNavigation: () => ({
    navigate: mockNavigate,
    setOptions: jest.fn(),
  }),
}));

jest.mock('../../src/components/ui', () => {
  const React = require('react');
  const { Text, TouchableOpacity, View } = require('react-native');
  return {
    PaperBackground: ({ children }: any) => <View>{children}</View>,
    Card: ({ children }: any) => <View>{children}</View>,
    DesignExportForeground: ({ children }: any) => <View>{children}</View>,
    ActionLoadingSlot: ({ children }: any) => <View>{children}</View>,
    Button: ({ title, onPress }: any) => (
      <TouchableOpacity onPress={onPress}>
        <Text>{title}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock('../../src/services/legalConsentService', () => ({
  setLegalConsentAccepted: jest.fn(),
}));

import LegalConsentScreen from '../../src/screens/LegalConsentScreen';
import PrivacyScreen from '../../src/screens/PrivacyScreen';

describe('legal surfaces flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens consent with a calmer summary before the explicit confirmations', () => {
    const screen = render(<LegalConsentScreen onAccepted={jest.fn()} />);

    expect(screen.getByText('A private place to begin')).toBeTruthy();
    expect(screen.getByText('The short version')).toBeTruthy();
    expect(screen.getByText('Agree and enter Oneiros')).toBeTruthy();
    expect(screen.getByText('Read the full privacy policy and terms')).toBeTruthy();
    expect(
      screen.getByText('We do not sell your journal content or use it for advertising.')
    ).toBeTruthy();
  });

  it('keeps the privacy screen user-facing and free of release-checklist wording', () => {
    const screen = render(<PrivacyScreen />);

    expect(screen.getByText('Privacy & Legal')).toBeTruthy();
    expect(
      screen.getByText(/This space is private by design\./i)
    ).toBeTruthy();
    expect(
      screen.getByText(/This in-app notice is a plain-language summary\./i)
    ).toBeTruthy();
    expect(screen.queryByText(/in production/i)).toBeNull();
    expect(screen.queryByText(/store console/i)).toBeNull();
  });
});
