import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, spacing, typography, text, borderRadius, borders, semantic } from '../theme';
import { PaperBackground, Card, DesignExportForeground, Button } from '../components/ui';
import { LEGAL_LINKS, PRIVACY_SECTIONS } from '../constants/legal';
import { RootStackParamList } from '../navigation/types';

type NavProp = StackNavigationProp<RootStackParamList, 'Privacy'>;

const PrivacyScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();

  return (
    <View style={styles.container}>
      <PaperBackground />
      <DesignExportForeground fill>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Privacy & Legal</Text>
          <Text style={styles.subtitle}>
            This space is private by design. These notes explain what Oneiros does with your
            journal and where the boundaries are.
          </Text>

          <Card style={styles.card}>
            {PRIVACY_SECTIONS.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.paragraph}>{section.body}</Text>
              </View>
            ))}

            <View style={styles.requestBox}>
              <Text style={styles.requestTitle}>Data requests</Text>
              <Text style={styles.requestText}>
                For export, account deletion, or privacy questions, send a request from Contact
                us.
              </Text>
              <View style={styles.requestActions}>
                <Button
                  title="Request export"
                  variant="secondary"
                  size="compact"
                  onPress={() =>
                    navigation.navigate('Contact', {
                      initialSubject: 'Data export request',
                      initialMessage: 'I would like to request an export of my Oneiros data.',
                    })
                  }
                  style={styles.requestButton}
                />
                <Button
                  title="Request deletion"
                  variant="ghost"
                  size="compact"
                  onPress={() =>
                    navigation.navigate('Contact', {
                      initialSubject: 'Account deletion request',
                      initialMessage:
                        'I would like to request deletion of my Oneiros account and associated data.',
                    })
                  }
                  style={[styles.requestButton, styles.deleteButton]}
                  textStyle={styles.deleteButtonText}
                />
              </View>
            </View>

            {(LEGAL_LINKS.privacyPolicyUrl || LEGAL_LINKS.termsUrl) && (
              <View style={styles.hostedLinksBox}>
                <Text style={styles.requestTitle}>Full documents</Text>
                <Text style={styles.requestText}>
                  If you want the full legal documents, you can read them here any time.
                </Text>
                <View style={styles.requestActions}>
                  {LEGAL_LINKS.privacyPolicyUrl && (
                    <Button
                      title="Privacy Policy"
                      variant="secondary"
                      size="compact"
                      onPress={() => Linking.openURL(LEGAL_LINKS.privacyPolicyUrl!)}
                      style={styles.requestButton}
                    />
                  )}
                  {LEGAL_LINKS.termsUrl && (
                    <Button
                      title="Terms of Use"
                      variant="secondary"
                      size="compact"
                      onPress={() => Linking.openURL(LEGAL_LINKS.termsUrl!)}
                      style={styles.requestButton}
                    />
                  )}
                </View>
              </View>
            )}

            <Text style={styles.footer}>
              This in-app notice is a plain-language summary. If anything feels unclear, you can
              always contact us.
            </Text>
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
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: text.secondary,
    lineHeight: typography.sizes.md * typography.lineHeights.normal,
    marginBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.xl,
  },
  section: {
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: borders.primary,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  paragraph: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  requestBox: {
    backgroundColor: colors.buttonPrimaryLight12,
    borderWidth: 1,
    borderColor: colors.contourLineSoft,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  requestTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  requestText: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    marginBottom: spacing.md,
  },
  requestActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  requestButton: {
    flexGrow: 1,
  },
  deleteButton: {
    borderColor: colors.error,
  },
  deleteButtonText: {
    color: semantic.errorDark,
  },
  hostedLinksBox: {
    backgroundColor: colors.fieldSurface,
    borderWidth: 1,
    borderColor: colors.contourLineSoft,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  footer: {
    fontSize: typography.sizes.xs,
    color: text.muted,
    lineHeight: typography.sizes.xs * typography.lineHeights.relaxed,
    fontStyle: 'italic',
  },
});

export default PrivacyScreen;
