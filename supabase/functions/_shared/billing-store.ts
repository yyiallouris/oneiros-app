import type { BillingProvider, EntitlementProvider, EntitlementSnapshot, EntitlementState, VerifiedPurchase, WebhookEventEnvelope } from '../../../src/billing/types.ts';
import { HttpError } from './http.ts';

const APPLE_ISSUER_ID = Deno.env.get('APPLE_ISSUER_ID') ?? '';
const APPLE_KEY_ID = Deno.env.get('APPLE_KEY_ID') ?? '';
const APPLE_PRIVATE_KEY = Deno.env.get('APPLE_PRIVATE_KEY') ?? '';
const APPLE_BUNDLE_ID = Deno.env.get('APPLE_BUNDLE_ID') ?? '';
const APPLE_SUBSCRIPTION_PRODUCT_ID = Deno.env.get('APPLE_SUBSCRIPTION_PRODUCT_ID') ?? '';
const APPLE_SUBSCRIPTION_MONTHLY_PRODUCT_ID =
  Deno.env.get('APPLE_SUBSCRIPTION_MONTHLY_PRODUCT_ID') ?? APPLE_SUBSCRIPTION_PRODUCT_ID;
const APPLE_SUBSCRIPTION_YEARLY_PRODUCT_ID = Deno.env.get('APPLE_SUBSCRIPTION_YEARLY_PRODUCT_ID') ?? '';

const GOOGLE_PACKAGE_NAME = Deno.env.get('GOOGLE_PACKAGE_NAME') ?? '';
const GOOGLE_SUBSCRIPTION_PRODUCT_ID = Deno.env.get('GOOGLE_SUBSCRIPTION_PRODUCT_ID') ?? '';
const GOOGLE_SUBSCRIPTION_MONTHLY_BASE_PLAN_ID =
  Deno.env.get('GOOGLE_SUBSCRIPTION_MONTHLY_BASE_PLAN_ID') ?? 'monthly';
const GOOGLE_SUBSCRIPTION_YEARLY_BASE_PLAN_ID =
  Deno.env.get('GOOGLE_SUBSCRIPTION_YEARLY_BASE_PLAN_ID') ?? 'yearly';
const GOOGLE_SERVICE_ACCOUNT_JSON = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON') ?? '';
const GOOGLE_SERVICE_ACCOUNT_EMAIL = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL') ?? '';
const GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY') ?? '';

function requireEnv(value: string, name: string): string {
  if (!value) throw new HttpError(500, `Missing required environment variable: ${name}`);
  return value;
}

function toBase64Url(input: Uint8Array | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return atob(normalized + padding);
}

function decodeJwtPayload<T>(token: string): T {
  const [, payload] = token.split('.');
  if (!payload) throw new HttpError(400, 'Invalid token payload');
  return JSON.parse(fromBase64Url(payload)) as T;
}

function normalizePrivateKey(raw: string): string {
  return raw.includes('\\n') ? raw.replace(/\\n/g, '\n') : raw;
}

async function importPkcs8(privateKeyPem: string, algorithm: EcKeyImportParams | RsaHashedImportParams, usages: KeyUsage[]) {
  const cleaned = privateKeyPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '');
  const binary = Uint8Array.from(atob(cleaned), (char) => char.charCodeAt(0));
  return crypto.subtle.importKey('pkcs8', binary.buffer, algorithm, false, usages);
}

