import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabsParamList } from './types';
import WriteScreen from '../screens/WriteScreen';
import JournalScreen from '../screens/JournalScreen';
import InsightsScreen from '../screens/InsightsScreen';
import { colors, typography } from '../theme';
import WriteTabIcon from '../assets/tab-icons/write_tab.svg';
import JournalTabIcon from '../assets/tab-icons/journal_tab.svg';
import InsightsTabIcon from '../assets/tab-icons/insights_tab.svg';

const Tab = createBottomTabNavigator<MainTabsParamList>();

// Minimum bottom inset so tab bar stays above Android navigation bar when
// system insets are 0 or small (edge-to-edge). Android nav bar is typically 48dp.
const MIN_TAB_BAR_BOTTOM_INSET = Platform.OS === 'android' ? 48 : 8;

const TabIconFrame = ({
  focused,
  children,
}: {
  focused: boolean;
  children: React.ReactNode;
}) => (
  <View style={[styles.iconFrame, focused && styles.iconFrameActive]}>
    {focused ? (
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.68)', 'rgba(200, 140, 200, 0.12)']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    ) : null}
    {children}
  </View>
);

const TabSvgIcon = ({
  focused,
  Icon,
  width = 30,
  height = 30,
  scale = 1,
}: {
  focused: boolean;
  Icon: React.ComponentType<any>;
  width?: number;
  height?: number;
  scale?: number;
}) => (
  <View
    style={{
      alignItems: 'center',
      justifyContent: 'center',
      transform: [{ scale }],
    }}
  >
    <Icon
      width={width}
      height={height}
      style={{ opacity: focused ? 1 : 0.72 }}
    />
  </View>
);

export const MainTabsNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, MIN_TAB_BAR_BOTTOM_INSET);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: bottomInset,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          paddingTop: 6,
          paddingBottom: 8,
          height: 86,
          borderRadius: 24,
          elevation: 0,
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={[colors.backgroundTertiary, colors.navSurface]}
            start={{ x: 0.18, y: 0 }}
            end={{ x: 0.82, y: 1 }}
            style={styles.tabBackground}
          />
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
            <TabIconFrame focused={focused}>
              <TabSvgIcon
                focused={focused}
                Icon={WriteTabIcon}
                width={28}
                height={34}
                scale={1}
              />
            </TabIconFrame>
          ),
        }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIconFrame focused={focused}>
              <TabSvgIcon
                focused={focused}
                Icon={JournalTabIcon}
                width={28}
                height={34}
                scale={1.4}
              />
            </TabIconFrame>
          ),
        }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIconFrame focused={focused}>
              <TabSvgIcon
                focused={focused}
                Icon={InsightsTabIcon}
                width={28}
                height={34}
                scale={1.4}
              />
            </TabIconFrame>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBackground: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.navBorder,
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  iconFrame: {
    width: 72,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    overflow: 'hidden',
  },
  iconFrameActive: {
    borderWidth: 1,
    borderColor: colors.border,
  },
});

