CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION billing_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS billing_accounts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  apple_app_account_token uuid NOT NULL DEFAULT gen_random_uuid(),
  google_obfuscated_account_id text NOT NULL DEFAULT ('oneiros_' || replace(gen_random_uuid()::text, '-', '')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (apple_app_account_token),
  UNIQUE (google_obfuscated_account_id)
);

CREATE TABLE IF NOT EXISTS subscription_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('apple', 'google')),
  plan_code text NOT NULL CHECK (plan_code IN ('free', 'paid_monthly')),
  entitlement_state text NOT NULL CHECK (
    entitlement_state IN ('inactive', 'active', 'grace_period', 'billing_retry', 'paused', 'expired', 'revoked', 'refunded')
  ),
  product_id text NOT NULL,
  store_subscription_id text,
  original_transaction_id text,
  latest_transaction_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  auto_renew_status boolean,
  environment text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscription_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('apple', 'google')),
  transaction_key text NOT NULL UNIQUE,
  external_transaction_id text NOT NULL,
  original_transaction_id text,
  purchase_token text,
  plan_code text NOT NULL CHECK (plan_code IN ('free', 'paid_monthly')),
  entitlement_state text NOT NULL CHECK (
    entitlement_state IN ('inactive', 'active', 'grace_period', 'billing_retry', 'paused', 'expired', 'revoked', 'refunded')
  ),
  product_id text NOT NULL,
  transaction_type text NOT NULL,
  transaction_time timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  auto_renew_status boolean,
  environment text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('apple', 'google')),
  external_event_id text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'duplicate', 'failed')),
  processed_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, external_event_id)
);

CREATE TABLE IF NOT EXISTS quota_buckets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entitlement_id uuid REFERENCES subscription_entitlements(id) ON DELETE SET NULL,
  feature_key text NOT NULL CHECK (
    feature_key IN ('dream_reflection_free', 'dream_reflection_paid', 'recent_dream_field_paid', 'period_reflection')
  ),
  bucket_key text NOT NULL UNIQUE,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  limit_count integer NOT NULL CHECK (limit_count >= 0),
  used_count integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quota_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entitlement_id uuid REFERENCES subscription_entitlements(id) ON DELETE SET NULL,
  bucket_id uuid REFERENCES quota_buckets(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (
    action IN (
      'dream_reflection_generate',
      'dream_reflection_regenerate',
      'dream_followup_reply',
      'recent_dream_field_generate',
      'period_reflection_generate'
    )
  ),
  feature_key text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'committed', 'released', 'denied', 'cached')),
  idempotency_key text NOT NULL,
  artifact_id uuid,
  denial_reason text,
  request_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, action, idempotency_key)
);

CREATE TABLE IF NOT EXISTS ai_generation_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entitlement_id uuid REFERENCES subscription_entitlements(id) ON DELETE SET NULL,
  quota_event_id uuid REFERENCES quota_events(id) ON DELETE SET NULL,
  source_action text NOT NULL CHECK (
    source_action IN (
      'dream_reflection_generate',
      'dream_reflection_regenerate',
      'recent_dream_field_generate',
      'period_reflection_generate'
    )
  ),
  scope_type text NOT NULL CHECK (scope_type IN ('calendar_period', 'recent_sequence')),
  scope_key text NOT NULL,
  artifact_state text NOT NULL DEFAULT 'ready' CHECK (artifact_state IN ('ready', 'failed')),
  language text NOT NULL DEFAULT 'en',
  start_date date,
  end_date date,
  dream_ids text[] NOT NULL DEFAULT ARRAY[]::text[],
  dream_count integer NOT NULL DEFAULT 0,
  month_key text,
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, scope_type, scope_key, language)
);

ALTER TABLE quota_events
  ADD CONSTRAINT quota_events_artifact_id_fkey
  FOREIGN KEY (artifact_id) REFERENCES ai_generation_artifacts(id) ON DELETE SET NULL;

ALTER TABLE interpretations
  ADD COLUMN IF NOT EXISTS reflection_origin text CHECK (reflection_origin IN ('free_weekly', 'paid_cycle')),
  ADD COLUMN IF NOT EXISTS chat_replies_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS chat_replies_limit integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS origin_quota_event_id uuid REFERENCES quota_events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS origin_entitlement_id uuid REFERENCES subscription_entitlements(id) ON DELETE SET NULL;

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS time_zone text;

