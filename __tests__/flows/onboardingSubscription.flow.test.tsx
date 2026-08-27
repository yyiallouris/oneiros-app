/**
 * Flow coverage: documentation/flows-03-onboarding-account-security.md (plan selection before secure step).
 */
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockPurchasePlan = jest.fn();
let mockHasPaidAccess = false;
let mockStorePriceAvailable = true;

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

jest.mock('../../src/components/ui', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    PaperBackground: ({ children }: any) => <View>{children}</View>,
    DesignExportForeground: ({ children }: any) => <View>{children}</View>,
  };
});

jest.mock('../../src/components/subscription/SubscriptionBillingSwitch', () => ({
  SubscriptionBillingSwitch: ({ value, onChange }: any) => {
    const React = require('react');
    const { Text, TouchableOpacity, View } = require('react-native');
    return (
      <View>
        <Text>{`Interval:${value}`}</Text>
        <TouchableOpacity onPress={() => onChange('yearly')}>
          <Text>Switch yearly</Text>
        </TouchableOpacity>
      </View>
    );
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
  SubscriptionPlanCard: ({ title, actionTitle, onPress, disabled }: any) => {
    const React = require('react');
    const { Text, TouchableOpacity, View } = require('react-native');
    return (
      <View>
        <Text>{title}</Text>
        <TouchableOpacity onPress={onPress} disabled={disabled}>
          <Text>{actionTitle}</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock('../../src/providers/SubscriptionProvider', () => ({
  useSubscription: () => ({
    status: mockHasPaidAccess ? { hasPaidAccess: true, planTier: 'premium' } : { hasPaidAccess: false, planTier: 'free' },
    loading: false,
    storeProductsLoading: false,
    iapRuntimeAvailable: true,
    products: [
      {
        planCode: 'paid_monthly',
        planTier: 'premium',
        billingInterval: 'monthly',
        productId: 'monthly',
        storePriceAvailable: mockStorePriceAvailable,
        priceAmount: 4.99,
        currencyCode: 'EUR',
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
        storePriceAvailable: mockStorePriceAvailable,
        priceAmount: 47.88,
        currencyCode: 'EUR',
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
        storePriceAvailable: mockStorePriceAvailable,
        priceAmount: 8.99,
        currencyCode: 'EUR',
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
        storePriceAvailable: mockStorePriceAvailable,
        priceAmount: 77.88,
        currencyCode: 'EUR',
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
  }),
}));

import OnboardingSubscriptionScreen from '../../src/screens/onboarding/OnboardingSubscriptionScreen';

describe('Onboarding subscription flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHasPaidAccess = false;
    mockStorePriceAvailable = true;
  });

  it('lets the user continue with Free into the secure step', async () => {
    const screen = render(<OnboardingSubscriptionScreen />);

    expect(screen.getByTestId('subscription-carousel')).toBeTruthy();
    expect(screen.getByText('InitialIndex:1')).toBeTruthy();
    expect(screen.getByText('IndicatorPosition:top')).toBeTruthy();
    expect(screen.getByText('Interval:monthly')).toBeTruthy();
    fireEvent.press(screen.getByText('Continue with Free'));

    expect(mockNavigate).toHaveBeenCalledWith('OnboardingSecure');
  });

  it('hides the pricing switch when the free card becomes active', async () => {
    const screen = render(<OnboardingSubscriptionScreen />);

    expect(screen.getByText('Interval:monthly')).toBeTruthy();
    fireEvent.press(screen.getByText('Show free card'));

    await waitFor(() => {
      expect(screen.queryByText('Interval:monthly')).toBeNull();
    });
  });

  it('starts purchase directly from onboarding premium CTA', async () => {
    const screen = render(<OnboardingSubscriptionScreen />);

    fireEvent.press(screen.getByText('Choose Premium'));

    await waitFor(() => {
      expect(mockPurchasePlan).toHaveBeenCalledWith('premium', 'monthly', 'onboarding');
    });
  });

  it('keeps paid choices disabled until the store returns a real price', async () => {
    mockStorePriceAvailable = false;
    const screen = render(<OnboardingSubscriptionScreen />);

    fireEvent.press(screen.getAllByText('Price unavailable')[0]);
    expect(mockPurchasePlan).not.toHaveBeenCalled();
  });

  it('skips the screen when paid access is already active', async () => {
    mockHasPaidAccess = true;
    render(<OnboardingSubscriptionScreen />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('OnboardingSecure');
    });
  });
});
