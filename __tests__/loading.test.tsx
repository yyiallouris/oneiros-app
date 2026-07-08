import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { LoadingState } from '../src/components/ui/LoadingState';
import { ActionLoadingSlot } from '../src/components/ui/ActionLoadingSlot';
import { ContentSkeleton } from '../src/components/ui/ContentSkeleton';
import { loadingPresets } from '../src/theme/loading';

jest.mock('../src/components/ui/BreathingLine', () => ({
  BreathingLine: ({ testID = 'breathing-line' }: { testID?: string }) => {
    const { Text } = require('react-native');
    return <Text testID={testID}>BreathingLine</Text>;
  },
}));

jest.mock('../src/components/ui/AbstractPrintTexture', () => ({
  PrintPatchLoader: ({ testID = 'print-patch-loader' }: { testID?: string }) => {
    const { Text } = require('react-native');
    return <Text testID={testID}>PrintPatchLoader</Text>;
  },
}));

describe('loading system', () => {
  it('renders reflect preset for dream reflection', () => {
    render(<LoadingState preset="dreamReflection" />);
    expect(screen.getByTestId('loading-state')).toBeTruthy();
    expect(screen.getByTestId('print-patch-loader')).toBeTruthy();
    expect(screen.getByText(loadingPresets.dreamReflection.message!)).toBeTruthy();
  });

  it('renders breath preset for recent reflection panel', () => {
    render(<LoadingState preset="recentReflection" />);
    expect(screen.getByTestId('breathing-line')).toBeTruthy();
    expect(screen.getByText(loadingPresets.recentReflection.message!)).toBeTruthy();
  });

  it('swaps children for loading visual in ActionLoadingSlot', () => {
    const { Text } = require('react-native');
    const { rerender } = render(
      <ActionLoadingSlot loading={false} loadingProps={{ preset: 'saveDream' }}>
        <Text testID="save-button">Save</Text>
      </ActionLoadingSlot>
    );
    expect(screen.getByTestId('save-button')).toBeTruthy();

    rerender(
      <ActionLoadingSlot loading loadingProps={{ preset: 'saveDream' }}>
        <Text testID="save-button">Save</Text>
      </ActionLoadingSlot>
    );
    expect(screen.queryByTestId('save-button')).toBeNull();
    expect(screen.getByTestId('action-loading-state')).toBeTruthy();
    expect(screen.getByText(loadingPresets.saveDream.message!)).toBeTruthy();
  });

  it('renders content skeleton blocks', () => {
    render(<ContentSkeleton blocks={2} />);
    expect(screen.getByTestId('content-skeleton')).toBeTruthy();
  });
});
