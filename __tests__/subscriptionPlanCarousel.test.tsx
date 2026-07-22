import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import { SubscriptionPlanCarousel } from '../src/components/subscription/SubscriptionPlanCarousel';

const mockScrollTo = jest.fn();

jest.mock('react-native/Libraries/Components/ScrollView/ScrollView', () => {
  const React = require('react');
  const { View } = jest.requireActual('react-native');
  const MockScrollView = React.forwardRef(({ children, ...props }: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      scrollTo: mockScrollTo,
    }));
    return <View {...props}>{children}</View>;
  });

  return {
    __esModule: true,
    default: MockScrollView,
  };
});

describe('SubscriptionPlanCarousel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 1,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('positions the scroll view to the requested initial card', async () => {
    const screen = render(
      <SubscriptionPlanCarousel initialIndex={1} indicatorPosition="top" testID="carousel">
        <ReactNative.Text>Free</ReactNative.Text>
        <ReactNative.Text>Premium</ReactNative.Text>
      </SubscriptionPlanCarousel>
    );

    fireEvent(screen.getByTestId('carousel'), 'layout', {
      nativeEvent: {
        layout: {
          width: 390,
        },
      },
    });

    await waitFor(() => {
      expect(mockScrollTo).toHaveBeenCalled();
    });

    const firstCall = mockScrollTo.mock.calls[0][0];
    expect(firstCall.animated).toBe(false);
    expect(firstCall.x).toBeGreaterThan(0);
    expect(screen.getByTestId('carousel-indicators-top')).toBeTruthy();
    expect(screen.getByTestId('carousel-scroll')).toBeTruthy();
  });

  it('reports the active card index after scroll settles', async () => {
    const onIndexChange = jest.fn();
    const screen = render(
      <SubscriptionPlanCarousel initialIndex={1} onIndexChange={onIndexChange} testID="carousel">
        <ReactNative.Text>Free</ReactNative.Text>
        <ReactNative.Text>Premium</ReactNative.Text>
      </SubscriptionPlanCarousel>
    );

    fireEvent(screen.getByTestId('carousel'), 'layout', {
      nativeEvent: {
        layout: {
          width: 390,
        },
      },
    });

    fireEvent(screen.getByTestId('carousel-scroll'), 'momentumScrollEnd', {
      nativeEvent: {
        contentOffset: {
          x: 0,
        },
      },
    });

    await waitFor(() => {
      expect(onIndexChange).toHaveBeenCalledWith(0);
    });
  });
});
