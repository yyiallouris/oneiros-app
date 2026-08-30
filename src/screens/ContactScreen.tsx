import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, spacing, typography, borderRadius } from '../theme';
import {
  PaperBackground,
  Button,
  DesignExportForeground,
  ActionLoadingSlot,
  FormFeedback,
  type FormFeedbackTone,
} from '../components/ui';
import { sendContactMessage } from '../services/contact';
import { RootStackParamList } from '../navigation/types';

type ContactRouteProp = RouteProp<RootStackParamList, 'Contact'>;
type ContactNavigationProp = StackNavigationProp<RootStackParamList>;
type Feedback = { tone: FormFeedbackTone; title: string; message: string };

const SUCCESS_REDIRECT_DELAY_MS = 1200;

const ContactScreen: React.FC = () => {
  const route = useRoute<ContactRouteProp>();
  const navigation = useNavigation<ContactNavigationProp>();
  const [subject, setSubject] = useState(route.params?.initialSubject ?? '');
  const [message, setMessage] = useState(route.params?.initialMessage ?? '');
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (route.params?.initialSubject) setSubject(route.params.initialSubject);
    if (route.params?.initialMessage) setMessage(route.params.initialMessage);
  }, [route.params?.initialMessage, route.params?.initialSubject]);

  useEffect(() => () => {
    if (redirectTimer.current) clearTimeout(redirectTimer.current);
  }, []);

  const updateSubject = (value: string) => {
    setSubject(value);
    if (feedback?.tone === 'error') setFeedback(null);
  };

  const updateMessage = (value: string) => {
    setMessage(value);
    if (feedback?.tone === 'error') setFeedback(null);
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      setFeedback({
        tone: 'error',
        title: 'Message needed',
        message: 'Please share a few words so we can help.',
      });
      return;
    }
    setFeedback(null);
    setIsSending(true);
    try {
      await sendContactMessage({ subject: subject.trim() || '(no subject)', message: message.trim() });
      setSubject('');
      setMessage('');
      setFeedback({
        tone: 'success',
        title: 'Message sent',
        message: 'Thank you. We’ll reply by email. Returning to Write…',
      });
      redirectTimer.current = setTimeout(() => {
        redirectTimer.current = null;
        navigation.navigate('MainTabs', { screen: 'Write' });
      }, SUCCESS_REDIRECT_DELAY_MS);
    } catch {
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
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <PaperBackground />
      <DesignExportForeground style={styles.content}>
        <Text style={styles.title}>Contact us</Text>
        <Text style={styles.subtitle}>
          Share feedback, privacy requests, or anything that is on your mind. We will receive your message privately.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            placeholder="Optional"
            placeholderTextColor={colors.textMuted}
            value={subject}
            onChangeText={updateSubject}
            editable={!isSending}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Write your message..."
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
            disabled={!message.trim()}
          />
        </ActionLoadingSlot>

        {feedback && (
          <FormFeedback
            testID="contact-feedback"
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  textArea: {
    minHeight: 120,
  },
});

export default ContactScreen;
