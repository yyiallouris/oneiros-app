# billing-register-purchase

Authenticated Edge Function that binds a verified store purchase to the current Oneiros user.

Supported providers:

- `apple`
  - expects `signedTransactionInfo`
- `google`
  - expects `purchaseToken`
  - optional `packageName`

Behavior:

- ensures the user's `billing_accounts` row exists
- verifies the purchase directly with Apple or Google
- confirms the store-side account identifier matches the Oneiros-linked identifier
- writes `subscription_transactions`
- upserts `subscription_entitlements`

Required env:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Apple:
  - `APPLE_ISSUER_ID`
  - `APPLE_KEY_ID`
  - `APPLE_PRIVATE_KEY`
  - `APPLE_BUNDLE_ID`
  - `APPLE_SUBSCRIPTION_PRODUCT_ID`
- Google:
  - `GOOGLE_PACKAGE_NAME`
  - `GOOGLE_SUBSCRIPTION_PRODUCT_ID`
  - either `GOOGLE_SERVICE_ACCOUNT_JSON` or both:
    - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
    - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
