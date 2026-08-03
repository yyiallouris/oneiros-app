/**
 * Flow coverage: documentation/flows-03-onboarding-account-security.md and documentation/flows-10-subscriptions-billing.md
 * (dedicated subscription destination, premium-first comparison, and compact Account entry).
 */
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockNavigate = jest.fn();
const mockGetDisplayName = jest.fn();
const mockGetInterpretationDepth = jest.fn();
const mockGetPatternInsightLanguage = jest.fn();
const mockGetBiometricStatus = jest.fn();
const mockIsBiometricEnabled = jest.fn();
const mockPurchasePlan = jest.fn();
const mockRestorePurchases = jest.fn();
const mockOpenManageSubscriptions = jest.fn();
let mockHasPaidAccess = false;
let mockEntitlementState: 'active' | 'inactive' | 'grace_period' = 'inactive';
let mockIapRuntimeAvailable = true;
let mockIapUnavailableReason: 'expo_go' | 'web' | 'missing_native_module' | 'unknown' | null = null;

jest.mock('@react-navigation/native', () => ({
  __esModule: true,
  useNavigation: () => ({
    navigate: mockNavigate,
    setOptions: jest.fn(),
  }),
  useFocusEffect: (callback: () => void) => {
    const React = require('react');
    React.useEffect(() => callback(), [callback]);
  },
}));

jest.mock('../../src/components/ui', () => {
  const React = require('react');
  const { Text, TouchableOpacity, View } = require('react-native');
  return {
    PaperBackground: ({ children }: any) => <View>{children}</View>,
    Card: ({ children }: any) => <View testID="surface-card">{children}</View>,
    Button: ({ title, onPress, disabled }: any) => (
      <TouchableOpacity onPress={onPress} disabled={disabled}>
        <Text>{title}</Text>
      </TouchableOpacity>
    ),
    DesignExportForeground: ({ children }: any) => <View>{children}</View>,
  };
});

jest.mock('../../src/components/subscription/SubscriptionBillingSwitch', () => ({
  SubscriptionBillingSwitch: ({ value }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    return <Text>{`Interval:${value}`}</Text>;
  },
}));

jest.mock('../../src/components/subscription/SubscriptionPlanCarousel', () => ({
  SubscriptionPlanCarousel: ({ children, initialIndex, indicatorPosition, onIndexChange, testID }: any) => {
    const React = require('react');
    const { Text, TouchableOpacity, View } = require('react-native');
    return (
      <View testID={testID}>
        <Text>{`InitialIndex:${initialIndex ?? 0}`}</Text>
        <Text>{`IndicatorPosition:${indicatorPosition ?? 'bottom'}`}</Text>
        <TouchableOpacity onPress={() => onIndexChange?.(0)}>
          <Text>Show free card</Text>
        </TouchableOpacity>
        {children}
      </View>
    );
  },
}));

