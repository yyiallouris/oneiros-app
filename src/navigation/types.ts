import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: NavigatorScreenParams<MainTabsParamList>;
  DreamEditor: { dreamId?: string; date?: string };
  InterpretationChat: { dreamId: string };
  DreamDetail: { dreamId: string };
  Account: undefined;
  Contact: undefined;
};

export type MainTabsParamList = {
  Write: undefined;
  Journal: undefined;
  Calendar: undefined;
};

