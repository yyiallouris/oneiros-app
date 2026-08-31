import React from 'react';
import fs from 'fs';
import { render } from '@testing-library/react-native';
import { Image, StyleSheet, View } from 'react-native';

import {
  ArchetypalEnergiesIcon,
  DreamPlacesIcon,
  EmotionalWeatherIcon,
  InnerTensionsIcon,
  PatternRecognitionIcon,
  RepeatingPatternsIcon,
  ReturningImagesIcon,
  ThresholdsIcon,
} from '../src/components/icons/InsightsIcons';
import { iconography } from '../src/theme';

describe('insights icons', () => {
  it('renders all active insights icons', () => {
    const { getByTestId } = render(
      <View>
        <ArchetypalEnergiesIcon testID="icon-archetypal-energies" size={88} />
        <DreamPlacesIcon testID="icon-dream-places" size={88} />
        <EmotionalWeatherIcon testID="icon-emotional-weather" size={88} />
        <InnerTensionsIcon testID="icon-inner-tensions" size={88} />
        <PatternRecognitionIcon testID="icon-pattern-recognition" size={88} />
        <RepeatingPatternsIcon testID="icon-repeating-patterns" size={88} />
        <ReturningImagesIcon testID="icon-returning-images" size={88} />
        <ThresholdsIcon testID="icon-thresholds" size={88} />
      </View>
    );

    expect(getByTestId('icon-archetypal-energies')).toBeTruthy();
    expect(getByTestId('icon-dream-places')).toBeTruthy();
    expect(getByTestId('icon-emotional-weather')).toBeTruthy();
    expect(getByTestId('icon-inner-tensions')).toBeTruthy();
    expect(getByTestId('icon-pattern-recognition')).toBeTruthy();
    expect(getByTestId('icon-repeating-patterns')).toBeTruthy();
    expect(getByTestId('icon-returning-images')).toBeTruthy();
    expect(getByTestId('icon-thresholds')).toBeTruthy();
  });

  it('uses a dedicated emotional weather PNG instead of the pattern-recognition placeholder', () => {
    expect(EmotionalWeatherIcon).not.toBe(PatternRecognitionIcon);
  });

  it('keeps full-screen Insights marks quiet enough to support an empty state', () => {
    const source = fs.readFileSync('src/screens/InsightsSectionScreen.tsx', 'utf8');

    expect(iconography.insights.sectionSize).toBe(88);
    expect(source).toContain('const SECTION_ICON_SIZE = iconography.insights.sectionSize');
    expect(source).not.toContain('const SECTION_ICON_SIZE = 112');
  });

  it('keeps Dream Places in the hand-ink PNG family at a quieter optical scale', () => {
    const screen = render(<DreamPlacesIcon size={58} testID="icon-dream-places-ink" />);
    const icon = screen.UNSAFE_getByType(Image);
    const flattenedStyle = StyleSheet.flatten(icon.props.style);

    expect(flattenedStyle.width).toBeGreaterThan(58);
    expect(flattenedStyle.height).toBeGreaterThan(58);
    expect(flattenedStyle.tintColor).toBeUndefined();
    expect(flattenedStyle.opacity).toBeUndefined();
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

  it('points archetypes and pattern recognition at the true transparent PNG assets', () => {
    const source = fs.readFileSync('src/components/icons/InsightsIcons.tsx', 'utf8');

    expect(source).toContain('oneiros_isnights_archetypes.png');
    expect(source).toContain('pattern_recognition_essay/oneiros_pattern_recognition_essay.png');
    expect(source).toContain('oneiros_insight_dream_places_sheet_extract_rgba_900.png');
    expect(source).toContain('opticalScale: 0.88');
    expect(source).toContain('opticalScale: 0.92');
    expect(source).toContain('canvas: { width: 559, height: 591 }');
    expect(source).toContain('canvas: { width: 1024, height: 1024 }');
  });
});
