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
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '../theme';
import { Button, Card, WaveBackground, FloatingSunMoon } from '../components/ui';
import { supabase } from '../services/supabaseClient';
import { logEvent, logError } from '../services/logger';

// Complete OAuth session in browser
WebBrowser.maybeCompleteAuthSession();

type Mode = 'login' | 'signup';

const AuthScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle deep links from OAuth redirect
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      console.log('[Auth] Deep link received:', url);
      
      // Handle any dreamjournal:// URL (simpler - no specific path required)
      if (url.startsWith('dreamjournal://')) {
        console.log('[Auth] Processing OAuth callback...');
        
        // Extract tokens from URL
        let accessToken: string | null = null;
        let refreshToken: string | null = null;

        // Try hash fragments first
        if (url.includes('#')) {
          const hashPart = url.split('#')[1];
          const hashParams = new URLSearchParams(hashPart);
          accessToken = hashParams.get('access_token');
          refreshToken = hashParams.get('refresh_token');
        }

        // Try query params
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
          console.log('[Auth] Setting session from deep link...');
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('[Auth] Deep link session error:', error);
          } else {
            console.log('[Auth] Deep link session set successfully');
            logEvent('auth_google_success', { mode, source: 'deeplink' });
          }
        }
      }
    };

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [mode]);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter an email and password.');
      return;
    }

    setIsLoading(true);
    logEvent('auth_submit', { mode, email: email.trim().toLowerCase() });
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) {
          console.error('[Auth] signIn error details', error);
          throw error;
        }
        console.log('[Auth] signIn success', { user: data?.user?.id });
        logEvent('auth_login_success', { email: email.trim().toLowerCase() });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) {
          console.error('[Auth] signUp error details', error);
          throw error;
        }
        console.log('[Auth] signUp success', { user: data?.user?.id });
        logEvent('auth_signup_success', { email: email.trim().toLowerCase() });
        Alert.alert(
          'Check your email',
          'We sent you a confirmation link. Please confirm your email to continue.'
        );
      }
    } catch (error: any) {
      logError('auth_error', error, { mode });
      Alert.alert('Auth error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    logEvent('auth_google_start', { mode });
    console.log('[Auth] Starting Google OAuth flow...');

    try {
      // Build redirect URL that works in Expo Go (proxy) and in standalone (scheme)
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'dreamjournal',
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
            setIsLoading(false);
          } else {
            throw new Error('No session created from Google sign-in.');
          }
        }
      } else if (authResult.type === 'dismiss' || authResult.type === 'cancel') {
        console.log('[Auth] OAuth cancelled by user');
        Alert.alert('Sign-in cancelled', 'Google sign-in was cancelled.');
      } else {
        console.error('[Auth] Unexpected auth session result:', authResult.type);
        Alert.alert('Sign-in error', 'Google sign-in did not complete. Please try again.');
      }
    } catch (error: any) {
      console.error('[Auth] Google OAuth error:', error);
      logError('auth_google_error', error, { mode });
      Alert.alert('Google sign-in error', error.message || 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <WaveBackground />
      <View style={[styles.inner, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.header}>
          <FloatingSunMoon size={100} style={styles.floatingOrb} />
          <Text style={styles.title}>Dream Journal</Text>
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
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <Button
            title={mode === 'login' ? 'Sign in' : 'Create account'}
            onPress={handleAuth}
            loading={isLoading}
            style={styles.primaryButton}
          />

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

        <TouchableOpacity onPress={toggleMode} style={styles.switchMode}>
          <Text style={styles.switchModeText}>
            {mode === 'login'
              ? "Don't have an account? Create one"
              : 'Already have an account? Sign in'}
          </Text>
        </TouchableOpacity>
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
  },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
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
    backgroundColor: colors.accent,
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
  primaryButton: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
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
  switchMode: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
});

export default AuthScreen;


