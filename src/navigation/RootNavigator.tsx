import React, { createContext, useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import { MainTabsNavigator } from './MainTabsNavigator';
import DreamEditorScreen from '../screens/DreamEditorScreen';
import InterpretationChatScreen from '../screens/InterpretationChatScreen';
import DreamDetailScreen from '../screens/DreamDetailScreen';
import AuthScreen from '../screens/AuthScreen';
import LoginSupportScreen from '../screens/LoginSupportScreen';
import SetPasswordScreen from '../screens/SetPasswordScreen';
import BiometricLockScreen from '../screens/BiometricLockScreen';
import { isBiometricEnabled, syncBiometricFromRemote } from '../services/biometricAuthService';
import AccountScreen from '../screens/AccountScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import OnboardingNavigator from './OnboardingNavigator';
import { hasCompletedOnboardingForUser } from '../services/onboardingService';
import { PENDING_PASSWORD_RESET_KEY } from '../constants/auth';
import ContactScreen from '../screens/ContactScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import LegalConsentScreen from '../screens/LegalConsentScreen';
import CalendarScreen from '../screens/CalendarScreen';
import InsightsSectionScreen from '../screens/InsightsSectionScreen';
import PatternExplorerScreen from '../screens/PatternExplorerScreen';
import InsightsJourneyScreen from '../screens/InsightsJourneyScreen';
import JournalFilterScreen from '../screens/JournalFilterScreen';
import { INSIGHTS_SECTION_TITLES } from '../constants/insightsSections';
import type { InsightsSectionId } from '../types/insights';
import { colors, typography } from '../theme';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { supabase } from '../services/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { StorageService } from '../services/storageService';
import { SyncService } from '../services/syncService';
import { LocalStorage } from '../services/localStorage';
import { voiceTranscriptionQueueService } from '../services/voiceTranscriptionQueueService';
import { onNetworkStateChange, isOnline } from '../utils/network';
import { DevOfflineToggle } from '../components/DevOfflineToggle';
import { processAuthDeepLink, redactAuthUrl } from '../utils/authDeepLink';
import { hasAcceptedLegalConsentForUser } from '../services/legalConsentService';
import {
  DESIGN_EXPORT_INITIAL_ONBOARDING_ROUTE,
  DESIGN_EXPORT_INITIAL_ROUTE,
  DESIGN_EXPORT_INITIAL_TAB,
  DESIGN_EXPORT_DREAM_ID,
  DESIGN_EXPORT_INSIGHTS_SECTION_ID,
  DESIGN_EXPORT_JOURNAL_FILTER_SYMBOL,
  DESIGN_EXPORT_MODE,
  IS_DESIGN_EXPORT_BACKGROUND_ONLY,
} from '../designExport';

const Stack = createStackNavigator<RootStackParamList>();

const ROOT_ROUTE_NAMES: Array<keyof RootStackParamList> = [
  'Auth',
  'LoginSupport',
  'SetPassword',
  'BiometricLock',
  'LegalConsent',
  'Onboarding',
  'MainTabs',
  'DreamEditor',
  'InterpretationChat',
  'DreamDetail',
  'Account',
  'Subscription',
  'Contact',
  'Privacy',
  'Calendar',
  'InsightsSection',
  'PatternExplorer',
  'InsightsJourney',
  'JournalFilter',
];

const MAIN_TAB_ROUTE_NAMES = ['Write', 'Journal', 'Insights'] as const;
const ONBOARDING_ROUTE_NAMES = [
  'OnboardingName',
  'OnboardingDepth',
  'OnboardingLanguage',
  'OnboardingSubscription',
  'OnboardingSecure',
] as const;
const SHOW_DEV_OFFLINE_TOGGLE = false;

const oneirosNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.background,
    text: colors.textPrimary,
    border: colors.contourLineFaint,
    primary: colors.buttonPrimary,
  },
};

const isRootRouteName = (route: string): route is keyof RootStackParamList =>
  ROOT_ROUTE_NAMES.includes(route as keyof RootStackParamList);

const isMainTabRouteName = (route: string): route is (typeof MAIN_TAB_ROUTE_NAMES)[number] =>
  MAIN_TAB_ROUTE_NAMES.includes(route as (typeof MAIN_TAB_ROUTE_NAMES)[number]);

