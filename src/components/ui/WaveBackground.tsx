import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { getWaveColorsForTime } from '../../theme/waveTimeColors';

const { width } = Dimensions.get('window');
const W = width + 60;

// Front wave: solid sand (no blending so it stays warm). Warmer than theme wave1 so it doesn’t read grey.
const FRONT_WAVE_SAND = '#E6DDCF';

export const WaveBackground: React.FC = () => {
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;
  const [backWaveColor, setBackWaveColor] = useState(() => getWaveColorsForTime().wave2);

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
    const anim3 = createWaveAnimation(waveAnim3, 2);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  // Only the back wave: update colour as time passes (purple → red through the day)
  useEffect(() => {
    setBackWaveColor(getWaveColorsForTime().wave2);
    const interval = setInterval(() => setBackWaveColor(getWaveColorsForTime().wave2), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const translateX1 = waveAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 30], // Subtle horizontal drift
  });

  const translateX2 = waveAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const translateX3 = waveAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 25],
  });

  return (
      <View style={styles.container}>
        {/* Back wave — πιο χαμηλά (Y=130), time-based (so if this renders on top it’s the default front) */}
        <Animated.View
          style={[styles.waveContainer, styles.waveBack, { transform: [{ translateX: translateX1 }] }]}
        >
          <Svg width={W} height={200} viewBox={`0 0 ${W} 200`} style={styles.wave}>
            <Path
              d={`M0,75 Q${W * 0.25},55 ${W * 0.5},75 T${W},75 L${W},200 L0,200 Z`}
              fill={backWaveColor}
              opacity={0.5}
            />
          </Svg>
        </Animated.View>
        {/* Middle wave — band 0.5 × front */}
        <Animated.View
          style={[styles.waveContainer, styles.waveBack, { transform: [{ translateX: translateX2 }] }]}
        >
          <Svg width={W} height={200} viewBox={`0 0 ${W} 200`} style={styles.wave}>
            <Path
              d={`M0,115 Q${W * 0.25},75 ${W * 0.5},115 T${W},115 L${W},200 L0,200 Z`}
              fill={backWaveColor}
              opacity={0.55}
            />
          </Svg>
        </Animated.View>
        {/* Front wave — band 1 (full), sand solid */}
        <Animated.View
          style={[styles.waveContainer, styles.waveFront, { transform: [{ translateX: translateX3 }] }]}
        >
          <Svg width={W} height={200} viewBox={`0 0 ${W} 200`} style={styles.wave}>
            <Path
              d={`M0,200 Q${W * 0.25},115 ${W * 0.5},200 T${W},200 L${W},200 L0,200 Z`}
              fill={FRONT_WAVE_SAND}
              opacity={1}
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
  waveBack: {
    zIndex: 0,
    elevation: 0,
  },
  waveFront: {
    zIndex: 1,
    elevation: 2,
  },
  wave: {
    position: 'absolute',
    bottom: 0,
  },
});

