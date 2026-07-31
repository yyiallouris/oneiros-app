import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { PremiumUpsellModal } from '../src/components/subscription/PremiumUpsellModal';

jest.mock('../src/components/subscription/SubscriptionBillingSwitch', () => ({
  SubscriptionBillingSwitch: ({ value }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    return <Text>{`Interval:${value}`}</Text>;
  },
}));

jest.mock('../src/components/subscription/SubscriptionPlanCarousel', () => ({
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

jest.mock('../src/components/subscription/SubscriptionPlanCard', () => ({
  SubscriptionPlanCard: ({ title, actionTitle }: any) => {
    const React = require('react');
    const { Text, View } = require('react-native');
    return (
      <View>
        <Text>{title}</Text>
        <Text>{actionTitle}</Text>
      </View>
    );
  },
}));

const premiumPlan = {
  planCode: 'paid_monthly' as const,
  planTier: 'premium' as const,
  billingInterval: 'monthly' as const,
  productId: 'monthly',
  displayPrice: '€4.99 / month',
  totalPriceLabel: 'Billed monthly',
  compareAtPriceLabel: null,
  monthlyEquivalentLabel: null,
  savingsLabel: null,
  title: 'Premium Monthly',
  trialLabel: '7-day free trial',
};

const deeperPlan = {
  planCode: 'deeper_monthly' as const,
  planTier: 'deeper' as const,
  billingInterval: 'monthly' as const,
  productId: 'deeper-monthly',
  displayPrice: '€8.99 / month',
  totalPriceLabel: 'Billed monthly',
  compareAtPriceLabel: null,
  monthlyEquivalentLabel: null,
  savingsLabel: null,
  title: 'Deeper Monthly',
  trialLabel: '7-day free trial',
};

describe('PremiumUpsellModal', () => {
  it('shows compare mode with both cards and premium-first carousel positioning', () => {
    const screen = render(
      <PremiumUpsellModal
        visible
        source="insights"
        billingInterval="monthly"
        premiumPlan={premiumPlan}
        deeperPlan={deeperPlan}
        onClose={jest.fn()}
        onIntervalChange={jest.fn()}
        onUpgrade={jest.fn()}
      />
    );

    expect(screen.getByText('Free')).toBeTruthy();
    expect(screen.getByText('Premium Monthly')).toBeTruthy();
    expect(screen.getByText('Current plan')).toBeTruthy();
    expect(screen.getByText('InitialIndex:1')).toBeTruthy();
    expect(screen.getByText('IndicatorPosition:top')).toBeTruthy();
    expect(screen.getByText('Interval:monthly')).toBeTruthy();
  });

  it('shows only the premium card in premium-only mode', () => {
    const screen = render(
      <PremiumUpsellModal
        visible
        source="followup"
        billingInterval="monthly"
        premiumPlan={premiumPlan}
        deeperPlan={deeperPlan}
        displayMode="premium_only"
        onClose={jest.fn()}
        onIntervalChange={jest.fn()}
        onUpgrade={jest.fn()}
      />
    );

    expect(screen.queryByText('Stay on Free')).toBeNull();
    expect(screen.queryByText('Free')).toBeNull();
    expect(screen.getByText('Premium Monthly')).toBeTruthy();
    expect(screen.getByText('InitialIndex:0')).toBeTruthy();
    expect(screen.getByText('Interval:monthly')).toBeTruthy();
  });

  it('hides the pricing switch in compare mode when the free card becomes active', () => {
    const screen = render(
      <PremiumUpsellModal
        visible
        source="insights"
        billingInterval="monthly"
        premiumPlan={premiumPlan}
        deeperPlan={deeperPlan}
        onClose={jest.fn()}
        onIntervalChange={jest.fn()}
        onUpgrade={jest.fn()}
      />
    );

    expect(screen.getByText('Interval:monthly')).toBeTruthy();
    fireEvent.press(screen.getByText('Show free card'));
    expect(screen.queryByText('Interval:monthly')).toBeNull();
  });
});
