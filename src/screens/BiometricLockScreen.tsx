import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
// @ts-ignore - @expo/vector-icons resolved at runtime by Expo
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography } from '../theme';
import { Button, WaveBackground, FloatingSunMoon } from '../components/ui';
import { requireBiometricUnlock, getBiometricStatus, getBiometricLabel } from '../services/biometricAuthService';
import { BiometricUnlockContext } from '../navigation/RootNavigator';

type NavProp = StackNavigationProp<RootStackParamList>;

const BiometricLockScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const onUnlock = useContext(BiometricUnlockContext);
  const [label, setLabel] = useState('Fingerprint');
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    getBiometricStatus().then((s) => setLabel(getBiometricLabel(s.type)));
  }, []);

  // Auto-prompt once when screen appears
  useEffect(() => {
    const t = setTimeout(async () => {
      const status = await getBiometricStatus();
      const promptLabel = getBiometricLabel(status.type);
      const ok = await requireBiometricUnlock(`Unlock with ${promptLabel}`);
      if (ok) onUnlock?.();
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const handleUnlock = async () => {
    setUnlocking(true);
    try {
      const ok = await requireBiometricUnlock(`Unlock with ${label}`);
      if (ok) onUnlock?.();
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <View style={styles.container}>
      <WaveBackground />
      <View style={[styles.inner, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.header}>
          <FloatingSunMoon size={100} style={styles.floatingOrb} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>Dream Journal is locked</Text>
            <Ionicons name="lock-closed" size={28} color={colors.textPrimary} style={styles.lockIcon} />
          </View>
          <Text style={styles.subtitle}>
            Use {label} to open your journal.
          </Text>
        </View>
        <Button
          title={`Unlock with ${label}`}
          onPress={handleUnlock}
          loading={unlocking}
          style={styles.button}
        />
        <TouchableOpacity
          onPress={() => navigation.navigate('LoginSupport')}
          style={styles.supportLink}
          activeOpacity={0.7}
        >
          <Text style={styles.supportLinkText}>Having issues? Contact us!</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  floatingOrb: {
    top: -20,
    zIndex: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    zIndex: 1,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    fontFamily: typography.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  lockIcon: {
    marginLeft: spacing.xs,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    lineHeight: typography.sizes.md * typography.lineHeights.normal,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.lg,
  },
  supportLink: {
    marginTop: spacing.xl,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  supportLinkText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
});

export default BiometricLockScreen;