COMMENT ON TABLE billing_accounts IS 'Stable user-linked store identifiers for Apple appAccountToken and Google obfuscated account id.';
COMMENT ON TABLE subscription_entitlements IS 'Current normalized subscription snapshot per user. Free is derived when no active paid entitlement exists.';
COMMENT ON TABLE subscription_transactions IS 'Verified store purchase / renewal / revoke history.';
COMMENT ON TABLE billing_webhook_events IS 'Raw Apple/Google webhook events with dedupe and replay-safe processing metadata.';
COMMENT ON TABLE quota_buckets IS 'Active quota windows, including free rolling-7-day and paid billing-cycle buckets.';
COMMENT ON TABLE quota_events IS 'Idempotent quota reservations, commits, releases, cache hits, and denials.';
COMMENT ON TABLE ai_generation_artifacts IS 'Persisted premium AI outputs that remain readable after paid access lapses.';

CREATE INDEX IF NOT EXISTS subscription_transactions_user_created_idx ON subscription_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS billing_webhook_events_status_idx ON billing_webhook_events (status, created_at DESC);
CREATE INDEX IF NOT EXISTS quota_buckets_user_feature_idx ON quota_buckets (user_id, feature_key, period_end DESC);
CREATE INDEX IF NOT EXISTS quota_events_user_created_idx ON quota_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_generation_artifacts_user_scope_idx ON ai_generation_artifacts (user_id, scope_type, scope_key, created_at DESC);

DROP TRIGGER IF EXISTS billing_accounts_set_updated_at ON billing_accounts;
CREATE TRIGGER billing_accounts_set_updated_at
BEFORE UPDATE ON billing_accounts
FOR EACH ROW EXECUTE FUNCTION billing_set_updated_at();

DROP TRIGGER IF EXISTS subscription_entitlements_set_updated_at ON subscription_entitlements;
CREATE TRIGGER subscription_entitlements_set_updated_at
BEFORE UPDATE ON subscription_entitlements
FOR EACH ROW EXECUTE FUNCTION billing_set_updated_at();

DROP TRIGGER IF EXISTS subscription_transactions_set_updated_at ON subscription_transactions;
CREATE TRIGGER subscription_transactions_set_updated_at
BEFORE UPDATE ON subscription_transactions
FOR EACH ROW EXECUTE FUNCTION billing_set_updated_at();

DROP TRIGGER IF EXISTS billing_webhook_events_set_updated_at ON billing_webhook_events;
CREATE TRIGGER billing_webhook_events_set_updated_at
BEFORE UPDATE ON billing_webhook_events
FOR EACH ROW EXECUTE FUNCTION billing_set_updated_at();

DROP TRIGGER IF EXISTS quota_buckets_set_updated_at ON quota_buckets;
CREATE TRIGGER quota_buckets_set_updated_at
BEFORE UPDATE ON quota_buckets
FOR EACH ROW EXECUTE FUNCTION billing_set_updated_at();

DROP TRIGGER IF EXISTS quota_events_set_updated_at ON quota_events;
CREATE TRIGGER quota_events_set_updated_at
BEFORE UPDATE ON quota_events
FOR EACH ROW EXECUTE FUNCTION billing_set_updated_at();

DROP TRIGGER IF EXISTS ai_generation_artifacts_set_updated_at ON ai_generation_artifacts;
CREATE TRIGGER ai_generation_artifacts_set_updated_at
BEFORE UPDATE ON ai_generation_artifacts
FOR EACH ROW EXECUTE FUNCTION billing_set_updated_at();

ALTER TABLE billing_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE quota_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE quota_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generation_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own billing accounts"
  ON billing_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own subscription entitlements"
  ON subscription_entitlements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own subscription transactions"
  ON subscription_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own quota buckets"
  ON quota_buckets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own quota events"
  ON quota_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own AI generation artifacts"
  ON ai_generation_artifacts
  FOR SELECT
  USING (auth.uid() = user_id);

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
    p_plan_code = 'paid_monthly'
    AND p_entitlement_state IN ('active', 'grace_period', 'billing_retry')
    AND COALESCE(p_current_period_end > p_now, true);
$$;

