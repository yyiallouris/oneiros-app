import React from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import JournalScreen from './JournalScreen';

type Route = RouteProp<RootStackParamList, 'JournalFilter'>;

/**
 * Stack screen: filtered journal opened from Insights (symbol or landscape).
 * Back returns to the insights section list instead of switching tabs.
 */
const JournalFilterScreen: React.FC = () => {
  const route = useRoute<Route>();
  const { filterSymbol, filterLandscape } = route.params ?? {};
  return (
    <JournalScreen
      overrideParams={{
        filterSymbol: filterSymbol ?? undefined,
        filterLandscape: filterLandscape ?? undefined,
      }}
    />
  );
};

export default JournalFilterScreen;
