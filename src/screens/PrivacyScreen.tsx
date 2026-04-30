import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, spacing, typography, text, borderRadius, borders, semantic } from '../theme';
import { WaveBackground, Card } from '../components/ui';
import { PRIVACY_SECTIONS } from '../constants/legal';
import { RootStackParamList } from '../navigation/types';

type NavProp = StackNavigationProp<RootStackParamList, 'Privacy'>;

const PrivacyScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();

  return (
    <View style={styles.container}>
      <WaveBackground />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Privacy & Legal</Text>
        <Text style={styles.subtitle}>
          Clear boundaries for a private journal, written in plain language.
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
              For export, account deletion, or privacy questions, send a request from Contact us.
            </Text>
            <View style={styles.requestActions}>
              <TouchableOpacity
                style={styles.requestButton}
                onPress={() =>
                  navigation.navigate('Contact', {
                    initialSubject: 'Data export request',
                    initialMessage: 'I would like to request an export of my Oneiros data.',
                  })
                }
                activeOpacity={0.7}
              >
                <Text style={styles.requestButtonText}>Request export</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.requestButton, styles.deleteButton]}
                onPress={() =>
                  navigation.navigate('Contact', {
                    initialSubject: 'Account deletion request',
                    initialMessage:
                      'I would like to request deletion of my Oneiros account and associated data.',
                  })
                }
                activeOpacity={0.7}
              >
                <Text style={[styles.requestButtonText, styles.deleteButtonText]}>Request deletion</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.footer}>
            This in-app notice is a product summary and should be supported by a full hosted Privacy Policy and Terms of Use before public release.
          </Text>
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
    borderWidth: 1,
    borderColor: colors.buttonPrimary40,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.fieldSurface,
  },
  deleteButton: {
    borderColor: colors.error,
    backgroundColor: semantic.errorBackground,
  },
  requestButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.buttonPrimary,
  },
  deleteButtonText: {
    color: semantic.errorDark,
  },
  footer: {
    fontSize: typography.sizes.xs,
    color: text.muted,
    lineHeight: typography.sizes.xs * typography.lineHeights.relaxed,
    fontStyle: 'italic',
  },
});

export default PrivacyScreen;
