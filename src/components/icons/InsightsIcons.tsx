import React from 'react';
import {
  Image,
  type ImageProps,
  type ImageSourcePropType,
  StyleSheet,
  View,
} from 'react-native';

type IconProps = Omit<ImageProps, 'source'> & {
  size?: number;
  color?: string;
};

const ICON_SOURCES = {
  returningImages: {
    source: require('../../assets/icons/insights_section_icons/oneiros_insight_returning_images_sheet_extract_rgba_900.png'),
    bounds: { left: 198, top: 218, width: 504, height: 499 },
  },
  repeatingPatterns: {
    source: require('../../assets/icons/insights_section_icons/oneiros_insight_repeating_patterns_sheet_extract_rgba_900.png'),
    bounds: { left: 140, top: 308, width: 575, height: 329 },
  },
  thresholds: {
    source: require('../../assets/icons/insights_section_icons/oneiros_insight_thresholds_sheet_extract_rgba_900.png'),
    bounds: { left: 273, top: 192, width: 354, height: 568 },
  },
  innerTensions: {
    source: require('../../assets/icons/insights_section_icons/oneiros_insight_inner_tensions_sheet_extract_rgba_900.png'),
    bounds: { left: 232, top: 200, width: 436, height: 560 },
  },
  dreamPlaces: {
    source: require('../../assets/icons/insights_section_icons/oneiros_insight_dream_places_sheet_extract_rgba_900.png'),
    bounds: { left: 162, top: 288, width: 554, height: 367 },
  },
  archetypalEnergies: {
    source: require('../../assets/icons/insights_section_icons/oneiros_insight_archetypal_energies_sheet_extract_rgba_900.png'),
    bounds: { left: 285, top: 192, width: 329, height: 568 },
  },
  patternRecognition: {
    source: require('../../assets/icons/insights_section_icons/oneiros_pattern_recognition_from_sheet_true_rgba_900.png'),
    bounds: { left: 230, top: 254, width: 440, height: 433 },
  },
} as const;

type IconBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function createInsightsPngIcon(source: ImageSourcePropType, bounds: IconBounds) {
  return ({ size = 24, color: _color, style, ...props }: IconProps) => {
    const scale = size / Math.max(bounds.width, bounds.height);
    const renderedWidth = 900 * scale;
    const renderedHeight = 900 * scale;
    const offsetX = (size - bounds.width * scale) / 2 - bounds.left * scale;
    const offsetY = (size - bounds.height * scale) / 2 - bounds.top * scale;

    return (
      <View style={[styles.frame, { width: size, height: size }, style]}>
        <Image
          source={source}
          resizeMode="stretch"
          accessibilityIgnoresInvertColors
          style={[
            styles.image,
            {
              width: renderedWidth,
              height: renderedHeight,
              left: offsetX,
              top: offsetY,
            },
          ]}
          {...props}
        />
      </View>
    );
  };
}

export const ReturningImagesIcon = createInsightsPngIcon(ICON_SOURCES.returningImages.source, ICON_SOURCES.returningImages.bounds);
export const RepeatingPatternsIcon = createInsightsPngIcon(ICON_SOURCES.repeatingPatterns.source, ICON_SOURCES.repeatingPatterns.bounds);
export const ThresholdsIcon = createInsightsPngIcon(ICON_SOURCES.thresholds.source, ICON_SOURCES.thresholds.bounds);
export const InnerTensionsIcon = createInsightsPngIcon(ICON_SOURCES.innerTensions.source, ICON_SOURCES.innerTensions.bounds);
export const DreamPlacesIcon = createInsightsPngIcon(ICON_SOURCES.dreamPlaces.source, ICON_SOURCES.dreamPlaces.bounds);
export const ArchetypalEnergiesIcon = createInsightsPngIcon(ICON_SOURCES.archetypalEnergies.source, ICON_SOURCES.archetypalEnergies.bounds);
export const PatternRecognitionIcon = createInsightsPngIcon(ICON_SOURCES.patternRecognition.source, ICON_SOURCES.patternRecognition.bounds);

// Backward-compatible aliases while screens migrate to the explicit names above.
export const SymbolsIcon = ReturningImagesIcon;
export const MotifsIcon = RepeatingPatternsIcon;
export const PlacesIcon = DreamPlacesIcon;
export const ArchetypesIcon = ArchetypalEnergiesIcon;

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    alignSelf: 'center',
  },
  image: {
    position: 'absolute',
  },
});
