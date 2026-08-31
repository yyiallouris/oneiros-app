import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { SubscriptionPlanCard } from '../src/components/subscription/SubscriptionPlanCard';

jest.mock('../src/components/ui', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Card: ({ children, style }: any) => <View style={style}>{children}</View>,
  };
});

describe('SubscriptionPlanCard', () => {
  it('keeps long localized store prices on one adaptive line', () => {
    const screen = render(
      <SubscriptionPlanCard
        title="Premium Yearly"
        price="Rp 1.234.567,89"
        priceDetail="Billed once a year"
        features={[]}
        imageSource={{ uri: 'subscription-test' }}
        actionTitle="Choose Premium"
        onPress={jest.fn()}
        variant="premium"
      />
    );

    const price = screen.getByText('Rp 1.234.567,89');
    expect(price.props.numberOfLines).toBe(1);
    expect(price.props.adjustsFontSizeToFit).toBe(true);
    expect(price.props.minimumFontScale).toBe(0.72);
  });

  it('keeps store failure out of the primary price and purchase CTA', () => {
    const onPress = jest.fn();
    const screen = render(
      <SubscriptionPlanCard
        title="Premium Monthly"
        price="Price unavailable"
        priceDetail="Try again when the store is available"
        features={[]}
        imageSource={{ uri: 'subscription-test' }}
        actionTitle="Price unavailable"
        onPress={onPress}
        variant="premium"
        disabled
        priceState="unavailable"
        hideAction
      />
    );

    expect(screen.getByText('Store price unavailable')).toBeTruthy();
    expect(screen.queryByText('Price unavailable')).toBeNull();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('never combines Recommended with the current-plan badge', () => {
    const screen = render(
      <SubscriptionPlanCard
        title="Premium"
        eyebrow="The natural choice"
        badgeText="Recommended"
        price="€4.99 / month"
        features={[]}
        imageSource={{ uri: 'subscription-test' }}
        actionTitle="Manage subscription"
        onPress={jest.fn()}
        variant="premium"
        current
      />
    );

    expect(screen.getByText('Your plan')).toBeTruthy();
    expect(screen.queryByText('Recommended')).toBeNull();
  });

  it('keeps secondary benefits behind an accessible expansion control', () => {
    const features = Array.from({ length: 6 }, (_, index) => ({
      label: `Benefit ${index + 1}`,
      included: true,
    }));
    const screen = render(
      <SubscriptionPlanCard
        title="Premium"
        price="€4.99 / month"
        features={features}
        imageSource={{ uri: 'subscription-test' }}
        actionTitle="Choose Premium"
        onPress={jest.fn()}
        variant="premium"
      />
    );

    expect(screen.queryByText('Benefit 5')).toBeNull();
    fireEvent.press(screen.getByText('See all features'));
    expect(screen.getByText('Benefit 5')).toBeTruthy();
    expect(screen.getByText('Show fewer features')).toBeTruthy();
  });

  it('starts purchase only from the explicit CTA, not from the card surface', () => {
    const onPress = jest.fn();
    const screen = render(
      <SubscriptionPlanCard
        title="Premium"
        price="€4.99 / month"
        features={[]}
        imageSource={{ uri: 'subscription-test' }}
        actionTitle="Choose Premium"
        onPress={onPress}
        variant="premium"
      />
    );

    expect(screen.getByTestId('subscription-plan-card-premium').props.onPress).toBeUndefined();
    expect(onPress).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText('Choose Premium'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
