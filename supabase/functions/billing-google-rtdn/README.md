# billing-google-rtdn

Public webhook endpoint for Google Play Real-time Developer Notifications.

Behavior:

- accepts Pub/Sub push payloads
- dedupes by `message.messageId`
- re-fetches authoritative subscription state from the Google Play Developer API
- resolves the Oneiros user through `billing_accounts.google_obfuscated_account_id`
- writes transaction / entitlement updates

Required env:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_PACKAGE_NAME`
- `GOOGLE_SUBSCRIPTION_PRODUCT_ID`
- optional: `GOOGLE_DEEPER_SUBSCRIPTION_PRODUCT_ID`
- optional: `GOOGLE_SUBSCRIPTION_MONTHLY_BASE_PLAN_ID` (default `monthly`)
- optional: `GOOGLE_SUBSCRIPTION_YEARLY_BASE_PLAN_ID` (default `yearly`)
- either `GOOGLE_SERVICE_ACCOUNT_JSON` or both:
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
