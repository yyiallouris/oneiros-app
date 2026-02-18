import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { typography, text } from '../../theme';

interface LoadingScreenProps {
  onComplete?: () => void;
}

const BRUSH_WIDTH = 100;
const BRUSH_DURATION_MS = 1500;
const IMAGE_SCALE = 0.88; // Slightly smaller than full screen

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const insets = useSafeAreaInsets();
  const { height: screenH, width: screenW } = useWindowDimensions();
  const brushAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const contentH = screenH - insets.top - insets.bottom;
  const imgW = Math.round(screenW * IMAGE_SCALE);
  const imgH = Math.round(contentH * IMAGE_SCALE);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    Animated.timing(brushAnim, {
      toValue: 1,
      duration: BRUSH_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onComplete?.();
      });
    });
  }, [brushAnim, fadeAnim]);

  const brushTranslateX = brushAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-BRUSH_WIDTH, imgW + BRUSH_WIDTH],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.centerBox}>
        <View style={[styles.imageWrap, { width: imgW, height: imgH }]}>
          <Image
          source={require('../../../assets/loading_image.png')}
          style={{ width: imgW, height: imgH }}
          resizeMode="cover"
          />
          <Animated.View
            style={[
              styles.brush,
              {
                width: BRUSH_WIDTH,
                height: imgH,
                transform: [{ translateX: brushTranslateX }],
              },
            ]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={['transparent', 'rgba(255, 255, 255, 0.55)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        <View style={styles.titleWrap}>
          <Text style={styles.titleMain}>Oneiros</Text>
          <Text style={styles.titleSub}>Dream Journal</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4EFE8',
  },
  centerBox: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrap: {
    overflow: 'hidden',
  },
  titleWrap: {
    marginTop: 20,
    alignItems: 'center',
  },
  titleMain: {
    fontFamily: typography.bold,
    fontSize: 28,
    fontWeight: typography.weights.bold,
    color: text.primary,
    letterSpacing: 1.2,
  },
  titleSub: {
    fontFamily: typography.regular,
    fontSize: 15,
    fontWeight: typography.weights.regular,
    color: text.secondary,
    letterSpacing: 3,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  brush: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
});

