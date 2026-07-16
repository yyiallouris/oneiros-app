import React from 'react';
import { render } from '@testing-library/react-native';
import { Image, StyleSheet, View } from 'react-native';

import {
  ArchetypalEnergiesIcon,
  DreamPlacesIcon,
  InnerTensionsIcon,
  PatternRecognitionIcon,
  RepeatingPatternsIcon,
  ReturningImagesIcon,
  ThresholdsIcon,
} from '../src/components/icons/InsightsIcons';

describe('insights icons', () => {
  it('renders all active insights icons', () => {
    const { getByTestId } = render(
      <View>
        <ArchetypalEnergiesIcon testID="icon-archetypal-energies" size={88} />
        <DreamPlacesIcon testID="icon-dream-places" size={88} />
        <InnerTensionsIcon testID="icon-inner-tensions" size={88} />
        <PatternRecognitionIcon testID="icon-pattern-recognition" size={88} />
        <RepeatingPatternsIcon testID="icon-repeating-patterns" size={88} />
        <ReturningImagesIcon testID="icon-returning-images" size={88} />
        <ThresholdsIcon testID="icon-thresholds" size={88} />
      </View>
    );

    expect(getByTestId('icon-archetypal-energies')).toBeTruthy();
    expect(getByTestId('icon-dream-places')).toBeTruthy();
    expect(getByTestId('icon-inner-tensions')).toBeTruthy();
    expect(getByTestId('icon-pattern-recognition')).toBeTruthy();
    expect(getByTestId('icon-repeating-patterns')).toBeTruthy();
    expect(getByTestId('icon-returning-images')).toBeTruthy();
    expect(getByTestId('icon-thresholds')).toBeTruthy();
  });

  it('crops the supplied transparent canvas to the requested visual size', () => {
    const { UNSAFE_getByType } = render(<ThresholdsIcon size={88} testID="icon-thresholds-sized" />);
    const icon = UNSAFE_getByType(Image);
    const flattenedStyle = StyleSheet.flatten(icon.props.style);

    expect(flattenedStyle.width).toBeGreaterThan(88);
    expect(flattenedStyle.height).toBeGreaterThan(88);
    expect(flattenedStyle.left).toBeLessThan(0);
    expect(flattenedStyle.top).toBeLessThan(0);
  });
});
