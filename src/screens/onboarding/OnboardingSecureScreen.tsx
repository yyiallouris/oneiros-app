import React, { useState, useCallback, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, spacing, typography, text } from '../../theme';
import { MountainWaveBackground, Card, Button } from '../../components/ui';
import {
  getBiometricStatus,
  isBiometricEnabled,
  enableBiometric,
  disableBiometric,
  getBiometricLabel,
} from '../../services/biometricAuthService';
import { setOnboardingCompleted } from '../../services/onboardingService';
import { OnboardingCompleteContext } from '../../navigation/OnboardingNavigator';
import type { OnboardingStackParamList } from '../../navigation/types';

type NavProp = StackNavigationProp<OnboardingStackParamList, 'OnboardingSecure'>;

const OnboardingSecureScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const onComplete = useContext(OnboardingCompleteContext);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Fingerprint');
  const [biometricLoading, setBiometricLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    getBiometricStatus().then((status) => {
      if (mounted) {
        setBiometricSupported(status.canUse || status.hasHardware);
        setBiometricLabel(getBiometricLabel(status.type));
      }
    });
    isBiometricEnabled().then((enabled) => {
      if (mounted) setBiometricEnabled(enabled);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleBiometricToggle = useCallback(async (value: boolean) => {
    setBiometricLoading(true);
    try {
      if (value) {
        const result = await enableBiometric();
        if (result.success) {
          setBiometricEnabled(true);
        } else {
          Alert.alert('Could not enable', result.error ?? 'Try again.');
        }
      } else {
        await disableBiometric();
        setBiometricEnabled(false);
      }
    } finally {
      setBiometricLoading(false);
    }
  }, []);

  const handleFinish = useCallback(async () => {
    await setOnboardingCompleted();
    onComplete?.();
  }, [onComplete]);

  const handleSkip = useCallback(async () => {
    await setOnboardingCompleted();
    onComplete?.();
  }, [onComplete]);

  return (
    <View style={styles.container}>
      <MountainWaveBackground height={260} lite />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Secure your journal</Text>
        <Text style={styles.subtitle}>
          Keep your dreams private. You can lock the app with {biometricLabel} so only you can open it.
        </Text>

        <Card style={styles.card}>
          {biometricSupported ? (
            <>
              <Text style={styles.sectionLabel}>Lock app with {biometricLabel}</Text>
              <Text style={styles.fieldLabel}>Require {biometricLabel} to open the app</Text>
              <View style={styles.biometricRow}>
                {biometricLoading ? (
                  <ActivityIndicator size="small" color={colors.buttonPrimary} style={styles.biometricSpinner} />
                ) : (
                  <TouchableOpacity
                    style={[styles.toggle, biometricEnabled && styles.toggleOn]}
                    onPress={() => handleBiometricToggle(!biometricEnabled)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.toggleThumb, biometricEnabled && styles.toggleThumbOn]} />
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : (
            <Text style={styles.unsupportedText}>
              Biometric lock is not available on this device. You can enable it later in Account settings if you switch devices.
            </Text>
          )}
          <Button
            title="Get started"
            onPress={handleFinish}
            style={styles.primaryButton}
          />
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
    padding: spacing.xs,
  },
  backText: {
    fontSize: typography.sizes.md,
    color: colors.buttonPrimary,
    fontWeight: typography.weights.medium,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: text.secondary,
    lineHeight: typography.sizes.md * 1.4,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  card: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    marginBottom: spacing.sm,
  },
  biometricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  biometricSpinner: {
    alignSelf: 'flex-start',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.inputBorder,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOn: {
    backgroundColor: colors.buttonPrimary,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignSelf: 'flex-start',
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  unsupportedText: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    lineHeight: typography.sizes.sm * 1.4,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    marginBottom: spacing.sm,
  },
  skipButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontSize: typography.sizes.sm,
    color: text.muted,
    fontWeight: typography.weights.medium,
  },
});

export default OnboardingSecureScreen;
