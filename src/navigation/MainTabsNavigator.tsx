import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabsParamList } from './types';
import WriteScreen from '../screens/WriteScreen';
import JournalScreen from '../screens/JournalScreen';
import InsightsScreen from '../screens/InsightsScreen';
import { colors, typography } from '../theme';
import { IS_DESIGN_EXPORT_BACKGROUND_ONLY } from '../designExport';

const Tab = createBottomTabNavigator<MainTabsParamList>();
const TAB_ICON_SIZE = 33;
const WRITE_TAB_ICON_SIZE = 40;

const TAB_ICONS = {
  Write: {
    active: require('../assets/tab-icons/write_active.png'),
    inactive: require('../assets/tab-icons/write_inactive.png'),
  },
  Journal: {
    active: require('../assets/tab-icons/journal_active.png'),
    inactive: require('../assets/tab-icons/journal_inactive.png'),
  },
  Insights: {
    active: require('../assets/tab-icons/inighsts_active.png'),
    inactive: require('../assets/tab-icons/inisghts_inactive.png'),
  },
} satisfies Record<keyof MainTabsParamList, { active: ImageSourcePropType; inactive: ImageSourcePropType }>;

const TabPngIcon = ({
  focused,
  source,
  testID,
  size = TAB_ICON_SIZE,
}: {
  focused: boolean;
  source: ImageSourcePropType;
  testID: string;
  size?: number;
}) => (
  <View style={styles.iconFrame}>
    <Image
      source={source}
      style={[
        { width: size, height: size },
        focused && styles.iconImageFocused,
      ]}
      resizeMode="contain"
      testID={testID}
    />
  </View>
);

export interface MainTabsNavigatorProps {
  initialRouteName?: keyof MainTabsParamList;
}

export const MainTabsNavigator: React.FC<MainTabsNavigatorProps> = ({ initialRouteName }) => {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom + 14;

  return (
    <Tab.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: 24,
          right: 24,
          bottom: bottomInset,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: 10,
          height: 82,
          borderRadius: 35,
          elevation: 10,
          display: IS_DESIGN_EXPORT_BACKGROUND_ONLY ? 'none' : 'flex',
        },
        tabBarBackground: () => (
          <View style={styles.tabBackground} testID="tab-bar-paper-background" />
        ),
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarActiveTintColor: colors.tabIconActive,
        tabBarInactiveTintColor: colors.tabIconInactive,
        tabBarLabelStyle: {
          fontSize: typography.sizes.xs,
          fontWeight: typography.weights.medium,
          fontFamily: typography.regular,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Write"
        component={WriteScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabPngIcon
              focused={focused}
              size={WRITE_TAB_ICON_SIZE}
              source={focused ? TAB_ICONS.Write.active : TAB_ICONS.Write.inactive}
              testID={focused ? 'tab-icon-write-active' : 'tab-icon-write-inactive'}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabPngIcon
              focused={focused}
              source={focused ? TAB_ICONS.Journal.active : TAB_ICONS.Journal.inactive}
              testID={focused ? 'tab-icon-journal-active' : 'tab-icon-journal-inactive'}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabPngIcon
              focused={focused}
              source={focused ? TAB_ICONS.Insights.active : TAB_ICONS.Insights.inactive}
              testID={focused ? 'tab-icon-insights-active' : 'tab-icon-insights-inactive'}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBackground: {
    flex: 1,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: 'rgba(222, 211, 223, 0.35)',
    backgroundColor: 'rgba(255, 253, 249, 0.86)',
    shadowColor: '#2D2430',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  iconFrame: {
    width: 60,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImageFocused: {
    transform: [{ translateY: -1 }],
  },
});
