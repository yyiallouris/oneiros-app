import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../theme';
import { WaveBackground, Button } from '../components/ui';
import { sendContactMessage } from '../services/contact';

const ContactScreen: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Missing message', 'Please share a few words so we can help.');
      return;
    }
    setIsSending(true);
    try {
      await sendContactMessage({ subject: subject.trim() || '(no subject)', message: message.trim() });
      setSubject('');
      setMessage('');
      Alert.alert('Thank you', 'Your message has been sent. We will get back to you soon.');
    } catch {
      Alert.alert('Error', 'Something went wrong while sending your message. Please try again later.');
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
      <WaveBackground />
      <View style={styles.content}>
        <Text style={styles.title}>Contact us</Text>
        <Text style={styles.subtitle}>
          Share feedback, ideas, or anything that’s on your mind. We’ll receive your message privately.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            placeholder="Optional"
            placeholderTextColor={colors.textMuted}
            value={subject}
            onChangeText={setSubject}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Write your message..."
            placeholderTextColor={colors.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
          />
        </View>

        <Button
          title="Send"
          onPress={handleSubmit}
          loading={isSending}
          disabled={!message.trim()}
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


