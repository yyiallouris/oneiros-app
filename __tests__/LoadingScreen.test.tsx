import React from 'react';
import { render } from '@testing-library/react-native';
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
    expect(getByTestId('loading-logo')).toBeTruthy();
    expect(getByText('Oneiros')).toBeTruthy();
  });
});
