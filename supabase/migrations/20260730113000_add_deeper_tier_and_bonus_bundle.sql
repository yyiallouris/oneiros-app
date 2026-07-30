ALTER TABLE subscription_entitlements
  DROP CONSTRAINT IF EXISTS subscription_entitlements_plan_code_check;

ALTER TABLE subscription_entitlements
  ADD CONSTRAINT subscription_entitlements_plan_code_check
  CHECK (plan_code IN ('free', 'paid_monthly', 'paid_yearly', 'deeper_monthly', 'deeper_yearly'));

ALTER TABLE subscription_transactions
  DROP CONSTRAINT IF EXISTS subscription_transactions_plan_code_check;

ALTER TABLE subscription_transactions
  ADD CONSTRAINT subscription_transactions_plan_code_check
  CHECK (plan_code IN ('free', 'paid_monthly', 'paid_yearly', 'deeper_monthly', 'deeper_yearly'));

CREATE TABLE IF NOT EXISTS billing_bonus_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  entitlement_id uuid REFERENCES subscription_entitlements(id) ON DELETE SET NULL,
  grant_type text NOT NULL CHECK (grant_type IN ('paid_limit_grace_bundle')),
  dream_reflection_bonus integer NOT NULL DEFAULT 5 CHECK (dream_reflection_bonus >= 0),
  recent_dream_field_bonus integer NOT NULL DEFAULT 5 CHECK (recent_dream_field_bonus >= 0),
  granted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_bonus_grants_user_created_idx
  ON billing_bonus_grants (user_id, created_at DESC);

ALTER TABLE billing_bonus_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own billing bonus grants"
  ON billing_bonus_grants
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION billing_plan_tier(p_plan_code text)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN p_plan_code IN ('paid_monthly', 'paid_yearly') THEN 'premium'
    WHEN p_plan_code IN ('deeper_monthly', 'deeper_yearly') THEN 'deeper'
    ELSE 'free'
  END;
$$;

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
    billing_plan_tier(p_plan_code) <> 'free'
    AND p_entitlement_state IN ('active', 'grace_period', 'billing_retry')
    AND COALESCE(p_current_period_end > p_now, true);
$$;

CREATE OR REPLACE FUNCTION billing_paid_dream_reflection_limit(p_plan_code text, p_raw jsonb)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT GREATEST(
    1,
    COALESCE(
      NULLIF((COALESCE(p_raw, '{}'::jsonb)->>'dream_reflection_limit')::integer, 0),
      CASE
        WHEN billing_plan_tier(p_plan_code) = 'deeper' THEN 80
        ELSE 35
      END
    )
  );
$$;

CREATE OR REPLACE FUNCTION billing_paid_dream_reflection_limit(p_raw jsonb)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT billing_paid_dream_reflection_limit('paid_monthly', p_raw);
$$;

CREATE OR REPLACE FUNCTION billing_paid_recent_dream_field_limit(p_plan_code text, p_raw jsonb)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN billing_plan_tier(p_plan_code) = 'deeper' THEN 0
    ELSE GREATEST(
      1,
      COALESCE(
        NULLIF((COALESCE(p_raw, '{}'::jsonb)->>'recent_dream_field_limit')::integer, 0),
        10
      )
    )
  END;
$$;

