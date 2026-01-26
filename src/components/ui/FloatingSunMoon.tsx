import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '../../theme';

interface FloatingSunMoonProps {
  size?: number;
  style?: any;
}

export const FloatingSunMoon: React.FC<FloatingSunMoonProps> = ({ 
  size = 120,
  style 
}) => {
  const opacityAnim = useRef(new Animated.Value(0.8)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slow breathing oscillation
    const opacityAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    );

    // Gentle vertical floating motion
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateYAnim, {
          toValue: -8,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    );

    opacityAnimation.start();
    floatAnimation.start();

    return () => {
      opacityAnimation.stop();
      floatAnimation.stop();
    };
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ translateY: translateYAnim }],
        },
        style,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Defs>
          <RadialGradient id="sunMoonGradient" cx="50%" cy="50%">
            <Stop offset="0%" stopColor="#C3B8E0" stopOpacity="0.6" />
            <Stop offset="50%" stopColor="#E8D5B7" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#C3B8E0" stopOpacity="0.2" />
          </RadialGradient>
        </Defs>
        <Circle
          cx="60"
          cy="60"
          r="50"
          fill="url(#sunMoonGradient)"
        />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

