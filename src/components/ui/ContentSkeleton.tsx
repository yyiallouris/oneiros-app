import React, { useEffect, useRef } from 'react';
import { View, StyleProp, ViewStyle, Animated, Easing, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';

interface ContentSkeletonProps {
  blocks?: number;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export const ContentSkeleton: React.FC<ContentSkeletonProps> = ({
  blocks = 3,
  testID = 'content-skeleton',
  style,
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

  return (
    <View style={[styles.container, style]} testID={testID}>
      {Array.from({ length: blocks }, (_, index) => (
        <View key={index} style={styles.block}>
          <Animated.View
            style={[
              styles.line,
              styles.titleLine,
              {
                backgroundColor: colors.wave1,
                opacity: shimmer.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.28, 0.5],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.line,
              {
                backgroundColor: colors.wave2,
                opacity: shimmer.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.25, 0.45],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.line,
              styles.shortLine,
              {
                backgroundColor: colors.wave2,
                opacity: shimmer.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, 0.4],
                }),
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  block: {
    marginBottom: spacing.xl,
  },
  line: {
    height: 14,
    borderRadius: 2,
    marginBottom: spacing.sm,
    width: '100%',
  },
  titleLine: {
    width: '45%',
    height: 12,
    marginBottom: spacing.md,
  },
  shortLine: {
    width: '88%',
  },
});