CREATE OR REPLACE FUNCTION billing_paid_essay_cadence(p_plan_code text)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN billing_plan_tier(p_plan_code) = 'deeper' THEN 'weekly'
    WHEN billing_plan_tier(p_plan_code) = 'premium' THEN 'monthly'
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION billing_try_grant_paid_limit_bundle(
  p_user_id uuid,
  p_entitlement_id uuid,
  p_plan_code text,
  p_raw jsonb,
  p_period_start timestamptz,
  p_period_end timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_grant billing_bonus_grants;
  v_plan_tier text := billing_plan_tier(p_plan_code);
  v_dream_bucket_key text := format(
    'dream_reflection_paid:%s:%s:%s',
    p_user_id,
    COALESCE(p_period_start::text, 'none'),
    COALESCE(p_period_end::text, 'none')
  );
  v_recent_bucket_key text := format(
    'recent_dream_field_paid:%s:%s:%s',
    p_user_id,
    COALESCE(p_period_start::text, 'none'),
    COALESCE(p_period_end::text, 'none')
  );
  v_dream_limit integer := billing_paid_dream_reflection_limit(p_plan_code, p_raw);
  v_recent_limit integer := billing_paid_recent_dream_field_limit(p_plan_code, p_raw);
BEGIN
  INSERT INTO billing_bonus_grants (
    user_id,
    entitlement_id,
    grant_type,
    dream_reflection_bonus,
    recent_dream_field_bonus
  )
  VALUES (
    p_user_id,
    p_entitlement_id,
    'paid_limit_grace_bundle',
    5,
    CASE WHEN v_plan_tier = 'premium' THEN 5 ELSE 0 END
  )
  ON CONFLICT (user_id) DO NOTHING
  RETURNING * INTO v_grant;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('granted', false);
  END IF;

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
    p_entitlement_id,
    'dream_reflection_paid',
    v_dream_bucket_key,
    COALESCE(p_period_start, now()),
    COALESCE(p_period_end, now()),
    v_dream_limit,
    jsonb_build_object('plan_code', p_plan_code, 'plan_tier', v_plan_tier)
  )
  ON CONFLICT (bucket_key) DO NOTHING;

  UPDATE quota_buckets
  SET
    limit_count = CASE
      WHEN limit_count = 0 THEN 0
      ELSE limit_count + 5
    END,
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('bonus_bundle_granted', true),
    updated_at = now()
  WHERE bucket_key = v_dream_bucket_key;

  IF v_plan_tier = 'premium' THEN
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
      p_entitlement_id,
      'recent_dream_field_paid',
      v_recent_bucket_key,
      COALESCE(p_period_start, now()),
      COALESCE(p_period_end, now()),
      v_recent_limit,
      jsonb_build_object('plan_code', p_plan_code, 'plan_tier', v_plan_tier)
    )
    ON CONFLICT (bucket_key) DO NOTHING;

    UPDATE quota_buckets
    SET
      limit_count = CASE
        WHEN limit_count = 0 THEN 0
        ELSE limit_count + 5
      END,
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('bonus_bundle_granted', true),
      updated_at = now()
    WHERE bucket_key = v_recent_bucket_key;
  END IF;

  RETURN jsonb_build_object(
    'granted', true,
    'kind', 'paid_limit_grace_bundle',
    'plan_tier', v_plan_tier,
    'dream_reflection_bonus', 5,
    'recent_dream_field_bonus', CASE WHEN v_plan_tier = 'premium' THEN 5 ELSE 0 END,
    'message_key', 'paid_limit_grace_bundle_granted'
  );
