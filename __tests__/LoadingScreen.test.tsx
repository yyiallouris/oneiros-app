import React from 'react';
import fs from 'fs';
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { LoadingScreen } from '../src/components/ui/LoadingScreen';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('LoadingScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders the paper background, new logo, and Oneiros wordmark', () => {
    const { getByTestId, getByText } = render(<LoadingScreen />);

    expect(getByTestId('paper-background')).toBeTruthy();
    const paperImage = getByTestId('paper-background-image');
    expect(paperImage.props.resizeMode).toBe('repeat');
    expect(StyleSheet.flatten(paperImage.props.style)).toMatchObject({
      width: '100%',
      height: '100%',
    });
    expect(getByTestId('loading-logo')).toBeTruthy();
    expect(getByText('Oneiros')).toBeTruthy();
    expect(fs.readFileSync('src/components/ui/LoadingScreen.tsx', 'utf8')).toContain(
      "assets/branding/releases/v1.3.0/exports/splash-symbol-master.png",
    );
  });
});
