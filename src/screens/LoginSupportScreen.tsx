import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, borderRadius } from '../theme';
import {
  PaperBackground,
  Button,
  DesignExportForeground,
  ActionLoadingSlot,
  FormFeedback,
  type FormFeedbackTone,
} from '../components/ui';
import { sendSupportRequest } from '../services/supportRequest';
import { logEvent, logError } from '../services/logger';

type NavProp = StackNavigationProp<RootStackParamList>;
type Feedback = { tone: FormFeedbackTone; title: string; message: string };

const SUCCESS_REDIRECT_DELAY_MS = 1200;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const LoginSupportScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (redirectTimer.current) clearTimeout(redirectTimer.current);
  }, []);

  const updateEmail = (value: string) => {
    setEmail(value);
    if (feedback?.tone === 'error') setFeedback(null);
  };

  const updateMessage = (value: string) => {
    setMessage(value);
    if (feedback?.tone === 'error') setFeedback(null);
  };

  const handleSubmit = async () => {
    const e = email.trim();
    const m = message.trim();
    if (!isValidEmail(e)) {
      logEvent('support_request_validation_fail', { reason: 'invalid_email' });
      setFeedback({
        tone: 'error',
        title: 'Check your email',
        message: 'Enter a valid email address so we can get back to you.',
      });
      return;
    }
    if (!m) {
      logEvent('support_request_validation_fail', { reason: 'no_message' });
      setFeedback({
        tone: 'error',
        title: 'Message needed',
        message: 'Please describe what’s going wrong so we can help.',
      });
      return;
    }
    setFeedback(null);
    setIsSending(true);
    logEvent('support_request_submit', {});
    try {
      await sendSupportRequest({ email: e, message: m });
      logEvent('support_request_success', {});
      setEmail('');
      setMessage('');
      setFeedback({
        tone: 'success',
        title: 'Message sent',
        message: 'We’ve received your request and sent a confirmation email. Returning to sign in…',
      });
      redirectTimer.current = setTimeout(() => {
        redirectTimer.current = null;
        navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
      }, SUCCESS_REDIRECT_DELAY_MS);
    } catch (err) {
      logError('support_request_error', err, {});
      setFeedback({
        tone: 'error',
        title: 'Message not sent',
        message: 'Please try again. Your message is still here. If this continues, email support@oneirosjournal.com.',
      });
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
      <PaperBackground />
      <DesignExportForeground style={styles.content}>
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
            onChangeText={updateEmail}
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
            onChangeText={updateMessage}
            multiline
            textAlignVertical="top"
            editable={!isSending}
          />
        </View>

        <ActionLoadingSlot
          loading={isSending}
          loadingProps={{ preset: 'sendSupport' }}
        >
          <Button
            title="Send"
            onPress={handleSubmit}
            disabled={!email.trim() || !message.trim()}
          />
        </ActionLoadingSlot>

        {feedback && (
          <FormFeedback
            testID="login-support-feedback"
            tone={feedback.tone}
            title={feedback.title}
            message={feedback.message}
          />
        )}
      </DesignExportForeground>
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
    color: colors.buttonPrimary,
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