const isOnboardingRouteName = (route: string): route is (typeof ONBOARDING_ROUTE_NAMES)[number] =>
  ONBOARDING_ROUTE_NAMES.includes(route as (typeof ONBOARDING_ROUTE_NAMES)[number]);

const getTodayForDesignExport = () => new Date().toISOString().slice(0, 10);

const designExportInitialRootRoute = (): keyof RootStackParamList => {
  if (isMainTabRouteName(DESIGN_EXPORT_INITIAL_ROUTE)) return 'MainTabs';
  if (isOnboardingRouteName(DESIGN_EXPORT_INITIAL_ROUTE)) return 'Onboarding';
  return isRootRouteName(DESIGN_EXPORT_INITIAL_ROUTE) ? DESIGN_EXPORT_INITIAL_ROUTE : 'MainTabs';
};

const designExportInitialTabRoute = () =>
  isMainTabRouteName(DESIGN_EXPORT_INITIAL_ROUTE)
    ? DESIGN_EXPORT_INITIAL_ROUTE
    : isMainTabRouteName(DESIGN_EXPORT_INITIAL_TAB)
      ? DESIGN_EXPORT_INITIAL_TAB
      : 'Write';

const designExportInitialOnboardingRoute = () =>
  isOnboardingRouteName(DESIGN_EXPORT_INITIAL_ROUTE)
    ? DESIGN_EXPORT_INITIAL_ROUTE
    : isOnboardingRouteName(DESIGN_EXPORT_INITIAL_ONBOARDING_ROUTE)
      ? DESIGN_EXPORT_INITIAL_ONBOARDING_ROUTE
      : 'OnboardingName';

type AuthenticatedRouteState = {
  pendingPasswordReset: boolean;
  biometricLockEnabled: boolean;
  onboardingCompleted: boolean;
  legalConsentAccepted: boolean;
};

/** Set to false when user completes "Set new password" after password-reset link. */
export const PendingPasswordResetContext = createContext<((v: boolean) => void) | null>(null);

/** Call when user passes biometric unlock (app lock). */
export const BiometricUnlockContext = createContext<(() => void) | null>(null);

