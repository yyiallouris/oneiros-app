import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '../theme';
import { Button, Card, WaveBackground, FloatingSunMoon } from '../components/ui';
import { supabase } from '../services/supabaseClient';
import { logEvent, logError } from '../services/logger';
import { PENDING_PASSWORD_RESET_KEY, MIN_PASSWORD_LENGTH } from '../constants/auth';
import { PendingPasswordResetContext } from '../navigation/RootNavigator';

const SET_PASSWORD_TIMEOUT_MS = 15_000;

const SetPasswordScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const setPendingPasswordReset = useContext(PendingPasswordResetContext);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSetPassword = async () => {
    const p = password.trim();
    const c = confirmPassword.trim();
    if (p.length < MIN_PASSWORD_LENGTH) {
      Alert.alert('Password too short', `Use at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (p !== c) {
      Alert.alert('Passwords don’t match', 'Please enter the same password in both fields.');
      return;
    }
    setIsLoading(true);
    try {
      const updatePromise = supabase.auth.updateUser({ password: p });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out. Please try again.')), SET_PASSWORD_TIMEOUT_MS)
      );
      const { error } = await Promise.race([updatePromise, timeoutPromise]);
      if (error) throw error;
      await AsyncStorage.removeItem(PENDING_PASSWORD_RESET_KEY);
      setPendingPasswordReset?.(false);
      logEvent('auth_password_updated', {});
      Alert.alert('Password updated', 'Your password has been changed successfully.');
    } catch (err: any) {
      logError('auth_set_password_error', err, {});
      Alert.alert('Could not set password', err.message || 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <WaveBackground />
      <View style={[styles.inner, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.header}>
          <FloatingSunMoon size={100} style={styles.floatingOrb} />
          <Text style={styles.title}>Set new password</Text>
          <Text style={styles.subtitle}>
            Enter your new password below. You’ll stay signed in.
          </Text>
        </View>
        <Card style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>New password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
              accessibilityLabel="New password"
              accessibilityHint="Enter your new password, at least 8 characters"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoCapitalize="none"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!isLoading}
              accessibilityLabel="Confirm password"
              accessibilityHint="Re-enter your new password to confirm"
            />
          </View>
          <Button
            title="Set password"
            onPress={handleSetPassword}
            loading={isLoading}
            style={styles.primaryButton}
          />
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
    position: 'relative',
  },
  floatingOrb: {
    top: -20,
    zIndex: 0,
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    fontFamily: typography.bold,
    color: colors.textPrimary,
    zIndex: 1,
    marginTop: spacing.sm,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    lineHeight: typography.sizes.md * typography.lineHeights.normal,
    textAlign: 'center',
  },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    backgroundColor: colors.cardBackground,
  },
  primaryButton: {
    marginTop: spacing.md,
  },
});

export default SetPasswordScreen;