CREATE OR REPLACE FUNCTION billing_get_user_timezone(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(NULLIF((SELECT us.time_zone FROM user_settings us WHERE us.user_id = p_user_id), ''), 'UTC');
$$;

CREATE OR REPLACE FUNCTION billing_ensure_account(p_user_id uuid)
RETURNS billing_accounts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account billing_accounts;
BEGIN
  INSERT INTO billing_accounts (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT *
  INTO v_account
  FROM billing_accounts
  WHERE user_id = p_user_id;

  RETURN v_account;
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
      v_limit := 60;

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

CREATE OR REPLACE FUNCTION billing_commit_quota(
  p_quota_event_id uuid,
  p_result jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event quota_events;
  v_bucket quota_buckets;
  v_interpretation_id uuid := NULL;
  v_context_interpretation_id uuid := NULL;
BEGIN
  SELECT *
  INTO v_event
  FROM quota_events
  WHERE id = p_quota_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'quota_event_not_found';
  END IF;

  IF v_event.status IN ('committed', 'cached') THEN
    RETURN jsonb_build_object(
      'status', v_event.status,
      'quota_event_id', v_event.id,
      'bucket_id', v_event.bucket_id,
      'result', v_event.result_context
    );
  END IF;

  IF v_event.status <> 'pending' THEN
    RETURN jsonb_build_object(
      'status', v_event.status,
      'quota_event_id', v_event.id,
      'bucket_id', v_event.bucket_id,
      'reason', v_event.denial_reason,
      'result', v_event.result_context
    );
  END IF;

  v_interpretation_id := NULLIF((COALESCE(p_result, '{}'::jsonb) ->> 'interpretation_id'), '')::uuid;
  v_context_interpretation_id := NULLIF((COALESCE(v_event.request_context, '{}'::jsonb) ->> 'interpretation_id'), '')::uuid;

  IF v_event.bucket_id IS NOT NULL THEN
    SELECT *
    INTO v_bucket
    FROM quota_buckets
    WHERE id = v_event.bucket_id
    FOR UPDATE;

    UPDATE quota_buckets
    SET used_count = used_count + 1
    WHERE id = v_bucket.id;
  END IF;

  IF v_event.action = 'dream_followup_reply' THEN
    UPDATE interpretations
    SET
      chat_replies_used = LEAST(chat_replies_limit, COALESCE(chat_replies_used, 0) + 1),
      updated_at = now()
    WHERE id = COALESCE(v_interpretation_id, v_context_interpretation_id)
      AND user_id = v_event.user_id;
  END IF;

  UPDATE quota_events
  SET
    status = 'committed',
    result_context = COALESCE(p_result, '{}'::jsonb),
    updated_at = now()
  WHERE id = v_event.id
  RETURNING * INTO v_event;

  RETURN jsonb_build_object(
    'status', v_event.status,
    'quota_event_id', v_event.id,
    'bucket_id', v_event.bucket_id,
    'result', v_event.result_context
  );
END;
$$;

CREATE OR REPLACE FUNCTION billing_release_quota(
  p_quota_event_id uuid,
  p_reason text,
  p_result jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event quota_events;
BEGIN
  SELECT *
  INTO v_event
  FROM quota_events
  WHERE id = p_quota_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'quota_event_not_found';
  END IF;

  IF v_event.status = 'released' THEN
    RETURN jsonb_build_object(
      'status', v_event.status,
      'quota_event_id', v_event.id,
      'reason', v_event.denial_reason,
      'result', v_event.result_context
    );
  END IF;

  IF v_event.status = 'pending' THEN
    UPDATE quota_events
    SET
      status = 'released',
      denial_reason = p_reason,
      result_context = COALESCE(p_result, '{}'::jsonb),
      updated_at = now()
    WHERE id = v_event.id
    RETURNING * INTO v_event;
  END IF;

  RETURN jsonb_build_object(
    'status', v_event.status,
    'quota_event_id', v_event.id,
    'reason', v_event.denial_reason,
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
    v_dream_limit := 60;
    v_recent_limit := 10;

    SELECT *
    INTO v_dream_bucket
    FROM quota_buckets
    WHERE user_id = p_user_id
      AND entitlement_id = v_ent.id
      AND feature_key = 'dream_reflection_paid'
    ORDER BY period_end DESC
    LIMIT 1;

    SELECT *
    INTO v_recent_bucket
    FROM quota_buckets
    WHERE user_id = p_user_id
      AND entitlement_id = v_ent.id
      AND feature_key = 'recent_dream_field_paid'
    ORDER BY period_end DESC
    LIMIT 1;

    v_dream_used := COALESCE(v_dream_bucket.used_count, 0);
    v_dream_remaining := GREATEST(v_dream_limit - v_dream_used, 0);
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
