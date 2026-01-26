import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { WaveBackground } from '../components/ui';

const AccountScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <WaveBackground />
      <View style={styles.content}>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.subtitle}>
          Here you’ll be able to manage your profile, subscription, and backup settings.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    lineHeight: typography.sizes.md * typography.lineHeights.normal,
  },
});

export default AccountScreen;


