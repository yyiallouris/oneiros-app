import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
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
        <View
          testID="main-tabs-options"
          tabBarHideOnKeyboard={screenOptions?.tabBarHideOnKeyboard}
        >
          {screenOptions?.tabBarBackground?.()}
          {React.Children.map(children, (child: any) => {
            const name = child.props.name;
            const focused = (initialRouteName ?? 'Write') === name;
            return (
              <View key={name}>
                {child.props.options?.tabBarIcon?.({ focused, color: undefined, size: undefined })}
                {screenOptions?.tabBarLabel?.({
                  focused,
                  color: focused ? '#4B3158' : '#756A79',
                  children: name,
                })}
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
    expect(screen.getByTestId('tab-label-write').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ fontFamily: 'Inter_500Medium' })]),
    );
    const writeFrame = screen.getByTestId('tab-icon-write-active');
    expect(StyleSheet.flatten(writeFrame.props.style)).toEqual(
      expect.objectContaining({ width: 28, height: 30, opacity: 0.98 }),
    );
    const writeImages = writeFrame.findAllByType(Image).map((image) => StyleSheet.flatten(image.props.style));
    expect(writeImages).toHaveLength(2);
    expect(writeImages.every((image) => image.tintColor === '#4B3158')).toBe(true);
    expect(screen.getByTestId('tab-icon-journal-inactive').props.width).toBe(30);
    expect(StyleSheet.flatten(screen.getByTestId('tab-icon-insights-inactive').props.style)).toEqual(
      expect.objectContaining({ width: 29, opacity: 0.58 }),
    );
    expect(StyleSheet.flatten(screen.getByTestId('tab-icon-journal-inactive').props.style).opacity).toBe(0.58);
    expect(StyleSheet.flatten(screen.getByTestId('tab-label-journal').props.style).color).toBe('#756A79');
    expect(screen.getByTestId('main-tabs-options').props.tabBarHideOnKeyboard).toBe(true);
  });

  it('uses the dot-free authored seeing crop and deep-plum state when Insights is active', () => {
    const screen = render(<MainTabsNavigator initialRouteName="Insights" />);
    const eyeFrame = screen.getByTestId('tab-icon-insights-active');
    const eyeImage = eyeFrame.findByType(Image);

    expect(StyleSheet.flatten(eyeFrame.props.style)).toEqual(
      expect.objectContaining({ width: 29, opacity: 0.98 }),
    );
    expect(StyleSheet.flatten(eyeImage.props.style)).toEqual(
      expect.objectContaining({ tintColor: '#4B3158', top: expect.any(Number) }),
    );
    expect(StyleSheet.flatten(eyeImage.props.style).top).toBeLessThan(-18);
    expect(StyleSheet.flatten(screen.getByTestId('tab-label-insights').props.style).color).toBe('#4B3158');
    expect(screen.getByTestId('tab-icon-journal-inactive')).toBeTruthy();
    expect(screen.getByTestId('tab-icon-write-inactive')).toBeTruthy();
  });

  it('uses the organic journal drawing when Journal is the initial tab', () => {
    const screen = render(<MainTabsNavigator initialRouteName="Journal" />);

    expect(screen.getByTestId('tab-icon-journal-active')).toBeTruthy();
    expect(screen.getByTestId('tab-icon-write-inactive')).toBeTruthy();
    expect(screen.getByTestId('tab-icon-insights-inactive')).toBeTruthy();
    expect(screen.getByTestId('tab-label-write').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ fontFamily: 'Inter_400Regular' })]),
    );
    expect(screen.getByTestId('tab-icon-journal-active').props.width).toBe(30);
    expect(StyleSheet.flatten(screen.getByTestId('tab-icon-journal-active').props.style).opacity).toBe(0.98);
  });
});
