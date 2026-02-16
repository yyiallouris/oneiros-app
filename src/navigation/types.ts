import { NavigatorScreenParams } from '@react-navigation/native';
import type { InsightsSectionId } from '../types/insights';

export type RootStackParamList = {
  Auth: undefined;
  LoginSupport: undefined;
  SetPassword: undefined;
  BiometricLock: undefined;
  MainTabs: NavigatorScreenParams<MainTabsParamList>;
  DreamEditor: { dreamId?: string; date?: string };
  InterpretationChat: { dreamId: string };
  DreamDetail: { dreamId: string };
  Account: undefined;
  Contact: undefined;
  Privacy: undefined;
  Calendar: { initialDate?: string } | undefined;
  InsightsSection: {
    sectionId: InsightsSectionId;
    periodStart?: string;
    periodEnd?: string;
    periodLabel?: string;
  };
  InsightsJourney: {
    initialSectionId?: InsightsSectionId;
    periodStart?: string;
    periodEnd?: string;
    periodLabel?: string;
  };
  JournalFilter: { filterSymbol?: string; filterLandscape?: string };
};

export type MainTabsParamList = {
  Write: undefined;
  Journal: { filterSymbol?: string; filterLandscape?: string } | undefined;
  Insights: undefined;
};