async function signJwt(params: {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  privateKeyPem: string;
  algorithm: EcKeyImportParams | RsaHashedImportParams;
  signAlgorithm: any;
}): Promise<string> {
  const encodedHeader = toBase64Url(JSON.stringify(params.header));
  const encodedPayload = toBase64Url(JSON.stringify(params.payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const privateKey = await importPkcs8(params.privateKeyPem, params.algorithm, ['sign']);
  const signature = await crypto.subtle.sign(params.signAlgorithm, privateKey, new TextEncoder().encode(signingInput));
  return `${signingInput}.${toBase64Url(new Uint8Array(signature))}`;
}

function appleApiBase(environment?: string | null): string {
  return environment === 'Sandbox'
    ? 'https://api.storekit-sandbox.itunes.apple.com'
    : 'https://api.storekit.itunes.apple.com';
}

async function buildAppleJwt(): Promise<string> {
  const issuerId = requireEnv(APPLE_ISSUER_ID, 'APPLE_ISSUER_ID');
  const keyId = requireEnv(APPLE_KEY_ID, 'APPLE_KEY_ID');
  const privateKey = normalizePrivateKey(requireEnv(APPLE_PRIVATE_KEY, 'APPLE_PRIVATE_KEY'));
  const bundleId = requireEnv(APPLE_BUNDLE_ID, 'APPLE_BUNDLE_ID');
  const now = Math.floor(Date.now() / 1000);

  return signJwt({
    header: { alg: 'ES256', kid: keyId, typ: 'JWT' },
    payload: {
      iss: issuerId,
      iat: now,
      exp: now + 300,
      aud: 'appstoreconnect-v1',
      bid: bundleId,
    },
    privateKeyPem: privateKey,
    algorithm: { name: 'ECDSA', namedCurve: 'P-256' },
    signAlgorithm: { name: 'ECDSA', hash: 'SHA-256' },
  });
}

function parseAppleState(transaction: Record<string, unknown>): EntitlementState {
  if (transaction.revocationDate || transaction.revocationReason) return 'revoked';
  const expiresDate = Number(transaction.expiresDate ?? 0);
  if (!expiresDate) return 'active';
  return expiresDate > Date.now() ? 'active' : 'expired';
}

function isConfiguredAppleProduct(productId: string): boolean {
  return [APPLE_SUBSCRIPTION_MONTHLY_PRODUCT_ID, APPLE_SUBSCRIPTION_YEARLY_PRODUCT_ID]
    .filter(Boolean)
    .includes(productId);
}

function resolveApplePlanCode(productId: string): 'paid_monthly' | 'paid_yearly' {
  if (productId === APPLE_SUBSCRIPTION_YEARLY_PRODUCT_ID) return 'paid_yearly';
  if (productId === APPLE_SUBSCRIPTION_MONTHLY_PRODUCT_ID || !APPLE_SUBSCRIPTION_YEARLY_PRODUCT_ID) {
    return 'paid_monthly';
  }
  throw new HttpError(400, `Apple product id is not configured for subscriptions: ${productId}`);
}

function mapApplePurchase(userId: string, transaction: Record<string, unknown>): { purchase: VerifiedPurchase; snapshot: EntitlementSnapshot } {
  const transactionId = String(transaction.transactionId ?? '');
  const originalTransactionId = String(transaction.originalTransactionId ?? transactionId);
  const productId = String(transaction.productId ?? APPLE_SUBSCRIPTION_MONTHLY_PRODUCT_ID);
  const appAccountToken = typeof transaction.appAccountToken === 'string' ? transaction.appAccountToken : null;
  const environment = typeof transaction.environment === 'string' ? transaction.environment : null;
  const entitlementState = parseAppleState(transaction);
  const expiresDate = Number(transaction.expiresDate ?? 0);
  const purchaseDate = Number(transaction.purchaseDate ?? 0);
  const planCode = resolveApplePlanCode(productId);

  if (!transactionId || !productId) {
    throw new HttpError(400, 'Apple transaction is missing required identifiers');
  }

  const currentPeriodStart = purchaseDate ? new Date(purchaseDate).toISOString() : null;
  const currentPeriodEnd = expiresDate ? new Date(expiresDate).toISOString() : null;

  const purchase: VerifiedPurchase = {
    userId,
    provider: 'apple',
    planCode,
    entitlementState,
    productId,
    transactionKey: `apple:${transactionId}`,
    externalTransactionId: transactionId,
    originalTransactionId,
    transactionType: String(transaction.type ?? transaction.offerType ?? 'store_purchase'),
    transactionTime: currentPeriodStart,
    currentPeriodStart,
    currentPeriodEnd,
    autoRenewStatus: true,
    environment,
    appAccountToken,
    raw: transaction,
  };

  const snapshot: EntitlementSnapshot = {
    userId,
    provider: 'apple',
    planCode,
    entitlementState,
    productId,
    originalTransactionId,
    latestTransactionId: transactionId,
    currentPeriodStart,
    currentPeriodEnd,
    autoRenewStatus: true,
    environment,
    raw: transaction,
  };

  return { purchase, snapshot };
}

async function fetchAppleTransaction(transactionId: string, environment?: string | null): Promise<Record<string, unknown>> {
  const jwt = await buildAppleJwt();
  const response = await fetch(`${appleApiBase(environment)}/inApps/v1/transactions/${encodeURIComponent(transactionId)}`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  });

  if (!response.ok) {
    throw new HttpError(response.status, 'Failed to verify Apple transaction', await response.text());
  }

  const data = (await response.json()) as { signedTransactionInfo?: string };
  if (!data.signedTransactionInfo) {
    throw new HttpError(502, 'Apple transaction response did not include signedTransactionInfo');
  }

  return decodeJwtPayload<Record<string, unknown>>(data.signedTransactionInfo);
}

async function fetchAppleSubscription(originalTransactionId: string, environment?: string | null): Promise<Record<string, unknown>> {
  const jwt = await buildAppleJwt();
  const response = await fetch(`${appleApiBase(environment)}/inApps/v1/subscriptions/${encodeURIComponent(originalTransactionId)}`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  });

  if (!response.ok) {
    throw new HttpError(response.status, 'Failed to load Apple subscription status', await response.text());
  }

  return (await response.json()) as Record<string, unknown>;
}

