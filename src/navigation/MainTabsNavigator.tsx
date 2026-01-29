import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabsParamList } from './types';
import WriteScreen from '../screens/WriteScreen';
import JournalScreen from '../screens/JournalScreen';
import InsightsScreen from '../screens/InsightsScreen';
import { colors, typography } from '../theme';
import Svg, { Path } from 'react-native-svg';

const Tab = createBottomTabNavigator<MainTabsParamList>();

// Simple pen icon
const PenIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Simple book icon
const BookIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Key icon for Insights tab
const KeyIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const MainTabsNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
          height: 60 + Math.max(insets.bottom - 8, 0),
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: typography.sizes.xs,
          fontWeight: typography.weights.medium,
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Write"
        component={WriteScreen}
        options={{
          tabBarIcon: ({ color }) => <PenIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{
          tabBarIcon: ({ color }) => <BookIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{
          tabBarIcon: ({ color }) => <KeyIcon color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

