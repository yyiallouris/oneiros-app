import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabsParamList } from './types';
import WriteScreen from '../screens/WriteScreen';
import JournalScreen from '../screens/JournalScreen';
import InsightsScreen from '../screens/InsightsScreen';
import { colors, typography } from '../theme';
import Svg, { Path } from 'react-native-svg';

const Tab = createBottomTabNavigator<MainTabsParamList>();

// Minimum bottom inset so tab bar stays above Android navigation bar when
// system insets are 0 or small (edge-to-edge). Android nav bar is typically 48dp.
const MIN_TAB_BAR_BOTTOM_INSET = Platform.OS === 'android' ? 48 : 8;

// Write tab icon (designer asset)
const PenIcon = ({ color, size = 26 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 1340 1320">
    <Path transform="translate(703,144)" d="m0 0h8l10 5 6 7 5 12 14 35 12 26 8 17 10 19 26 52 9 16 12 21 8 15 11 20 12 20 14 24 13 23 28 49 14 26 9 19 8 20 7 20 5 23 2 15 1 18-3 35-4 22-7 25-9 25-12 28-10 24-12 30-13 35-10 31-8 32-8 44-4 6-7 5h-10l-5-3-2-5v-13l4-37 6-33 7-27 12-36 9-26 15-41 10-28 12-41 4-19 1-8v-37l-4-24-7-24-11-28-17-35-13-23-14-22-13-22-15-27-16-28-14-26-14-27-12-23-23-46-16-36-12-29-5 11-10 24-18 39-11 23-9 17-8 16-8 15-8 16-14 26-14 24-12 21-11 19-21 35-12 22-12 23-13 29-10 30-4 19-2 18v24l3 18 7 26 8 24 27 72 11 31 12 39 9 35 5 25 3 25v17l-1 3-8 3-8 1-8-4-4-8-8-42-5-22-6-20-11-32-10-25-13-31-16-38-14-34-9-26-4-17-3-20v-36l4-28 7-25 9-22 9-20 10-18 8-16 14-25 11-19 15-26 40-70 8-15 8-16 15-28 15-29 13-26 12-28 9-24 6-19 4-13 6-10 9-6z" fill={color} />
    <Path transform="translate(1162,1031)" d="m0 0 9 1 5 5 3 4 1 3v13l-8 10-10 9-23 15-19 11-28 12-28 10-27 8-44 10-33 6-44 6-21 2-18 1h-55l-44-2-46-5-75-12-43-7-58-6-18-1h-40l-28 1-36 4-33 5-23 5-19 5-30 10-30 13-8 4-10 4-23 12-10 4-7-1-8-6-3-5v-6l6-8 10-9 15-9 18-11 29-15 24-10 25-9 21-6 33-7 42-6 15-2 35-2h38l31 2 66 8 31 5 45 7 52 6 43 3h82l31-3 35-5 41-8 50-12 27-9 32-14 23-12 16-10 11-5z" fill={color} />
    <Path transform="translate(551,683)" d="m0 0 4 1 5 5 21 33 14 25 15 29 11 22 12 28 9 25 9 29 8 30 10 50 5 21 7 12 9 11 7 7 14 10 6 1 12-6 8-8 10-15 6-13 5-23 6-38 6-27 9-30 11-30 12-26 8-16 9-19 13-23 11-19 7-10 3-7 5-2 2 4-14 43-14 41-14 49-10 41-5 27-5 40-4 36-4 15-11 18-21 21-13 10-14 9-10 4-9-1-13-7-19-13-11-9-12-11-9-10-8-11-7-16-3-12-7-54-6-32-13-52-39-117-12-32-3-7z" fill={color} />
    <Path transform="translate(707,503)" d="m0 0h6l5 5 18 37 8 16 12 21 14 21 12 13 3 3-2 7-13 18-14 20-12 21-8 16-13 25-5 13-4 5-7 1-5-5-10-19-7-14-12-22-9-16-18-30-9-13 1-5 9-11 13-17 10-15 14-27 12-27 9-19z" fill={color} />
  </Svg>
);

// Journal tab icon (designer asset)
const BookIcon = ({ color, size = 26 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 1140 1416">
    <Path transform="translate(285,95)" d="m0 0h566l33 2 23 3 28 5 24 7 20 8 26 14 12 8 16 12 10 9 9 9 7 8 13 16 10 15 10 19 8 20 7 24 5 25 3 19 2 28 1 90 1 231 2 266 2 126v79l-1 9 1 1 1 16v31l-1 36-4 30-8 24-11 21-10 14-14 15-12 10-17 10-17 8-15 5-12 3-19 2-17 1h-766l-47-2-14-2-20-6-15-7-14-8-16-12-13-12-8-8-10-14-8-13-9-20-5-14-4-18-3-26-1-95-1-524-1-66-1-166-1-43v-61l3-24 5-24 4-12 7-16 14-22 7-8h2l2-4 8-7 15-11 21-12 16-7 20-6 26-4 22-2h12l3-1zm7 54-50 2-6 2v333l2 148 2 79 1 5-1 16v40l1 35 1 154 1 239 1 31 1 60 1 16 1 6 12 1h508l10-2 8-5 5-6 6-14 10-34 8-21 8-15 12-18 9-10 11-11 11-8 15-9 16-8 21-8 25-6 30-5 25-3 38-2 20-3 5-3 3-6 1-6 1-113v-152l-1-16-1-2v-8l2-14v-100l1-25v-21l-1-19-1-149-2-48v-40l-3-54-4-30-5-24-6-23-8-20-11-21-11-16-8-10-8-7-13-12-15-10-19-10-21-8-24-6-18-3-10-1-64-2zm-114 6-21 3-12 3-11 5-7 5v2l-4 2-7 6-3 10 2 7-5 3 2 5 5 9 8 11 4 9 1 5 1 28v106l-2 10-4 12h2l-1 14 4 2v20l-1 3 1 2 3 36 1 22 1 345v174l-1 13-2 5v7l-3 6 2 6 2 5v10l1 4 1 54v133l-3 16-2 15-5-1-1-3-5-1 1 4 4 6v5l6 5 12 6 22 6 8 1h13l4-1 1-2v-99l1-72-2-8 1-5v-31l1-19v-47l-1-66-1-108v-137l-2-268v-37l-1-22 1-2v-13l-2-49-1-128-1-32v-15zm830 1026-36 6-25 6-24 11-11 6-12 9-9 9-9 11-9 16-6 13-3 11-2 12v6l2 3 7-1 13-5 21-12 19-13 17-14 13-12 15-13 32-32 7-8 8-8v-1zm53 45-9 6-7 7-2 1v2l-4 2-8 7-7 9-14 12-10 8-13 10-30 20-7 3v2l8 1 27-1 18-4 14-7 13-11 11-11 7-11 4-8 4-10 5-12 3-10v-5zm-940 43v2h3v-2zm-7 1m6 2 1 2z" fill={color} />
    <Path transform="translate(615,502)" d="m0 0h9l9 2 5 4 13 28 8 16 15 27 10 14 9 12 11 12 16 15 8 7 14 11 17 12 4 5 1 2v9l-7 7-12 8-12 9-9 9-8 7-3 3h-2l-2 4-8 8-12 16-12 18-8 13-12 23-13 26-8 9-5 2-9 1-8-3-6-8-8-16-12-25-10-19-12-18-8-10-10-11-7-8-13-12-13-10-21-16-9-6-1-2v-7l4-9 9-9 14-11 10-8 11-9 7-7h2l2-4 9-10 9-13 15-23 8-13 8-16 14-30 5-5zm5 87-12 19-8 11-13 16-11 14-17 16-2 5 7 7 8 6 10 10h2v2h2l2 4 7 7 12 16 10 15 8 13 2 1 6-12 10-15 11-14 18-21 16-14 1-5-16-16-7-8-11-13-11-14-11-16-10-13z" fill={color} />
    <Path transform="translate(113,430)" d="m0 0 6 2 3 4 2 9 3 42 1 213v313l-2 11-3 1h-9l-6-2-3-3-1-4-1-308h-2v-81l2-67v-26l-1-23v-66l4-9 5-5z" fill={color} />
    <Path transform="translate(110,227)" d="m0 0 9 1 3 8 1 7 1 36v86l-1 13-4 6-2 1h-10l-3-4-3-12-1-12v-86l1-22 3-20z" fill={color} />
    <Path transform="translate(115,1061)" d="m0 0 7 3 4 9 1 5 1 15v162l-5 3-5 2h-6l-4-9-3-16-1-13v-154l5-5z" fill={color} />
  </Svg>
);

// Insights tab icon (designer asset)
const InsightsIcon = ({ color, size = 26 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="560 265 420 465">
    <Path transform="translate(755,456)" d="m0 0h24l17 2 18 4 18 6 20 9 17 8 10 6 16 8 15 7 24 9-2 2-4 1h-13l-21-4-35-11-29-11-7-2 5 8 4 11 1 6v10l-2 11-7 14-9 10-8 6-9 5 15-2 14-4 16-6 18-10 12-8 16-12v3l-7 8-2 3 14-9 16-9h3l-2 4-11 9-17 12-21 12-21 10-15 5-21 5-15 2-15 1h-13l-18-1-23-4-17-5-20-8-17-9-19-12-14-11-8-7-1-3 5 1 14 8 13 8-2-4-5-6v-2l4 2 10 8 17 12 16 8 16 6 17 4h5l-12-8-8-7-7-11-4-11-1-5v-17l2-9 6-12-36 15-18 6-19 5-12 2h-16l-5-1v-2l20-9 17-8 22-12 21-11 28-11 13-4 18-3zm3 7-19 2-21 5-21 8-20 9-20 11-10 5 3 1 35-15 19-7 19-6 20-4 7-1h32l21 3 21 5 20 7 18 7 3-1-19-10-24-10-21-6-14-2-26-1zm-20 21-10 5-8 8-5 10-2 8v11l4 15 7 11 9 8 16 8 8 2 14 1 16-3 16-8 10-10 5-8 3-9 1-5v-12l-3-10-6-10-9-7-6-3 2 9v9l-3 10-4 6-7 7-7 3-5 1h-11l-10-3-9-7-5-8-2-6v-13l2-10z" fill={color} />
    <Path transform="translate(724,352)" d="m0 0 1 3-6 9-11 13-12 13-14 14-4 5h-2l-2 4-102 102-1 3 4 2 32 32 8 7 15 15 8 7 9 9 8 7 8 8 8 7 16 15 8 7 10 9 8 7 16 15 13 12 22 22 4 5v2l3-1 7-8 14-15 12-12 8-7 7-7 8-7 15-14 12-11 8-7 8-8 8-7 12-11 15-14 17-16 12-12 8-7 24-24-2-4-6-7-2-1v-2l-4-2-16-16-7-8-87-87-7-8-12-13-9-12-2-6 4 1 14 12 125 125 4 5 6 5v2l3 1v2l4 2 9 9-3 5-55 55-8 7-19 19-8 7-9 9-8 7-12 11-10 9-8 7-14 13-8 7-20 18-18 18-10 13h-2l-6-8-9-10-19-19-8-7-12-11-2-1v-2l-4-2-10-9-8-7-12-11-10-9-8-8-8-7-7-7-8-7-13-13-8-7-59-59 2-4 87-87 5-6 8-7 9-10h2l2-4 3-1 2-4 20-20 8-7 9-9z" fill={color} />
    <Path transform="translate(767,304)" d="m0 0h3l9 21 6 9 12 9-4 4-8 6-7 9-6 15-3 7h-3l-7-18-6-10-9-8-5-3v-2l10-7 6-7 6-12 5-12zm1 19-6 11-9 9 1 3 7 6 6 12 2-1 6-11 7-7 2-1v-2l-7-5-6-9-2-5z" fill={color} />
    <Path transform="translate(915,623)" d="m0 0h2l4 14 5 5 12 4v2l-10 3-6 7-4 15-3 1-3-14-6-7-12-5v-2l13-4 5-6zm0 22-3 4 4 4 4-2v-4l-2-2z" fill={color} />
    <Path transform="translate(767,613)" d="m0 0h2l4 18 1 3 15 5-2 2-11 4-3 4-4 15h-2l-5-16-4-4-5-2-7-2 1-2 11-3 4-4 3-9z" fill={color} />
    <Path transform="translate(621,603)" d="m0 0h2l5 15 6 5 9 3-1 2-11 4-4 6-3 11-3 1-4-14-5-5-10-4 2-2 11-4 4-7zm1 21-3 2 1 3h2l1 2 4-4-3-3z" fill={color} />
    <Path transform="translate(872,327)" d="m0 0h2l3 13 4 3 8 3-2 2-8 3-3 5-2 12-2-1-4-13-4-4-9-3 2-2 9-3 4-6z" fill={color} />
    <Path transform="translate(655,342)" d="m0 0h2l4 15 7 3 5 2v1l-9 3-4 4-3 12h-2l-3-12-5-5-6-2v-2l10-4 3-9z" fill={color} />
  </Svg>
);

export const MainTabsNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, MIN_TAB_BAR_BOTTOM_INSET);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 8,
          paddingBottom: 8,
          height: 68,
          // Push the whole tab bar up so it sits just above the system nav bar (no double padding)
          marginBottom: bottomInset,
        },
        tabBarActiveTintColor: colors.tabIconActive,
        tabBarInactiveTintColor: colors.tabIconInactive,
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
          tabBarIcon: ({ color }) => <InsightsIcon color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

