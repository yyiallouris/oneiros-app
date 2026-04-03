import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, spacing, typography, text, borderRadius, borders } from '../../theme';
import { MountainWaveBackground, Card, Button } from '../../components/ui';
import { UserService } from '../../services/userService';
import type { OnboardingStackParamList } from '../../navigation/types';

type NavProp = StackNavigationProp<OnboardingStackParamList, 'OnboardingName'>;

const OnboardingNameScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [displayName, setDisplayName] = useState('');

  const handleContinue = useCallback(() => {
    const trimmed = displayName.trim();
    if (trimmed) {
      UserService.setDisplayName(trimmed);
    }
    navigation.navigate('OnboardingDepth');
  }, [displayName, navigation]);

  const canContinue = displayName.trim().length > 0;

  const handleSkip = useCallback(() => {
    navigation.navigate('OnboardingDepth');
  }, [navigation]);

  return (
    <View style={styles.container}>
      <MountainWaveBackground height={260} lite />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.welcome}>Welcome to Oneiros</Text>
        <Text style={styles.subtitle}>
          Your dream journal companion. Let’s set a few things up — you can skip any step.
        </Text>

        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>What should we call you?</Text>
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
          <Button
            title="Continue"
            onPress={handleContinue}
            disabled={!canContinue}
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
  welcome: {
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

export default OnboardingNameScreen;
