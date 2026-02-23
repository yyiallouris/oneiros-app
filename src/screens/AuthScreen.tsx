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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - @expo/vector-icons resolved at runtime by Expo
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme';
import { Button, Card, WaveBackground } from '../components/ui';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabaseClient';
import { logEvent, logError } from '../services/logger';
import { PENDING_PASSWORD_RESET_KEY, MIN_PASSWORD_LENGTH } from '../constants/auth';
import { processAuthDeepLink, isNewGoogleUser } from '../utils/authDeepLink';

// Complete OAuth session in browser
WebBrowser.maybeCompleteAuthSession();

type Mode = 'login' | 'signup';
type NavProp = StackNavigationProp<RootStackParamList>;

const AUTH_REQUEST_TIMEOUT_MS = 25_000;

const AuthScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
          if (result.isNewUser) {
            Alert.alert('Welcome!', "You're all set. Your dream journal is ready.");
          } else {
            Alert.alert('Welcome back!', "You're signed in with Google.");
          }
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

    const runInitialUrl = async () => {
      const url = await Linking.getInitialURL();
      if (url?.startsWith('oneiros-dream-journal://')) handleDeepLink(url);
    };
    runInitialUrl();
    const t1 = setTimeout(runInitialUrl, 800);
    const t2 = setTimeout(runInitialUrl, 2000);

    const subscription = Linking.addEventListener('url', (e) => handleDeepLink(e.url));

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      subscription.remove();
    };
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
    logEvent('auth_submit', { mode, email: email.trim().toLowerCase() });
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
          console.error('[Auth] signIn error details', error);
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
        console.log('[Auth] signIn success', { user: data?.user?.id });
        logEvent('auth_login_success', { email: email.trim().toLowerCase() });
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
          console.error('[Auth] signUp error details', error);
          throw error;
        }
        console.log('[Auth] signUp success', { user: data?.user?.id });
        logEvent('auth_signup_success', { email: normalizedEmail });
        // When email confirmation is enabled, Supabase returns user but no session until verified
        if (data?.user && !data?.session) {
          logEvent('auth_verification_screen_shown', {});
          setPendingVerificationEmail(normalizedEmail);
          setResendCooldown(60); // Rate limit: don't allow resend until 60s after first email
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
      logError('auth_verify_otp_error', err, { email: pendingVerificationEmail });
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
      logError('auth_resend_error', err, { email: pendingVerificationEmail });
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
        redirectTo: 'oneiros-dream-journal://auth/confirm',
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out. Please check your connection and try again.')), AUTH_REQUEST_TIMEOUT_MS)
      );
      const { error } = await Promise.race([resetPromise, timeoutPromise]);
      if (error) throw error;
      setForgotPasswordSent(true);
      setForgotPasswordCooldown(60);
      logEvent('auth_forgot_password_sent', { email: normalizedEmail });
    } catch (err: any) {
      logError('auth_forgot_password_error', err, { email: normalizedEmail });
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
        redirectTo: 'oneiros-dream-journal://auth/confirm',
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

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    logEvent('auth_google_start', { mode });
    console.log('[Auth] Starting Google OAuth flow...');

    try {
      // Build redirect URL that works in Expo Go (proxy) and in standalone (scheme)
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'oneiros-dream-journal',
        path: 'auth/callback',
        useProxy: true, // Expo Go/dev client: use proxy to get back into the app
      });
      console.log('[Auth] Redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth(
        {
          provider: 'google',
        },
        {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        }
      );

      if (error) {
        console.error('[Auth] OAuth error:', error);
        throw error;
      }

      console.log('[Auth] OAuth URL received:', data?.url ? 'Yes' : 'No');
      if (!data?.url) {
        console.error('[Auth] No OAuth URL received');
        setIsLoading(false);
        throw new Error('Failed to start Google sign-in');
      }

      console.log('[Auth] Opening browser with OAuth URL...');

      // Use WebBrowser.openAuthSessionAsync (works reliably with Expo Go)
      const authResult = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      console.log('[Auth] Auth session result type:', authResult.type);
      if (authResult.url) {
        console.log('[Auth] Auth session returned URL');
      }

      if (authResult.type === 'success' && authResult.url) {
        // Try to extract tokens from the returned URL
        let accessToken: string | null = null;
        let refreshToken: string | null = null;
        const url = authResult.url;

        // Hash fragment
        if (url.includes('#')) {
          const hashPart = url.split('#')[1];
          const hashParams = new URLSearchParams(hashPart);
          accessToken = hashParams.get('access_token');
          refreshToken = hashParams.get('refresh_token');
        }

        // Query params
        if (!accessToken && url.includes('?')) {
          const queryPart = url.split('?')[1].split('#')[0];
          const queryParams = new URLSearchParams(queryPart);
          accessToken = queryParams.get('access_token');
          refreshToken = queryParams.get('refresh_token');
        }

        // Regex fallback
        if (!accessToken) {
          const tokenMatch = url.match(/access_token=([^&]+)/);
          const refreshMatch = url.match(/refresh_token=([^&]+)/);
          accessToken = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;
          refreshToken = refreshMatch ? decodeURIComponent(refreshMatch[1]) : null;
        }

        if (accessToken && refreshToken) {
          console.log('[Auth] Setting session from auth session URL...');
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('[Auth] Session error:', sessionError);
            throw sessionError;
          }

          console.log('[Auth] Session set successfully');
          logEvent('auth_google_success', { mode, source: 'auth_session_url' });
          const { data: userData } = await supabase.auth.getUser();
          const isNewUser = isNewGoogleUser(userData.user);
          if (isNewUser) {
            Alert.alert('Welcome!', "You're all set. Your dream journal is ready.");
          } else {
            Alert.alert('Welcome back!', "You're signed in with Google.");
          }
          setIsLoading(false);
        } else {
          console.log('[Auth] No tokens in URL, checking session fallback...');
          // Give Supabase a moment to process the code and create the session
          await new Promise((resolve) => setTimeout(resolve, 1200));
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            console.error('[Auth] Session fetch error:', sessionError.message);
          }
          if (sessionData?.session) {
            console.log('[Auth] Session found via fallback session check');
            logEvent('auth_google_success', { mode, source: 'session_fallback' });
            const { data: userData } = await supabase.auth.getUser();
            const isNewUser = isNewGoogleUser(userData.user);
            if (isNewUser) {
              Alert.alert('Welcome!', "You're all set. Your dream journal is ready.");
            } else {
              Alert.alert('Welcome back!', "You're signed in with Google.");
            }
            setIsLoading(false);
          } else {
            throw new Error('No session created from Google sign-in.');
          }
        }
      } else if (authResult.type === 'dismiss' || authResult.type === 'cancel') {
        // Browser may close before we get the redirect URL; deep link often delivers session.
        // Wait and check for session before showing "cancelled".
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          logEvent('auth_google_success', { mode, source: 'dismiss_then_session' });
          // Deep link handler shows the success alert; no duplicate here
        } else {
          logEvent('auth_google_cancel', { mode });
          Alert.alert('Sign-in cancelled', 'Google sign-in was cancelled.');
        }
        setIsLoading(false);
      } else {
        console.error('[Auth] Unexpected auth session result:', authResult.type);
        Alert.alert('Sign-in error', 'Google sign-in did not complete. Please try again.');
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('[Auth] Google OAuth error:', error);
      logError('auth_google_error', error, { mode });
      Alert.alert('Google sign-in error', error.message || 'Something went wrong. Please try again.');
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
        <WaveBackground />
        <View style={[styles.inner, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}>
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
                <Button
                  title="Send reset link"
                  onPress={handleForgotPassword}
                  loading={isLoading}
                  style={styles.primaryButton}
                />
              </>
            ) : (
              <>
                <Button
                  title={forgotPasswordCooldown > 0 ? `Resend link (${forgotPasswordCooldown}s)` : 'Resend link'}
                  onPress={handleResendForgotPassword}
                  loading={isLoading}
                  disabled={forgotPasswordCooldown > 0}
                  style={styles.primaryButton}
                />
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
        </View>
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
        <WaveBackground />
        <View style={[styles.inner, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}>
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
            <Button
              title="Verify"
              onPress={handleVerifyCode}
              loading={isVerifying}
              style={styles.primaryButton}
            />
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
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <WaveBackground />
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

          <Button
            title={mode === 'login' ? 'Sign in' : 'Create account'}
            onPress={handleAuth}
            loading={isLoading}
            disabled={mode === 'signup' && (password !== verifyPassword || !verifyPassword.trim())}
            style={styles.primaryButton}
          />

          {mode === 'login' && (
            <TouchableOpacity onPress={openForgotPassword} style={styles.forgotPasswordLink}>
              <Text style={styles.resendText}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          {/* Google OAuth */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>
          <Button
            title="Continue with Google"
            onPress={handleGoogleAuth}
            variant="secondary"
            loading={isLoading}
            disabled={isLoading}
          />
        </Card>

        <TouchableOpacity
          onPress={() => navigation.navigate('LoginSupport')}
          style={styles.supportLink}
          activeOpacity={0.7}
        >
          <Text style={styles.supportLinkText}>Having issues? Contact us!</Text>
        </TouchableOpacity>
      </ScrollView>
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
    backgroundColor: colors.buttonPrimary,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },
  dividerText: {
    marginHorizontal: spacing.sm,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
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


