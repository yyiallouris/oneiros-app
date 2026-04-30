import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, spacing, typography, text, borderRadius } from '../../theme';
import { MountainWaveBackground, Card, Button } from '../../components/ui';
import { setInterpretationDepth, type InterpretationDepth } from '../../services/userSettingsService';
import type { OnboardingStackParamList } from '../../navigation/types';
import { AI_REFLECTION_NOTICE } from '../../constants/legal';

type NavProp = StackNavigationProp<OnboardingStackParamList, 'OnboardingDepth'>;

const DEPTH_OPTIONS: { value: InterpretationDepth; label: string; hint: string }[] = [
  { value: 'quick', label: 'Quick Glance', hint: '80–180 words, low cognitive load' },
  { value: 'standard', label: 'Core Reflection', hint: '150–350 words, full post-Jungian' },
  { value: 'advanced', label: 'Deeper Dive', hint: '400–700 words, extended & motif tracking' },
];

const OnboardingDepthScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [interpretationDepth, setInterpretationDepthState] = useState<InterpretationDepth>('standard');

  const handleContinue = useCallback(async () => {
    await setInterpretationDepth(interpretationDepth);
    navigation.navigate('OnboardingSecure');
  }, [interpretationDepth, navigation]);

  const handleSkip = useCallback(() => {
    navigation.navigate('OnboardingSecure');
  }, [navigation]);

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
        <Text style={styles.title}>Dream analysis</Text>
        <Text style={styles.subtitle}>
          Choose how deep you want your interpretations. You can change this anytime in Account settings.
        </Text>
        <Text style={styles.notice}>{AI_REFLECTION_NOTICE}</Text>

        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>Level of analysis</Text>
          {DEPTH_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.depthRow, interpretationDepth === opt.value && styles.depthRowActive]}
              onPress={() => setInterpretationDepthState(opt.value)}
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
          <Button
            title="Continue"
            onPress={handleContinue}
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
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  notice: {
    fontSize: typography.sizes.sm,
    color: text.muted,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    marginBottom: spacing.lg,
    textAlign: 'center',
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
  primaryButton: {
    marginTop: spacing.lg,
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

export default OnboardingDepthScreen;
