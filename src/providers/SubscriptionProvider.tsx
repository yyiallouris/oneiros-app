import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Platform } from 'react-native';
import type { ProductSubscription, Purchase } from 'expo-iap';
import {
  deepLinkToSubscriptions,
  fetchProducts as fetchStoreProductsNative,
  getTransactionJwsIOS,
  showManageSubscriptionsIOS,
  useIAP,
} from 'expo-iap';
import { supabase } from '../services/supabaseClient';
import {
  fetchSubscriptionStatus,
  getFallbackPlan,
  getIapUnavailableMessage,
  getInitialIapRuntimeAvailability,
  getPurchaseRequest,
  getTargetPlanForTierInterval,
  isMissingNativeIapError,
  isStorePlanPurchasable,
  getStorePlanOptions,
  registerApplePurchase,
  registerGooglePurchase,
  subscriptionConfig,
} from '../services/subscriptionService';
import type {
  BillingInterval,
  IapUnavailableReason,
  PremiumGateSource,
  StoreSubscriptionPlan,
  SubscriptionStatus,
} from '../types/subscription';
import type { PlanTier } from '../billing/types';
import { logError } from '../services/logger';

type SubscriptionContextValue = {
  status: SubscriptionStatus | null;
  loading: boolean;
  refreshing: boolean;
  iapRuntimeAvailable: boolean;
  iapUnavailableReason: IapUnavailableReason | null;
  purchasingPlanCode: StoreSubscriptionPlan['planCode'] | null;
  products: StoreSubscriptionPlan[];
  storeProductsLoading: boolean;
  refreshStatus: () => Promise<void>;
  purchasePlan: (planTier: Exclude<PlanTier, 'free'>, interval: BillingInterval, source: PremiumGateSource) => Promise<boolean>;
  restorePurchases: () => Promise<void>;
  openManageSubscriptions: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

const initialFallbackProducts = [
  getFallbackPlan('paid_monthly'),
  getFallbackPlan('paid_yearly'),
  getFallbackPlan('deeper_monthly'),
  getFallbackPlan('deeper_yearly'),
];

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialIapRuntime = getInitialIapRuntimeAvailability();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<StoreSubscriptionPlan[]>(initialFallbackProducts);
  const [storeProductsLoading, setStoreProductsLoading] = useState(initialIapRuntime.available);
  const [iapRuntimeAvailable, setIapRuntimeAvailable] = useState(initialIapRuntime.available);
  const [iapUnavailableReason, setIapUnavailableReason] = useState<IapUnavailableReason | null>(
    initialIapRuntime.reason
  );
  const [purchasingPlanCode, setPurchasingPlanCode] = useState<StoreSubscriptionPlan['planCode'] | null>(null);
  const purchaseSourceRef = useRef<PremiumGateSource>('account');
  const iapRuntimeLoggedRef = useRef(false);
  const storeFetchGenerationRef = useRef(0);

  const markIapRuntimeUnavailable = (reason: IapUnavailableReason) => {
    setIapRuntimeAvailable(false);
    setIapUnavailableReason(reason);
    setStoreProductsLoading(false);
    setProducts(initialFallbackProducts);
  };

  const logAndMarkMissingIapModule = (error: unknown) => {
    markIapRuntimeUnavailable('missing_native_module');
    if (iapRuntimeLoggedRef.current) return;
    iapRuntimeLoggedRef.current = true;
    logError('subscription_iap_runtime_unavailable', error);
  };

  const maybeHandleMissingIapModuleError = (error: unknown, options?: { alertUser?: boolean }): boolean => {
    if (!isMissingNativeIapError(error)) return false;
    logAndMarkMissingIapModule(error);
    if (options?.alertUser) {
      Alert.alert('Subscriptions unavailable', getIapUnavailableMessage('missing_native_module'));
    }
    return true;
  };

  const refreshStatus = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setStatus(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setRefreshing(true);
    try {
      const nextStatus = await fetchSubscriptionStatus();
      setStatus(nextStatus);
    } catch (error) {
      logError('subscription_status_fetch_failed', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const iap = useIAP({
    onPurchaseSuccess: async (purchase: Purchase) => {
      try {
        if (Platform.OS === 'ios') {
          const signedTransactionInfo = await getTransactionJwsIOS(purchase.productId);
          if (!signedTransactionInfo) {
            throw new Error('Apple transaction payload was not available.');
          }
          await registerApplePurchase(signedTransactionInfo);
        } else {
          if (!purchase.purchaseToken) throw new Error('Google purchase token missing.');
          await registerGooglePurchase(purchase.purchaseToken);
        }

        await iap.finishTransaction({ purchase, isConsumable: false });
        await refreshStatus();
      } catch (error) {
        logError('subscription_purchase_registration_failed', error, {
          source: purchaseSourceRef.current,
          productId: purchase.productId,
        });
        Alert.alert(
          'Purchase received',
          'Your purchase came through, but the app could not finish syncing the entitlement yet. Please tap Restore purchases in Subscription.'
        );
      } finally {
        setPurchasingPlanCode(null);
      }
    },
    onPurchaseError: (error) => {
      setPurchasingPlanCode(null);
      if (error?.code === 'user-cancelled') return;
      if (maybeHandleMissingIapModuleError(error)) return;
      Alert.alert('Purchase unavailable', error?.message ?? 'Please try again in a moment.');
    },
    onError: (error) => {
      if (maybeHandleMissingIapModuleError(error)) return;
      logError('subscription_iap_error', error);
    },
  });

  const storeSkus = Platform.OS === 'ios'
    ? [
        subscriptionConfig.applePremiumMonthlyProductId,
        subscriptionConfig.applePremiumYearlyProductId,
        subscriptionConfig.appleDeeperMonthlyProductId,
        subscriptionConfig.appleDeeperYearlyProductId,
      ]
    : [
        subscriptionConfig.googlePremiumSubscriptionProductId,
        subscriptionConfig.googleDeeperSubscriptionProductId,
      ];

  const refreshStoreProducts = useCallback(async () => {
    if (!iap.connected || !iapRuntimeAvailable) return;

    const generation = ++storeFetchGenerationRef.current;
    setStoreProductsLoading(true);
    // Never keep displaying a price from an earlier storefront while a fresh
    // lookup is in progress or after that lookup fails.
    setProducts(initialFallbackProducts);

    try {
      const fetched = await fetchStoreProductsNative({ skus: storeSkus, type: 'subs' });
      if (generation !== storeFetchGenerationRef.current) return;
      setProducts(getStorePlanOptions((fetched ?? []) as ProductSubscription[]));
    } catch (error) {
      if (generation !== storeFetchGenerationRef.current) return;
      logError('subscription_fetch_products_failed', error);
      if (maybeHandleMissingIapModuleError(error)) return;
      setProducts(initialFallbackProducts);
    } finally {
      if (generation === storeFetchGenerationRef.current) {
        setStoreProductsLoading(false);
      }
    }
  }, [iap.connected, iapRuntimeAvailable]);

  useEffect(() => {
    refreshStatus().catch(() => undefined);
    let authRefreshTimer: ReturnType<typeof setTimeout> | null = null;
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      // Auth subscribers run under Supabase's exclusive auth lock. Defer getSession
      // until after the callback returns to avoid blocking PKCE/session completion.
      if (authRefreshTimer) clearTimeout(authRefreshTimer);
      authRefreshTimer = setTimeout(() => {
        authRefreshTimer = null;
        refreshStatus().catch(() => undefined);
      }, 0);
    });

    return () => {
      if (authRefreshTimer) clearTimeout(authRefreshTimer);
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    void refreshStoreProducts();
  }, [refreshStoreProducts]);

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') return;
      refreshStatus().catch(() => undefined);
      void refreshStoreProducts();
    });
    return () => appStateSubscription.remove();
  }, [refreshStoreProducts]);

  const purchasePlan = async (
    planTier: Exclude<PlanTier, 'free'>,
    interval: BillingInterval,
    source: PremiumGateSource
  ) => {
    if (!iapRuntimeAvailable) {
      Alert.alert('Subscriptions unavailable', getIapUnavailableMessage(iapUnavailableReason));
      return false;
    }

    if (!iap.connected) {
      Alert.alert(
        'Store not ready yet',
        'Premium purchases are still warming up. Give the store a moment, then try again.'
      );
      return false;
    }

    const planCode = getTargetPlanForTierInterval(planTier, interval);
    const plan = products.find((item) => item.planCode === planCode);

    if (!isStorePlanPurchasable(plan)) {
      Alert.alert(
        'Price unavailable',
        'We could not load the current store price. Check your connection and try again.'
      );
      return false;
    }

    if (Platform.OS === 'android' && !plan.offerTokenAndroid) {
      Alert.alert(
        'Purchase options still loading',
        'Google Play has not finished loading the subscription offer yet. Please try again in a moment.'
      );
      return false;
    }

    setPurchasingPlanCode(plan.planCode);
    purchaseSourceRef.current = source;

    try {
      const effectiveStatus = status ?? (await fetchSubscriptionStatus());
      await iap.requestPurchase(getPurchaseRequest(plan, effectiveStatus));
      return true;
    } catch (error) {
      setPurchasingPlanCode(null);
      logError('subscription_purchase_request_failed', error, {
        source,
        planCode,
      });
      Alert.alert(
        'Could not open purchase',
        error instanceof Error ? error.message : 'Please try again in a moment.'
      );
      return false;
    }
  };

  const restorePurchases = async () => {
    if (!iapRuntimeAvailable) {
      Alert.alert('Subscriptions unavailable', getIapUnavailableMessage(iapUnavailableReason));
      return;
    }

    try {
      await iap.restorePurchases();
      await refreshStatus();
      Alert.alert('Purchases restored', 'Your subscription state has been refreshed.');
    } catch (error) {
      if (maybeHandleMissingIapModuleError(error, { alertUser: true })) return;
      logError('subscription_restore_failed', error);
      Alert.alert('Could not restore', 'Please try again in a moment.');
    }
  };

  const openManageSubscriptions = async () => {
    if (!iapRuntimeAvailable) {
      Alert.alert('Subscriptions unavailable', getIapUnavailableMessage(iapUnavailableReason));
      return;
    }

    try {
      if (Platform.OS === 'ios') {
        await showManageSubscriptionsIOS();
      } else {
        await deepLinkToSubscriptions({
          packageNameAndroid: subscriptionConfig.androidPackageName,
          skuAndroid:
            status?.planTier === 'deeper'
              ? subscriptionConfig.googleDeeperSubscriptionProductId
              : subscriptionConfig.googlePremiumSubscriptionProductId,
        });
      }
    } catch (error) {
      if (maybeHandleMissingIapModuleError(error, { alertUser: true })) return;
      logError('subscription_manage_open_failed', error);
      Alert.alert('Could not open subscriptions', 'Please try again from your store subscriptions page.');
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        status,
        loading,
        refreshing,
        iapRuntimeAvailable,
        iapUnavailableReason,
        purchasingPlanCode,
        products,
        storeProductsLoading,
        refreshStatus,
        purchasePlan,
        restorePurchases,
        openManageSubscriptions,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export function useSubscription(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
}
