import React from 'react';
import { Platform } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { SocialAuthProviderRow } from '../src/components/ui/SocialAuthProviderRow';

describe('SocialAuthProviderRow', () => {
  const onGooglePress = jest.fn();
  const onDiscordPress = jest.fn();
  const onApplePress = jest.fn();
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
  });

  it('renders Google and Discord on Android with continue-with copy', () => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });

    const { getByText, getByTestId, queryByTestId } = render(
      <SocialAuthProviderRow
        onGooglePress={onGooglePress}
        onDiscordPress={onDiscordPress}
        onApplePress={onApplePress}
      />
    );

    expect(getByText('or continue with')).toBeTruthy();
    expect(getByTestId('oauth-provider-google')).toBeTruthy();
    expect(getByTestId('oauth-provider-discord')).toBeTruthy();
    expect(queryByTestId('oauth-provider-apple')).toBeNull();

    fireEvent.press(getByTestId('oauth-provider-google'));
    fireEvent.press(getByTestId('oauth-provider-discord'));
    expect(onGooglePress).toHaveBeenCalledTimes(1);
    expect(onDiscordPress).toHaveBeenCalledTimes(1);
    expect(onApplePress).not.toHaveBeenCalled();
  });

  it('includes Apple between Google and Discord on iOS', () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });

    const { getByTestId, getByLabelText } = render(
      <SocialAuthProviderRow
        onGooglePress={onGooglePress}
        onDiscordPress={onDiscordPress}
        onApplePress={onApplePress}
      />
    );

    expect(getByLabelText('Continue with Google')).toBeTruthy();
    expect(getByLabelText('Continue with Apple')).toBeTruthy();
    expect(getByLabelText('Continue with Discord')).toBeTruthy();

    fireEvent.press(getByTestId('oauth-provider-apple'));
    expect(onApplePress).toHaveBeenCalledTimes(1);
  });
});
