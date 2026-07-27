-- RESCUE: yyiallouris@gmail.com is paid but stuck at 60/60.
-- Run this NOW in Supabase Dashboard → SQL Editor.
--
-- Why this shape:
-- - Does NOT rotate current_period_start/end (avoids a new bucket_key that would
--   hardcode limit 60 again before the override migration is pushed).
-- - Raises every active paid dream-reflection bucket to 200 and resets used_count.
-- - Stamps raw.dream_reflection_limit = 200 for the override migration.

DO $$
DECLARE
  v_email text := 'yyiallouris@gmail.com';
  v_user_id uuid;
  v_ent_id uuid;
  v_limit integer := 200;
  v_period_start timestamptz;
  v_period_end timestamptz;
  v_bucket_key text;
  v_updated integer := 0;
BEGIN
  SELECT id
  INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower(v_email)
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'auth user not found for email %', v_email;
  END IF;

  INSERT INTO billing_accounts (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Keep existing period window when already paid+active; only extend if missing/expired.
  SELECT id, current_period_start, current_period_end
  INTO v_ent_id, v_period_start, v_period_end
  FROM subscription_entitlements
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_ent_id IS NULL
     OR v_period_end IS NULL
     OR v_period_end <= now()
     OR v_period_start IS NULL THEN
    v_period_start := date_trunc('month', now());
    v_period_end := date_trunc('month', now()) + interval '1 month';
  END IF;

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
      'note', 'rescue: 200 dream reflections / cycle'
    )
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan_code = 'paid_monthly',
    entitlement_state = 'active',
    product_id = 'manual_test_200',
    current_period_start = COALESCE(subscription_entitlements.current_period_start, EXCLUDED.current_period_start),
    current_period_end = CASE
      WHEN subscription_entitlements.current_period_end IS NULL
        OR subscription_entitlements.current_period_end <= now()
        THEN EXCLUDED.current_period_end
      ELSE subscription_entitlements.current_period_end
    END,
    auto_renew_status = false,
    environment = 'manual',
    raw = COALESCE(subscription_entitlements.raw, '{}'::jsonb) || jsonb_build_object(
      'source', 'manual_test',
      'dream_reflection_limit', v_limit,
      'note', 'rescue: 200 dream reflections / cycle'
    ),
    updated_at = now()
  RETURNING id, current_period_start, current_period_end
  INTO v_ent_id, v_period_start, v_period_end;

  -- Raise + reset EVERY active paid dream bucket for this user (covers old bucket_keys).
  UPDATE quota_buckets
  SET
    limit_count = v_limit,
    used_count = 0,
    entitlement_id = v_ent_id,
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'source', 'manual_test',
      'dream_reflection_limit', v_limit,
      'rescued_at', now()
    ),
    updated_at = now()
  WHERE user_id = v_user_id
    AND feature_key = 'dream_reflection_paid'
    AND period_end > now();

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  -- Ensure the bucket matching the current entitlement period exists.
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
      'dream_reflection_limit', v_limit,
      'rescued_at', now()
    )
  )
  ON CONFLICT (bucket_key) DO UPDATE SET
    entitlement_id = EXCLUDED.entitlement_id,
    limit_count = EXCLUDED.limit_count,
    used_count = 0,
    metadata = quota_buckets.metadata || EXCLUDED.metadata,
    updated_at = now();

  RAISE NOTICE 'Rescued % — entitlement %, active paid buckets updated %, limit %, period % → %',
    v_email, v_ent_id, v_updated, v_limit, v_period_start, v_period_end;
END $$;

-- Verify (expect limit_count=200, used_count=0, dream_reflection_limit=200)
SELECT
  u.email,
  e.plan_code,
  e.entitlement_state,
  e.current_period_start,
  e.current_period_end,
  e.product_id,
  e.raw->>'dream_reflection_limit' AS dream_reflection_limit,
  b.bucket_key,
  b.limit_count,
  b.used_count,
  b.period_end
FROM auth.users u
JOIN subscription_entitlements e ON e.user_id = u.id
LEFT JOIN quota_buckets b
  ON b.user_id = u.id
 AND b.feature_key = 'dream_reflection_paid'
 AND b.period_end > now()
WHERE lower(u.email) = lower('yyiallouris@gmail.com')
ORDER BY b.period_end DESC NULLS LAST;
