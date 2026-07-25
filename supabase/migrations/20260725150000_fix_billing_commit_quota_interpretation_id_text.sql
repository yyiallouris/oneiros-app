-- Fix dream_followup_reply commit failures:
-- interpretations.id is app-generated text, not uuid.
-- billing_commit_quota previously cast interpretation_id to uuid, which either
-- throws on non-uuid ids or fails the UPDATE with text = uuid operator error,
-- surfacing as gateway "Failed to commit quota" after the AI reply already ran.

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
  v_interpretation_id text := NULL;
  v_context_interpretation_id text := NULL;
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

  -- Keep as text — matches interpretations.id (never cast to uuid).
  v_interpretation_id := NULLIF((COALESCE(p_result, '{}'::jsonb) ->> 'interpretation_id'), '');
  v_context_interpretation_id := NULLIF((COALESCE(v_event.request_context, '{}'::jsonb) ->> 'interpretation_id'), '');

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
