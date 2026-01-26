import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../theme';

interface ThreadDriftProps {
  size?: number;
  color?: string;
  style?: any;
}

/**
 * Signature loading for AI moments
 * Use for: AI interpretation, "sacred" waiting
 * Feels like: something alive is moving
 */
export const ThreadDrift: React.FC<ThreadDriftProps> = ({
  size = 60,
  color = colors.accent,
  style,
}) => {
  const driftX = useRef(new Animated.Value(0)).current;
  const wiggleY = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    // Slow sideways drift (reduced amplitude)
    const drift = Animated.loop(
      Animated.sequence([
        Animated.timing(driftX, {
          toValue: 6,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(driftX, {
          toValue: -6,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Subtle jitter (reduced amplitude)
    const wiggle = Animated.loop(
      Animated.sequence([
        Animated.timing(wiggleY, {
          toValue: 1.5,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(wiggleY, {
          toValue: -1.5,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Breathing opacity (lower range)
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.55,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.25,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    drift.start();
    wiggle.start();
    breathing.start();

    return () => {
      drift.stop();
      wiggle.stop();
      breathing.stop();
    };
  }, []);

  // Thread path - organic curve
  const threadPath = `M ${size * 0.1} ${size * 0.5} Q ${size * 0.5} ${size * 0.3} ${size * 0.9} ${size * 0.5}`;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Animated.View
        style={[
          styles.threadContainer,
          {
            transform: [
              { translateX: driftX },
              { translateY: wiggleY },
            ],
            opacity: opacityAnim,
          },
        ]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Double stroke for printmaking effect - main line */}
          <Path
            d={threadPath}
            stroke={color}
            strokeWidth={1.6}
            opacity={0.55}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Secondary line with slight offset */}
          <Path
            d={threadPath}
            stroke={color}
            strokeWidth={1.0}
            opacity={0.25}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform={`translate(0, 0.8)`}
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  threadContainer: {
    position: 'absolute',
  },
});
