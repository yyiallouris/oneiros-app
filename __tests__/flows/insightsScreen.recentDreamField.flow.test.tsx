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
const mockGenerateEntitledRecentDreamField = jest.fn();
const mockPurchasePlan = jest.fn();
let mockHasPaidAccess = true;

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
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    PaperBackground: ({ children }: any) => <View>{children}</View>,
    LegacyMountainWaveBackground: ({ children }: any) => <View>{children}</View>,
    MysticHeader: ({ title, subtitle }: any) => (
      <View>
        <Text>{title}</Text>
        <Text>{subtitle}</Text>
      </View>
    ),
    BreathingLine: () => null,
    Card: ({ children }: any) => <View>{children}</View>,
    Button: ({ title, onPress, disabled }: any) => (
      <TouchableOpacity onPress={onPress} disabled={disabled}>
        <Text>{title}</Text>
      </TouchableOpacity>
    ),
    DesignExportForeground: ({ children }: any) => <View>{children}</View>,
    LoadingState: () => <Text>Loading</Text>,
  };
});

jest.mock('../../src/components/icons/InsightsIcons', () => ({
  ArchetypalEnergiesIcon: () => null,
  DreamPlacesIcon: () => null,
  EmotionalWeatherIcon: () => null,
  InnerTensionsIcon: () => null,
  PatternRecognitionIcon: () => null,
  RepeatingPatternsIcon: () => null,
  ReturningImagesIcon: () => null,
  ThresholdsIcon: () => null,
}));

jest.mock('../../src/components/subscription/PremiumUpsellModal', () => ({
  PremiumUpsellModal: ({
    visible,
    source,
    displayMode,
  }: {
    visible: boolean;
    source: string;
    displayMode?: string;
  }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return visible ? <Text>{`Paywall:${source}:${displayMode ?? 'compare'}`}</Text> : null;
  },
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

jest.mock('../../src/providers/SubscriptionProvider', () => ({
  useSubscription: () => ({
    status: { hasPaidAccess: mockHasPaidAccess },
    products: [],
    purchasePlan: (...args: unknown[]) => mockPurchasePlan(...args),
  }),
}));

jest.mock('../../src/services/entitledAiService', () => ({
  EntitlementError: class EntitlementError extends Error {
    premiumRequired = true;
  },
  generateEntitledRecentDreamField: (...args: unknown[]) => mockGenerateEntitledRecentDreamField(...args),
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
    mockHasPaidAccess = true;
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
    mockGenerateEntitledRecentDreamField.mockResolvedValue(
      '## Recent Dream Field\nFresh body.\n\n## Reflective Questions\nWhat returns?'
    );
    mockIsOnline.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows Recent Dream Field with Last 3 as the default scope for paid users', async () => {
    const screen = render(<InsightsScreen />);

    await waitFor(() => expect(screen.getByText('Reflect on recent dreams')).toBeTruthy());
    expect(screen.getByText('Recent Dream Field')).toBeTruthy();
    expect(screen.queryByText('Dream Field Overview')).toBeNull();
    expect(screen.queryByText('This month in your dreams')).toBeNull();
    expect(screen.getByText('Returning Images')).toBeTruthy();
    expect(screen.queryByText('Images that keep returning')).toBeNull();
    expect(screen.queryByText('English')).toBeNull();
    expect(screen.getByText('Latest 3 reflected dreams')).toBeTruthy();
    expect(screen.queryByText('A recent field is forming')).toBeNull();
  });

  it('keeps recent scope chips unselected for free users', async () => {
    mockHasPaidAccess = false;
    const screen = render(<InsightsScreen />);

    await waitFor(() => expect(screen.getAllByText('Unlock Premium').length).toBeGreaterThan(0));
    expect(screen.getByText('Latest 3 reflected dreams')).toBeTruthy();
    expect(screen.queryByText('Premium')).toBeNull();

    fireEvent.press(screen.getByText('Last 5'));

    expect(screen.getByText('Paywall:insights:premium_only')).toBeTruthy();
    expect(screen.queryByText('Latest 5 reflected dreams')).toBeNull();
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
    expect(mockGenerateEntitledRecentDreamField).toHaveBeenCalledWith(3, 'en');
    expect(screen.queryByText('Past reflections')).toBeNull();
  });

  it('opens the premium paywall when a free user taps the locked recent field action', async () => {
    mockHasPaidAccess = false;
    const screen = render(<InsightsScreen />);

    await waitFor(() => expect(screen.getAllByText('Unlock Premium').length).toBeGreaterThan(0));
    fireEvent.press(screen.getAllByText('Unlock Premium')[0]);

    expect(screen.getByText('Paywall:insights:premium_only')).toBeTruthy();
  });

  it('keeps Forming Patterns visible after the first load instead of remounting a full loading screen', async () => {
    const screen = render(<InsightsScreen />);

    await waitFor(() => expect(screen.getByText('Forming Patterns')).toBeTruthy());
    expect(screen.queryByText('Loading')).toBeNull();
    expect(screen.getByText('Thresholds')).toBeTruthy();
    expect(screen.getByText('Emotional Weather')).toBeTruthy();
  });
});
