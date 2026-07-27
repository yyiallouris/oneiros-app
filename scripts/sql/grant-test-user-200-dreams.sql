-- Grant a manual/test paid entitlement with 200 dream reflections per billing cycle.
-- Target email (change when rotating test users):
--   yyiallouris@gmail.com
--
-- Prerequisites:
-- 1. User already exists in Supabase Auth (sign up / magic link once).
-- 2. Prefer applying migration 20260727010000_billing_dream_reflection_limit_override.sql
--    first (`supabase db push`), so new buckets keep reading raw.dream_reflection_limit.
--    One-shot (migration + this grant): scripts/sql/apply-test-user-200-dreams-oneshot.sql
--    This grant still force-sets the current paid bucket to 200 either way.
--
-- Run in Supabase Dashboard → SQL Editor (service role / postgres).

DO $$
DECLARE
  v_email text := 'yyiallouris@gmail.com';
  v_user_id uuid;
  v_ent_id uuid;
  v_period_start timestamptz := date_trunc('month', now());
  v_period_end timestamptz := date_trunc('month', now()) + interval '1 month';
  v_limit integer := 200;
  v_bucket_key text;
BEGIN
  SELECT id
  INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower(v_email)
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'auth user not found for email % — create/sign up that user first', v_email;
  END IF;

  INSERT INTO billing_accounts (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO subscription_entitlements (
    user_id,
    provider,
    plan_code,
    entitlement_state,
    product_id,
    current_period_start,
    current_period_end,
    auto_renew_status,
    environment,
    raw
  )
  VALUES (
    v_user_id,
    'apple',
    'paid_monthly',
    'active',
    'manual_test_200',
    v_period_start,
    v_period_end,
    false,
    'manual',
    jsonb_build_object(
      'source', 'manual_test',
      'dream_reflection_limit', v_limit,
      'note', 'test user 200 dream reflections / month'
    )
  )
  ON CONFLICT (user_id) DO UPDATE SET
    provider = EXCLUDED.provider,
    plan_code = EXCLUDED.plan_code,
    entitlement_state = EXCLUDED.entitlement_state,
    product_id = EXCLUDED.product_id,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    auto_renew_status = EXCLUDED.auto_renew_status,
    environment = EXCLUDED.environment,
    raw = EXCLUDED.raw,
    updated_at = now()
  RETURNING id INTO v_ent_id;

  v_bucket_key := format(
    'dream_reflection_paid:%s:%s:%s',
    v_user_id,
    v_period_start::text,
    v_period_end::text
  );

  INSERT INTO quota_buckets (
    user_id,
    entitlement_id,
    feature_key,
    bucket_key,
    period_start,
    period_end,
    limit_count,
    used_count,
    metadata
  )
  VALUES (
    v_user_id,
    v_ent_id,
    'dream_reflection_paid',
    v_bucket_key,
    v_period_start,
    v_period_end,
    v_limit,
    0,
    jsonb_build_object(
      'plan_code', 'paid_monthly',
      'source', 'manual_test',
      'dream_reflection_limit', v_limit
    )
  )
  ON CONFLICT (bucket_key) DO UPDATE SET
    entitlement_id = EXCLUDED.entitlement_id,
    limit_count = EXCLUDED.limit_count,
    used_count = 0,
    metadata = quota_buckets.metadata || EXCLUDED.metadata,
    updated_at = now();

  -- Keep any older paid buckets for this user aligned if period dates already matched.
  UPDATE quota_buckets
  SET
    limit_count = v_limit,
    used_count = 0,
    entitlement_id = v_ent_id,
    metadata = metadata || jsonb_build_object('dream_reflection_limit', v_limit, 'source', 'manual_test'),
    updated_at = now()
  WHERE user_id = v_user_id
    AND feature_key = 'dream_reflection_paid'
    AND period_end > now();

  RAISE NOTICE 'Granted % reflections/month to % (%) until %',
    v_limit, v_email, v_user_id, v_period_end;
END $$;

-- Verify
SELECT
  u.email,
  e.plan_code,
  e.entitlement_state,
  e.current_period_start,
  e.current_period_end,
  e.product_id,
  e.environment,
  e.raw->>'dream_reflection_limit' AS dream_reflection_limit,
  b.bucket_key,
  b.limit_count,
  b.used_count
FROM auth.users u
JOIN subscription_entitlements e ON e.user_id = u.id
LEFT JOIN quota_buckets b
  ON b.user_id = u.id
 AND b.feature_key = 'dream_reflection_paid'
 AND b.period_end > now()
WHERE lower(u.email) = lower('yyiallouris@gmail.com')
ORDER BY b.period_end DESC NULLS LAST;
