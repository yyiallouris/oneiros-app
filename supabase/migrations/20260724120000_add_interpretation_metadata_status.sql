-- Track asynchronous extraction state separately from the user-facing reflection.
ALTER TABLE interpretations
  ADD COLUMN IF NOT EXISTS metadata_status text NOT NULL DEFAULT 'ready'
    CHECK (metadata_status IN ('pending', 'ready', 'failed')),
  ADD COLUMN IF NOT EXISTS metadata_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS metadata_error_code text;

COMMENT ON COLUMN interpretations.metadata_status IS 'Background extraction state for display_distillation and long-term pattern metadata.';
COMMENT ON COLUMN interpretations.metadata_generated_at IS 'Timestamp when extraction metadata was last successfully generated.';
COMMENT ON COLUMN interpretations.metadata_error_code IS 'Safe non-content error code for the latest extraction metadata failure.';
