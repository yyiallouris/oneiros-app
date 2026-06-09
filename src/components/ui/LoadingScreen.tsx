import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography } from '../../theme';
import { DesignExportForeground } from './DesignExportForeground';

interface LoadingScreenProps {
  onComplete?: () => void;
}

const BRUSH_WIDTH = 100;
const BRUSH_DURATION_MS = 1500;
const MAX_EMBLEM_SIZE = 330;
const IMAGE_SCALE = 100; // Fuller in-app brand moment after the native splash.

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const insets = useSafeAreaInsets();
  const { height: screenH, width: screenW } = useWindowDimensions();
  const brushAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const contentH = screenH - insets.top - insets.bottom;
  const imgSize = Math.min(MAX_EMBLEM_SIZE, Math.round(screenW * IMAGE_SCALE));
  const portalOffset = -Math.round(contentH * 0.04);

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
      if (!onComplete) {
        return;
      }

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
    outputRange: [-BRUSH_WIDTH, imgSize + BRUSH_WIDTH],
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
      <DesignExportForeground style={[styles.centerBox, { transform: [{ translateY: portalOffset }] }]}>
        <View style={[styles.imageWrap, { width: imgSize, height: imgSize }]}>
          <Image
            source={require('../../../assets/branding/splash-logo.png')}
            style={{ width: imgSize, height: imgSize }}
            resizeMode="contain"
          />
          <Animated.View
            style={[
              styles.brush,
              {
                width: BRUSH_WIDTH,
                height: imgSize,
                transform: [{ translateX: brushTranslateX }],
              },
            ]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={['transparent', 'rgba(248, 243, 234, 0.34)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        <View style={styles.titleWrap}>
          <Text style={styles.titleMain}>Oneiros</Text>
        </View>
      </DesignExportForeground>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.buttonPrimary,
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
    marginTop: 18,
    alignItems: 'center',
  },
  titleMain: {
    fontFamily: typography.display,
    fontSize: 42,
    color: '#F8F3EA',
    letterSpacing: 1.8,
    opacity: 0.88,
  },
  brush: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
});
