import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, text, borderRadius, borders } from '../theme';
import { WaveBackground, Card } from '../components/ui';
import { UserService } from '../services/userService';
import { getInterpretationDepth, setInterpretationDepth, type InterpretationDepth } from '../services/userSettingsService';
import {
  getBiometricStatus,
  isBiometricEnabled,
  enableBiometric,
  disableBiometric,
  getBiometricLabel,
} from '../services/biometricAuthService';

type NavProp = StackNavigationProp<RootStackParamList>;

const DEPTH_OPTIONS: { value: InterpretationDepth; label: string; hint: string }[] = [
  { value: 'quick', label: 'Quick Glance', hint: '80–180 words, low cognitive load' },
  { value: 'standard', label: 'Core Reflection', hint: '150–350 words, full post-Jungian' },
  { value: 'advanced', label: 'Deeper Dive', hint: '400–700 words, extended & motif tracking' },
];

const AccountScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [displayName, setDisplayName] = useState('');
  const [savedHint, setSavedHint] = useState(false);
  const savedHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [interpretationDepth, setInterpretationDepthState] = useState<InterpretationDepth>('standard');
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Fingerprint');
  const [biometricLoading, setBiometricLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      UserService.getDisplayName().then((name) => {
        if (mounted) setDisplayName(name ?? '');
      });
      getInterpretationDepth().then((depth) => {
        if (mounted) setInterpretationDepthState(depth);
      });
      getBiometricStatus().then((status) => {
        if (mounted) {
          setBiometricSupported(status.canUse);
          setBiometricLabel(getBiometricLabel(status.type));
        }
      });
      isBiometricEnabled().then((enabled) => {
        if (mounted) setBiometricEnabled(enabled);
      });
      return () => {
        mounted = false;
        if (savedHintTimer.current) clearTimeout(savedHintTimer.current);
      };
    }, [])
  );

  const handleSaveName = useCallback(() => {
    if (savedHintTimer.current) clearTimeout(savedHintTimer.current);
    UserService.setDisplayName(displayName);
    setSavedHint(true);
    savedHintTimer.current = setTimeout(() => {
      savedHintTimer.current = null;
      setSavedHint(false);
      navigation.navigate('MainTabs', { screen: 'Write' });
    }, 800);
  }, [displayName, navigation]);

  const handleDepthSelect = useCallback((depth: InterpretationDepth) => {
    setInterpretationDepthState(depth);
    setInterpretationDepth(depth);
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

  return (
    <View style={styles.container}>
      <WaveBackground />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Account</Text>

        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>Profile</Text>
          <Text style={styles.fieldLabel}>Name or nickname</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="How you’d like to be called"
            placeholderTextColor={text.muted}
            maxLength={60}
            autoCapitalize="words"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveName} activeOpacity={0.7}>
            <Text style={styles.saveButtonText}>{savedHint ? 'Saved' : 'Save'}</Text>
          </TouchableOpacity>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>Dream analysis</Text>
          <Text style={styles.fieldLabel}>Level of analysis (default: Core Reflection)</Text>
          {DEPTH_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.depthRow, interpretationDepth === opt.value && styles.depthRowActive]}
              onPress={() => handleDepthSelect(opt.value)}
              activeOpacity={0.7}
            >
              <View style={styles.depthContent}>
                <Text style={[styles.depthLabel, interpretationDepth === opt.value && styles.depthLabelActive]}>
                  {opt.label}
                </Text>
                <Text style={styles.depthHint}>{opt.hint}</Text>
              </View>
              {interpretationDepth === opt.value && <Text style={styles.depthCheck}>✓</Text>}
            </TouchableOpacity>
          ))}
        </Card>

        {biometricSupported && (
          <Card style={styles.card}>
            <Text style={styles.sectionLabel}>Security</Text>
            <View style={styles.biometricRow}>
              <Text style={styles.biometricLabel}>Lock app with {biometricLabel}</Text>
              <Text style={styles.biometricHint}>Require {biometricLabel} to open the app</Text>
              {biometricLoading ? (
                <ActivityIndicator size="small" color={colors.accent} style={styles.biometricSpinner} />
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
          </Card>
        )}
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
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    fontFamily: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: borders.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  saveButton: {
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  saveButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.onAccent ?? colors.white,
  },
  depthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  depthRowActive: {
    backgroundColor: colors.accent + '14',
    borderColor: colors.accent + '40',
  },
  depthContent: { flex: 1 },
  depthLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  depthLabelActive: {
    color: colors.accent,
    fontWeight: typography.weights.semibold,
  },
  depthHint: {
    fontSize: typography.sizes.sm,
    color: text.muted,
    marginTop: 2,
  },
  depthCheck: {
    fontSize: typography.sizes.lg,
    color: colors.accent,
    marginLeft: spacing.sm,
  },
  biometricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  biometricLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    flex: 1,
  },
  biometricHint: {
    fontSize: typography.sizes.sm,
    color: text.muted,
    width: '100%',
    marginTop: 2,
  },
  biometricSpinner: {
    marginLeft: 'auto',
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
    backgroundColor: colors.accent,
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
});

export default AccountScreen;
