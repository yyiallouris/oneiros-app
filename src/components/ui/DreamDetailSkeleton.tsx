import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, StyleProp, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface DreamDetailSkeletonProps {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Layout-faithful DreamDetail initial loader.
 * Mirrors dream page (date / title / body) + always-open Dream Fabric,
 * not journal-list LinoSkeletonCard rows.
 */
export const DreamDetailSkeleton: React.FC<DreamDetailSkeletonProps> = ({
  style,
  testID = 'dream-detail-skeleton',
}) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.28, 0.5],
  });

  const line = (key: string, lineStyle: StyleProp<ViewStyle>, fill: string = colors.wave2) => (
    <Animated.View
      key={key}
      style={[styles.line, lineStyle, { backgroundColor: fill, opacity }]}
    />
  );

  return (
    <View style={[styles.root, style]} testID={testID}>
      {/* Dream page — matches dreamPage: date, title, multi-line body */}
      <View style={styles.dreamPage}>
        {line('date', styles.dateLine, colors.wave1)}
        {line('title', styles.titleLine, colors.wave1)}
        {line('body1', styles.bodyLine)}
        {line('body2', styles.bodyLine)}
        {line('body3', styles.bodyLine)}
        {line('body4', styles.bodyLineShort)}
      </View>

      <View style={styles.waveSpacer} />

      {/* Dream Fabric — matches the loaded, always-open detail hierarchy. */}
      <View style={styles.reflectionSection}>
        {line('reflectionTitle', styles.sectionHeading, colors.wave1)}

        <View style={styles.fabricRow}>
          {line('movementLabel', styles.labelLine, colors.wave1)}
          {line('movementTitle', styles.fabricBodyLine, colors.wave1)}
          {line('movementLine', styles.fabricBodyLine)}
        </View>

        <View style={styles.fabricRows}>
          <View style={styles.fabricRow}>
            {line('fabric1a', styles.fabricLabelLine, colors.wave1)}
            {line('fabric1b', styles.fabricBodyLine)}
          </View>
          <View style={styles.fabricRow}>
            {line('fabric2a', styles.fabricLabelLine, colors.wave1)}
            {line('fabric2b', styles.fabricBodyLine)}
          </View>
          <View style={styles.fabricRow}>
            {line('fabric3a', styles.fabricLabelLine, colors.wave1)}
            {line('fabric3b', styles.fabricBodyLine)}
          </View>
        </View>

        <View style={styles.previewBlock}>
          {line('previewLabel', styles.labelLine, colors.wave1)}
          {line('preview1', styles.bodyLine)}
          {line('preview2', styles.bodyLine)}
          {line('preview3', styles.bodyLineShort)}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  dreamPage: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.contourLineFaint,
    backgroundColor: 'rgba(255, 253, 249, 0.38)',
  },
  waveSpacer: {
    height: spacing.lg,
    marginVertical: spacing.lg,
  },
  reflectionSection: {
    marginBottom: spacing.xl,
    minHeight: 250,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  fabricRows: {
    marginBottom: spacing.md,
  },
  previewBlock: {
    marginTop: spacing.md,
  },
  fabricRow: {
    paddingVertical: spacing.sm,
  },
  line: {
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  dateLine: {
    width: '28%',
    height: 12,
    marginBottom: spacing.md,
  },
  titleLine: {
    width: '62%',
    height: typography.sizes.xl,
    marginBottom: spacing.md,
  },
  bodyLine: {
    width: '100%',
    height: 14,
  },
  bodyLineShort: {
    width: '78%',
    height: 14,
    marginBottom: 0,
  },
  sectionHeading: {
    width: '48%',
    height: typography.sizes.lg,
    marginBottom: spacing.md,
  },
  labelLine: {
    width: '34%',
    height: 10,
    marginBottom: spacing.sm,
  },
  fabricBodyLine: {
    width: '88%',
    height: 14,
    marginBottom: 0,
  },
  fabricLabelLine: {
    width: '42%',
    height: 10,
    marginBottom: spacing.xs,
  },
});
