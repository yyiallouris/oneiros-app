-- Track which Interpretive Echoes prompt/schema produced stored metadata,
-- so version bumps can selectively re-extract without wiping legacy rows.
ALTER TABLE interpretations
  ADD COLUMN IF NOT EXISTS extraction_prompt_version text,
  ADD COLUMN IF NOT EXISTS extraction_schema_version integer;

COMMENT ON COLUMN interpretations.extraction_prompt_version IS
  'Stable dream-field-map prompt id used for metadata extraction (e.g. dream-field-map-interpretive-v3).';
COMMENT ON COLUMN interpretations.extraction_schema_version IS
  'Structured extraction schema generation for Interpretive Echoes wire shape.';
