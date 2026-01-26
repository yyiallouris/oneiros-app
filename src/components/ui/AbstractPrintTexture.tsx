import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface PrintPatchLoaderProps {
  size?: number;
  color?: string;
  style?: any;
}

export const PrintPatchLoader: React.FC<PrintPatchLoaderProps> = ({
  size = 72,
  color = 'rgba(30, 95, 90, 0.55)',
  style,
}) => {
  // Create 5-7 horizontal threads with individual animations
  const threadCount = 6;
  const threads = useRef(
    Array.from({ length: threadCount }, (_, i) => ({
      opacity: new Animated.Value(0.2),
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      phase: i * 0.15, // Stagger initial phase
    }))
  ).current;

  useEffect(() => {
    const animations = threads.map((thread, i) => {
      // Organic pulse - each thread has different timing
      const pulseDuration = 1800 + (i % 3) * 200; // 1800-2200ms variation
      const pulseDelay = i * 150; // Stagger start

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.delay(pulseDelay),
          Animated.timing(thread.opacity, {
            toValue: 0.7,
            duration: pulseDuration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(thread.opacity, {
            toValue: 0.2,
            duration: pulseDuration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      // Organic drift - random but smooth movement
      const driftXDuration = 2400 + (i % 2) * 300; // 2400-2700ms
      const driftYDuration = 2800 + (i % 3) * 200; // 2800-3400ms
      const driftXRange = (i % 2 === 0 ? 1.5 : -1.2) + (i % 3) * 0.3; // Vary direction and range
      const driftYRange = (i % 3 === 0 ? 0.8 : -0.6) + (i % 2) * 0.4;

      const driftX = Animated.loop(
        Animated.sequence([
          Animated.timing(thread.x, {
            toValue: driftXRange,
            duration: driftXDuration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(thread.x, {
            toValue: -driftXRange * 0.7,
            duration: driftXDuration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      const driftY = Animated.loop(
        Animated.sequence([
          Animated.timing(thread.y, {
            toValue: driftYRange,
            duration: driftYDuration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(thread.y, {
            toValue: -driftYRange * 0.8,
            duration: driftYDuration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      pulse.start();
      driftX.start();
      driftY.start();

      return { pulse, driftX, driftY };
    });

    return () => {
      animations.forEach(({ pulse, driftX, driftY }) => {
        pulse.stop();
        driftX.stop();
        driftY.stop();
      });
    };
  }, []);

  // Generate horizontal thread paths with slight curves
  const threadPaths = useMemo(() => {
    const w = size;
    const h = size;
    const left = w * 0.15;
    const right = w * 0.85;
    const gap = h / (threadCount + 1);

    return Array.from({ length: threadCount }, (_, i) => {
      const y = gap * (i + 1) + (i % 2 === 0 ? 0.8 : -0.5); // Slight vertical offset
      const midX = w * 0.5;
      const curveOffset = (i % 3 === 0 ? 1.5 : -1.2) + (i % 2) * 0.8; // Organic curve variation
      
      // Horizontal thread with slight curve (not perfectly straight)
      const d = `M ${left} ${y} Q ${midX} ${y + curveOffset} ${right} ${y}`;
      return d;
    });
  }, [size, threadCount]);

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {threadPaths.map((d, i) => {
        const thread = threads[i];
        return (
          <Animated.View
            key={i}
            style={[
              styles.threadWrapper,
              {
                transform: [
                  { translateX: thread.x },
                  { translateY: thread.y },
                ],
              },
            ]}
          >
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <AnimatedPath
                d={d}
                stroke={color}
                strokeWidth={i % 3 === 0 ? 1.4 : 1.0} // Slight variation
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={thread.opacity}
              />
            </Svg>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    alignItems: 'center', 
    justifyContent: 'center',
    position: 'relative',
  },
  threadWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
});
