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

type IconBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type IconCanvas = {
  width: number;
  height: number;
};

type IconAsset = {
  source: ImageSourcePropType;
  bounds: IconBounds;
  canvas?: IconCanvas;
  /** Keeps a visually dense glyph in family without changing its source artwork. */
  opticalScale?: number;
};

const DEFAULT_ICON_CANVAS: IconCanvas = { width: 900, height: 900 };

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
    opticalScale: 0.92,
  },
  innerTensions: {
    source: require('../../assets/icons/insights_section_icons/oneiros_insight_inner_tensions_sheet_extract_rgba_900.png'),
    bounds: { left: 232, top: 200, width: 436, height: 560 },
    opticalScale: 0.94,
  },
  dreamPlaces: {
    source: require('../../assets/icons/insights_section_icons/oneiros_insight_dream_places_sheet_extract_rgba_900.png'),
    bounds: { left: 162, top: 288, width: 554, height: 367 },
    opticalScale: 0.88,
  },
  archetypalEnergies: {
    source: require('../../assets/icons/insights_section_icons/oneiros_isnights_archetypes.png'),
    bounds: { left: 0, top: 0, width: 559, height: 591 },
    canvas: { width: 559, height: 591 },
  },
  emotionalWeather: {
    source: require('../../assets/icons/insights_section_icons/oneiros_insight_emotional_weather.png'),
    bounds: { left: 236, top: 36, width: 464, height: 743 },
    opticalScale: 0.92,
  },
  patternRecognition: {
    source: require('../../assets/icons/insights_section_icons/pattern_recognition_essay/oneiros_pattern_recognition_essay.png'),
    bounds: { left: 144, top: 172, width: 720, height: 632 },
    canvas: { width: 1024, height: 1024 },
  },
} as const;

function createInsightsPngIcon(asset: IconAsset) {
  return ({ size = 24, color: _color, style, ...props }: IconProps) => {
    const { source, bounds, canvas = DEFAULT_ICON_CANVAS, opticalScale = 1 } = asset;
    const scale = (size * opticalScale) / Math.max(bounds.width, bounds.height);
    const renderedWidth = canvas.width * scale;
    const renderedHeight = canvas.height * scale;
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

export const ReturningImagesIcon = createInsightsPngIcon(ICON_SOURCES.returningImages);
export const RepeatingPatternsIcon = createInsightsPngIcon(ICON_SOURCES.repeatingPatterns);
export const ThresholdsIcon = createInsightsPngIcon(ICON_SOURCES.thresholds);
export const InnerTensionsIcon = createInsightsPngIcon(ICON_SOURCES.innerTensions);
export const DreamPlacesIcon = createInsightsPngIcon(ICON_SOURCES.dreamPlaces);
export const ArchetypalEnergiesIcon = createInsightsPngIcon(ICON_SOURCES.archetypalEnergies);
export const EmotionalWeatherIcon = createInsightsPngIcon(ICON_SOURCES.emotionalWeather);
export const PatternRecognitionIcon = createInsightsPngIcon(ICON_SOURCES.patternRecognition);

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
