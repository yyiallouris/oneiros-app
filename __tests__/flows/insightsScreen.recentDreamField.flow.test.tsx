/**
 * Flow coverage: documentation/flows-07-insights-reports.md (Recent Dream Field ad-hoc reflections).
 */
import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

const mockNavigate = jest.fn();
const mockIsOnline = jest.fn();
const mockGetInsightsOverview = jest.fn();
const mockGetRecentPatternInsightEntries = jest.fn();
const mockGetCachedRecentDreamFieldReflection = jest.fn();
const mockGenerateRecentDreamFieldReflection = jest.fn();

jest.mock('@react-navigation/native', () => ({
  __esModule: true,
  useNavigation: () => ({ navigate: mockNavigate }),
  useFocusEffect: (callback: () => void) => {
    const React = require('react');
    React.useEffect(() => callback(), [callback]);
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/components/ui', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    PsycheScreenBackground: ({ children }: any) => <View>{children}</View>,
    MysticHeader: ({ title, subtitle }: any) => (
      <View>
        <Text>{title}</Text>
        <Text>{subtitle}</Text>
      </View>
    ),
    BreathingLine: () => null,
    Card: ({ children }: any) => <View>{children}</View>,
    DesignExportForeground: ({ children }: any) => <View>{children}</View>,
  };
});

jest.mock('../../src/components/icons/InsightsIcons', () => ({
  ArchetypesIcon: () => null,
  DreamsLoggedIcon: () => null,
  MotifsIcon: () => null,
  PatternRecognitionIcon: () => null,
  PlacesIcon: () => null,
  SymbolsIcon: () => null,
}));

jest.mock('../../src/services/insightsService', () => ({
  getInsightsOverview: (...args: unknown[]) => mockGetInsightsOverview(...args),
  getPeriodThisMonth: jest.fn(() => ({ startDate: '2026-05-01', endDate: '2026-05-31' })),
  getPeriodLastMonth: jest.fn(() => ({ startDate: '2026-04-01', endDate: '2026-04-30' })),
  getPeriodLastNMonths: jest.fn(() => ({ startDate: '2026-03-01', endDate: '2026-05-31' })),
  getPeriodAllTime: jest.fn().mockResolvedValue({ startDate: '2026-01-01', endDate: '2026-05-31' }),
  getPeriodLabel: jest.fn(() => 'This month'),
}));

jest.mock('../../src/services/patternInsightsService', () => ({
  canGeneratePatternReflection: jest.fn((count: number) => count >= 2),
  generateRecentDreamFieldReflection: (...args: unknown[]) => mockGenerateRecentDreamFieldReflection(...args),
  getCachedRecentDreamFieldReflection: (...args: unknown[]) => mockGetCachedRecentDreamFieldReflection(...args),
  getRecentPatternInsightEntries: (...args: unknown[]) => mockGetRecentPatternInsightEntries(...args),
}));

jest.mock('../../src/utils/network', () => ({
  isOnline: (...args: unknown[]) => mockIsOnline(...args),
}));

import InsightsScreen from '../../src/screens/InsightsScreen';

const overview = {
  dreamsLoggedCount: 3,
  interpretedDreamsCount: 3,
  topImages: [],
  topMotifs: [],
  topThresholds: [],
  topTensions: [],
  topPlaces: [],
  topArchetypalEchoes: [],
  topAffects: [],
  strongestPatterns: [],
  fieldSummary: 'The field gathers lightly.',
};

describe('InsightsScreen Recent Dream Field flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    mockGetInsightsOverview.mockResolvedValue(overview);
    mockGetRecentPatternInsightEntries.mockResolvedValue([
      { dreamId: 'd1', date: '2026-05-01', extracted: {}, interpretation: 'one' },
      { dreamId: 'd2', date: '2026-05-02', extracted: {}, interpretation: 'two' },
      { dreamId: 'd3', date: '2026-05-03', extracted: {}, interpretation: 'three' },
    ]);
    mockGetCachedRecentDreamFieldReflection.mockResolvedValue(null);
    mockGenerateRecentDreamFieldReflection.mockResolvedValue(
      '## Recent Dream Field\nFresh body.\n\n## Reflective Questions\nWhat returns?'
    );
    mockIsOnline.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows Recent Dream Field with Last 3 as the default scope', async () => {
    const screen = render(<InsightsScreen />);

    await waitFor(() => expect(screen.getByText('Recent Dream Field')).toBeTruthy());
    expect(screen.getByText('Latest 3 reflected dreams')).toBeTruthy();
    expect(screen.getByText('Reflect on recent dreams')).toBeTruthy();
  });

  it('switches recent scope between Last 2 and Last 5', async () => {
    const screen = render(<InsightsScreen />);

    await waitFor(() => expect(screen.getByText('Latest 3 reflected dreams')).toBeTruthy());
    fireEvent.press(screen.getByText('Last 2'));
    expect(screen.getByText('Latest 2 reflected dreams')).toBeTruthy();
    fireEvent.press(screen.getByText('Last 5'));
    expect(screen.getByText('Latest 5 reflected dreams')).toBeTruthy();
  });

  it('alerts when recent reflection generation is attempted while offline', async () => {
    mockIsOnline.mockResolvedValue(false);
    const screen = render(<InsightsScreen />);

    await waitFor(() => expect(screen.getByText('Reflect on recent dreams')).toBeTruthy());
    fireEvent.press(screen.getByText('Reflect on recent dreams'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "You're Offline",
        'Generating reflection requires an internet connection. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    });
  });

  it('renders generated recent reflection inline without a report archive row', async () => {
    const screen = render(<InsightsScreen />);

    await waitFor(() => expect(screen.getByText('Reflect on recent dreams')).toBeTruthy());
    fireEvent.press(screen.getByText('Reflect on recent dreams'));

    await waitFor(() => expect(screen.getByText('Fresh body.')).toBeTruthy());
    expect(mockGenerateRecentDreamFieldReflection).toHaveBeenCalledWith(3, 'en', { force: false });
    expect(screen.queryByText('Past reflections')).toBeNull();
  });
});
