-- ONE-SHOT: apply dream_reflection_limit override + grant 200/month test user
-- Generated for Dashboard SQL Editor. Prefer supabase db push for the migration half long-term.

-- Allow manual/test entitlements to override the paid dream-reflection cycle limit
-- via subscription_entitlements.raw.dream_reflection_limit (default remains 60).

CREATE OR REPLACE FUNCTION billing_paid_dream_reflection_limit(p_raw jsonb)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT GREATEST(
    1,
    COALESCE(
      NULLIF((COALESCE(p_raw, '{}'::jsonb)->>'dream_reflection_limit')::integer, 0),
      60
    )
  );
$$;

COMMENT ON FUNCTION billing_paid_dream_reflection_limit(jsonb) IS
  'Paid dream-reflection cycle limit. Reads optional raw.dream_reflection_limit; defaults to 60.';


CREATE OR REPLACE FUNCTION billing_reserve_quota(
  p_user_id uuid,
  p_action text,
  p_idempotency_key text,
  p_context jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_context jsonb := COALESCE(p_context, '{}'::jsonb);
  v_event quota_events;
  v_bucket quota_buckets;
  v_ent subscription_entitlements;
  v_artifact ai_generation_artifacts;
  v_now timestamptz := now();
  v_paid boolean := false;
  v_feature_key text := '';
  v_reason text := NULL;
  v_interpretation RECORD;
  v_scope_key text := COALESCE(v_context->>'scope_key', '');
  v_scope_type text := COALESCE(v_context->>'scope_type', '');
  v_language text := COALESCE(v_context->>'language', 'en');
  v_month_key text := COALESCE(v_context->>'month_key', '');
  v_is_current_month boolean := COALESCE((v_context->>'is_current_month')::boolean, false);
  v_is_same_language boolean := false;
  v_latest_reflected_at timestamptz := NULLIF(v_context->>'latest_reflected_at', '')::timestamptz;
  v_last_generated_at timestamptz := NULL;
  v_dream_count integer := COALESCE((v_context->>'dream_count')::integer, 0);
  v_bucket_key text;
  v_limit integer;
BEGIN
  SELECT *
  INTO v_event
  FROM quota_events
  WHERE user_id = p_user_id
    AND action = p_action
    AND idempotency_key = p_idempotency_key
  FOR UPDATE;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'status', v_event.status,
      'quota_event_id', v_event.id,
      'bucket_id', v_event.bucket_id,
      'artifact_id', v_event.artifact_id,
      'reason', v_event.denial_reason,
      'result', v_event.result_context
    );
  END IF;

  SELECT *
  INTO v_ent
  FROM subscription_entitlements
  WHERE user_id = p_user_id
  ORDER BY updated_at DESC
  LIMIT 1;

  IF FOUND THEN
    v_paid := billing_has_paid_access(v_ent.plan_code, v_ent.entitlement_state, v_ent.current_period_end, v_now);
  END IF;

  IF p_action IN ('dream_reflection_generate', 'dream_reflection_regenerate') THEN
    IF v_paid THEN
      v_feature_key := 'dream_reflection_paid';
      v_bucket_key := format(
        'dream_reflection_paid:%s:%s:%s',
        p_user_id,
        COALESCE(v_ent.current_period_start::text, 'none'),
        COALESCE(v_ent.current_period_end::text, 'none')
      );
      v_limit := billing_paid_dream_reflection_limit(v_ent.raw);

      INSERT INTO quota_buckets (
        user_id,
        entitlement_id,
        feature_key,
        bucket_key,
        period_start,
        period_end,
        limit_count,
        metadata
      )
      VALUES (
        p_user_id,
        v_ent.id,
        v_feature_key,
        v_bucket_key,
        COALESCE(v_ent.current_period_start, v_now),
        COALESCE(v_ent.current_period_end, v_now),
        v_limit,
        jsonb_build_object('plan_code', v_ent.plan_code)
      )
      ON CONFLICT (bucket_key) DO UPDATE
      SET
        limit_count = EXCLUDED.limit_count,
        entitlement_id = EXCLUDED.entitlement_id,
        metadata = quota_buckets.metadata || EXCLUDED.metadata,
        updated_at = now();

      SELECT *
      INTO v_bucket
      FROM quota_buckets
      WHERE bucket_key = v_bucket_key
      FOR UPDATE;

      IF v_bucket.used_count >= v_bucket.limit_count THEN
        v_reason := 'dream_reflection_quota_reached';
      END IF;
    ELSE
      v_feature_key := 'dream_reflection_free';

      SELECT *
      INTO v_bucket
      FROM quota_buckets
      WHERE user_id = p_user_id
        AND feature_key = v_feature_key
        AND period_end > v_now
      ORDER BY period_end DESC
      LIMIT 1
      FOR UPDATE;

      IF NOT FOUND THEN
        INSERT INTO quota_buckets (
          user_id,
          feature_key,
          bucket_key,
          period_start,
          period_end,
          limit_count,
          metadata
        )
        VALUES (
          p_user_id,
          v_feature_key,
          format('dream_reflection_free:%s:%s', p_user_id, replace(v_now::text, ' ', '_')),
          v_now,
          v_now + interval '7 days',
          1,
          jsonb_build_object('window_type', 'rolling_7_day')
        )
        RETURNING * INTO v_bucket;
      END IF;

      IF v_bucket.used_count >= v_bucket.limit_count THEN
        v_reason := 'free_weekly_reflection_unavailable';
      END IF;

      v_context := v_context || jsonb_build_object('reflection_origin', 'free_weekly');
    END IF;

    IF v_reason IS NULL AND v_paid THEN
      v_context := v_context || jsonb_build_object('reflection_origin', 'paid_cycle');
    END IF;
  ELSIF p_action = 'dream_followup_reply' THEN
    v_feature_key := 'dream_followup_reply';

    SELECT
      i.id,
      i.reflection_origin,
      i.chat_replies_used,
      i.chat_replies_limit
    INTO v_interpretation
    FROM interpretations i
    WHERE i.user_id = p_user_id
      AND i.id = (v_context->>'interpretation_id')
    FOR UPDATE;

    IF NOT FOUND THEN
      v_reason := 'interpretation_not_found';
    ELSIF COALESCE(v_interpretation.chat_replies_used, 0) >= COALESCE(v_interpretation.chat_replies_limit, 5) THEN
      v_reason := 'chat_reply_limit_reached';
    ELSIF v_interpretation.reflection_origin = 'paid_cycle' AND NOT v_paid THEN
      v_reason := 'paid_reflection_read_only_after_lapse';
    ELSIF v_interpretation.reflection_origin IS NULL THEN
      v_reason := 'interpretation_origin_missing';
    END IF;
  ELSIF p_action = 'recent_dream_field_generate' THEN
    v_feature_key := 'recent_dream_field_paid';

    IF NOT v_paid THEN
      v_reason := 'paid_subscription_required';
    ELSIF v_scope_key = '' OR v_scope_type <> 'recent_sequence' THEN
      v_reason := 'invalid_recent_scope';
    ELSE
      SELECT *
      INTO v_artifact
      FROM ai_generation_artifacts
      WHERE user_id = p_user_id
        AND scope_type = 'recent_sequence'
        AND scope_key = v_scope_key
        AND language = v_language
        AND artifact_state = 'ready'
      LIMIT 1;

      IF FOUND THEN
        INSERT INTO quota_events (
          user_id,
          entitlement_id,
          action,
          feature_key,
          status,
          idempotency_key,
          artifact_id,
          request_context,
          result_context
        )
        VALUES (
          p_user_id,
          v_ent.id,
          p_action,
          v_feature_key,
          'cached',
          p_idempotency_key,
          v_artifact.id,
          v_context,
          jsonb_build_object('artifact_id', v_artifact.id, 'content', v_artifact.content, 'scope_key', v_artifact.scope_key)
        )
        RETURNING * INTO v_event;

        RETURN jsonb_build_object(
          'status', v_event.status,
          'quota_event_id', v_event.id,
          'artifact_id', v_artifact.id,
          'result', v_event.result_context
        );
      END IF;

      v_bucket_key := format(
        'recent_dream_field_paid:%s:%s:%s',
        p_user_id,
        COALESCE(v_ent.current_period_start::text, 'none'),
        COALESCE(v_ent.current_period_end::text, 'none')
      );
      v_limit := 10;

      INSERT INTO quota_buckets (
        user_id,
        entitlement_id,
        feature_key,
        bucket_key,
        period_start,
        period_end,
        limit_count,
        metadata
      )
      VALUES (
        p_user_id,
        v_ent.id,
        v_feature_key,
        v_bucket_key,
        COALESCE(v_ent.current_period_start, v_now),
        COALESCE(v_ent.current_period_end, v_now),
        v_limit,
        jsonb_build_object('plan_code', v_ent.plan_code)
      )
      ON CONFLICT (bucket_key) DO NOTHING;

      SELECT *
      INTO v_bucket
      FROM quota_buckets
      WHERE bucket_key = v_bucket_key
      FOR UPDATE;

      IF v_bucket.used_count >= v_bucket.limit_count THEN
        v_reason := 'recent_dream_field_quota_reached';
      END IF;
    END IF;
  ELSIF p_action = 'period_reflection_generate' THEN
    v_feature_key := 'period_reflection';

    IF NOT v_paid THEN
      v_reason := 'paid_subscription_required';
    ELSIF v_scope_key = '' OR v_scope_type <> 'calendar_period' THEN
      v_reason := 'invalid_period_scope';
    ELSIF v_dream_count < 2 THEN
      v_reason := 'not_enough_reflected_dreams';
    ELSE
      SELECT *
      INTO v_artifact
      FROM ai_generation_artifacts
      WHERE user_id = p_user_id
        AND scope_type = 'calendar_period'
        AND scope_key = v_scope_key
        AND artifact_state = 'ready'
      ORDER BY created_at DESC
      LIMIT 1;

      IF FOUND THEN
        v_is_same_language := v_artifact.language = v_language;
        IF v_is_same_language THEN
          INSERT INTO quota_events (
            user_id,
            entitlement_id,
            action,
            feature_key,
            status,
            idempotency_key,
            artifact_id,
            request_context,
            result_context
          )
          VALUES (
            p_user_id,
            v_ent.id,
            p_action,
            v_feature_key,
            'cached',
            p_idempotency_key,
            v_artifact.id,
            v_context,
            jsonb_build_object('artifact_id', v_artifact.id, 'content', v_artifact.content, 'scope_key', v_artifact.scope_key)
          )
          RETURNING * INTO v_event;

          RETURN jsonb_build_object(
            'status', v_event.status,
            'quota_event_id', v_event.id,
            'artifact_id', v_artifact.id,
            'result', v_event.result_context
          );
        END IF;

        v_reason := 'period_reflection_already_exists';
      END IF;

      IF v_reason IS NULL AND v_is_current_month THEN
        SELECT generated_at
        INTO v_last_generated_at
        FROM pattern_reports
        WHERE user_id = p_user_id
          AND month_key LIKE (v_month_key || '%')
        ORDER BY generated_at DESC
        LIMIT 1;

        IF v_last_generated_at IS NOT NULL AND (v_latest_reflected_at IS NULL OR v_latest_reflected_at <= v_last_generated_at) THEN
          v_reason := 'no_new_reflected_dream_since_last_generation';
        END IF;
      END IF;
    END IF;
  ELSE
    v_reason := 'unsupported_action';
  END IF;

  IF v_reason IS NOT NULL THEN
    INSERT INTO quota_events (
      user_id,
      entitlement_id,
      bucket_id,
      action,
      feature_key,
      status,
      idempotency_key,
      denial_reason,
      request_context
    )
    VALUES (
      p_user_id,
      v_ent.id,
      v_bucket.id,
      p_action,
      COALESCE(v_feature_key, p_action),
      'denied',
      p_idempotency_key,
      v_reason,
      v_context
    )
    RETURNING * INTO v_event;

    RETURN jsonb_build_object(
      'status', v_event.status,
      'quota_event_id', v_event.id,
      'bucket_id', v_event.bucket_id,
      'reason', v_event.denial_reason
    );
  END IF;

  INSERT INTO quota_events (
    user_id,
    entitlement_id,
    bucket_id,
    action,
    feature_key,
    status,
    idempotency_key,
    request_context
  )
  VALUES (
    p_user_id,
    v_ent.id,
    v_bucket.id,
    p_action,
    v_feature_key,
    'pending',
    p_idempotency_key,
    v_context
  )
  RETURNING * INTO v_event;

  RETURN jsonb_build_object(
    'status', v_event.status,
    'quota_event_id', v_event.id,
    'bucket_id', v_event.bucket_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION billing_subscription_status(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account billing_accounts;
  v_ent subscription_entitlements;
  v_now timestamptz := now();
  v_plan_code text := 'free';
  v_state text := 'inactive';
  v_paid boolean := false;
  v_dream_bucket quota_buckets;
  v_recent_bucket quota_buckets;
  v_free_bucket quota_buckets;
  v_dream_used integer := 0;
  v_dream_limit integer := 1;
  v_dream_remaining integer := 1;
  v_recent_used integer := 0;
  v_recent_limit integer := 0;
  v_recent_remaining integer := 0;
  v_dream_next_reset timestamptz := NULL;
  v_recent_next_reset timestamptz := NULL;
BEGIN
  v_account := billing_ensure_account(p_user_id);

  SELECT *
  INTO v_ent
  FROM subscription_entitlements
  WHERE user_id = p_user_id
  ORDER BY updated_at DESC
  LIMIT 1;

  IF FOUND THEN
    v_paid := billing_has_paid_access(v_ent.plan_code, v_ent.entitlement_state, v_ent.current_period_end, v_now);
    IF v_paid THEN
      v_plan_code := v_ent.plan_code;
      v_state := v_ent.entitlement_state;
    END IF;
  END IF;

  IF v_paid THEN
    v_dream_limit := billing_paid_dream_reflection_limit(v_ent.raw);
    v_recent_limit := 10;

    SELECT *
    INTO v_dream_bucket
    FROM quota_buckets
    WHERE user_id = p_user_id
      AND entitlement_id = v_ent.id
      AND feature_key = 'dream_reflection_paid'
    ORDER BY period_end DESC
    LIMIT 1;

    IF FOUND THEN
      v_dream_limit := COALESCE(NULLIF(v_dream_bucket.limit_count, 0), v_dream_limit);
      v_dream_used := COALESCE(v_dream_bucket.used_count, 0);
    END IF;
    v_dream_remaining := GREATEST(v_dream_limit - v_dream_used, 0);

    SELECT *
    INTO v_recent_bucket
    FROM quota_buckets
    WHERE user_id = p_user_id
      AND entitlement_id = v_ent.id
      AND feature_key = 'recent_dream_field_paid'
    ORDER BY period_end DESC
    LIMIT 1;
    v_dream_next_reset := v_ent.current_period_end;

    v_recent_used := COALESCE(v_recent_bucket.used_count, 0);
    v_recent_remaining := GREATEST(v_recent_limit - v_recent_used, 0);
    v_recent_next_reset := v_ent.current_period_end;
  ELSE
    SELECT *
    INTO v_free_bucket
    FROM quota_buckets
    WHERE user_id = p_user_id
      AND feature_key = 'dream_reflection_free'
      AND period_end > v_now
    ORDER BY period_end DESC
    LIMIT 1;

    IF FOUND THEN
      v_dream_used := LEAST(v_free_bucket.used_count, 1);
      v_dream_remaining := GREATEST(1 - v_dream_used, 0);
      v_dream_next_reset := v_free_bucket.period_end;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'plan_code', v_plan_code,
    'entitlement_state', v_state,
    'current_period_start', CASE WHEN v_paid THEN v_ent.current_period_start ELSE NULL END,
    'current_period_end', CASE WHEN v_paid THEN v_ent.current_period_end ELSE NULL END,
    'app_account_token', v_account.apple_app_account_token,
    'google_obfuscated_account_id', v_account.google_obfuscated_account_id,
    'quotas', jsonb_build_object(
      'dream_reflections', jsonb_build_object(
        'limit', v_dream_limit,
        'used', v_dream_used,
        'remaining', v_dream_remaining,
        'next_reset_at', v_dream_next_reset
      ),
      'recent_dream_field', jsonb_build_object(
        'limit', v_recent_limit,
        'used', v_recent_used,
        'remaining', v_recent_remaining,
        'next_reset_at', v_recent_next_reset
      ),
      'period_reflection', jsonb_build_object(
        'limit', NULL,
        'used', NULL,
        'remaining', NULL,
        'next_reset_at', CASE WHEN v_paid THEN v_ent.current_period_end ELSE NULL END
      )
    )
  );
END;
$$;

-- ---- grant test user ----

-- Grant a manual/test paid entitlement with 200 dream reflections per billing cycle.
-- Target email (change when rotating test users):
--   yyiallouris@gmail.com
--
-- Prerequisites:
-- 1. User already exists in Supabase Auth (sign up / magic link once).
-- 2. Prefer applying migration 20260727010000_billing_dream_reflection_limit_override.sql
--    first (`supabase db push`), so new buckets keep reading raw.dream_reflection_limit.
--    This script still force-sets the current paid bucket to 200 either way.
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
    metadata = quota_buckets.metadata || EXCLUDED.metadata,
    updated_at = now();

  -- Keep any older paid buckets for this user aligned if period dates already matched.
  UPDATE quota_buckets
  SET
    limit_count = v_limit,
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