jest.mock('../../src/components/subscription/SubscriptionPlanCard', () => ({
  SubscriptionPlanCard: ({ title, actionTitle, onPress }: any) => {
    const React = require('react');
    const { Text, TouchableOpacity, View } = require('react-native');
    return (
      <View>
        <Text>{title}</Text>
        <TouchableOpacity onPress={onPress}>
          <Text>{actionTitle}</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock('../../src/services/userService', () => ({
  UserService: {
    getDisplayName: (...args: unknown[]) => mockGetDisplayName(...args),
    setDisplayName: jest.fn(),
  },
}));

jest.mock('../../src/services/userSettingsService', () => ({
  getInterpretationDepth: (...args: unknown[]) => mockGetInterpretationDepth(...args),
  setInterpretationDepth: jest.fn(),
}));

jest.mock('../../src/services/patternInsightLanguageService', () => ({
  getPatternInsightLanguage: (...args: unknown[]) => mockGetPatternInsightLanguage(...args),
  setPatternInsightLanguage: jest.fn(),
}));

jest.mock('../../src/constants/patternInsightLanguages', () => ({
  PATTERN_INSIGHT_LANGUAGES: [
    { code: 'en', label: 'English', shortLabel: 'EN' },
    { code: 'el', label: 'Greek', shortLabel: 'EL' },
  ],
}));

jest.mock('../../src/services/biometricAuthService', () => ({
  getBiometricStatus: (...args: unknown[]) => mockGetBiometricStatus(...args),
  isBiometricEnabled: (...args: unknown[]) => mockIsBiometricEnabled(...args),
  enableBiometric: jest.fn(),
  disableBiometric: jest.fn(),
  getBiometricLabel: jest.fn(() => 'Face ID'),
}));

jest.mock('../../src/services/accountDeletion', () => ({
  deleteAccountAndData: jest.fn(),
}));

jest.mock('../../src/providers/SubscriptionProvider', () => ({
  useSubscription: () => ({
    status: {
      hasPaidAccess: mockHasPaidAccess,
      planTier: mockHasPaidAccess ? 'premium' : 'free',
      entitlementState: mockEntitlementState,
      currentPeriodEnd: '2026-08-01T00:00:00.000Z',
      quotas: {
        dreamReflections: { remaining: 31, used: 4, limit: 35, nextResetAt: null },
        recentDreamField: { remaining: 8, used: 2, limit: 10, nextResetAt: null },
        essays: { remaining: null, used: 0, limit: 1, nextResetAt: null, cadence: 'monthly' },
      },
    },
    loading: false,
    refreshing: false,
    iapRuntimeAvailable: mockIapRuntimeAvailable,
    iapUnavailableReason: mockIapUnavailableReason,
    products: [
      {
        planCode: 'paid_monthly',
        planTier: 'premium',
        billingInterval: 'monthly',
        productId: 'monthly',
        displayPrice: '€4.99 / month',
        totalPriceLabel: 'Billed monthly',
        compareAtPriceLabel: null,
        monthlyEquivalentLabel: null,
        savingsLabel: null,
        title: 'Premium Monthly',
        trialLabel: '7-day free trial',
      },
      {
        planCode: 'paid_yearly',
        planTier: 'premium',
        billingInterval: 'yearly',
        productId: 'yearly',
        displayPrice: '€47.88 / year',
        totalPriceLabel: '€47.88 billed yearly',
        compareAtPriceLabel: '€4.99 / month',
        monthlyEquivalentLabel: '€3.99 / month',
        savingsLabel: 'Save €12.00 / year',
        title: 'Premium Yearly',
        trialLabel: '7-day free trial',
      },
      {
        planCode: 'deeper_monthly',
        planTier: 'deeper',
        billingInterval: 'monthly',
        productId: 'deeper-monthly',
        displayPrice: '€8.99 / month',
        totalPriceLabel: 'Billed monthly',
        compareAtPriceLabel: null,
        monthlyEquivalentLabel: null,
        savingsLabel: null,
        title: 'Deeper Monthly',
        trialLabel: '7-day free trial',
      },
      {
        planCode: 'deeper_yearly',
        planTier: 'deeper',
        billingInterval: 'yearly',
        productId: 'deeper-yearly',
        displayPrice: '€77.88 / year',
        totalPriceLabel: '€77.88 billed yearly',
        compareAtPriceLabel: '€8.99 / month',
        monthlyEquivalentLabel: '€6.49 / month',
        savingsLabel: 'Save €30.00 / year',
        title: 'Deeper Yearly',
        trialLabel: '7-day free trial',
      },
    ],
    purchasingPlanCode: null,
    purchasePlan: (...args: unknown[]) => mockPurchasePlan(...args),
    restorePurchases: (...args: unknown[]) => mockRestorePurchases(...args),
    openManageSubscriptions: (...args: unknown[]) => mockOpenManageSubscriptions(...args),
  }),
}));

import AccountScreen from '../../src/screens/AccountScreen';
import SubscriptionScreen from '../../src/screens/SubscriptionScreen';

describe('subscription surface flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHasPaidAccess = false;
    mockEntitlementState = 'inactive';
    mockIapRuntimeAvailable = true;
    mockIapUnavailableReason = null;
    mockGetDisplayName.mockResolvedValue('Yiannis');
    mockGetInterpretationDepth.mockResolvedValue('standard');
    mockGetPatternInsightLanguage.mockResolvedValue('en');
    mockGetBiometricStatus.mockResolvedValue({ canUse: false, hasHardware: false, type: null });
    mockIsBiometricEnabled.mockResolvedValue(false);
  });

  it('keeps Account as a compact subscription entry that deep-links to Subscription', async () => {
    const screen = render(<AccountScreen />);

    await waitFor(() => expect(screen.getByText('Free plan')).toBeTruthy());
    expect(screen.queryByTestId('account-subscription-carousel')).toBeNull();
    expect(screen.queryByText('Go Premium')).toBeNull();

    fireEvent.press(screen.getByText('Free plan'));

    expect(mockNavigate).toHaveBeenCalledWith('Subscription');
  });

  it('opens the dedicated Subscription screen on the premium card by default', async () => {
    const screen = render(<SubscriptionScreen />);

    await waitFor(() => expect(screen.getByTestId('subscription-screen-carousel')).toBeTruthy());
    expect(screen.queryAllByTestId('surface-card')).toHaveLength(0);
    expect(screen.getByText('InitialIndex:1')).toBeTruthy();
    expect(screen.getByText('IndicatorPosition:top')).toBeTruthy();
    expect(screen.getByText('Interval:monthly')).toBeTruthy();
    expect(screen.getByText('Restore purchases')).toBeTruthy();
    expect(screen.queryByText('Manage')).toBeNull();
    expect(screen.queryByText('Dream reflections')).toBeNull();
    expect(screen.queryByText('Recent Dream Field')).toBeNull();
  });

  it('starts a premium purchase from the dedicated Subscription screen', async () => {
    const screen = render(<SubscriptionScreen />);

    await waitFor(() => expect(screen.getByText('Choose Premium')).toBeTruthy());
    fireEvent.press(screen.getByText('Choose Premium'));

    await waitFor(() => {
      expect(mockPurchasePlan).toHaveBeenCalledWith('premium', 'monthly', 'subscription');
    });
  });

  it('shows Manage only for active paid access', async () => {
    mockHasPaidAccess = true;
    mockEntitlementState = 'active';
    const screen = render(<SubscriptionScreen />);

    await waitFor(() => expect(screen.getByText('Manage')).toBeTruthy());
    expect(screen.queryByText('Restore purchases')).toBeNull();
  });

  it('hides the pricing switch when the free card becomes active', async () => {
    const screen = render(<SubscriptionScreen />);

    expect(screen.getByText('Interval:monthly')).toBeTruthy();
    fireEvent.press(screen.getByText('Show free card'));

    await waitFor(() => {
      expect(screen.queryByText('Interval:monthly')).toBeNull();
    });
  });

  it('shows helper copy and hides actions when native IAP is unavailable', async () => {
    mockIapRuntimeAvailable = false;
    mockIapUnavailableReason = 'expo_go';
    const screen = render(<SubscriptionScreen />);

    await waitFor(() =>
      expect(
        screen.getByText(/development build or store build/i)
      ).toBeTruthy()
    );
    expect(screen.queryByText('Restore purchases')).toBeNull();
    expect(screen.queryByText('Manage')).toBeNull();
  });
});
