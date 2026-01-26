import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { colors } from '../../theme';

interface BreathingLineProps {
  width?: number;
  height?: number;
  color?: string;
  style?: any;
}

/**
 * Default loading component: A subtle breathing line with shimmer
 * Use for: fetching small data, transitions
 * Feels like: wave / breath (not tech loading bar)
 */
export const BreathingLine: React.FC<BreathingLineProps> = ({
  width = 160,
  height = 3,
  color = 'rgba(30, 95, 90, 0.45)',
  style,
}) => {
  const x = useRef(new Animated.Value(-1)).current;
  const opacityAnim = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.55,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.25,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(x, {
            toValue: 1,
            duration: 2400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(x, {
            toValue: -1,
            duration: 2400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, []);

  const translateX = x.interpolate({
    inputRange: [-1, 1],
    outputRange: [-width * 0.35, width * 0.35],
  });

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.track,
          {
            width,
            height,
            backgroundColor: 'rgba(30, 95, 90, 0.14)', // Low contrast track
          },
        ]}
      >
        <Animated.View
          style={[
            styles.highlight,
            {
              width: width * 0.55, // Highlight segment
              height,
              backgroundColor: color,
              opacity: opacityAnim,
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    borderRadius: 999, // Pill shape
    overflow: 'hidden',
  },
  highlight: {
    borderRadius: 999,
  },
});
