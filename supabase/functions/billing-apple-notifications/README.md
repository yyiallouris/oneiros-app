# billing-apple-notifications

Public webhook endpoint for App Store Server Notifications.

Behavior:

- decodes the signed payload envelope
- re-fetches authoritative transaction state from Apple's App Store Server API
- resolves the Oneiros user through `billing_accounts.apple_app_account_token`
- dedupes on `billing_webhook_events(provider, external_event_id)`
- writes transaction / entitlement updates

Required env:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APPLE_ISSUER_ID`
- `APPLE_KEY_ID`
- `APPLE_PRIVATE_KEY`
- `APPLE_BUNDLE_ID`
- `APPLE_SUBSCRIPTION_MONTHLY_PRODUCT_ID`
- optional legacy fallback: `APPLE_SUBSCRIPTION_PRODUCT_ID`
- optional: `APPLE_SUBSCRIPTION_YEARLY_PRODUCT_ID`