type ApplePurchaseInput = {
  userId: string;
  signedTransactionInfo: string;
};

type AppleWebhookInput = {
  signedPayload: string;
};

const appleProvider: EntitlementProvider<ApplePurchaseInput, AppleWebhookInput> = {
  name: 'apple',
  async verifyPurchase(input) {
    requireEnv(APPLE_SUBSCRIPTION_MONTHLY_PRODUCT_ID, 'APPLE_SUBSCRIPTION_MONTHLY_PRODUCT_ID');
    const unverified = decodeJwtPayload<Record<string, unknown>>(input.signedTransactionInfo);
    const transactionId = String(unverified.transactionId ?? '');
    const verifiedTransaction = await fetchAppleTransaction(transactionId, typeof unverified.environment === 'string' ? unverified.environment : null);
    const mapped = mapApplePurchase(input.userId, verifiedTransaction);

    if (!isConfiguredAppleProduct(mapped.purchase.productId)) {
      throw new HttpError(400, 'Apple product id does not match configured subscription');
    }

    return mapped;
  },
  async resolveWebhook(input) {
    const payload = decodeJwtPayload<Record<string, unknown>>(input.signedPayload);
    const notificationId = String(payload.notificationUUID ?? '');
    const notificationType = String(payload.notificationType ?? 'apple_notification');
    const data = (payload.data ?? {}) as Record<string, unknown>;
    const signedTransactionInfo = typeof data.signedTransactionInfo === 'string' ? data.signedTransactionInfo : null;
    const signedRenewalInfo = typeof data.signedRenewalInfo === 'string' ? data.signedRenewalInfo : null;

    let purchase: VerifiedPurchase | undefined;
    let snapshot: EntitlementSnapshot | undefined;

    if (signedTransactionInfo) {
      const transactionPayload = decodeJwtPayload<Record<string, unknown>>(signedTransactionInfo);
      const transactionId = String(transactionPayload.transactionId ?? '');
      const verifiedTransaction = await fetchAppleTransaction(transactionId, typeof transactionPayload.environment === 'string' ? transactionPayload.environment : null);
      const mapped = mapApplePurchase('', verifiedTransaction);
      purchase = mapped.purchase;
      snapshot = mapped.snapshot;
    } else if (signedRenewalInfo) {
      const renewalPayload = decodeJwtPayload<Record<string, unknown>>(signedRenewalInfo);
      const originalTransactionId = String(renewalPayload.originalTransactionId ?? '');
      if (originalTransactionId) {
        const subscription = await fetchAppleSubscription(originalTransactionId, typeof renewalPayload.environment === 'string' ? renewalPayload.environment : null);
        const lastTransactions = Array.isArray(subscription.data) ? subscription.data : [];
        const lastSigned = lastTransactions[0]?.lastTransactions?.[0]?.signedTransactionInfo as string | undefined;
        if (lastSigned) {
          const verifiedTransaction = decodeJwtPayload<Record<string, unknown>>(lastSigned);
          const mapped = mapApplePurchase('', verifiedTransaction);
          purchase = mapped.purchase;
          snapshot = mapped.snapshot;
        }
      }
    }

    return {
      envelope: {
        provider: 'apple',
        eventId: notificationId || crypto.randomUUID(),
        eventType: notificationType,
        payload,
        receivedAt: new Date().toISOString(),
      },
      purchase,
      snapshot,
    };
  },
};

