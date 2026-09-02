import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabsParamList } from './types';
import WriteScreen from '../screens/WriteScreen';
import JournalScreen from '../screens/JournalScreen';
import InsightsScreen from '../screens/InsightsScreen';
import { colors, floatingTabBar, iconography, resolveFloatingTabBarBottom, typography } from '../theme';
import { IS_DESIGN_EXPORT_BACKGROUND_ONLY } from '../designExport';
import { InsightsTabIcon, JournalTabIcon, WriteTabIcon } from '../components/icons/NavigationIcons';

const Tab = createBottomTabNavigator<MainTabsParamList>();

const TabLabel = ({ focused, color, children }: { focused: boolean; color: string; children: string }) => (
  <Text
    testID={`tab-label-${children.toLowerCase()}`}
    style={[styles.tabLabel, { color }, focused && styles.tabLabelFocused]}
  >
    {children}
  </Text>
);

export interface MainTabsNavigatorProps {
  initialRouteName?: keyof MainTabsParamList;
}

export const MainTabsNavigator: React.FC<MainTabsNavigatorProps> = ({ initialRouteName }) => {
  const insets = useSafeAreaInsets();
  const bottomInset = resolveFloatingTabBarBottom(insets.bottom);

  return (
    <Tab.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          left: floatingTabBar.horizontalInset,
          right: floatingTabBar.horizontalInset,
          bottom: bottomInset,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: 7,
          height: floatingTabBar.height,
          borderRadius: floatingTabBar.borderRadius,
          elevation: 7,
          display: IS_DESIGN_EXPORT_BACKGROUND_ONLY ? 'none' : 'flex',
        },
        tabBarBackground: () => (
          <View style={styles.tabBackground} testID="tab-bar-paper-background" />
        ),
        tabBarItemStyle: {
          paddingVertical: 1,
          backgroundColor: 'transparent',
        },
        tabBarActiveTintColor: colors.tabIconActive,
        tabBarInactiveTintColor: colors.tabIconInactive,
        tabBarLabel: ({ focused, color, children }) => (
          <TabLabel focused={focused} color={color} children={String(children)} />
        ),
      }}
    >
      <Tab.Screen
        name="Write"
        component={WriteScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconFrame, focused && styles.iconFrameFocused]}>
              <WriteTabIcon
                focused={focused}
                testID={focused ? 'tab-icon-write-active' : 'tab-icon-write-inactive'}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconFrame, focused && styles.iconFrameFocused]}>
              <JournalTabIcon
                focused={focused}
                testID={focused ? 'tab-icon-journal-active' : 'tab-icon-journal-inactive'}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconFrame, focused && styles.iconFrameFocused]}>
              <InsightsTabIcon
                focused={focused}
                testID={focused ? 'tab-icon-insights-active' : 'tab-icon-insights-inactive'}
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBackground: {
    flex: 1,
    borderRadius: floatingTabBar.borderRadius,
    borderWidth: 1,
    borderColor: colors.navBorder,
    backgroundColor: colors.navSurface,
    shadowColor: colors.shadow,
    shadowOpacity: 0.075,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
  },
  iconFrame: {
    width: iconography.navigation.frameWidth,
    height: iconography.navigation.frameHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconFrameFocused: {
    transform: [{ translateY: -1 }],
  },
  tabLabel: {
    marginTop: 1,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.regular,
    fontFamily: typography.regular,
    backgroundColor: 'transparent',
  },
  tabLabelFocused: {
    fontWeight: typography.weights.medium,
    fontFamily: typography.medium,
  },
});
