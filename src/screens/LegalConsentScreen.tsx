import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Card, Button, PaperBackground, DesignExportForeground, ActionLoadingSlot } from '../components/ui';
import {
  LEGAL_CONSENT_ACKNOWLEDGEMENT,
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
  const [saving, setSaving] = useState(false);

  const handleAccept = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      await setLegalConsentAccepted();
      onAccepted();
    } catch {
      Alert.alert('Could not continue', 'Please try again.');
    } finally {
      setSaving(false);
    }
  }, [onAccepted, saving]);

  return (
    <View style={styles.container}>
      <PaperBackground height={260} lite />
      <DesignExportForeground fill>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Welcome to Oneiros</Text>
          <Text style={styles.subtitle}>
            A private space for dreams, reflection, and the patterns that return.
          </Text>

          <Card style={styles.card}>
            <View style={styles.summaryBox}>
              <Text style={styles.sectionLabel}>Before you continue</Text>
              <Text style={styles.paragraph}>{WELLNESS_DISCLAIMER}</Text>
              {LEGAL_CONSENT_SUMMARY_POINTS.map((item) => (
                <View key={item} style={styles.summaryRow}>
                  <View style={styles.summaryDot} />
                  <Text style={styles.summaryText}>{item}</Text>
                </View>
              ))}
            </View>

            <View style={styles.divider} />
            <Text style={styles.confirmLabel}>{LEGAL_CONSENT_ACKNOWLEDGEMENT}</Text>

            <ActionLoadingSlot
              loading={saving}
              loadingProps={{ preset: 'consentSave', style: styles.primaryButton }}
            >
              <Button
                title="Agree and continue"
                onPress={handleAccept}
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
    fontFamily: typography.roles.screenTitle,
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
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: borders.primary,
    marginVertical: spacing.md,
  },
  confirmLabel: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    marginBottom: spacing.sm,
  },
  primaryButton: {
    marginTop: spacing.sm,
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
