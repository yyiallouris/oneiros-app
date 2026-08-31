import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabsParamList } from './types';
import WriteScreen from '../screens/WriteScreen';
import JournalScreen from '../screens/JournalScreen';
import InsightsScreen from '../screens/InsightsScreen';
import { colors, floatingTabBar, iconography, resolveFloatingTabBarBottom, typography } from '../theme';
import { IS_DESIGN_EXPORT_BACKGROUND_ONLY } from '../designExport';
import { JournalTabIcon } from '../components/icons/NavigationIcons';

const Tab = createBottomTabNavigator<MainTabsParamList>();
const TAB_ICONS = {
  Write: {
    active: require('../assets/icons/tab-icons/write_active.png'),
    inactive: require('../assets/icons/tab-icons/write_inactive.png'),
  },
  Insights: {
    active: require('../assets/icons/tab-icons/inighsts_active.png'),
    inactive: require('../assets/icons/tab-icons/inisghts_inactive.png'),
  },
} satisfies Record<'Write' | 'Insights', { active: ImageSourcePropType; inactive: ImageSourcePropType }>;

const TabPngIcon = ({
  focused,
  source,
  testID,
  size = iconography.navigation.insightsSize,
  frameStyle,
  imageStyle,
}: {
  focused: boolean;
  source: ImageSourcePropType;
  testID: string;
  size?: number;
  frameStyle?: object;
  imageStyle?: object;
}) => (
  <View style={[styles.iconFrame, focused && styles.iconFrameFocused, frameStyle]}>
    <Image
      source={source}
      style={[
        { width: size, height: size },
        imageStyle,
        focused ? styles.iconImageActive : styles.iconImageInactive,
      ]}
      resizeMode="contain"
      testID={testID}
    />
  </View>
);

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
            <TabPngIcon
              focused={focused}
              size={iconography.navigation.writeSize}
              source={focused ? TAB_ICONS.Write.active : TAB_ICONS.Write.inactive}
              testID={focused ? 'tab-icon-write-active' : 'tab-icon-write-inactive'}
              frameStyle={styles.writeIconFrame}
              imageStyle={styles.writeIconImage}
            />
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
            <TabPngIcon
              focused={focused}
              size={iconography.navigation.insightsSize}
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
  writeIconFrame: {
    marginBottom: 3,
  },
  writeIconImage: {
    transform: [{ translateX: 2 }],
  },
  iconImageActive: {
    opacity: iconography.navigation.activeOpacity,
    tintColor: iconography.ink.primary,
  },
  iconImageInactive: {
    opacity: iconography.navigation.inactiveOpacity,
    tintColor: iconography.ink.inactive,
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
