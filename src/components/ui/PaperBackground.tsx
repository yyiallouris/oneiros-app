import React from 'react';
import { Image, StyleSheet, View, ViewProps } from 'react-native';
import { backgrounds } from '../../theme';

interface PaperBackgroundProps extends ViewProps {
  // Accepted during the legacy background migration but intentionally ignored.
  height?: number;
  top?: number;
  bottomOffset?: number;
  lite?: boolean;
}

export const PaperBackground: React.FC<PaperBackgroundProps> = ({ style, ...rest }) => (
  <View
    {...rest}
    pointerEvents="none"
    style={[styles.container, style]}
    testID="paper-background"
  >
    <Image
      source={require('../../../assets/backgrounds/BG_paper.png')}
      style={styles.image}
      resizeMode="repeat"
      fadeDuration={0}
      testID="paper-background-image"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: backgrounds.primary,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.94,
  },
});
