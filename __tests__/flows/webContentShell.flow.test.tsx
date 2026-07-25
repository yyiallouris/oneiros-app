import React from 'react';
import { Platform, Text, View } from 'react-native';
import { render } from '@testing-library/react-native';
import { WebContentShell } from '../../src/components/ui/WebContentShell';
import { useContentWidth } from '../../src/layout/WebLayoutContext';
import { layout } from '../../src/theme/layout';

jest.mock('../../src/designExport', () => ({
  DESIGN_EXPORT_MODE: false,
}));

const WidthProbe = () => {
  const width = useContentWidth();
  return <Text testID="content-width">{String(width)}</Text>;
};

describe('WebContentShell', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
  });

  it('passes children through on native without the web column chrome', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    const screen = render(
      <WebContentShell>
        <View testID="child" />
      </WebContentShell>
    );

    expect(screen.getByTestId('child')).toBeTruthy();
    expect(screen.queryByTestId('web-content-shell-column')).toBeNull();
  });

  it('renders a centered content column on web with a capped content width', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });

    const screen = render(
      <WebContentShell>
        <WidthProbe />
      </WebContentShell>
    );

    expect(screen.getByTestId('web-content-shell-outer')).toBeTruthy();
    expect(screen.getByTestId('web-content-shell-column')).toBeTruthy();

    const width = Number(screen.getByTestId('content-width').props.children);
    expect(width).toBeGreaterThan(0);
    expect(width).toBeLessThanOrEqual(layout.contentMaxWidthTablet);
  });
});
