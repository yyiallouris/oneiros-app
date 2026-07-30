import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Card, Button, PaperBackground, DesignExportForeground, ActionLoadingSlot } from '../components/ui';
import {
  CRISIS_NOTICE,
  LEGAL_CONSENT_ITEMS,
  LEGAL_CONSENT_SUMMARY_POINTS,
  WELLNESS_DISCLAIMER,
} from '../constants/legal';
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
      <PaperBackground height={260} lite />
      <DesignExportForeground fill>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>A private place to begin</Text>
          <Text style={styles.subtitle}>
            Before you enter, here are the few boundaries that protect this space.
          </Text>

          <Card style={styles.card}>
            <View style={styles.summaryBox}>
              <Text style={styles.sectionLabel}>The short version</Text>
              <Text style={styles.paragraph}>{WELLNESS_DISCLAIMER}</Text>
              {LEGAL_CONSENT_SUMMARY_POINTS.map((item) => (
                <View key={item} style={styles.summaryRow}>
                  <View style={styles.summaryDot} />
                  <Text style={styles.summaryText}>{item}</Text>
                </View>
              ))}
            </View>

            <View style={styles.crisisBox}>
              <Text style={styles.crisisLabel}>Important</Text>
              <Text style={styles.crisisText}>{CRISIS_NOTICE}</Text>
            </View>

            <View style={styles.divider} />
            <Text style={styles.confirmLabel}>To continue, please confirm:</Text>

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

            <ActionLoadingSlot
              loading={saving}
              loadingProps={{ preset: 'consentSave', style: styles.primaryButton }}
            >
              <Button
                title="Agree and enter Oneiros"
                onPress={handleAccept}
                disabled={!allChecked}
                style={styles.primaryButton}
              />
            </ActionLoadingSlot>
            <TouchableOpacity
              onPress={() => navigation.navigate('Privacy')}
              style={styles.linkButton}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>Read the full privacy policy and terms</Text>
            </TouchableOpacity>
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
  summaryBox: {
    backgroundColor: colors.fieldSurface,
    borderWidth: 1,
    borderColor: colors.contourLineSoft,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
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
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  summaryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.buttonPrimary,
    marginTop: 7,
    marginRight: spacing.sm,
    flexShrink: 0,
  },
  summaryText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: text.secondary,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  crisisBox: {
    backgroundColor: colors.buttonPrimaryLight12,
    borderWidth: 1,
    borderColor: colors.contourLineSoft,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  crisisLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  crisisText: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: borders.primary,
    marginVertical: spacing.md,
  },
  confirmLabel: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
    marginBottom: spacing.xs,
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
