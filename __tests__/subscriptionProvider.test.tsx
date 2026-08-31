import React from 'react';
import { Alert, AppState, Text } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';
import type { ProductSubscription } from 'expo-iap';

const mockFetchStoreProducts = jest.fn();
const mockRequestPurchase = jest.fn();
const mockGetSession = jest.fn();
const mockUnsubscribe = jest.fn();
let mockAppStateListener: ((state: AppStateStatus) => void) | null = null;

jest.mock('expo-iap', () => ({
  deepLinkToSubscriptions: jest.fn(),
  fetchProducts: (...args: unknown[]) => mockFetchStoreProducts(...args),
  getTransactionJwsIOS: jest.fn(),
  showManageSubscriptionsIOS: jest.fn(),
  useIAP: () => ({
    connected: true,
    finishTransaction: jest.fn(),
    requestPurchase: (...args: unknown[]) => mockRequestPurchase(...args),
    restorePurchases: jest.fn(),
  }),
}));

jest.mock('../src/services/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      })),
    },
    functions: { invoke: jest.fn() },
  },
}));

import { SubscriptionProvider, useSubscription } from '../src/providers/SubscriptionProvider';
import { subscriptionConfig } from '../src/services/subscriptionService';

function iosProduct(
  id: string,
  displayPrice: string,
  price: number,
  currency: string
): ProductSubscription {
  return {
    id,
    displayPrice,
    price,
    currency,
    platform: 'ios',
    type: 'subs',
    title: id,
    description: '',
  } as ProductSubscription;
}

const usdProducts = [
  iosProduct(subscriptionConfig.applePremiumMonthlyProductId, '$4.99', 4.99, 'USD'),
  iosProduct(subscriptionConfig.applePremiumYearlyProductId, '$47.88', 47.88, 'USD'),
  iosProduct(subscriptionConfig.appleDeeperMonthlyProductId, '$8.99', 8.99, 'USD'),
  iosProduct(subscriptionConfig.appleDeeperYearlyProductId, '$77.88', 77.88, 'USD'),
];

let latestSubscription: ReturnType<typeof useSubscription> | null = null;

const Probe = () => {
  latestSubscription = useSubscription();
  const monthly = latestSubscription.products.find((plan) => plan.planCode === 'paid_monthly');
  return <Text>{monthly?.displayPrice}</Text>;
};

describe('SubscriptionProvider store pricing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    latestSubscription = null;
    mockAppStateListener = null;
    mockGetSession.mockResolvedValue({ data: { session: null } });
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    jest.spyOn(AppState, 'addEventListener').mockImplementation(
      (_event, listener) => {
        mockAppStateListener = listener;
        return { remove: jest.fn() };
      }
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads exact storefront products and refreshes them after foregrounding', async () => {
    const gbpProducts = usdProducts.map((product) => ({
      ...product,
      currency: 'GBP',
      displayPrice: product.id.includes('yearly') ? '£39.99' : '£4.49',
    })) as ProductSubscription[];
    mockFetchStoreProducts
      .mockResolvedValueOnce(usdProducts)
      .mockResolvedValueOnce(gbpProducts);

    const screen = render(
      <SubscriptionProvider>
        <Probe />
      </SubscriptionProvider>
    );

    await waitFor(() => expect(screen.getByText('$4.99')).toBeTruthy());
    expect(latestSubscription?.storeProductsLoading).toBe(false);

    await act(async () => {
      mockAppStateListener?.('active');
    });

    await waitFor(() => expect(screen.getByText('£4.49')).toBeTruthy());
    expect(mockFetchStoreProducts).toHaveBeenCalledTimes(2);
  });

  it('keeps purchase dispatch disabled when the current store omits the product', async () => {
    mockFetchStoreProducts.mockResolvedValue([]);
    render(
      <SubscriptionProvider>
        <Probe />
      </SubscriptionProvider>
    );

    await waitFor(() => expect(latestSubscription?.storeProductsLoading).toBe(false));
    let started = true;
    await act(async () => {
      started = (await latestSubscription?.purchasePlan('premium', 'monthly', 'subscription')) ?? true;
    });

    expect(started).toBe(false);
    expect(mockRequestPurchase).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      'Price unavailable',
      expect.stringMatching(/current store price/i)
    );

    await act(async () => {
      await latestSubscription?.refreshStoreProducts();
    });
    expect(mockFetchStoreProducts).toHaveBeenCalledTimes(2);
  });
});
