import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, spacing, typography, text, borderRadius } from '../../theme';
import { PaperBackground, Card, Button, DesignExportForeground } from '../../components/ui';
import { OnboardingProgress } from '../../components/onboarding/OnboardingProgress';
import {
  setPatternInsightLanguage,
  type PatternInsightLanguageCode,
} from '../../services/patternInsightLanguageService';
import { getOnboardingLanguageOptions } from '../../utils/onboardingLanguage';
import type { OnboardingStackParamList } from '../../navigation/types';

type NavProp = StackNavigationProp<OnboardingStackParamList, 'OnboardingLanguage'>;

const OnboardingLanguageScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { defaultCode, languages } = useMemo(() => getOnboardingLanguageOptions(), []);
  const [language, setLanguage] = useState<PatternInsightLanguageCode>(defaultCode);

  const handleContinue = useCallback(async () => {
    await setPatternInsightLanguage(language);
    navigation.navigate('OnboardingSubscription');
  }, [language, navigation]);

  return (
    <View style={styles.container}>
      <PaperBackground height={260} lite />
      <DesignExportForeground fill>
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
          <OnboardingProgress step={3} />
          <Text style={styles.title}>Insights language</Text>
          <Text style={styles.subtitle}>
            This is the language for Recent Dream Field and Period Reflection. We start from your device language when we can — change anytime in Account.
          </Text>

          <Card style={styles.card}>
            <Text style={styles.sectionLabel}>Preferred language</Text>
            {languages.map((option) => (
              <TouchableOpacity
                key={option.code}
                style={[styles.languageRow, language === option.code && styles.languageRowActive]}
                onPress={() => setLanguage(option.code as PatternInsightLanguageCode)}
                activeOpacity={0.7}
              >
                <View style={styles.languageContent}>
                  <Text style={[styles.languageLabel, language === option.code && styles.languageLabelActive]}>
                    {option.name}
                  </Text>
                  <Text style={styles.languageHint}>{option.display}</Text>
                </View>
                {language === option.code && <Text style={styles.languageCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
            <Button title="Continue" onPress={handleContinue} style={styles.primaryButton} />
          </Card>
        </ScrollView>
      </DesignExportForeground>
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
    fontFamily: typography.roles.screenTitle,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: text.secondary,
    lineHeight: typography.sizes.md * 1.4,
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
  languageRow: {
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
  languageRowActive: {
    backgroundColor: colors.buttonPrimaryLight12,
    borderColor: colors.buttonPrimary40,
  },
  languageContent: { flex: 1 },
  languageLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  languageLabelActive: {
    color: colors.buttonPrimary,
    fontWeight: typography.weights.semibold,
  },
  languageHint: {
    fontSize: typography.sizes.sm,
    color: text.muted,
    marginTop: 2,
  },
  languageCheck: {
    fontSize: typography.sizes.lg,
    color: colors.buttonPrimary,
    marginLeft: spacing.sm,
  },
  primaryButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
});

export default OnboardingLanguageScreen;
