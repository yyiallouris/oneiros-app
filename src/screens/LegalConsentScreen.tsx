import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Card, Button, MountainWaveBackground } from '../components/ui';
import { CRISIS_NOTICE, LEGAL_CONSENT_ITEMS, WELLNESS_DISCLAIMER } from '../constants/legal';
import { setLegalConsentAccepted } from '../services/legalConsentService';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, text, borderRadius, borders } from '../theme';

type NavProp = StackNavigationProp<RootStackParamList, 'LegalConsent'>;

interface LegalConsentScreenProps {
  onAccepted: () => void;
}

const LegalConsentScreen: React.FC<LegalConsentScreenProps> = ({ onAccepted }) => {
  const navigation = useNavigation<NavProp>();
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);

  const allChecked = LEGAL_CONSENT_ITEMS.every((_, index) => checked[index]);

  const handleAccept = useCallback(async () => {
    if (!allChecked || saving) return;
    setSaving(true);
    try {
      await setLegalConsentAccepted();
      onAccepted();
    } catch {
      Alert.alert('Could not continue', 'Please try again.');
    } finally {
      setSaving(false);
    }
  }, [allChecked, onAccepted, saving]);

  return (
    <View style={styles.container}>
      <MountainWaveBackground height={260} lite />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Before we begin</Text>
        <Text style={styles.subtitle}>
          A small boundary around a very private space.
        </Text>

        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>Reflection, not care</Text>
          <Text style={styles.paragraph}>{WELLNESS_DISCLAIMER}</Text>
          <Text style={styles.paragraph}>{CRISIS_NOTICE}</Text>

          <View style={styles.divider} />

          {LEGAL_CONSENT_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item}
              style={styles.checkRow}
              onPress={() => setChecked((prev) => ({ ...prev, [index]: !prev[index] }))}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, checked[index] && styles.checkboxChecked]}>
                {checked[index] && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkText}>{item}</Text>
            </TouchableOpacity>
          ))}

          <Button
            title="I understand and agree"
            onPress={handleAccept}
            disabled={!allChecked}
            loading={saving}
            style={styles.primaryButton}
          />
          <TouchableOpacity
            onPress={() => navigation.navigate('Privacy')}
            style={styles.linkButton}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>Read privacy and legal details</Text>
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
    fontFamily: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: text.secondary,
    lineHeight: typography.sizes.md * typography.lineHeights.normal,
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
  paragraph: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    marginBottom: spacing.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: borders.primary,
    marginVertical: spacing.md,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.buttonPrimary40,
    backgroundColor: colors.fieldSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: colors.buttonPrimary,
    borderColor: colors.buttonPrimary,
  },
  checkmark: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    lineHeight: typography.sizes.sm,
  },
  checkText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  primaryButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  linkButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
  linkText: {
    fontSize: typography.sizes.sm,
    color: colors.buttonPrimary,
    fontWeight: typography.weights.medium,
  },
});

export default LegalConsentScreen;
