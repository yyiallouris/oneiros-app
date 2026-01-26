import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import * as Network from 'expo-network';
import { setForceOfflineMode } from '../utils/network';
import { semantic, text } from '../theme';

/**
 * Developer-only component to toggle offline mode for testing
 * Only visible in development mode (__DEV__)
 */
export const DevOfflineToggle: React.FC = () => {
  const [isForcedOffline, setIsForcedOffline] = useState(false);
  const [actualOnline, setActualOnline] = useState(true);
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Check actual network state periodically (bypass force offline mode)
    const checkActualNetwork = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        setActualOnline(networkState.isConnected ?? false);
      } catch (error) {
        console.warn('[DevOfflineToggle] Failed to check network:', error);
      }
    };

    checkActualNetwork();
    const interval = setInterval(checkActualNetwork, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Animate slide in/out
    Animated.timing(slideAnim, {
      toValue: isForcedOffline ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isForcedOffline]);

  if (!__DEV__) {
    return null; // Only show in development
  }

  const toggleOffline = () => {
    const newState = !isForcedOffline;
    setIsForcedOffline(newState);
    setForceOfflineMode(newState);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🧪 DEV MODE: Force offline ${newState ? 'ENABLED' : 'DISABLED'}`);
    console.log(`   Actual network: ${actualOnline ? 'ONLINE' : 'OFFLINE'}`);
    console.log(`   App will behave as: ${newState ? 'OFFLINE' : actualOnline ? 'ONLINE' : 'OFFLINE'}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  };

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0], // Slide in from right
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.button, isForcedOffline && styles.buttonOffline]}
        onPress={toggleOffline}
        activeOpacity={0.7}
      >
        <Text style={styles.emoji}>{isForcedOffline ? '📴' : '📶'}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.text}>
            {isForcedOffline ? 'FORCED OFFLINE' : 'ONLINE'}
          </Text>
          <Text style={styles.subtext}>
            {isForcedOffline ? 'Tap to go online' : 'Tap to force offline'}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Below status bar
    right: 0,
    zIndex: 9999,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: semantic.success,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonOffline: {
    backgroundColor: semantic.error,
  },
  emoji: {
    fontSize: 20,
    marginRight: 8,
  },
  textContainer: {
    flexDirection: 'column',
  },
  text: {
    color: text.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  subtext: {
    color: text.white,
    fontSize: 10,
    opacity: 0.9,
  },
});