const DesignExportRootNavigator: React.FC = () => {
  const initialRouteName = designExportInitialRootRoute();
  const initialTabRouteName = designExportInitialTabRoute();
  const initialOnboardingRouteName = designExportInitialOnboardingRoute();
  const today = getTodayForDesignExport();

  return (
    <PendingPasswordResetContext.Provider value={() => undefined}>
      <BiometricUnlockContext.Provider value={() => undefined}>
        <NavigationContainer theme={oneirosNavigationTheme}>
          <Stack.Navigator
            initialRouteName={initialRouteName}
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: colors.background },
              presentation: 'card',
              headerStyle: { backgroundColor: colors.background },
              headerShadowVisible: false,
              headerTintColor: colors.textAccent,
              headerTitleStyle: {
                fontFamily: typography.medium,
                fontSize: typography.sizes.lg,
                color: colors.textTitle,
              },
            }}
          >
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="LoginSupport" component={LoginSupportScreen} />
            <Stack.Screen name="SetPassword" component={SetPasswordScreen} />
            <Stack.Screen name="BiometricLock" component={BiometricLockScreen} />
            <Stack.Screen name="LegalConsent">
              {() => <LegalConsentScreen onAccepted={() => undefined} />}
            </Stack.Screen>
            <Stack.Screen name="Onboarding">
              {() => (
                <OnboardingNavigator
                  onComplete={() => undefined}
                  initialRouteName={initialOnboardingRouteName}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="MainTabs">
              {() => <MainTabsNavigator initialRouteName={initialTabRouteName} />}
            </Stack.Screen>
            <Stack.Screen
              name="DreamEditor"
              component={DreamEditorScreen}
              initialParams={{ date: today }}
              options={{
                headerShown: !IS_DESIGN_EXPORT_BACKGROUND_ONLY,
                headerStyle: { backgroundColor: colors.background },
                headerShadowVisible: false,
                headerTintColor: colors.textPrimary,
                headerTitle: 'Edit Dream',
              }}
            />
            <Stack.Screen
              name="InterpretationChat"
              component={InterpretationChatScreen}
              initialParams={{ dreamId: DESIGN_EXPORT_DREAM_ID }}
              options={{
                headerShown: !IS_DESIGN_EXPORT_BACKGROUND_ONLY,
                headerStyle: { backgroundColor: colors.background },
                headerShadowVisible: false,
                headerTintColor: colors.textPrimary,
                headerTitle: 'Jungian AI',
              }}
            />
            <Stack.Screen
              name="Account"
              component={AccountScreen}
              options={{
                headerShown: !IS_DESIGN_EXPORT_BACKGROUND_ONLY,
                headerStyle: { backgroundColor: colors.background },
                headerShadowVisible: false,
                headerTintColor: colors.textPrimary,
                headerTitle: 'Account',
              }}
            />
            <Stack.Screen
              name="Subscription"
              component={SubscriptionScreen}
              options={{
                headerShown: !IS_DESIGN_EXPORT_BACKGROUND_ONLY,
                headerStyle: { backgroundColor: colors.background },
                headerShadowVisible: false,
                headerTintColor: colors.textPrimary,
                headerTitle: 'Subscription & Billing',
              }}
            />
            <Stack.Screen
              name="Contact"
              component={ContactScreen}
              options={{
                headerShown: !IS_DESIGN_EXPORT_BACKGROUND_ONLY,
                headerStyle: { backgroundColor: colors.background },
                headerShadowVisible: false,
                headerTintColor: colors.textPrimary,
                headerTitle: 'Contact us',
              }}
            />
            <Stack.Screen
              name="Privacy"
              component={PrivacyScreen}
              options={{
                headerShown: !IS_DESIGN_EXPORT_BACKGROUND_ONLY,
                headerStyle: { backgroundColor: colors.background },
                headerShadowVisible: false,
                headerTintColor: colors.textPrimary,
                headerTitle: 'Privacy & Legal',
              }}
            />
            <Stack.Screen
              name="DreamDetail"
              component={DreamDetailScreen}
              initialParams={{ dreamId: DESIGN_EXPORT_DREAM_ID }}
              options={{
                headerShown: !IS_DESIGN_EXPORT_BACKGROUND_ONLY,
                headerStyle: { backgroundColor: colors.background },
                headerShadowVisible: false,
                headerTintColor: colors.textPrimary,
                headerTitle: 'Dream',
              }}
            />
            <Stack.Screen
              name="Calendar"
              component={CalendarScreen}
              initialParams={{ initialDate: today }}
              options={{
                headerShown: !IS_DESIGN_EXPORT_BACKGROUND_ONLY,
                headerStyle: { backgroundColor: colors.background },
                headerShadowVisible: false,
                headerTintColor: colors.textPrimary,
                headerTitle: 'Dream Calendar',
              }}
            />
            <Stack.Screen
              name="InsightsSection"
              component={InsightsSectionScreen}
              initialParams={{
                sectionId: DESIGN_EXPORT_INSIGHTS_SECTION_ID as InsightsSectionId,
                periodStart: today,
                periodEnd: today,
                periodLabel: 'Design export',
              }}
              options={{
                headerShown: !IS_DESIGN_EXPORT_BACKGROUND_ONLY,
                headerStyle: { backgroundColor: colors.background },
                headerShadowVisible: false,
                headerTintColor: colors.textPrimary,
                headerTitleAlign: 'center',
                headerTitle: 'Insights',
              }}
            />
            <Stack.Screen
              name="PatternExplorer"
              component={PatternExplorerScreen}
              initialParams={{
                periodStart: today,
                periodEnd: today,
                periodLabel: 'Design export',
              }}
              options={{
                headerShown: !IS_DESIGN_EXPORT_BACKGROUND_ONLY,
                headerStyle: { backgroundColor: colors.background },
                headerShadowVisible: false,
                headerTintColor: colors.textPrimary,
                headerTitleAlign: 'center',
                headerTitle: 'Pattern Explorer',
              }}
            />
            <Stack.Screen
              name="InsightsJourney"
              component={InsightsJourneyScreen}
              initialParams={{
                initialSectionId: DESIGN_EXPORT_INSIGHTS_SECTION_ID as InsightsSectionId,
                periodStart: today,
                periodEnd: today,
                periodLabel: 'Design export',
              }}
              options={{
                headerShown: !IS_DESIGN_EXPORT_BACKGROUND_ONLY,
                headerStyle: { backgroundColor: colors.background },
                headerShadowVisible: false,
                headerTintColor: colors.textPrimary,
                headerTitleAlign: 'center',
                headerTitle: 'Insights',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen
              name="JournalFilter"
              component={JournalFilterScreen}
              initialParams={{ filterSymbol: DESIGN_EXPORT_JOURNAL_FILTER_SYMBOL }}
              options={{
                headerShown: !IS_DESIGN_EXPORT_BACKGROUND_ONLY,
                headerStyle: { backgroundColor: colors.background },
                headerShadowVisible: false,
                headerTintColor: colors.textPrimary,
                headerTitle: 'Journal',
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </BiometricUnlockContext.Provider>
    </PendingPasswordResetContext.Provider>
  );
};

export const RootNavigator: React.FC = () => {
  if (DESIGN_EXPORT_MODE) {
    return <DesignExportRootNavigator />;
  }

  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPasswordReset, setPendingPasswordReset] = useState(false);
  const [biometricLockEnabled, setBiometricLockEnabled] = useState(false);
  const [biometricUnlocked, setBiometricUnlocked] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [legalConsentAccepted, setLegalConsentAcceptedState] = useState<boolean | null>(null);
  const [routeStateReady, setRouteStateReady] = useState(false);
  const previousSessionRef = useRef<Session | null>(null);
  const routeStateRequestRef = useRef(0);
  const wasOfflineRef = useRef<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const resolveAuthenticatedRouteState = async (userId: string): Promise<AuthenticatedRouteState> => {
      // Route gate uses local/session-critical flags only. Remote biometric sync must not
      // block post-OAuth navigation. The known user ID also avoids re-entering the
      // Supabase auth lock from an auth-state notification.
      const [pending, lockEnabled, completed, legalAccepted] = await Promise.all([
        AsyncStorage.getItem(PENDING_PASSWORD_RESET_KEY)
          .then((value) => value === 'true')
          .catch(() => false),
        isBiometricEnabled().catch(() => false),
        hasCompletedOnboardingForUser(userId).catch(() => false),
        hasAcceptedLegalConsentForUser(userId).catch(() => false),
      ]);

      return {
        pendingPasswordReset: pending,
        biometricLockEnabled: lockEnabled,
        onboardingCompleted: completed,
        legalConsentAccepted: legalAccepted,
      };
    };

    const applyAuthenticatedRouteState = (state: AuthenticatedRouteState) => {
      setPendingPasswordReset(state.pendingPasswordReset);
      setBiometricLockEnabled(state.biometricLockEnabled);
      setOnboardingCompleted(state.onboardingCompleted);
      setLegalConsentAcceptedState(state.legalConsentAccepted);
      setRouteStateReady(true);
    };

    const refreshBiometricFromRemoteInBackground = () => {
      void syncBiometricFromRemote()
        .then((enabled) => {
          if (mounted) setBiometricLockEnabled(enabled);
        })
        .catch(() => {
          // Keep local preference; do not block routing.
        });
    };

    const init = async () => {
      // Run storage init and deep link processing in parallel for faster first paint
      const processDeepLink = async () => {
        for (const delayMs of [0, 300, 800, 1500]) {
          if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
          const initialUrl = await Linking.getInitialURL();
          console.log('[RootNavigator] getInitialURL (attempt, delay=' + delayMs + 'ms):', redactAuthUrl(initialUrl));
          if (initialUrl?.startsWith('oneiros-dream-journal://')) {
            console.log('[RootNavigator] Processing initial auth URL on cold start');
            const result = await processAuthDeepLink(initialUrl);
            if (result.handled) {
              console.log('[RootNavigator] Auth URL handled successfully', result.isRecovery ? '(recovery)' : '');
            } else if (result.error) {
              console.warn('[RootNavigator] Auth URL failed:', result.error);
            } else {
              console.warn('[RootNavigator] Auth URL not handled (wrong format or error)');
            }
            // Process a concrete initial callback once. Reprocessing the same one-time
            // OAuth code can keep the splash/loading path alive longer than necessary.
            break;
          }
        }
      };

      await Promise.all([StorageService.initialize(), processDeepLink()]);

      const { data } = await supabase.auth.getSession();
      if (mounted) {
        previousSessionRef.current = data.session;
        if (data.session) {
          const requestId = ++routeStateRequestRef.current;
          const routeState = await resolveAuthenticatedRouteState(data.session.user.id);
          if (!mounted || requestId !== routeStateRequestRef.current) return;
          applyAuthenticatedRouteState(routeState);
          refreshBiometricFromRemoteInBackground();
        } else {
          setRouteStateReady(false);
          setOnboardingCompleted(null);
          setLegalConsentAcceptedState(null);
        }
        setSession(data.session);
        setIsLoading(false);
      }
    };

    init();

    let authTransitionChain: Promise<void> = Promise.resolve();

    const cleanupLoggedOutAccount = async (loggedOutUserId: string) => {
      try {
        // A later auth event is serialized behind this cleanup, so a newly
        // signed-in user's local data cannot be erased by an older logout task.
        const unsyncedDreams = await LocalStorage.getUnsyncedDreams();
        if (unsyncedDreams.length > 0) {
          console.log(`[RootNavigator] Found ${unsyncedDreams.length} unsynced dream(s) before logout, attempting final sync...`);
          try {
            await SyncService.syncUnsyncedDreams();
            console.log(`✅ ${unsyncedDreams.length} dream(s) synced before logout`);
          } catch (error) {
            console.error('❌ Failed to sync before logout:', error);
          }
        }
        await StorageService.clearAll(loggedOutUserId);
        await AsyncStorage.removeItem(PENDING_PASSWORD_RESET_KEY);
      } catch (error) {
        console.error('[RootNavigator] Error during logout cleanup:', error);
        try {
          await StorageService.clearAll(loggedOutUserId);
          await AsyncStorage.removeItem(PENDING_PASSWORD_RESET_KEY);
        } catch (clearError) {
          console.error('[RootNavigator] Failed to clear storage:', clearError);
        }
      }
    };

    const handleAuthStateChange = async (event: string, newSession: Session | null) => {
      const previousSession = previousSessionRef.current;
      const userChanged = !!previousSession && !!newSession && previousSession.user.id !== newSession.user.id;
      const sessionStarted = !previousSession && !!newSession;

      // CRITICAL: Preserve session when offline - Supabase clears session on token refresh failure
      // when network is unavailable (known issue: supabase/auth-js#141). Don't kick user to login.
      if (!newSession && previousSession) {
        const online = await isOnline();
        if (!online) {
          console.log('[RootNavigator] Session null but offline - preserving session to avoid login redirect');
          previousSessionRef.current = previousSession;
          return;
        }
      }

      previousSessionRef.current = newSession;

      if (userChanged || sessionStarted) {
        console.log('[RootNavigator] Session started or user changed, initializing owner-scoped storage');
        // On signed-out cold start, StorageService may still hold the previous
        // owner ID. Finish that owner's cleanup before resolving/rendering the
        // new account's local routes.
        await StorageService.initialize();
      }

      // CRITICAL: Update UI state immediately so user sees correct screen (SetPassword/MainTabs)
      // after local route-critical flags are known. Remote biometric sync runs in background
      // so hanging user_settings never blocks post-OAuth navigation.
      if (newSession) {
        const requestId = ++routeStateRequestRef.current;
        if (sessionStarted || userChanged) {
          setRouteStateReady(false);
          setIsLoading(true);
          setSession(newSession);
        }

        const routeState = await resolveAuthenticatedRouteState(newSession.user.id);
        if (!mounted || requestId !== routeStateRequestRef.current) return;
        applyAuthenticatedRouteState(routeState);
        refreshBiometricFromRemoteInBackground();
        setSession(newSession);
        setIsLoading(false);
      } else {
        routeStateRequestRef.current += 1;
        setPendingPasswordReset(false);
        setBiometricLockEnabled(false);
        setBiometricUnlocked(false);
        setRouteStateReady(false);
        setOnboardingCompleted(null);
        setLegalConsentAcceptedState(null);
        setIsLoading(false);
        setSession(null);
      }

      // If user logged out, clear all local storage
      // Do this in background to avoid blocking the logout flow
      if (previousSession && !newSession) {
        console.log('[RootNavigator] User logged out, clearing local storage');
        setPendingPasswordReset(false);

        await cleanupLoggedOutAccount(previousSession.user.id);
        // Do not clear biometric preference on logout: it is stored per-user in Supabase.
        // On next login we sync from remote (syncBiometricFromRemote) and restore the toggle.
      }

      // If user logged in (new session), initialize storage and fetch from database (in background)
      if (!previousSession && newSession) {
        console.log('[RootNavigator] User logged in, initializing storage and fetching data...');
        (async () => {
          // CRITICAL: Fetch dreams from database when logging in
        // This ensures dreams saved on other devices or previously synced are loaded
        SyncService.fetchAndMergeDreams()
          .then((dreams) => {
            console.log(`✅ Fetched ${dreams.length} dream(s) from database on login`);
          })
          .catch((error) => {
            console.error('[RootNavigator] Failed to fetch dreams on login:', error);
          });
        
        // CRITICAL: Fetch interpretations from database when logging in
        // This ensures interpretations/analysis are loaded
        SyncService.fetchAndMergeInterpretations()
          .then((interpretations) => {
            console.log(`✅ Fetched ${interpretations.length} interpretation(s) from database on login`);
          })
          .catch((error) => {
            console.error('[RootNavigator] Failed to fetch interpretations on login:', error);
          });
        
        // Also sync any unsynced data (in case there's any)
        SyncService.syncAll().catch((error) => {
          console.error('[RootNavigator] Sync failed on login:', error);
        });
        })().catch((err) => console.error('[RootNavigator] Login init failed:', err));
      }

    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      // Supabase invokes subscribers while holding its exclusive auth lock. Returning
      // this async work would deadlock PKCE exchange when route checks touch auth state.
      authTransitionChain = authTransitionChain
        .then(() => handleAuthStateChange(event, newSession))
        .catch((error) => {
          console.error('[RootNavigator] Auth state handling failed:', error);
          if (mounted) setIsLoading(false);
        });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Auto-sync when network comes back online
  useEffect(() => {
    if (!session) {
      return;
    }

    // Initialize offline state
    isOnline().then((online) => {
      wasOfflineRef.current = !online;
    });

    const unsubscribe = onNetworkStateChange(async (isOnlineNow) => {
      const wasOffline = wasOfflineRef.current;
      console.log(`[RootNavigator] 🔄 Network state changed: ${isOnlineNow ? 'ONLINE' : 'OFFLINE'}, wasOffline: ${wasOffline}`);
      
      // Update the ref immediately
      wasOfflineRef.current = !isOnlineNow;
      
      if (isOnlineNow && wasOffline) {
        void voiceTranscriptionQueueService.drain();
        // Network just came back online - sync unsynced data and merge remote
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🌐 USER BACK ONLINE - Syncing and merging data...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        try {
          // Get count of unsynced dreams before syncing
          const unsyncedDreams = await LocalStorage.getUnsyncedDreams();
          const unsyncedCount = unsyncedDreams.length;
          
          console.log(`[RootNavigator] Found ${unsyncedCount} unsynced dream(s) to sync`);
          
          // CRITICAL: First sync unsynced dreams to remote (must complete before fetch)
          // This ensures offline dreams are saved to database before we fetch
          if (unsyncedCount > 0) {
            try {
              console.log(`[RootNavigator] Syncing ${unsyncedCount} unsynced dream(s) to database...`);
              await SyncService.syncUnsyncedDreams();
              
              // Verify sync completed by checking unsynced queue again
              const remainingUnsynced = await LocalStorage.getUnsyncedDreams();
              const syncedCount = unsyncedCount - remainingUnsynced.length;
              
              if (syncedCount > 0) {
                console.log(`✅ ${syncedCount} unsynced dream(s) successfully synced to database`);
              }
              if (remainingUnsynced.length > 0) {
                console.warn(`⚠️  ${remainingUnsynced.length} dream(s) failed to sync and remain in queue`);
              }
            } catch (error) {
              console.error('❌ Sync failed on network reconnect:', error);
              // Continue anyway - will retry later
            }
          } else {
            console.log('ℹ️  No unsynced dreams to sync');
          }
        
          // Then fetch and merge remote dreams (this will log merge count)
          // This ensures we get dreams from database (including the ones we just synced)
          try {
            const mergedDreams = await SyncService.fetchAndMergeDreams();
            console.log(`✅ Dreams merged. Total dreams: ${mergedDreams.length}`);
          } catch (error) {
            console.error('❌ Failed to fetch and merge dreams:', error);
          }
          
          // Also fetch and merge interpretations when coming back online
          try {
            const mergedInterpretations = await SyncService.fetchAndMergeInterpretations();
            console.log(`✅ Interpretations merged. Total interpretations: ${mergedInterpretations.length}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          } catch (error) {
            console.error('❌ Failed to fetch and merge interpretations:', error);
          }
        } catch (error) {
          console.error('[RootNavigator] Error during online sync:', error);
        }
      } else if (!isOnlineNow) {
        // Just went offline
        console.log('[RootNavigator] 📴 User went OFFLINE');
      }
    });

    return unsubscribe;
  }, [session]);

  // Re-lock when app goes to background; refresh lock preference when returning to foreground
  // Use debounce to avoid resetting lock during brief transitions (e.g. permission dialogs)
  useEffect(() => {
    let backgroundTimeout: NodeJS.Timeout | null = null;
    
    const sub = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      if (nextState === 'background') {
        // Debounce: only reset lock if app stays in background for at least 300ms
        // This prevents permission dialogs from triggering the lock screen
        backgroundTimeout = setTimeout(() => {
          setBiometricUnlocked(false);
        }, 300);
      } else if (nextState === 'active' || nextState === 'inactive') {
        // Cancel the debounce if app comes back to foreground/inactive before timeout
        if (backgroundTimeout) {
          clearTimeout(backgroundTimeout);
          backgroundTimeout = null;
        }
        if (nextState === 'active' && session) {
          const enabled = await isBiometricEnabled();
          setBiometricLockEnabled(enabled);
          void voiceTranscriptionQueueService.drain();
        }
      }
    });
    return () => {
      if (backgroundTimeout) clearTimeout(backgroundTimeout);
      sub.remove();
    };
  }, [session]);

  useEffect(() => {
    if (session) void voiceTranscriptionQueueService.drain();
  }, [session]);

  const showBiometricLock = !!session && biometricLockEnabled && !biometricUnlocked;

  if (isLoading || (!!session && !routeStateReady)) {
    // Branded loader — never a blank paper screen after OAuth/session start.
    return <LoadingScreen />;
  }

  const authenticatedStackScreens = (
    <>
      <Stack.Screen
        name="DreamEditor"
        component={DreamEditorScreen}
        options={{
          headerShown: !IS_DESIGN_EXPORT_BACKGROUND_ONLY,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.textPrimary,
          headerTitle: 'Edit Dream',
        }}
      />
      <Stack.Screen
        name="InterpretationChat"
        component={InterpretationChatScreen}
        options={{
          headerShown: !IS_DESIGN_EXPORT_BACKGROUND_ONLY,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.textPrimary,
          headerTitle: 'Jungian AI',
        }}
      />
      <Stack.Screen
        name="Account"
        component={AccountScreen}
        options={{
          headerShown: !IS_DESIGN_EXPORT_BACKGROUND_ONLY,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.textPrimary,
          headerTitle: 'Account',
        }}
      />
      <Stack.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{
          headerShown: !IS_DESIGN_EXPORT_BACKGROUND_ONLY,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.textPrimary,
          headerTitle: 'Subscription & Billing',
        }}
      />
      <Stack.Screen
        name="Contact"
        component={ContactScreen}
        options={{
          headerShown: !IS_DESIGN_EXPORT_BACKGROUND_ONLY,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.textPrimary,
          headerTitle: 'Contact us',
        }}
      />
      <Stack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={{
          headerShown: !IS_DESIGN_EXPORT_BACKGROUND_ONLY,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.textPrimary,
          headerTitle: 'Privacy & Legal',
        }}
      />
      <Stack.Screen
        name="DreamDetail"
        component={DreamDetailScreen}
        options={{
          headerShown: !IS_DESIGN_EXPORT_BACKGROUND_ONLY,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.textPrimary,
          headerTitle: 'Dream',
        }}
      />
      <Stack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          headerShown: !IS_DESIGN_EXPORT_BACKGROUND_ONLY,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.textPrimary,
          headerTitle: 'Dream Calendar',
        }}
      />
      <Stack.Screen
        name="InsightsSection"
        component={InsightsSectionScreen}
        options={({ route }) => {
          const p = route.params as { sectionId?: InsightsSectionId; periodLabel?: string };
          const baseTitle = p?.sectionId === 'pattern-recognition'
            ? 'Insights'
            : (p?.sectionId ? (INSIGHTS_SECTION_TITLES[p.sectionId] ?? 'Insights') : 'Insights');
          const title = (p?.sectionId === 'pattern-recognition' || !p?.periodLabel)
            ? baseTitle
            : `${baseTitle} (${p.periodLabel})`;
          return {
            headerShown: !IS_DESIGN_EXPORT_BACKGROUND_ONLY,
            headerStyle: { backgroundColor: colors.background },
            headerShadowVisible: false,
            headerTintColor: colors.textPrimary,
            headerTitleAlign: 'center',
            headerTitle: title,
          };
        }}
      />
      <Stack.Screen
        name="PatternExplorer"
        component={PatternExplorerScreen}
        options={{
          headerShown: !IS_DESIGN_EXPORT_BACKGROUND_ONLY,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.textPrimary,
          headerTitleAlign: 'center',
          headerTitle: 'Pattern Explorer',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="InsightsJourney"
        component={InsightsJourneyScreen}
        options={{
          headerShown: !IS_DESIGN_EXPORT_BACKGROUND_ONLY,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.textPrimary,
          headerTitleAlign: 'center',
          headerTitle: 'Insights',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="JournalFilter"
        component={JournalFilterScreen}
        options={({ route }) => {
          const p = route.params as { filterSymbol?: string; filterLandscape?: string; filterMotif?: string };
          const title = p?.filterSymbol ? `Symbol: ${p.filterSymbol}` : p?.filterLandscape ? `Landscape: ${p.filterLandscape}` : p?.filterMotif ? `Motif: ${p.filterMotif}` : 'Journal';
          return {
            headerShown: !IS_DESIGN_EXPORT_BACKGROUND_ONLY,
            headerStyle: { backgroundColor: colors.background },
            headerShadowVisible: false,
            headerTintColor: colors.textPrimary,
            headerTitle: title,
          };
        }}
      />
    </>
  );

  return (
    <PendingPasswordResetContext.Provider value={setPendingPasswordReset}>
      <BiometricUnlockContext.Provider value={() => setBiometricUnlocked(true)}>
        <NavigationContainer theme={oneirosNavigationTheme}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: colors.background },
              presentation: 'card',
              headerStyle: { backgroundColor: colors.background },
              headerShadowVisible: false,
              headerTintColor: colors.textAccent,
              headerTitleStyle: {
                fontFamily: typography.medium,
                fontSize: typography.sizes.lg,
                color: colors.textTitle,
              },
            }}
          >
            {!session ? (
              <>
                <Stack.Screen name="Auth" component={AuthScreen} />
                <Stack.Screen name="LoginSupport" component={LoginSupportScreen} />
                <Stack.Screen
                  name="Privacy"
                  component={PrivacyScreen}
                  options={{
                    headerShown: !IS_DESIGN_EXPORT_BACKGROUND_ONLY,
                    headerStyle: { backgroundColor: colors.background },
                    headerShadowVisible: false,
                    headerTintColor: colors.textPrimary,
                    headerTitle: 'Privacy & Legal',
                  }}
                />
              </>
            ) : (
              <>
                {pendingPasswordReset ? (
                  <Stack.Screen name="SetPassword" component={SetPasswordScreen} />
                ) : showBiometricLock ? (
                  <>
                    <Stack.Screen name="BiometricLock" component={BiometricLockScreen} />
                    <Stack.Screen name="LoginSupport" component={LoginSupportScreen} />
                  </>
                ) : legalConsentAccepted !== true ? (
                  <Stack.Screen name="LegalConsent">
                    {() => (
                      <LegalConsentScreen
                        onAccepted={() => setLegalConsentAcceptedState(true)}
                      />
                    )}
                  </Stack.Screen>
                ) : onboardingCompleted === false ? (
                  <Stack.Screen name="Onboarding">
                    {() => (
                      <OnboardingNavigator
                        onComplete={() => setOnboardingCompleted(true)}
                      />
                    )}
                  </Stack.Screen>
                ) : (
                  <Stack.Screen name="MainTabs" component={MainTabsNavigator} />
                )}
                {authenticatedStackScreens}
              </>
            )}
          </Stack.Navigator>
          {!IS_DESIGN_EXPORT_BACKGROUND_ONLY && SHOW_DEV_OFFLINE_TOGGLE && <DevOfflineToggle />}
        </NavigationContainer>
      </BiometricUnlockContext.Provider>
    </PendingPasswordResetContext.Provider>
  );
};
