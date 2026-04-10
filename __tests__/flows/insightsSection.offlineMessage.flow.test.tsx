/**
 * Flow coverage: documentation/flows-05-sync-offline.md (offline guard for pattern reflection generation).
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, InteractionManager } from 'react-native';

const mockNavigate = jest.fn();
const mockGetCurrentUserId = jest.fn();
const mockGetPatternReports = jest.fn();
const mockGetInterpretationDepth = jest.fn();
const mockIsOnline = jest.fn();

jest.mock('@react-navigation/native', () => ({
  __esModule: true,
  useNavigation: () => ({
    navigate: mockNavigate,
    setOptions: jest.fn(),
  }),
  useRoute: () => ({
    params: { sectionId: 'pattern-recognition' },
  }),
  useFocusEffect: (callback: () => void) => {
    const React = require('react');
    React.useEffect(() => callback(), [callback]);
  },
}));

jest.mock('../../src/components/ui', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    MountainWaveBackground: ({ children }: any) => <View>{children}</View>,
    BreathingLine: () => null,
    Card: ({ children }: any) => <View>{children}</View>,
    SectionTitleWithInfo: ({ title }: any) => <Text>{title}</Text>,
    SymbolInfoModal: () => null,
  };
});

jest.mock('../../src/components/icons/InsightsIcons', () => {
  const React = require('react');
  return {
    SymbolsIcon: () => null,
    MotifsIcon: () => null,
    ArchetypesIcon: () => null,
    PlacesIcon: () => null,
  };
});

jest.mock('../../src/services/insightsService', () => ({
  getRecurringSymbols: jest.fn().mockResolvedValue([]),
  getRecurringArchetypes: jest.fn().mockResolvedValue([]),
  getRecurringLandscapes: jest.fn().mockResolvedValue([]),
  getRecurringMotifs: jest.fn().mockResolvedValue([]),
  getCollectiveInsights: jest.fn().mockResolvedValue({
    topSymbolsThisMonth: [],
    archetypeTrends: [],
  }),
  getSymbolClusters: jest.fn().mockReturnValue([]),
  symbolHasAssociations: jest.fn().mockReturnValue(false),
  getAssociationsForSymbol: jest.fn().mockReturnValue([]),
}));

jest.mock('../../src/services/patternInsightsService', () => ({
  generateMonthlyInsights: jest.fn(),
  getPatternInsightEntries: jest.fn().mockResolvedValue([]),
  getMonthPeriod: jest.fn((monthKey: string) => ({ startDate: `${monthKey}-01`, endDate: `${monthKey}-28` })),
  getWeekPeriod: jest.fn(),
  getLast12MonthKeys: jest.fn().mockReturnValue(['2025-04']),
  formatMonthKeyLabel: jest.fn().mockReturnValue('April 2025'),
  formatReportKeyLabel: jest.fn().mockReturnValue('April 2025'),
  formatReportKeyLabelForEssay: jest.fn().mockReturnValue('April 2025'),
  getReportKeyForGeneration: jest.fn((monthKey: string) => monthKey),
  getCurrentMonthKey: jest.fn().mockReturnValue('2025-04'),
  isFirstWeekOfMonthFinished: jest.fn().mockReturnValue(true),
  getWeekNumOfMonth: jest.fn().mockReturnValue(2),
}));

jest.mock('../../src/services/localStorage', () => ({
  LocalStorage: {
    getPatternReports: (...args: unknown[]) => mockGetPatternReports(...args),
    savePatternReport: jest.fn(),
  },
}));

jest.mock('../../src/services/remoteStorage', () => ({
  remoteGetPatternReports: jest.fn().mockResolvedValue(null),
  remoteSavePatternReport: jest.fn(),
}));

jest.mock('../../src/services/userService', () => ({
  UserService: {
    getCurrentUserId: (...args: unknown[]) => mockGetCurrentUserId(...args),
  },
}));

jest.mock('../../src/services/userSettingsService', () => ({
  getInterpretationDepth: (...args: unknown[]) => mockGetInterpretationDepth(...args),
}));

jest.mock('../../src/utils/network', () => ({
  isOnline: (...args: unknown[]) => mockIsOnline(...args),
}));

jest.mock('../../src/constants/safeLabels', () => ({
  toSafeSymbolLabel: (value: string) => value,
}));

jest.mock('../../src/constants/symbolArchetypeInfo', () => ({
  ARCHETYPE_SECTION_TITLES: {
    core: 'Inner structures',
    dynamic: 'Archetypal energies',
  },
  ARCHETYPE_SECTION_NOTES: {
    core: 'Inner structures note',
    dynamic: 'Archetypal energies note',
  },
  DREAM_LAYER_OVERVIEW: [
    'Dreams speak through three interwoven layers:',
    'Symbols — the vivid images and scenes that stand out.',
    'Inner structures — deeper psychic functions.',
    'Archetypal energies — wider patterns that move through you temporarily.',
  ],
  getArchetypeInfoKey: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import InsightsSectionScreen from '../../src/screens/InsightsSectionScreen';

describe('InsightsSection offline message flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(InteractionManager, 'runAfterInteractions')
      .mockImplementation((callback: any) => {
        callback();
        return { cancel: jest.fn() } as any;
      });
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    mockGetCurrentUserId.mockResolvedValue(null);
    mockGetPatternReports.mockResolvedValue({});
    mockGetInterpretationDepth.mockResolvedValue('standard');
    mockIsOnline.mockResolvedValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('alerts when reflection generation is attempted while offline', async () => {
    const screen = render(<InsightsSectionScreen />);

    await waitFor(() => expect(screen.getByText('Generate reflection')).toBeTruthy());

    fireEvent.press(screen.getByText('Generate reflection'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "You're Offline",
        'Generating reflection requires an internet connection. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    });
  });
});
