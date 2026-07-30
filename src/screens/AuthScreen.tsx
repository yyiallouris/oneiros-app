import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  Linking,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - @expo/vector-icons resolved at runtime by Expo
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme';
import { Button, Card, PaperBackground, DesignExportForeground, ActionLoadingSlot, SocialAuthProviderRow } from '../components/ui';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabaseClient';
import { logEvent, logError } from '../services/logger';
import { PENDING_PASSWORD_RESET_KEY, MIN_PASSWORD_LENGTH } from '../constants/auth';
import { AUTH_LEGAL_NOTE } from '../constants/legal';
import { processAuthDeepLink } from '../utils/authDeepLink';
import {
  AUTH_APPLE_PROVIDER,
  getAuthOAuthProvider,
  getAuthOAuthProviderLabel,
  isNewOAuthUser,
  parseAuthCallbackParams,
  type AuthOAuthProviderConfig,
  type AuthOAuthProviderId,
} from '../utils/authOAuth';
import { DESIGN_EXPORT_AUTH_MODE, DESIGN_EXPORT_MODE } from '../designExport';

// Complete OAuth session in browser
WebBrowser.maybeCompleteAuthSession();

type Mode = 'login' | 'signup';
type NavProp = StackNavigationProp<RootStackParamList>;

const AUTH_REQUEST_TIMEOUT_MS = 25_000;
const APPLE_NONCE_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._';
let lastOAuthSuccessAlertAt = 0;

const authDebugLog = (...args: unknown[]) => {
  if (__DEV__) console.log(...args);
};

const authDebugError = (...args: unknown[]) => {
  if (__DEV__) console.error(...args);
};

const createAppleNonce = (length = 32): string => {
  const getRandomBytes = (Crypto as typeof Crypto & { getRandomBytes?: (byteCount: number) => Uint8Array }).getRandomBytes;
  const bytes = getRandomBytes ? getRandomBytes(length) : new Uint8Array(length).map(() => Math.floor(Math.random() * 256));
  return Array.from(bytes, (byte) => APPLE_NONCE_CHARSET[byte % APPLE_NONCE_CHARSET.length]).join('');
};

const showOAuthSuccessAlert = (providerId: AuthOAuthProviderId | undefined, isNewUser: boolean | undefined) => {
  // New users go straight into LegalConsent/Onboarding — skip the modal stop.
  if (isNewUser) return;

  const now = Date.now();
  // Browser result + Linking can both complete the same OAuth redirect.
  if (now - lastOAuthSuccessAlertAt < 4_000) return;
  lastOAuthSuccessAlertAt = now;

  const providerLabel = getAuthOAuthProviderLabel(providerId);
  Alert.alert('Welcome back!', providerLabel ? `You're signed in with ${providerLabel}.` : "You're signed in.");
};

const AuthScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const [mode, setMode] = useState<Mode>(DESIGN_EXPORT_MODE ? DESIGN_EXPORT_AUTH_MODE : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoadingLabel, setOauthLoadingLabel] = useState<string | null>(null);
  /** After signup with email confirmation required, show OTP input. */
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  /** Seconds left before Resend can be used again (Supabase rate limit ~60s). */
  const [resendCooldown, setResendCooldown] = useState(0);
  /** Forgot password: show email form to request reset link. */
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  /** Cooldown after sending reset link (Supabase rate limit ~60s). */
  const [forgotPasswordCooldown, setForgotPasswordCooldown] = useState(0);

  const lastProcessedUrlRef = React.useRef<string | null>(null);

  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      if (!url?.startsWith('oneiros-dream-journal://')) return;
      if (lastProcessedUrlRef.current === url) return;
      lastProcessedUrlRef.current = url;

      const result = await processAuthDeepLink(url);
      if (result.handled) {
        setPendingVerificationEmail(null);
        setVerificationCode('');
        setShowForgotPassword(false);
        setForgotPasswordSent(false);
        setIsLoading(false);
        setIsVerifying(false);
        if (result.isRecovery) {
          Alert.alert('Reset link verified', 'Set your new password on the next screen.');
        } else if (result.isOAuth) {
          showOAuthSuccessAlert(result.provider, result.isNewUser);
        } else {
          Alert.alert("You're all set!", 'Your email is verified. Welcome!');
        }
        // Navigation happens via RootNavigator (session set)
      } else if (result.isErrorUrl) {
        // OAuth error URL (cancelled, etc.) – no alert; Supabase auto-links when possible
      } else if (result.error) {
        Alert.alert('Verification failed', result.error || 'Link may have expired. Try the code from your email.');
      }
    };

    // Cold-start initial URLs are owned by RootNavigator. AuthScreen only handles live events
    // (magic link / OAuth return while the auth UI is already mounted).
    const subscription = Linking.addEventListener('url', (e) => handleDeepLink(e.url));
    return () => subscription.remove();
  }, []);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter an email and password.');
      return;
    }
    if (mode === 'signup') {
      if (password.length < MIN_PASSWORD_LENGTH) {
        Alert.alert('Password too short', `Use at least ${MIN_PASSWORD_LENGTH} characters.`);
        return;
      }
      if (password !== verifyPassword) {
        Alert.alert('Passwords don\'t match', 'Please enter the same password in both fields.');
        return;
      }
      if (!verifyPassword.trim()) {
        Alert.alert('Verify password', 'Please confirm your password in the second field.');
        return;
      }
    }

    setIsLoading(true);
    logEvent('auth_submit', { mode });
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out. Please check your connection and try again.')), AUTH_REQUEST_TIMEOUT_MS)
      );
      if (mode === 'login') {
        const signInPromise = supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        const { data, error } = await Promise.race([signInPromise, timeoutPromise]);
        if (error) {
          authDebugError('[Auth] signIn error details', error);
          // Unverified email: show verification screen so they can enter code or use magic link
          const msg = error.message ?? '';
          const isUnverified =
            /email not confirmed|confirm your email|verify your email|not confirmed|user is not confirmed|email_not_confirmed/i.test(msg);
          if (isUnverified) {
            logEvent('auth_unverified_login', {});
            setPendingVerificationEmail(email.trim().toLowerCase());
            setResendCooldown(0);
            Alert.alert(
              'Verify your email',
              'Please confirm your email first. Check your inbox for the verification link or enter the code below.'
            );
          } else {
            throw error;
          }
          return;
        }
        authDebugLog('[Auth] signIn success', { user: data?.user?.id });
        logEvent('auth_login_success', {});
      } else {
        const normalizedEmail = email.trim().toLowerCase();
        const signUpPromise = supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: 'oneiros-dream-journal://auth/confirm',
          },
        });
        const { data, error } = await Promise.race([signUpPromise, timeoutPromise]);
        if (error) {
          authDebugError('[Auth] signUp error details', error);
          throw error;
        }
        authDebugLog('[Auth] signUp success', { user: data?.user?.id });
        logEvent('auth_signup_success', {});
        // Confirmation required: user without session → verification UI.
        // Autoconfirm/dev: session present → let RootNavigator route (no false “check email”).
        if (data?.user && !data?.session) {
          logEvent('auth_verification_screen_shown', {});
          setPendingVerificationEmail(normalizedEmail);
          setResendCooldown(60); // Rate limit: don't allow resend until 60s after first email
        } else if (data?.session) {
          logEvent('auth_signup_session_ready', {});
        } else {
          Alert.alert(
            'Check your email',
            'We sent you a confirmation link. Please confirm your email to continue.'
          );
        }
      }
    } catch (error: any) {
      logError('auth_error', error, { mode });
      const msg = error?.message ?? '';
      const isInvalidCreds = /invalid login credentials|invalid email or password/i.test(msg);
      const isNetwork = /fetch|network|timeout|econnrefused|enotfound|failed to fetch/i.test(msg);
      const title = isNetwork ? 'Connection issue' : 'Auth error';
      const body = isInvalidCreds
        ? 'Invalid email or password. Please try again.'
        : isNetwork
          ? msg.includes('timed out') ? msg : 'Please check your internet connection and try again.'
          : msg || 'Something went wrong. Please try again.';
      Alert.alert(title, body);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const code = verificationCode.replace(/\s/g, '');
    const validLength = code.length >= 6 && code.length <= 8;
    if (!pendingVerificationEmail || !validLength) {
      logEvent('auth_verify_otp_invalid', {});
      Alert.alert('Invalid code', 'Please enter the 6–8 digit code from your email.');
      return;
    }
    setIsVerifying(true);
    logEvent('auth_verify_otp_start', {});
    try {
      const verifyPromise = supabase.auth.verifyOtp({
        email: pendingVerificationEmail,
        token: code,
        type: 'email',
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Verification timed out. Please try again.')), AUTH_REQUEST_TIMEOUT_MS)
      );
      const { error } = await Promise.race([verifyPromise, timeoutPromise]);
      if (error) throw error;
      logEvent('auth_email_verified', { method: 'otp' });
      Alert.alert("You're all set!", 'Your email is verified. Welcome!');
      setPendingVerificationEmail(null);
      setVerificationCode('');
    } catch (err: any) {
      logError('auth_verify_otp_error', err, {});
      Alert.alert('Verification failed', err.message || 'Invalid or expired code. Try again or use the link in your email.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Count down resend cooldown every second (Supabase rate limit)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // Count down forgot-password resend cooldown
  useEffect(() => {
    if (forgotPasswordCooldown <= 0) return;
    const t = setInterval(() => setForgotPasswordCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [forgotPasswordCooldown]);

  const handleResendCode = async () => {
    if (!pendingVerificationEmail || resendCooldown > 0) return;
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingVerificationEmail,
        options: { emailRedirectTo: 'oneiros-dream-journal://auth/confirm' },
      });
      if (error) throw error;
      logEvent('auth_resend_code_sent', {});
      setResendCooldown(60);
      Alert.alert('Email sent', 'A new verification email was sent. Check your inbox and spam folder.');
    } catch (err: any) {
      logError('auth_resend_error', err, {});
      const msg = err?.message ?? '';
      const isRateLimit = /rate limit|wait|60|seconds|minute/i.test(msg);
      if (isRateLimit) {
        setResendCooldown(60);
        Alert.alert(
          'Please wait',
          'You can request another email in about 60 seconds. Check your inbox for the first email.'
        );
      } else {
        Alert.alert('Could not resend', msg || 'Please try again later.');
      }
    } finally {
      setIsResending(false);
    }
  };

  const exitVerification = () => {
    logEvent('auth_verification_exit', {});
    setPendingVerificationEmail(null);
    setVerificationCode('');
    setResendCooldown(0);
  };

  const openForgotPassword = () => {
    logEvent('auth_forgot_password_open', {});
    setShowForgotPassword(true);
  };

  const handleForgotPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      logEvent('auth_forgot_password_skip', { reason: 'no_email' });
      Alert.alert('Enter your email', 'We need your email to send a reset link.');
      return;
    }
    setIsLoading(true);
    logEvent('auth_forgot_password_submit', {});
    try {
      const resetPromise = supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: 'oneiros-dream-journal://auth/recovery',
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out. Please check your connection and try again.')), AUTH_REQUEST_TIMEOUT_MS)
      );
      const { error } = await Promise.race([resetPromise, timeoutPromise]);
      if (error) throw error;
      setForgotPasswordSent(true);
      setForgotPasswordCooldown(60);
      logEvent('auth_forgot_password_sent', {});
    } catch (err: any) {
      logError('auth_forgot_password_error', err, {});
      Alert.alert('Could not send', err.message || 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendForgotPassword = async () => {
    if (!email.trim().toLowerCase() || forgotPasswordCooldown > 0) return;
    setIsLoading(true);
    try {
      const resetPromise = supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: 'oneiros-dream-journal://auth/recovery',
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out.')), AUTH_REQUEST_TIMEOUT_MS)
      );
      const { error } = await Promise.race([resetPromise, timeoutPromise]);
      if (error) throw error;
      setForgotPasswordCooldown(60);
      logEvent('auth_forgot_password_resend', {});
      Alert.alert('Email sent', 'A new reset link was sent. Check your inbox and spam folder.');
    } catch (err: any) {
      logError('auth_forgot_password_resend_error', err, {});
      const isRateLimit = /rate limit|wait|60|seconds|minute/i.test(err?.message ?? '');
      if (isRateLimit) setForgotPasswordCooldown(60);
      Alert.alert('Could not resend', err?.message || 'Please try again in a minute.');
    } finally {
      setIsLoading(false);
    }
  };

  const waitForSession = async (attempts = 5, delayMs = 500) => {
    for (let i = 0; i < attempts; i++) {
      if (i > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) return sessionData.session;
    }
    return null;
  };

  const handleOAuthProvider = async (provider: AuthOAuthProviderConfig) => {
    setIsLoading(true);
    setOauthLoadingLabel(`Continuing with ${provider.label}…`);
    logEvent(`${provider.eventPrefix}_start`, { mode });
    authDebugLog(`[Auth] Starting ${provider.label} OAuth flow...`);

    try {
      // Stable native scheme redirect — must be allowlisted in Supabase Redirect URLs.
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'oneiros-dream-journal',
        path: 'auth/callback',
      });
      authDebugLog('[Auth] Redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider.id,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          // Ask providers to return to our app scheme after consent.
          queryParams: provider.id === 'google' ? { prompt: 'select_account' } : undefined,
        },
      });

      if (error) {
        authDebugError('[Auth] OAuth error:', error);
        throw error;
      }

      authDebugLog('[Auth] OAuth URL received:', data?.url ? 'Yes' : 'No');
      if (!data?.url) {
        authDebugError('[Auth] No OAuth URL received');
        throw new Error(`Failed to start ${provider.label} sign-in`);
      }

      authDebugLog('[Auth] Opening browser with OAuth URL...');

      const authResult = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      authDebugLog('[Auth] Auth session result type:', authResult.type);
      if ('url' in authResult && authResult.url) {
        authDebugLog('[Auth] Auth session returned URL');
      }

      if (authResult.type === 'success' && 'url' in authResult && authResult.url) {
        const url = authResult.url;
        const callback = parseAuthCallbackParams(url);
        if (callback.error) {
          logEvent(`${provider.eventPrefix}_cancel`, { mode, reason: callback.error });
          Alert.alert(
            'Sign-in cancelled',
            callback.errorDescription?.replace(/\+/g, ' ') ||
              `${provider.label} sign-in was cancelled.`
          );
          return;
        }

        const result = await processAuthDeepLink(url);
        if (result.handled) {
          logEvent(`${provider.eventPrefix}_success`, {
            mode,
            source: callback.code ? 'pkce_code' : 'auth_session_url',
          });
          if (result.isOAuth) {
            showOAuthSuccessAlert(result.provider ?? provider.id, result.isNewUser);
          } else {
            showOAuthSuccessAlert(provider.id, result.isNewUser);
          }
          return;
        }

        // Rare race: session arrives via auth state before URL processing finishes.
        const session = await waitForSession();
        if (session) {
          logEvent(`${provider.eventPrefix}_success`, { mode, source: 'session_fallback' });
          showOAuthSuccessAlert(provider.id, isNewOAuthUser(session.user));
          return;
        }

        throw new Error(
          result.error ||
            `No session created from ${provider.label} sign-in. Please try again.`
        );
      }

      if (authResult.type === 'dismiss' || authResult.type === 'cancel') {
        // Browser may close before we get the redirect URL; deep link / PKCE often still lands.
        const session = await waitForSession(6, 400);
        if (session) {
          logEvent(`${provider.eventPrefix}_success`, { mode, source: 'dismiss_then_session' });
          // Deep link handler shows the success alert when it owns the URL; otherwise welcome here.
          showOAuthSuccessAlert(provider.id, isNewOAuthUser(session.user));
          return;
        }
        logEvent(`${provider.eventPrefix}_cancel`, { mode });
        Alert.alert('Sign-in cancelled', `${provider.label} sign-in was cancelled.`);
        return;
      }

      authDebugError('[Auth] Unexpected auth session result:', authResult.type);
      Alert.alert('Sign-in error', `${provider.label} sign-in did not complete. Please try again.`);
    } catch (error: any) {
      authDebugError(`[Auth] ${provider.label} OAuth error:`, error);
      logError(`${provider.eventPrefix}_error`, error, { mode });
      Alert.alert(`${provider.label} sign-in error`, error.message || 'Something went wrong. Please try again.');
    } finally {
      setOauthLoadingLabel(null);
      setIsLoading(false);
    }
  };

  const handleAppleAuth = async () => {
    if (Platform.OS !== 'ios') return;

    setIsLoading(true);
    setOauthLoadingLabel('Continuing with Apple…');
    logEvent(`${AUTH_APPLE_PROVIDER.eventPrefix}_start`, { mode });

    try {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Apple sign-in is not available on this device.');
      }

      const nonce = createAppleNonce();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        throw new Error('Apple did not return a sign-in token.');
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce,
      });

      if (error) throw error;

      logEvent(`${AUTH_APPLE_PROVIDER.eventPrefix}_success`, { mode });
      showOAuthSuccessAlert('apple', isNewOAuthUser(data.user));
    } catch (error: any) {
      if (error?.code === 'ERR_REQUEST_CANCELED') {
        logEvent(`${AUTH_APPLE_PROVIDER.eventPrefix}_cancel`, { mode });
        return;
      }

      logError(`${AUTH_APPLE_PROVIDER.eventPrefix}_error`, error, { mode });
      Alert.alert('Apple sign-in error', error?.message || 'Something went wrong. Please try again.');
    } finally {
      setOauthLoadingLabel(null);
      setIsLoading(false);
    }
  };

  // Forgot password step
  if (showForgotPassword) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <PaperBackground />
        <DesignExportForeground style={[styles.inner, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.subtitle}>
              {forgotPasswordSent
                ? `We sent a reset link to ${email.trim().toLowerCase()}. Tap the link in the email to set a new password.`
                : 'Enter your email and we’ll send you a link to reset your password.'}
            </Text>
          </View>
          <Card style={styles.card}>
            {!forgotPasswordSent ? (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    editable={!isLoading}
                  />
                </View>
                <ActionLoadingSlot
                  loading={isLoading}
                  loadingProps={{ preset: 'authSubmit', message: 'Sending reset link…', style: styles.primaryButton }}
                >
                  <Button
                    title="Send reset link"
                    onPress={handleForgotPassword}
                    style={styles.primaryButton}
                  />
                </ActionLoadingSlot>
              </>
            ) : (
              <>
                <ActionLoadingSlot
                  loading={isLoading}
                  loadingProps={{ preset: 'authSubmit', message: 'Sending reset link…', style: styles.primaryButton }}
                >
                  <Button
                    title={forgotPasswordCooldown > 0 ? `Resend link (${forgotPasswordCooldown}s)` : 'Resend link'}
                    onPress={handleResendForgotPassword}
                    disabled={forgotPasswordCooldown > 0}
                    style={styles.primaryButton}
                  />
                </ActionLoadingSlot>
              </>
            )}
            <TouchableOpacity
              onPress={() => {
                setShowForgotPassword(false);
                setForgotPasswordSent(false);
                setForgotPasswordCooldown(0);
              }}
              style={styles.backLink}
            >
              <Text style={styles.switchModeText}>Back to sign in</Text>
            </TouchableOpacity>
          </Card>
        </DesignExportForeground>
      </KeyboardAvoidingView>
    );
  }

  // Email verification step (after signup when confirmation is required)
  if (pendingVerificationEmail) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <PaperBackground />
        <DesignExportForeground style={[styles.inner, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Verify your email</Text>
            <Text style={styles.subtitle}>
              We sent a verification code and a magic link to {pendingVerificationEmail}. Enter the code below or tap the link in the email.
            </Text>
          </View>

          <Card style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>Verification code</Text>
              <TextInput
                style={styles.input}
                placeholder="00000000"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={8}
                value={verificationCode}
                onChangeText={(t) => setVerificationCode(t.replace(/\D/g, '').slice(0, 8))}
                editable={!isVerifying}
              />
            </View>
            <ActionLoadingSlot
              loading={isVerifying}
              loadingProps={{ preset: 'authSubmit', message: 'Verifying your email…', style: styles.primaryButton }}
            >
              <Button
                title="Verify"
                onPress={handleVerifyCode}
                style={styles.primaryButton}
              />
            </ActionLoadingSlot>
            <TouchableOpacity
              onPress={handleResendCode}
              disabled={isResending || resendCooldown > 0}
              style={styles.resendButton}
            >
              <Text style={styles.resendText}>
                {isResending
                  ? 'Sending…'
                  : resendCooldown > 0
                    ? `Resend code (${resendCooldown}s)`
                    : 'Resend code'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={exitVerification} style={styles.backLink}>
              <Text style={styles.switchModeText}>Back to sign up</Text>
            </TouchableOpacity>
          </Card>
        </DesignExportForeground>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <PaperBackground />
      <DesignExportForeground fill>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + spacing.lg,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.header}>
          <Text style={styles.titleMain}>Oneiros</Text>
          <Text style={styles.titleSub}>Dream Journal</Text>
          <Text style={styles.subtitle}>
            Sign in to sync your dreams securely across devices.
          </Text>
        </View>

        <Card style={styles.card}>
          {/* Mode toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === 'login' && styles.modeButtonActive,
              ]}
              onPress={() => setMode('login')}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  mode === 'login' && styles.modeButtonTextActive,
                ]}
              >
                Sign in
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === 'signup' && styles.modeButtonActive,
              ]}
              onPress={() => setMode('signup')}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  mode === 'signup' && styles.modeButtonTextActive,
                ]}
              >
                Create account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.inputWithIcon}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setPasswordVisible((v) => !v)}
                style={styles.eyeButton}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons
                  name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {mode === 'signup' && (
            <View style={styles.field}>
              <Text style={styles.label}>Verify password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.inputWithIcon}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!passwordVisible}
                  autoCapitalize="none"
                  value={verifyPassword}
                  onChangeText={setVerifyPassword}
                />
                <TouchableOpacity
                  onPress={() => setPasswordVisible((v) => !v)}
                  style={styles.eyeButton}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons
                    name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              {verifyPassword.length > 0 && password !== verifyPassword && (
                <Text style={styles.passwordMismatch}>Passwords don't match</Text>
              )}
            </View>
          )}

          <ActionLoadingSlot
            loading={isLoading}
            loadingProps={{
              preset: 'authSubmit',
              message:
                oauthLoadingLabel ??
                (mode === 'login' ? 'Signing in…' : 'Creating your account…'),
              style: styles.primaryButton,
            }}
          >
            <Button
              title={mode === 'login' ? 'Sign in' : 'Create account'}
              onPress={handleAuth}
              disabled={mode === 'signup' && (password !== verifyPassword || !verifyPassword.trim())}
              style={styles.primaryButton}
            />
          </ActionLoadingSlot>

          {mode === 'login' && (
            <TouchableOpacity onPress={openForgotPassword} style={styles.forgotPasswordLink}>
              <Text style={styles.resendText}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          <SocialAuthProviderRow
            disabled={isLoading}
            onGooglePress={() => handleOAuthProvider(getAuthOAuthProvider('google'))}
            onDiscordPress={() => handleOAuthProvider(getAuthOAuthProvider('discord'))}
            onApplePress={Platform.OS === 'ios' ? handleAppleAuth : undefined}
          />
          <TouchableOpacity
            onPress={() => navigation.navigate('Privacy')}
            style={styles.legalLink}
            activeOpacity={0.7}
          >
            <Text style={styles.legalText}>{AUTH_LEGAL_NOTE}</Text>
          </TouchableOpacity>
        </Card>

        <TouchableOpacity
          onPress={() => navigation.navigate('LoginSupport')}
          style={styles.supportLink}
          activeOpacity={0.7}
        >
          <Text style={styles.supportLinkText}>Having issues? Contact us!</Text>
        </TouchableOpacity>
        </ScrollView>
      </DesignExportForeground>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: typography.weights.bold,
    fontFamily: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  header: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  titleMain: {
    fontSize: 28,
    fontWeight: typography.weights.bold,
    fontFamily: typography.bold,
    color: colors.textPrimary,
    zIndex: 1,
    marginTop: spacing.xs,
    letterSpacing: 0.5,
  },
  titleSub: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium,
    fontFamily: typography.bold,
    color: colors.textSecondary,
    zIndex: 1,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.full,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  modeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: colors.buttonPrimary90,
    borderWidth: 1,
    borderColor: colors.buttonEdge,
  },
  modeButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  modeButtonTextActive: {
    color: colors.white,
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
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cardBackground,
  },
  inputWithIcon: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingRight: spacing.xs,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  eyeButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordMismatch: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.xs,
    color: colors.error,
  },
  primaryButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  switchModeText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  supportLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  supportLinkText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  legalLink: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  legalText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    lineHeight: typography.sizes.xs * typography.lineHeights.relaxed,
    textAlign: 'center',
  },
  forgotPasswordLink: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  resendButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  resendText: {
    fontSize: typography.sizes.sm,
    color: colors.buttonPrimary,
    fontWeight: typography.weights.medium,
  },
  backLink: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
  },
});

export default AuthScreen;
