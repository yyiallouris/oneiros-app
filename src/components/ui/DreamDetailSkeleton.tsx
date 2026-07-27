import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, StyleProp, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface DreamDetailSkeletonProps {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Layout-faithful DreamDetail initial loader.
 * Mirrors dream page (date / title / body) + symbolic reflection summary,
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

      {/* Reflection summary — matches reflectionSection + DreamFieldSummary shape */}
      <View style={styles.reflectionSection}>
        {line('reflectionTitle', styles.sectionHeading, colors.wave1)}

        <View style={styles.essenceBlock}>
          {line('essenceLabel', styles.labelLine, colors.wave1)}
          {line('essenceTitle', styles.essenceTitleLine, colors.wave1)}
          {line('essenceLine', styles.essenceBodyLine)}
        </View>

        <View style={styles.summaryBlock}>
          {line('anchorsLabel', styles.labelLine, colors.wave1)}
          <View style={styles.anchorRow}>
            {line('anchor1a', styles.anchorTitleLine, colors.wave1)}
            {line('anchor1b', styles.anchorMeaningLine)}
          </View>
          <View style={styles.anchorRow}>
            {line('anchor2a', styles.anchorTitleLine, colors.wave1)}
            {line('anchor2b', styles.anchorMeaningLine)}
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
  essenceBlock: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.contourLineFaint,
    marginBottom: spacing.md,
  },
  summaryBlock: {
    marginBottom: spacing.md,
  },
  previewBlock: {
    marginTop: spacing.md,
  },
  anchorRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.contourLineFaint,
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
  essenceTitleLine: {
    width: '55%',
    height: typography.sizes.lg,
    marginBottom: spacing.xs,
  },
  essenceBodyLine: {
    width: '88%',
    height: 14,
    marginBottom: 0,
  },
  anchorTitleLine: {
    width: '42%',
    height: 14,
    marginBottom: spacing.xs,
  },
  anchorMeaningLine: {
    width: '72%',
    height: 12,
    marginBottom: 0,
  },
});
