import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';

interface ThreadPulseProps {
  size?: number;
  color?: string;
  style?: any;
}

/**
 * Custom loading component with thread-like pulsing animation
 * Reflects the ritualistic, organic feeling of the dream journal app
 */
export const ThreadPulse: React.FC<ThreadPulseProps> = ({
  size = 40,
  color = colors.buttonPrimary,
  style,
}) => {
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;
  const threadScale = useRef(new Animated.Value(1)).current;
  const threadOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Create staggered pulse animation for the three dots
    const createPulse = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 800,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(threadScale, {
              toValue: 1.1,
              duration: 800,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(threadOpacity, {
              toValue: 0.9,
              duration: 400,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(animValue, {
              toValue: 0,
              duration: 800,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(threadScale, {
              toValue: 1,
              duration: 800,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(threadOpacity, {
              toValue: 0.6,
              duration: 400,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ])
      );
    };

    // Start all three pulses with different delays for wave effect
    const pulse1Anim = createPulse(pulse1, 0);
    const pulse2Anim = createPulse(pulse2, 200);
    const pulse3Anim = createPulse(pulse3, 400);

    pulse1Anim.start();
    pulse2Anim.start();
    pulse3Anim.start();

    return () => {
      pulse1Anim.stop();
      pulse2Anim.stop();
      pulse3Anim.stop();
    };
  }, []);

  // Interpolate scale and opacity for each dot
  const scale1 = pulse1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  });

  const scale2 = pulse2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  });

  const scale3 = pulse3.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  });

  const opacity1 = pulse1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 1, 0.4],
  });

  const opacity2 = pulse2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 1, 0.4],
  });

  const opacity3 = pulse3.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 1, 0.4],
  });

  // Thread path connecting the dots
  const threadPath = `M ${size * 0.2} ${size * 0.5} Q ${size * 0.5} ${size * 0.3} ${size * 0.8} ${size * 0.5}`;

  const dotSize = size * 0.15;
  const dotRadius = dotSize / 2;

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.threadContainer,
          {
            width: size,
            height: size,
            transform: [{ scale: threadScale }],
            opacity: threadOpacity,
          },
        ]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Thread line */}
          <Path
            d={threadPath}
            stroke={color}
            strokeWidth={1.5}
            strokeOpacity={0.3}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>

      {/* Three pulsing dots */}
      <Animated.View
        style={[
          styles.dot,
          {
            left: size * 0.2 - dotRadius,
            top: size * 0.5 - dotRadius,
            width: dotSize,
            height: dotSize,
            borderRadius: dotRadius,
            backgroundColor: color,
            transform: [{ scale: scale1 }],
            opacity: opacity1,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            left: size * 0.5 - dotRadius,
            top: size * 0.3 - dotRadius,
            width: dotSize,
            height: dotSize,
            borderRadius: dotRadius,
            backgroundColor: color,
            transform: [{ scale: scale2 }],
            opacity: opacity2,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            left: size * 0.8 - dotRadius,
            top: size * 0.5 - dotRadius,
            width: dotSize,
            height: dotSize,
            borderRadius: dotRadius,
            backgroundColor: color,
            transform: [{ scale: scale3 }],
            opacity: opacity3,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  threadContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
  },
});
