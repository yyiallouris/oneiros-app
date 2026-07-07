import React from 'react';
import { View } from 'react-native';
import { render } from '@testing-library/react-native';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 12, left: 0, right: 0 }),
}));

jest.mock('../src/screens/WriteScreen', () => () => null);
jest.mock('../src/screens/JournalScreen', () => () => null);
jest.mock('../src/screens/InsightsScreen', () => () => null);
jest.mock('../src/designExport', () => ({
  IS_DESIGN_EXPORT_BACKGROUND_ONLY: false,
}));

jest.mock('@react-navigation/bottom-tabs', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    createBottomTabNavigator: () => ({
      Navigator: ({ children, initialRouteName, screenOptions }: any) => (
        <View>
          {screenOptions?.tabBarBackground?.()}
          {React.Children.map(children, (child: any) => {
            const name = child.props.name;
            const focused = (initialRouteName ?? 'Write') === name;
            return (
              <View key={name}>
                {child.props.options?.tabBarIcon?.({ focused, color: undefined, size: undefined })}
              </View>
            );
          })}
        </View>
      ),
      Screen: ({ children }: any) => <View>{children}</View>,
    }),
  };
});

import { MainTabsNavigator } from '../src/navigation/MainTabsNavigator';

describe('MainTabsNavigator', () => {
  it('renders the paper tab background and write-active icon by default', () => {
    const screen = render(<MainTabsNavigator initialRouteName="Write" />);

    expect(screen.getByTestId('tab-bar-paper-background')).toBeTruthy();
    expect(screen.getByTestId('tab-icon-write-active')).toBeTruthy();
    expect(screen.getByTestId('tab-icon-journal-inactive')).toBeTruthy();
    expect(screen.getByTestId('tab-icon-insights-inactive')).toBeTruthy();
  });

  it('uses the journal active png when Journal is the initial tab', () => {
    const screen = render(<MainTabsNavigator initialRouteName="Journal" />);

    expect(screen.getByTestId('tab-icon-journal-active')).toBeTruthy();
    expect(screen.getByTestId('tab-icon-write-inactive')).toBeTruthy();
    expect(screen.getByTestId('tab-icon-insights-inactive')).toBeTruthy();
  });
});
