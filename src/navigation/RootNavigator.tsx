import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import { MainTabsNavigator } from './MainTabsNavigator';
import DreamEditorScreen from '../screens/DreamEditorScreen';
import InterpretationChatScreen from '../screens/InterpretationChatScreen';
import DreamDetailScreen from '../screens/DreamDetailScreen';
import AuthScreen from '../screens/AuthScreen';
import AccountScreen from '../screens/AccountScreen';
import ContactScreen from '../screens/ContactScreen';
import { colors } from '../theme';
import { supabase } from '../services/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { StorageService } from '../services/storageService';
import { SyncService } from '../services/syncService';
import { onNetworkStateChange, isOnline } from '../utils/network';
import { DevOfflineToggle } from '../components/DevOfflineToggle';

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const previousSessionRef = useRef<Session | null>(null);
  const wasOfflineRef = useRef<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // Initialize storage service (checks for user changes, clears data if needed)
      await StorageService.initialize();
      
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setSession(data.session);
        previousSessionRef.current = data.session;
        setIsLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      const previousSession = previousSessionRef.current;
      previousSessionRef.current = newSession;

      // If user logged out, clear all local storage
      // Do this in background to avoid blocking the logout flow
      if (previousSession && !newSession) {
        console.log('[RootNavigator] User logged out, clearing local storage');
        
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
          } catch (error) {
            console.error('[RootNavigator] Error during logout cleanup:', error);
            // Try to clear anyway
            try {
              await StorageService.clearAll();
            } catch (clearError) {
              console.error('[RootNavigator] Failed to clear storage:', clearError);
            }
          }
        })();
      }

      // If user logged in (new session), initialize storage and fetch from database
      if (!previousSession && newSession) {
        console.log('[RootNavigator] User logged in, initializing storage and fetching data...');
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
      }

      // If session changed (user might have changed), re-initialize
      if (previousSession && newSession && previousSession.user.id !== newSession.user.id) {
        console.log('[RootNavigator] User changed, re-initializing storage');
        await StorageService.initialize();
      }

      setSession(newSession);
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

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: colors.background },
          presentation: 'card',
        }}
      >
        {!session ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
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
      </Stack.Navigator>
      <DevOfflineToggle />
    </NavigationContainer>
  );
};

