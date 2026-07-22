ALTER TABLE subscription_entitlements
  DROP CONSTRAINT IF EXISTS subscription_entitlements_plan_code_check;

ALTER TABLE subscription_entitlements
  ADD CONSTRAINT subscription_entitlements_plan_code_check
  CHECK (plan_code IN ('free', 'paid_monthly', 'paid_yearly'));

ALTER TABLE subscription_transactions
  DROP CONSTRAINT IF EXISTS subscription_transactions_plan_code_check;

ALTER TABLE subscription_transactions
  ADD CONSTRAINT subscription_transactions_plan_code_check
  CHECK (plan_code IN ('free', 'paid_monthly', 'paid_yearly'));

CREATE OR REPLACE FUNCTION billing_has_paid_access(
  p_plan_code text,
  p_entitlement_state text,
  p_current_period_end timestamptz,
  p_now timestamptz DEFAULT now()
)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    p_plan_code IN ('paid_monthly', 'paid_yearly')
    AND p_entitlement_state IN ('active', 'grace_period', 'billing_retry')
    AND COALESCE(p_current_period_end > p_now, true);
$$;
