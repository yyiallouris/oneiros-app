import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { RootNavigator } from './src/navigation/RootNavigator';
import { LoadingScreen, WebContentShell } from './src/components/ui';
import { SubscriptionProvider } from './src/providers/SubscriptionProvider';
import {
  DESIGN_EXPORT_DEVICE_HEIGHT,
  DESIGN_EXPORT_DEVICE_WIDTH,
  DESIGN_EXPORT_HOLD_SPLASH,
  DESIGN_EXPORT_MODE,
} from './src/designExport';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isLoading, setIsLoading] = useState(!DESIGN_EXPORT_MODE || DESIGN_EXPORT_HOLD_SPLASH);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    CormorantGaramond_600SemiBold,
  });

  useEffect(() => {
    if (!fontsLoaded) {
      return;
    }

    // Keep the native splash visible until brand fonts are ready, then hand off
    // to the in-app loading screen for the rest of the intro sequence.
    SplashScreen.hideAsync().catch(() => {
      // Ignore errors
    });
  }, [fontsLoaded]);

  useEffect(() => {
    if (!DESIGN_EXPORT_MODE || typeof document === 'undefined') {
      return;
    }

    const styleId = 'oneiros-design-export-phone-frame';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        html,
        body,
        #root {
          width: ${DESIGN_EXPORT_DEVICE_WIDTH}px !important;
          min-width: ${DESIGN_EXPORT_DEVICE_WIDTH}px !important;
          max-width: ${DESIGN_EXPORT_DEVICE_WIDTH}px !important;
          height: ${DESIGN_EXPORT_DEVICE_HEIGHT}px !important;
          min-height: ${DESIGN_EXPORT_DEVICE_HEIGHT}px !important;
          max-height: ${DESIGN_EXPORT_DEVICE_HEIGHT}px !important;
          margin: 0 !important;
          overflow: hidden !important;
          background: #f7efe7 !important;
        }

        #root,
        #root > div {
          position: relative !important;
          overflow: hidden !important;
        }

        #root > div {
          width: ${DESIGN_EXPORT_DEVICE_WIDTH}px !important;
          min-width: ${DESIGN_EXPORT_DEVICE_WIDTH}px !important;
          max-width: ${DESIGN_EXPORT_DEVICE_WIDTH}px !important;
          height: ${DESIGN_EXPORT_DEVICE_HEIGHT}px !important;
          min-height: ${DESIGN_EXPORT_DEVICE_HEIGHT}px !important;
          max-height: ${DESIGN_EXPORT_DEVICE_HEIGHT}px !important;
        }
      `;
      document.head.appendChild(style);
    }

    const existing = document.querySelector('script[data-oneiros-figma-capture="true"]');
    if (existing) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://mcp.figma.com/mcp/html-to-design/capture.js';
    script.async = true;
    script.dataset.oneirosFigmaCapture = 'true';
    document.head.appendChild(script);
  }, []);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  if (!fontsLoaded) {
    return null;
  }

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <WebContentShell>
          <LoadingScreen onComplete={DESIGN_EXPORT_HOLD_SPLASH ? undefined : handleLoadingComplete} />
        </WebContentShell>
      </SafeAreaProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <WebContentShell>
          <SubscriptionProvider>
            <RootNavigator />
          </SubscriptionProvider>
        </WebContentShell>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
