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

  it('keeps an unavailable paid CTA disabled', () => {
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
      />
    );

    fireEvent.press(screen.getAllByText('Price unavailable')[1]);
    expect(onPress).not.toHaveBeenCalled();
  });
});
