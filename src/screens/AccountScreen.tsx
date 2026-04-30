import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, text, borderRadius, borders, semantic } from '../theme';
import { WaveBackground, Card } from '../components/ui';
import { UserService } from '../services/userService';
import { getInterpretationDepth, setInterpretationDepth, getMythicResonance, setMythicResonance, type InterpretationDepth } from '../services/userSettingsService';
import {
  getBiometricStatus,
  isBiometricEnabled,
  enableBiometric,
  disableBiometric,
  getBiometricLabel,
} from '../services/biometricAuthService';
import { deleteAccountAndData } from '../services/accountDeletion';

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
  const [mythicResonance, setMythicResonanceState] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Fingerprint');
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [accountDeleting, setAccountDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      UserService.getDisplayName().then((name) => {
        if (mounted) setDisplayName(name ?? '');
      });
      getInterpretationDepth().then((depth) => {
        if (mounted) setInterpretationDepthState(depth);
      });
      getMythicResonance().then((enabled) => {
        if (mounted) setMythicResonanceState(enabled);
      });
      getBiometricStatus().then((status) => {
        if (mounted) {
          // Show Security section when hasHardware is true (iOS Face ID, Android fingerprint).
          // Use canUse for enabling; show when hasHardware so user can tap to trigger permission prompt.
          setBiometricSupported(status.canUse || status.hasHardware);
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

  const handleMythicResonanceToggle = useCallback(async (value: boolean) => {
    setMythicResonanceState(value);
    await setMythicResonance(value);
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

  const handleExportRequest = useCallback(() => {
    navigation.navigate('Contact', {
      initialSubject: 'Data export request',
      initialMessage: 'I would like to request an export of my Oneiros data.',
    });
  }, [navigation]);

  const handleDeletionRequest = useCallback(() => {
    Alert.alert(
      'Delete account and data?',
      'This will delete your Oneiros account and associated dream data. This cannot be undone. Some records may be kept only where required for security, fraud prevention, or legal reasons.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setAccountDeleting(true);
            try {
              await deleteAccountAndData();
            } catch {
              Alert.alert(
                'Could not delete account',
                'Please try again later or contact us from Privacy & Legal so we can help.'
              );
            } finally {
              setAccountDeleting(false);
            }
          },
        },
      ]
    );
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
          {interpretationDepth === 'advanced' && (
            <View style={styles.mythicRow}>
              <View style={styles.mythicContent}>
                <Text style={styles.mythicLabel}>Mythic Resonance</Text>
                <Text style={styles.mythicHint}>Adds brief mythic echoes as metaphors — not spiritual claims. Available in Deeper Dive.</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, mythicResonance && styles.toggleOn]}
                onPress={() => handleMythicResonanceToggle(!mythicResonance)}
                activeOpacity={0.7}
              >
                <View style={[styles.toggleThumb, mythicResonance && styles.toggleThumbOn]} />
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {biometricSupported && (
          <Card style={styles.card}>
            <Text style={styles.sectionLabel}>Security</Text>
            <View style={styles.biometricRow}>
              <Text style={styles.biometricLabel}>Lock app with {biometricLabel}</Text>
              <Text style={styles.biometricHint}>Require {biometricLabel} to open the app</Text>
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
          </Card>
        )}

        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>Your data</Text>
          <TouchableOpacity style={styles.dataRow} onPress={() => navigation.navigate('Privacy')} activeOpacity={0.7}>
            <View style={styles.dataRowContent}>
              <Text style={styles.dataRowTitle}>Privacy & Legal</Text>
              <Text style={styles.dataRowHint}>How your journal, AI reflections, and requests are handled.</Text>
            </View>
            <Text style={styles.dataRowChevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dataRow} onPress={handleExportRequest} activeOpacity={0.7}>
            <View style={styles.dataRowContent}>
              <Text style={styles.dataRowTitle}>Export journal</Text>
              <Text style={styles.dataRowHint}>Request a copy of your dreams and AI reflections.</Text>
            </View>
            <Text style={styles.dataRowChevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dataRow, styles.dataRowLast, accountDeleting && styles.dataRowDisabled]}
            onPress={handleDeletionRequest}
            activeOpacity={0.7}
            disabled={accountDeleting}
          >
            <View style={styles.dataRowContent}>
              <Text style={[styles.dataRowTitle, styles.deleteRowTitle]}>Delete account and data</Text>
              <Text style={styles.dataRowHint}>
                {accountDeleting ? 'Deleting account...' : 'Permanently remove your account and associated data.'}
              </Text>
            </View>
            <Text style={[styles.dataRowChevron, styles.deleteRowTitle]}>›</Text>
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
    backgroundColor: colors.buttonPrimary,
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
    backgroundColor: colors.buttonPrimaryLight12,
    borderColor: colors.buttonPrimary40,
  },
  depthContent: { flex: 1 },
  depthLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  depthLabelActive: {
    color: colors.buttonPrimary,
    fontWeight: typography.weights.semibold,
  },
  depthHint: {
    fontSize: typography.sizes.sm,
    color: text.muted,
    marginTop: 2,
  },
  depthCheck: {
    fontSize: typography.sizes.lg,
    color: colors.buttonPrimary,
    marginLeft: spacing.sm,
  },
  mythicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: borders.primary,
  },
  mythicContent: { flex: 1 },
  mythicLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  mythicHint: {
    fontSize: typography.sizes.sm,
    color: text.muted,
    marginTop: 2,
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
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: borders.primary,
  },
  dataRowLast: {
    borderBottomWidth: 0,
  },
  dataRowDisabled: {
    opacity: 0.55,
  },
  dataRowContent: {
    flex: 1,
    paddingRight: spacing.md,
  },
  dataRowTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  dataRowHint: {
    fontSize: typography.sizes.sm,
    color: text.muted,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
  },
  dataRowChevron: {
    fontSize: typography.sizes.xl,
    color: colors.textMuted,
  },
  deleteRowTitle: {
    color: semantic.errorDark,
  },
});

export default AccountScreen;
