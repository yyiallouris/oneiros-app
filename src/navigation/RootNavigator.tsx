import React, { useEffect, useState } from 'react';
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

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setSession(data.session);
        setIsLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
    </NavigationContainer>
  );
};

