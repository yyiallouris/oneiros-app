import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, borderRadius } from '../theme';
import { WaveBackground, Button } from '../components/ui';
import { sendSupportRequest } from '../services/supportRequest';
import { logEvent, logError } from '../services/logger';

type NavProp = StackNavigationProp<RootStackParamList>;

const LoginSupportScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async () => {
    const e = email.trim();
    const m = message.trim();
    if (!e) {
      logEvent('support_request_validation_fail', { reason: 'no_email' });
      Alert.alert('Email required', 'Please enter your email so we can get back to you.');
      return;
    }
    if (!m) {
      logEvent('support_request_validation_fail', { reason: 'no_message' });
      Alert.alert('Message required', 'Please describe what’s going wrong so we can help.');
      return;
    }
    setIsSending(true);
    logEvent('support_request_submit', {});
    try {
      await sendSupportRequest({ email: e, message: m });
      logEvent('support_request_success', {});
      setEmail('');
      setMessage('');
      Alert.alert(
        'Message sent',
        "We've received your request. Check your inbox for a confirmation from support@oneirosjournal.com — we'll get back to you soon."
      );
      navigation.goBack();
    } catch (err) {
      logError('support_request_error', err, {});
      Alert.alert('Something went wrong', 'Please try again later or email us at support@oneirosjournal.com.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <WaveBackground />
      <View style={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Having trouble signing in?</Text>
        <Text style={styles.subtitle}>
          Tell us what’s going wrong and we’ll look into it. You’ll get a confirmation email from support@oneirosjournal.com right away.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Your email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isSending}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>What’s going wrong?</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g. Can’t reset password, didn’t receive verification email..."
            placeholderTextColor={colors.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
            editable={!isSending}
          />
        </View>

        <Button
          title="Send"
          onPress={handleSubmit}
          loading={isSending}
          disabled={!email.trim() || !message.trim()}
        />
      </View>
    </KeyboardAvoidingView>
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
  backRow: {
    marginBottom: spacing.lg,
  },
  backText: {
    fontSize: typography.sizes.md,
    color: colors.accent,
    fontWeight: typography.weights.medium,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: typography.sizes.md * typography.lineHeights.normal,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  textArea: {
    minHeight: 120,
  },
});

export default LoginSupportScreen;
