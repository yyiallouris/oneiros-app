import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { OnboardingStackParamList } from './types';
import OnboardingNameScreen from '../screens/onboarding/OnboardingNameScreen';
import OnboardingDepthScreen from '../screens/onboarding/OnboardingDepthScreen';
import OnboardingSecureScreen from '../screens/onboarding/OnboardingSecureScreen';
import { colors } from '../theme';

const Stack = createStackNavigator<OnboardingStackParamList>();

export interface OnboardingNavigatorProps {
  onComplete: () => void;
}

export const OnboardingCompleteContext = React.createContext<(() => void) | null>(null);

const OnboardingNavigator: React.FC<OnboardingNavigatorProps> = ({ onComplete }) => {
  return (
    <OnboardingCompleteContext.Provider value={onComplete}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: colors.background },
          presentation: 'card',
        }}
      >
        <Stack.Screen name="OnboardingName" component={OnboardingNameScreen} />
        <Stack.Screen name="OnboardingDepth" component={OnboardingDepthScreen} />
        <Stack.Screen name="OnboardingSecure" component={OnboardingSecureScreen} />
      </Stack.Navigator>
    </OnboardingCompleteContext.Provider>
  );
};

export default OnboardingNavigator;
