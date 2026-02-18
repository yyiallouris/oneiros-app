import React, { createContext, useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
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
import { PENDING_PASSWORD_RESET_KEY } from '../constants/auth';
import ContactScreen from '../screens/ContactScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import CalendarScreen from '../screens/CalendarScreen';
import InsightsSectionScreen from '../screens/InsightsSectionScreen';
import InsightsJourneyScreen from '../screens/InsightsJourneyScreen';
import JournalFilterScreen from '../screens/JournalFilterScreen';
import { INSIGHTS_SECTION_TITLES } from '../constants/insightsSections';
import type { InsightsSectionId } from '../types/insights';
import { colors } from '../theme';
import { supabase } from '../services/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { StorageService } from '../services/storageService';
import { SyncService } from '../services/syncService';
import { onNetworkStateChange, isOnline } from '../utils/network';
import { DevOfflineToggle } from '../components/DevOfflineToggle';
import { processAuthDeepLink, redactAuthUrl } from '../utils/authDeepLink';

const Stack = createStackNavigator<RootStackParamList>();

/** Set to false when user completes "Set new password" after password-reset link. */
export const PendingPasswordResetContext = createContext<((v: boolean) => void) | null>(null);

/** Call when user passes biometric unlock (app lock). */
export const BiometricUnlockContext = createContext<(() => void) | null>(null);

export const RootNavigator: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPasswordReset, setPendingPasswordReset] = useState(false);
  const [biometricLockEnabled, setBiometricLockEnabled] = useState(false);
  const [biometricUnlocked, setBiometricUnlocked] = useState(false);
  const previousSessionRef = useRef<Session | null>(null);
  const wasOfflineRef = useRef<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // Initialize storage service (checks for user changes, clears data if needed)
      await StorageService.initialize();

      // Process auth deep link on cold start (magic link / reset password open the app;
      // getInitialURL() is often null or delayed on Android, so retry several times)
      for (const delayMs of [0, 300, 800, 1500]) {
        if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
        const initialUrl = await Linking.getInitialURL();
        console.log('[RootNavigator] getInitialURL (attempt, delay=' + delayMs + 'ms):', redactAuthUrl(initialUrl));
        if (initialUrl?.startsWith('oneiros-dream-journal://')) {
          console.log('[RootNavigator] Processing initial auth URL on cold start');
          const result = await processAuthDeepLink(initialUrl);
          if (result.handled) {
            console.log('[RootNavigator] Auth URL handled successfully', result.isRecovery ? '(recovery)' : '');
            break;
          }
          console.warn('[RootNavigator] Auth URL not handled (wrong format or error)');
        }
      }

      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setSession(data.session);
        previousSessionRef.current = data.session;
        if (data.session) {
          const pending = await AsyncStorage.getItem(PENDING_PASSWORD_RESET_KEY);
          setPendingPasswordReset(pending === 'true');
          const lockEnabled = await syncBiometricFromRemote();
          setBiometricLockEnabled(lockEnabled);
        }
        setIsLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } =     supabase.auth.onAuthStateChange(async (event, newSession) => {
      const previousSession = previousSessionRef.current;
      previousSessionRef.current = newSession;

      // CRITICAL: Update UI state immediately so user sees correct screen (SetPassword/MainTabs)
      // Only await the quick AsyncStorage read; StorageService.initialize() etc. run in background
      if (newSession) {
        const pending = await AsyncStorage.getItem(PENDING_PASSWORD_RESET_KEY);
        setPendingPasswordReset(pending === 'true');
        syncBiometricFromRemote().then(setBiometricLockEnabled);
      } else {
        setPendingPasswordReset(false);
        setBiometricLockEnabled(false);
        setBiometricUnlocked(false);
      }
      setSession(newSession);

      // If user logged out, clear all local storage
      // Do this in background to avoid blocking the logout flow
      if (previousSession && !newSession) {
        console.log('[RootNavigator] User logged out, clearing local storage');
        setPendingPasswordReset(false);

        // Clear storage in background (non-blocking)
        // Don't await - let logout complete immediately
        (async () => {
          try {
            // CRITICAL: Before clearing, try to sync any unsynced dreams one last time
            // This ensures dreams are saved to database before logout
            const { LocalStorage } = await import('../services/localStorage');
            const unsyncedDreams = await LocalStorage.getUnsyncedDreams();
            if (unsyncedDreams.length > 0) {
              console.log(`[RootNavigator] Found ${unsyncedDreams.length} unsynced dream(s) before logout, attempting final sync...`);
              try {
                await SyncService.syncUnsyncedDreams();
                console.log(`✅ ${unsyncedDreams.length} dream(s) synced before logout`);
              } catch (error) {
                console.error('❌ Failed to sync before logout:', error);
                // Continue with clearing anyway
              }
            }
            await StorageService.clearAll();
            await AsyncStorage.removeItem(PENDING_PASSWORD_RESET_KEY);
            // Do not clear biometric preference on logout: it is stored per-user in Supabase.
            // On next login we sync from remote (syncBiometricFromRemote) and restore the toggle.
          } catch (error) {
            console.error('[RootNavigator] Error during logout cleanup:', error);
            // Try to clear anyway
            try {
              await StorageService.clearAll();
              await AsyncStorage.removeItem(PENDING_PASSWORD_RESET_KEY);
            } catch (clearError) {
              console.error('[RootNavigator] Failed to clear storage:', clearError);
            }
          }
        })();
      }

      // If user logged in (new session), initialize storage and fetch from database (in background)
      if (!previousSession && newSession) {
        console.log('[RootNavigator] User logged in, initializing storage and fetching data...');
        (async () => {
          await StorageService.initialize();
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

      // If session changed (user might have changed), re-initialize
      if (previousSession && newSession && previousSession.user.id !== newSession.user.id) {
        console.log('[RootNavigator] User changed, re-initializing storage');
        StorageService.initialize().catch((err) => console.error('[RootNavigator] Re-init failed:', err));
      }
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
        // Network just came back online - sync unsynced data and merge remote
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🌐 USER BACK ONLINE - Syncing and merging data...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        try {
          // Get count of unsynced dreams before syncing
          const { LocalStorage } = await import('../services/localStorage');
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
              const { LocalStorage: LocalStorage2 } = await import('../services/localStorage');
              const remainingUnsynced = await LocalStorage2.getUnsyncedDreams();
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
        }
      }
    });
    return () => {
      if (backgroundTimeout) clearTimeout(backgroundTimeout);
      sub.remove();
    };
  }, [session]);

  const showBiometricLock = !!session && biometricLockEnabled && !biometricUnlocked;

  return (
    <PendingPasswordResetContext.Provider value={setPendingPasswordReset}>
      <BiometricUnlockContext.Provider value={() => setBiometricUnlocked(true)}>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: colors.background },
              presentation: 'card',
            }}
          >
            {!session ? (
              <>
                <Stack.Screen name="Auth" component={AuthScreen} />
                <Stack.Screen name="LoginSupport" component={LoginSupportScreen} />
              </>
            ) : pendingPasswordReset ? (
              <Stack.Screen name="SetPassword" component={SetPasswordScreen} />
            ) : showBiometricLock ? (
              <>
                <Stack.Screen name="BiometricLock" component={BiometricLockScreen} />
                <Stack.Screen name="LoginSupport" component={LoginSupportScreen} />
              </>
            ) : (
              <Stack.Screen name="MainTabs" component={MainTabsNavigator} />
            )}
        <Stack.Screen
          name="DreamEditor"
          component={DreamEditorScreen}
          options={{
            headerShown: true,
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
            headerShown: true,
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
            headerShown: true,
            headerStyle: { backgroundColor: colors.background },
            headerShadowVisible: false,
            headerTintColor: colors.textPrimary,
            headerTitle: 'Account',
          }}
        />
        <Stack.Screen
          name="Contact"
          component={ContactScreen}
          options={{
            headerShown: true,
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
            headerShown: true,
            headerStyle: { backgroundColor: colors.background },
            headerShadowVisible: false,
            headerTintColor: colors.textPrimary,
            headerTitle: 'Privacy',
          }}
        />
        <Stack.Screen
          name="DreamDetail"
          component={DreamDetailScreen}
          options={{
            headerShown: true,
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
            headerShown: true,
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
            const baseTitle = p?.sectionId ? (INSIGHTS_SECTION_TITLES[p.sectionId] ?? 'Insights') : 'Insights';
            const title = p?.periodLabel ? `${baseTitle} (${p.periodLabel})` : baseTitle;
            return {
              headerShown: true,
              headerStyle: { backgroundColor: colors.background },
              headerShadowVisible: false,
              headerTintColor: colors.textPrimary,
              headerTitle: title,
            };
          }}
        />
        <Stack.Screen
          name="InsightsJourney"
          component={InsightsJourneyScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="JournalFilter"
          component={JournalFilterScreen}
          options={({ route }) => {
            const p = route.params as { filterSymbol?: string; filterLandscape?: string };
            const title = p?.filterSymbol ? `Symbol: ${p.filterSymbol}` : p?.filterLandscape ? `Landscape: ${p.filterLandscape}` : 'Journal';
            return {
              headerShown: true,
              headerStyle: { backgroundColor: colors.background },
              headerShadowVisible: false,
              headerTintColor: colors.textPrimary,
              headerTitle: title,
            };
          }}
        />
          </Stack.Navigator>
          <DevOfflineToggle />
        </NavigationContainer>
      </BiometricUnlockContext.Provider>
    </PendingPasswordResetContext.Provider>
  );
};

