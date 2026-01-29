import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography, text } from '../theme';
import { WaveBackground, Card } from '../components/ui';

const PrivacyScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <WaveBackground />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Privacy</Text>

        <Card style={styles.card}>
          <Text style={styles.paragraph}>
            Your dreams and reflections are yours alone. We don’t read them, and we don’t track who wrote what.
          </Text>
          <Text style={styles.paragraph}>
            Not even the people who built this app can see who you are or what you write. Your entries are stored under your account in a way that only you can access.
          </Text>
          <Text style={styles.paragraph}>
            We don’t sell your data or use it for advertising. Your content is only used to give you your own insights and to back it up when you’re signed in.
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
    marginBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.xl,
  },
  paragraph: {
    fontSize: typography.sizes.md,
    color: text.secondary,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
    marginBottom: spacing.lg,
  },
});

export default PrivacyScreen;
