import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../theme';

const { width } = Dimensions.get('window');

export const WaveBackground: React.FC = () => {
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create slow, dreamlike horizontal translation for waves
    const createWaveAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 8000 + delay * 2000, // Slow, organic motion
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 8000 + delay * 2000,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = createWaveAnimation(waveAnim1, 0);
    const anim2 = createWaveAnimation(waveAnim2, 1);

    anim1.start();
    anim2.start();

    return () => {
      anim1.stop();
      anim2.stop();
    };
  }, []);

  const translateX1 = waveAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 30], // Subtle horizontal drift
  });

  const translateX2 = waveAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20], // Opposite direction for depth
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.waveContainer,
          { transform: [{ translateX: translateX1 }] },
        ]}
      >
        <Svg
          width={width + 60}
          height={200}
          viewBox={`0 0 ${width + 60} 200`}
          style={styles.wave}
        >
          <Path
            d={`M0,100 Q${(width + 60) * 0.25},80 ${(width + 60) * 0.5},100 T${width + 60},100 L${width + 60},200 L0,200 Z`}
            fill={colors.wave1}
            opacity={0.3}
          />
        </Svg>
      </Animated.View>
      <Animated.View
        style={[
          styles.waveContainer,
          { transform: [{ translateX: translateX2 }] },
        ]}
      >
        <Svg
          width={width + 60}
          height={200}
          viewBox={`0 0 ${width + 60} 200`}
          style={styles.wave}
        >
          <Path
            d={`M0,120 Q${(width + 60) * 0.25},100 ${(width + 60) * 0.5},120 T${width + 60},120 L${width + 60},200 L0,200 Z`}
            fill={colors.wave2}
            opacity={0.2}
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: -30,
    right: -30,
    height: 200,
    overflow: 'hidden',
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
  },
  wave: {
    position: 'absolute',
    bottom: 0,
  },
});

