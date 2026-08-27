/**
 * Flow coverage: documentation/flows-05-sync-offline.md (offline guard for pattern reflection generation).
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, InteractionManager } from 'react-native';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

const mockNavigate = jest.fn();
const mockSetParams = jest.fn();
const mockGetCurrentUserId = jest.fn();
const mockGetPatternReports = jest.fn();
const mockGetInterpretationDepth = jest.fn();
const mockIsOnline = jest.fn();
const mockGetRecurringSymbols = jest.fn();
const mockGenerateEntitledPeriodReflection = jest.fn();
const mockPurchasePlan = jest.fn();
let mockRouteParams: Record<string, unknown> = { sectionId: 'pattern-recognition' };
let mockHasPaidAccess = true;

jest.mock('@react-navigation/native', () => ({
  __esModule: true,
  useNavigation: () => ({
    navigate: mockNavigate,
    setParams: mockSetParams,
    setOptions: jest.fn(),
  }),
  useRoute: () => ({
    params: mockRouteParams,
  }),
  useFocusEffect: (callback: () => void) => {
    const React = require('react');
    React.useEffect(() => callback(), [callback]);
  },
}));

jest.mock('../../src/components/ui', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    PaperBackground: ({ children }: any) => <View>{children}</View>,
    LegacyMountainWaveBackground: ({ children }: any) => <View>{children}</View>,
    BreathingLine: () => null,
    Card: ({ children }: any) => <View>{children}</View>,
    Button: ({ title, onPress, disabled }: any) => (
      <TouchableOpacity onPress={onPress} disabled={disabled}>
        <Text>{title}</Text>
      </TouchableOpacity>
    ),
    LoadingState: () => <Text>Loading</Text>,
    ContentSkeleton: () => <Text>Skeleton</Text>,
    SectionTitleWithInfo: ({ title }: any) => <Text>{title}</Text>,
    SymbolInfoModal: () => null,
    DesignExportForeground: ({ children }: any) => <View>{children}</View>,
  };
});

jest.mock('../../src/components/icons/InsightsIcons', () => {
  const React = require('react');
  return {
    ArchetypalEnergiesIcon: () => null,
    DreamPlacesIcon: () => null,
    InnerTensionsIcon: () => null,
    RepeatingPatternsIcon: () => null,
    ReturningImagesIcon: () => null,
    ThresholdsIcon: () => null,
  };
});

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
  getRecurringSymbols: (...args: unknown[]) => mockGetRecurringSymbols(...args),
  getRecurringArchetypes: jest.fn().mockResolvedValue([]),
  getRecurringLandscapes: jest.fn().mockResolvedValue([]),
  getRecurringMotifs: jest.fn().mockResolvedValue([]),
  getRecurringThresholds: jest.fn().mockResolvedValue([]),
  getRecurringCentralConflicts: jest.fn().mockResolvedValue([]),
  getCollectiveInsights: jest.fn().mockResolvedValue({
    topSymbolsThisMonth: [],
    archetypeTrends: [],
  }),
  getSymbolClusters: jest.fn().mockReturnValue([]),
  symbolHasAssociations: jest.fn().mockReturnValue(false),
  getAssociationsForSymbol: jest.fn().mockReturnValue([]),
  getPeriodThisMonth: jest.fn().mockReturnValue({ startDate: '2026-07-01', endDate: '2026-07-31' }),
  getPeriodLastMonth: jest.fn().mockReturnValue({ startDate: '2026-06-01', endDate: '2026-06-30' }),
  getPeriodLastNMonths: jest.fn((count: number) => {
    if (count === 3) return { startDate: '2026-05-01', endDate: '2026-07-31' };
    if (count === 6) return { startDate: '2026-02-01', endDate: '2026-07-31' };
    return { startDate: '2026-07-01', endDate: '2026-07-31' };
  }),
  getPeriodAllTime: jest.fn().mockResolvedValue({ startDate: '2026-01-01', endDate: '2026-07-31' }),
  getPeriodLabel: jest.fn((period: { startDate: string; endDate: string }) => {
    if (period.startDate === '2026-07-01' && period.endDate === '2026-07-31') return 'This month';
    if (period.startDate === '2026-06-01' && period.endDate === '2026-06-30') return 'Last month';
    if (period.startDate === '2026-05-01' && period.endDate === '2026-07-31') return 'Last 3 months';
    if (period.startDate === '2026-02-01' && period.endDate === '2026-07-31') return 'Last 6 months';
    return 'Custom period';
  }),
}));

jest.mock('../../src/services/patternInsightsService', () => ({
  generateMonthlyInsights: jest.fn(),
  getPatternInsightEntries: jest.fn().mockResolvedValue([]),
  getMonthPeriod: jest.fn((monthKey: string) => ({ startDate: `${monthKey}-01`, endDate: `${monthKey}-28` })),
  getLast12MonthKeys: jest.fn().mockReturnValue(['2025-04']),
  formatMonthKeyLabel: jest.fn().mockReturnValue('April 2025'),
  formatReportKeyLabel: jest.fn().mockReturnValue('April 2025'),
  formatReportKeyLabelForEssay: jest.fn().mockReturnValue('April 2025'),
  getReportKeyForGeneration: jest.fn((monthKey: string) => monthKey),
  getCurrentMonthKey: jest.fn().mockReturnValue('2025-04'),
  canGeneratePatternReflection: jest.fn((count: number) => count >= 2),
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
  generateEntitledPeriodReflection: (...args: unknown[]) => mockGenerateEntitledPeriodReflection(...args),
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
    mockHasPaidAccess = true;
    mockRouteParams = { sectionId: 'pattern-recognition' };
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
    mockGetRecurringSymbols.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('alerts when reflection generation is attempted while offline', async () => {
    const screen = render(<InsightsSectionScreen />);

    await waitFor(() => expect(screen.getByText('Generate reflection')).toBeTruthy());
    expect(screen.queryByText('English')).toBeNull();

    fireEvent.press(screen.getByText('Generate reflection'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "You're Offline",
        'Generating reflection requires an internet connection. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    });
  });

  it('opens the premium paywall when a free user taps a locked pattern reflection', async () => {
    mockHasPaidAccess = false;
    const screen = render(<InsightsSectionScreen />);

    await waitFor(() => expect(screen.getByText('Unlock Premium')).toBeTruthy());
    fireEvent.press(screen.getByText('Unlock Premium'));

    expect(screen.getByText('Paywall:period_reflection:premium_only')).toBeTruthy();
  });

  it('lets forming pattern sections own the period picker and reloads when the period changes', async () => {
    mockRouteParams = {
      sectionId: 'recurring-symbols',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      periodLabel: 'This month',
    };

    const screen = render(<InsightsSectionScreen />);

    await waitFor(() => expect(screen.getByText('Viewing period')).toBeTruthy());
    expect(screen.getByText('This month')).toBeTruthy();

    fireEvent.press(screen.getByText('This month'));
    fireEvent.press(screen.getByText('Last month'));

    await waitFor(() => {
      expect(mockSetParams).toHaveBeenCalledWith({
        sectionId: 'recurring-symbols',
        periodStart: '2026-06-01',
        periodEnd: '2026-06-30',
        periodLabel: 'Last month',
      });
    });

    expect(mockGetRecurringSymbols).toHaveBeenCalledWith({
      startDate: '2026-06-01',
      endDate: '2026-06-30',
    });
  });
});