type GoogleServiceAccount = {
  client_email: string;
  private_key: string;
};

function resolveGoogleServiceAccount(): GoogleServiceAccount {
  if (GOOGLE_SERVICE_ACCOUNT_JSON) {
    const parsed = JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON) as GoogleServiceAccount;
    return {
      client_email: parsed.client_email,
      private_key: normalizePrivateKey(parsed.private_key),
    };
  }

  return {
    client_email: requireEnv(GOOGLE_SERVICE_ACCOUNT_EMAIL, 'GOOGLE_SERVICE_ACCOUNT_EMAIL'),
    private_key: normalizePrivateKey(requireEnv(GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, 'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')),
  };
}

async function getGoogleAccessToken(): Promise<string> {
  const account = resolveGoogleServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const assertion = await signJwt({
    header: { alg: 'RS256', typ: 'JWT' },
    payload: {
      iss: account.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    },
    privateKeyPem: account.private_key,
    algorithm: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    signAlgorithm: 'RSASSA-PKCS1-v1_5',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    throw new HttpError(response.status, 'Failed to obtain Google access token', await response.text());
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new HttpError(502, 'Google token response missing access_token');
  }
  return data.access_token;
}

function mapGoogleState(subscriptionState: string, expiryTime: string | null): EntitlementState {
  if (subscriptionState.includes('GRACE_PERIOD')) return 'grace_period';
  if (subscriptionState.includes('ON_HOLD')) return 'billing_retry';
  if (subscriptionState.includes('PAUSED')) return 'paused';
  if (subscriptionState.includes('EXPIRED')) return 'expired';
  if (expiryTime && new Date(expiryTime).getTime() <= Date.now()) return 'expired';
  return 'active';
}

function resolveGooglePlanCode(lineItem: Record<string, unknown>): 'paid_monthly' | 'paid_yearly' {
  const offerDetails = (lineItem.offerDetails ?? {}) as Record<string, unknown>;
  const basePlanId = String(offerDetails.basePlanId ?? '');

  if (basePlanId === GOOGLE_SUBSCRIPTION_YEARLY_BASE_PLAN_ID) return 'paid_yearly';
  if (basePlanId === GOOGLE_SUBSCRIPTION_MONTHLY_BASE_PLAN_ID || !basePlanId) return 'paid_monthly';
  throw new HttpError(400, `Google base plan id is not configured for subscriptions: ${basePlanId}`);
}

function mapGooglePurchase(userId: string, payload: Record<string, unknown>, purchaseToken: string): { purchase: VerifiedPurchase; snapshot: EntitlementSnapshot } {
  const lineItems = Array.isArray(payload.lineItems) ? payload.lineItems as Array<Record<string, unknown>> : [];
  const lineItem = lineItems[0] ?? {};
  const productId = String(lineItem.productId ?? GOOGLE_SUBSCRIPTION_PRODUCT_ID);
  const latestOrderId = String(payload.latestOrderId ?? purchaseToken);
  const startTime = typeof payload.startTime === 'string' ? payload.startTime : null;
  const expiryTime = typeof lineItem.expiryTime === 'string' ? lineItem.expiryTime : null;
  const subscriptionState = String(payload.subscriptionState ?? 'SUBSCRIPTION_STATE_ACTIVE');
  const externalIdentifiers = (payload.externalAccountIdentifiers ?? {}) as Record<string, unknown>;
  const googleObfuscatedAccountId = typeof externalIdentifiers.obfuscatedExternalAccountId === 'string'
    ? externalIdentifiers.obfuscatedExternalAccountId
    : null;
  const entitlementState = mapGoogleState(subscriptionState, expiryTime);
  const autoRenewStatus = lineItem.autoRenewingPlan ? true : null;
  const planCode = resolveGooglePlanCode(lineItem);

  const purchase: VerifiedPurchase = {
    userId,
    provider: 'google',
    planCode,
    entitlementState,
    productId,
    transactionKey: `google:${latestOrderId}:${expiryTime ?? purchaseToken}`,
    externalTransactionId: latestOrderId,
    originalTransactionId: latestOrderId,
    purchaseToken,
    transactionType: subscriptionState,
    transactionTime: startTime,
    currentPeriodStart: startTime,
    currentPeriodEnd: expiryTime,
    autoRenewStatus,
    environment: 'Production',
    googleObfuscatedAccountId,
    raw: payload,
  };

  const snapshot: EntitlementSnapshot = {
    userId,
    provider: 'google',
    planCode,
    entitlementState,
    productId,
    latestTransactionId: latestOrderId,
    originalTransactionId: latestOrderId,
    currentPeriodStart: startTime,
    currentPeriodEnd: expiryTime,
    autoRenewStatus,
    environment: 'Production',
    raw: payload,
  };

  return { purchase, snapshot };
}

async function fetchGoogleSubscription(packageName: string, purchaseToken: string): Promise<Record<string, unknown>> {
  const accessToken = await getGoogleAccessToken();
  const response = await fetch(
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new HttpError(response.status, 'Failed to verify Google subscription', await response.text());
  }

  return (await response.json()) as Record<string, unknown>;
}

type GooglePurchaseInput = {
  userId: string;
  purchaseToken: string;
  packageName?: string;
};

type GoogleWebhookInput = {
  message: {
    messageId?: string;
    data?: string;
  };
};

const googleProvider: EntitlementProvider<GooglePurchaseInput, GoogleWebhookInput> = {
  name: 'google',
  async verifyPurchase(input) {
    requireEnv(GOOGLE_PACKAGE_NAME, 'GOOGLE_PACKAGE_NAME');
    requireEnv(GOOGLE_SUBSCRIPTION_PRODUCT_ID, 'GOOGLE_SUBSCRIPTION_PRODUCT_ID');
    const packageName = input.packageName || GOOGLE_PACKAGE_NAME;
    const subscription = await fetchGoogleSubscription(packageName, input.purchaseToken);
    const mapped = mapGooglePurchase(input.userId, subscription, input.purchaseToken);

    if (mapped.purchase.productId !== GOOGLE_SUBSCRIPTION_PRODUCT_ID) {
      throw new HttpError(400, 'Google product id does not match configured subscription');
    }

    return mapped;
  },
  async resolveWebhook(input) {
    const rawData = input.message?.data ? JSON.parse(atob(input.message.data)) as Record<string, unknown> : {};
    const subscriptionNotification = (rawData.subscriptionNotification ?? {}) as Record<string, unknown>;
    const purchaseToken = String(subscriptionNotification.purchaseToken ?? '');
    const packageName = String(rawData.packageName ?? GOOGLE_PACKAGE_NAME);
    const subscription = await fetchGoogleSubscription(packageName, purchaseToken);
    const mapped = mapGooglePurchase('', subscription, purchaseToken);

    return {
      envelope: {
        provider: 'google',
        eventId: input.message?.messageId ?? crypto.randomUUID(),
        eventType: String(subscriptionNotification.notificationType ?? 'subscription_notification'),
        payload: rawData,
        receivedAt: new Date().toISOString(),
      },
      purchase: mapped.purchase,
      snapshot: mapped.snapshot,
    };
  },
};

export function getProvider(name: BillingProvider): EntitlementProvider<any, any> {
  if (name === 'apple') return appleProvider;
  if (name === 'google') return googleProvider;
  throw new HttpError(400, 'Unsupported billing provider');
}
