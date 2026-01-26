import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { colors } from '../../theme';

interface StarsAppearingProps {
  count?: number;
  size?: number;
  color?: string;
  style?: any;
}

/**
 * Light loading for lists
 * Use for: skeleton placeholder for lists
 * Feels like: the dream forming
 */
export const StarsAppearing: React.FC<StarsAppearingProps> = ({
  count = 5,
  size = 4,
  color = colors.accent,
  style,
}) => {
  // Randomize sizes and positions per render (2-5px)
  const starConfigs = useRef(
    Array.from({ length: count }, (_, index) => {
      const baseSize = 2 + Math.random() * 3; // 2-5px
      const positions = [
        { x: 0, y: 0 },
        { x: 12, y: -8 },
        { x: -10, y: 6 },
        { x: 8, y: 10 },
        { x: -12, y: -6 },
        { x: 6, y: -12 },
        { x: -8, y: 8 },
      ];
      return {
        size: baseSize,
        position: positions[index % positions.length],
        opacity: new Animated.Value(0),
        driftX: new Animated.Value(0),
        driftY: new Animated.Value(0),
      };
    })
  ).current;

  useEffect(() => {
    const animations = starConfigs.map((star, index) => {
      // Random delay for organic feel
      const delay = index * 200 + Math.random() * 300;

      // Subtle drift (0-1px)
      const driftAnim = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(star.driftX, {
              toValue: Math.random() * 1 - 0.5, // -0.5 to 0.5
              duration: 1500 + Math.random() * 500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(star.driftY, {
              toValue: Math.random() * 1 - 0.5,
              duration: 1500 + Math.random() * 500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(star.driftX, {
              toValue: Math.random() * 1 - 0.5,
              duration: 1500 + Math.random() * 500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(star.driftY, {
              toValue: Math.random() * 1 - 0.5,
              duration: 1500 + Math.random() * 500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      // Fade only (no scale bounce)
      const fadeAnim = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(star.opacity, {
            toValue: 0.3 + Math.random() * 0.4, // 0.3-0.7 (varied)
            duration: 800 + Math.random() * 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(400 + Math.random() * 200),
          Animated.timing(star.opacity, {
            toValue: 0.1 + Math.random() * 0.2, // 0.1-0.3
            duration: 800 + Math.random() * 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(200 + Math.random() * 200),
        ])
      );

      driftAnim.start();
      fadeAnim.start();

      return { driftAnim, fadeAnim };
    });

    return () => {
      animations.forEach(({ driftAnim, fadeAnim }) => {
        driftAnim.stop();
        fadeAnim.stop();
      });
    };
  }, []);

  return (
    <View style={[styles.container, style]}>
      {starConfigs.map((star, index) => {
        return (
          <Animated.View
            key={index}
            style={[
              styles.star,
              {
                width: star.size,
                height: star.size,
                borderRadius: star.size / 2,
                backgroundColor: color,
                opacity: star.opacity,
                transform: [
                  { translateX: Animated.add(star.position.x, star.driftX) },
                  { translateY: Animated.add(star.position.y, star.driftY) },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  star: {
    position: 'absolute',
  },
});