END;
$$;

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
  v_is_current_month boolean := COALESCE((v_context->>'is_current_month')::boolean, false);
  v_dream_count integer := COALESCE((v_context->>'dream_count')::integer, 0);
  v_bucket_key text;
  v_limit integer;
  v_plan_tier text := 'free';
  v_bonus_grant jsonb := '{"granted": false}'::jsonb;
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
    v_plan_tier := billing_plan_tier(v_ent.plan_code);
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
      v_limit := billing_paid_dream_reflection_limit(v_ent.plan_code, v_ent.raw);

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
        jsonb_build_object('plan_code', v_ent.plan_code, 'plan_tier', v_plan_tier)
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
        v_bonus_grant := billing_try_grant_paid_limit_bundle(
          p_user_id,
          v_ent.id,
          v_ent.plan_code,
          v_ent.raw,
          v_ent.current_period_start,
          v_ent.current_period_end
        );
        IF COALESCE((v_bonus_grant->>'granted')::boolean, false) THEN
          v_context := v_context || jsonb_build_object('bonus_grant', v_bonus_grant);
          SELECT *
          INTO v_bucket
          FROM quota_buckets
          WHERE bucket_key = v_bucket_key
          FOR UPDATE;
        END IF;
      END IF;

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
      v_limit := billing_paid_recent_dream_field_limit(v_ent.plan_code, v_ent.raw);

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
        jsonb_build_object('plan_code', v_ent.plan_code, 'plan_tier', v_plan_tier)
      )
      ON CONFLICT (bucket_key) DO NOTHING;

      SELECT *
      INTO v_bucket
      FROM quota_buckets
      WHERE bucket_key = v_bucket_key
      FOR UPDATE;

      IF v_bucket.limit_count > 0 AND v_bucket.used_count >= v_bucket.limit_count THEN
        v_bonus_grant := billing_try_grant_paid_limit_bundle(
          p_user_id,
          v_ent.id,
          v_ent.plan_code,
          v_ent.raw,
          v_ent.current_period_start,
          v_ent.current_period_end
        );
        IF COALESCE((v_bonus_grant->>'granted')::boolean, false) THEN
          v_context := v_context || jsonb_build_object('bonus_grant', v_bonus_grant);
          SELECT *
          INTO v_bucket
          FROM quota_buckets
          WHERE bucket_key = v_bucket_key
          FOR UPDATE;
        END IF;
      END IF;

      IF v_bucket.limit_count > 0 AND v_bucket.used_count >= v_bucket.limit_count THEN
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
        IF v_artifact.language = v_language THEN
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
      request_context,
      result_context
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
      v_context,
      CASE WHEN COALESCE((v_context->'bonus_grant'->>'granted')::boolean, false)
        THEN jsonb_build_object('bonus_grant', v_context->'bonus_grant')
        ELSE '{}'::jsonb
      END
    )
    RETURNING * INTO v_event;

    RETURN jsonb_build_object(
      'status', v_event.status,
      'quota_event_id', v_event.id,
      'bucket_id', v_event.bucket_id,
      'reason', v_event.denial_reason,
      'result', v_event.result_context
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
    request_context,
    result_context
  )
  VALUES (
    p_user_id,
    v_ent.id,
    v_bucket.id,
    p_action,
    v_feature_key,
    'pending',
    p_idempotency_key,
    v_context,
    CASE WHEN COALESCE((v_context->'bonus_grant'->>'granted')::boolean, false)
      THEN jsonb_build_object('bonus_grant', v_context->'bonus_grant')
      ELSE '{}'::jsonb
    END
  )
  RETURNING * INTO v_event;

  RETURN jsonb_build_object(
    'status', v_event.status,
    'quota_event_id', v_event.id,
    'bucket_id', v_event.bucket_id,
    'result', v_event.result_context
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
  v_bonus billing_bonus_grants;
  v_now timestamptz := now();
  v_plan_code text := 'free';
  v_plan_tier text := 'free';
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
  v_essay_cadence text := NULL;
BEGIN
  v_account := billing_ensure_account(p_user_id);

  SELECT *
  INTO v_ent
  FROM subscription_entitlements
  WHERE user_id = p_user_id
  ORDER BY updated_at DESC
  LIMIT 1;

  SELECT *
  INTO v_bonus
  FROM billing_bonus_grants
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    v_paid := billing_has_paid_access(v_ent.plan_code, v_ent.entitlement_state, v_ent.current_period_end, v_now);
    IF v_paid THEN
      v_plan_code := v_ent.plan_code;
      v_plan_tier := billing_plan_tier(v_ent.plan_code);
      v_state := v_ent.entitlement_state;
      v_essay_cadence := billing_paid_essay_cadence(v_ent.plan_code);
    END IF;
  END IF;

  IF v_paid THEN
    v_dream_limit := billing_paid_dream_reflection_limit(v_ent.plan_code, v_ent.raw);
    v_recent_limit := billing_paid_recent_dream_field_limit(v_ent.plan_code, v_ent.raw);

    SELECT *
    INTO v_dream_bucket
    FROM quota_buckets
    WHERE user_id = p_user_id
      AND entitlement_id = v_ent.id
      AND feature_key = 'dream_reflection_paid'
    ORDER BY period_end DESC
    LIMIT 1;

    IF FOUND THEN
      IF v_dream_bucket.limit_count > 0 THEN
        v_dream_limit := v_dream_bucket.limit_count;
      END IF;
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
    IF COALESCE(v_recent_bucket.limit_count, v_recent_limit) = 0 THEN
      v_recent_limit := 0;
      v_recent_remaining := 0;
    ELSE
      IF FOUND AND v_recent_bucket.limit_count > 0 THEN
        v_recent_limit := v_recent_bucket.limit_count;
      END IF;
      v_recent_remaining := GREATEST(v_recent_limit - v_recent_used, 0);
    END IF;
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
    'plan_tier', v_plan_tier,
    'entitlement_state', v_state,
    'current_period_start', CASE WHEN v_paid THEN v_ent.current_period_start ELSE NULL END,
    'current_period_end', CASE WHEN v_paid THEN v_ent.current_period_end ELSE NULL END,
    'essay_cadence', v_essay_cadence,
    'bonus_grace_bundle_used', v_bonus.id IS NOT NULL,
    'bonus_grace_bundle_granted_at', v_bonus.granted_at,
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
        'limit', CASE WHEN v_recent_limit = 0 THEN NULL ELSE v_recent_limit END,
        'used', v_recent_used,
        'remaining', CASE WHEN v_recent_limit = 0 THEN NULL ELSE v_recent_remaining END,
        'next_reset_at', CASE WHEN v_recent_limit = 0 THEN NULL ELSE v_recent_next_reset END
      ),
      'period_reflection', jsonb_build_object(
        'limit', CASE WHEN v_paid THEN 1 ELSE NULL END,
        'used', NULL,
        'remaining', NULL,
        'next_reset_at', CASE WHEN v_paid THEN v_ent.current_period_end ELSE NULL END,
        'cadence', v_essay_cadence
      )
    )
  );
END;
$$;
