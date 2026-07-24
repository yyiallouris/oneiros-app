-- Prevent duplicate post-reflection metadata AI calls when multiple clients or
-- Edge isolates request enrichment for the same pending interpretation.
CREATE TABLE IF NOT EXISTS interpretation_metadata_extraction_jobs (
  interpretation_id text PRIMARY KEY REFERENCES interpretations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'completed', 'failed')),
  lease_expires_at timestamptz NOT NULL DEFAULT (now() + interval '2 minutes'),
  attempts integer NOT NULL DEFAULT 1 CHECK (attempts >= 1),
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE interpretation_metadata_extraction_jobs IS 'Server-side lease guard for asynchronous interpretation metadata extraction.';
COMMENT ON COLUMN interpretation_metadata_extraction_jobs.lease_expires_at IS 'When another worker may reclaim a stuck metadata extraction job.';

CREATE INDEX IF NOT EXISTS interpretation_metadata_extraction_jobs_user_status_idx
  ON interpretation_metadata_extraction_jobs (user_id, status, updated_at DESC);

DROP TRIGGER IF EXISTS interpretation_metadata_extraction_jobs_set_updated_at
  ON interpretation_metadata_extraction_jobs;
CREATE TRIGGER interpretation_metadata_extraction_jobs_set_updated_at
BEFORE UPDATE ON interpretation_metadata_extraction_jobs
FOR EACH ROW EXECUTE FUNCTION billing_set_updated_at();

ALTER TABLE interpretation_metadata_extraction_jobs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION billing_claim_metadata_extraction(
  p_user_id uuid,
  p_interpretation_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_metadata_status text;
  v_job interpretation_metadata_extraction_jobs%ROWTYPE;
BEGIN
  SELECT metadata_status
    INTO v_metadata_status
  FROM interpretations
  WHERE id = p_interpretation_id
    AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'not_found', 'claimed', false);
  END IF;

  IF v_metadata_status = 'ready' THEN
    INSERT INTO interpretation_metadata_extraction_jobs (
      interpretation_id,
      user_id,
      status,
      lease_expires_at,
      attempts,
      last_error_code
    )
    VALUES (
      p_interpretation_id,
      p_user_id,
      'completed',
      now(),
      1,
      NULL
    )
    ON CONFLICT (interpretation_id) DO UPDATE
      SET status = 'completed',
          user_id = EXCLUDED.user_id,
          lease_expires_at = now(),
          last_error_code = NULL,
          updated_at = now();

    RETURN jsonb_build_object('status', 'ready', 'claimed', false);
  END IF;

  INSERT INTO interpretation_metadata_extraction_jobs (
    interpretation_id,
    user_id,
    status,
    lease_expires_at,
    attempts,
    last_error_code
  )
  VALUES (
    p_interpretation_id,
    p_user_id,
    'processing',
    now() + interval '2 minutes',
    1,
    NULL
  )
  ON CONFLICT (interpretation_id) DO UPDATE
    SET status = 'processing',
        user_id = EXCLUDED.user_id,
        lease_expires_at = EXCLUDED.lease_expires_at,
        attempts = interpretation_metadata_extraction_jobs.attempts + 1,
        last_error_code = NULL,
        updated_at = now()
    WHERE interpretation_metadata_extraction_jobs.status IN ('completed', 'failed')
       OR interpretation_metadata_extraction_jobs.lease_expires_at <= now()
  RETURNING *
    INTO v_job;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'status', 'claimed',
      'claimed', true,
      'lease_expires_at', v_job.lease_expires_at,
      'attempts', v_job.attempts
    );
  END IF;

  SELECT *
    INTO v_job
  FROM interpretation_metadata_extraction_jobs
  WHERE interpretation_id = p_interpretation_id;

  RETURN jsonb_build_object(
    'status', 'processing',
    'claimed', false,
    'lease_expires_at', v_job.lease_expires_at,
    'attempts', v_job.attempts
  );
END;
$$;

CREATE OR REPLACE FUNCTION billing_finish_metadata_extraction(
  p_user_id uuid,
  p_interpretation_id text,
  p_status text,
  p_error_code text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job interpretation_metadata_extraction_jobs%ROWTYPE;
BEGIN
  IF p_status NOT IN ('completed', 'failed') THEN
    RAISE EXCEPTION 'Invalid metadata extraction finish status: %', p_status;
  END IF;

  UPDATE interpretation_metadata_extraction_jobs
    SET status = p_status,
        lease_expires_at = now(),
        last_error_code = CASE WHEN p_status = 'failed' THEN p_error_code ELSE NULL END,
        updated_at = now()
  WHERE interpretation_id = p_interpretation_id
    AND user_id = p_user_id
  RETURNING *
    INTO v_job;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'missing');
  END IF;

  RETURN jsonb_build_object(
    'status', v_job.status,
    'lease_expires_at', v_job.lease_expires_at,
    'attempts', v_job.attempts
  );
END;
$$;
