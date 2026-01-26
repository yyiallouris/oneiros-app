import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Card } from './Card';
import { colors, spacing, borderRadius } from '../../theme';

interface LinoSkeletonCardProps {
  style?: any;
}

/**
 * LINO-style skeleton card for loading states
 * Off-white track, dusty turquoise fill, rounded edges
 * Use for: lists, feeds, entries
 */
export const LinoSkeletonCard: React.FC<LinoSkeletonCardProps> = ({ style }) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.5],
  });

  return (
    <Card style={[styles.skeletonCard, style]} transparent>
      <View style={styles.skeletonContent}>
        {/* Date line */}
        <Animated.View
          style={[
            styles.skeletonLine,
            styles.skeletonDate,
            { opacity },
            { backgroundColor: 'rgba(30, 95, 90, 0.2)' }, // Dusty turquoise
          ]}
        />
        
        {/* Title line */}
        <Animated.View
          style={[
            styles.skeletonLine,
            styles.skeletonTitle,
            { opacity },
            { backgroundColor: 'rgba(30, 95, 90, 0.25)' },
          ]}
        />
        
        {/* Preview lines */}
        <Animated.View
          style={[
            styles.skeletonLine,
            styles.skeletonPreview1,
            { opacity },
            { backgroundColor: 'rgba(30, 95, 90, 0.15)' },
          ]}
        />
        <Animated.View
          style={[
            styles.skeletonLine,
            styles.skeletonPreview2,
            { opacity },
            { backgroundColor: 'rgba(30, 95, 90, 0.15)' },
          ]}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  skeletonCard: {
    marginBottom: spacing.md,
    backgroundColor: 'rgba(240, 229, 223, 0.7)', // Off-white track
    borderRadius: borderRadius.lg,
  },
  skeletonContent: {
    padding: 0,
  },
  skeletonLine: {
    borderRadius: 2,
    height: 12,
    marginBottom: spacing.sm,
  },
  skeletonDate: {
    width: '30%',
    height: 10,
    marginBottom: spacing.xs,
  },
  skeletonTitle: {
    width: '75%',
    height: 16,
    marginBottom: spacing.xs,
  },
  skeletonPreview1: {
    width: '100%',
    height: 12,
  },
  skeletonPreview2: {
    width: '85%',
    height: 12,
  },
});
