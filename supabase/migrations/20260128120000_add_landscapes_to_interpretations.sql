-- Add landscapes column to interpretations (settings/places from dream analysis).
-- Same treatment as symbols and archetypes: array of text.
ALTER TABLE interpretations
  ADD COLUMN IF NOT EXISTS landscapes text[] DEFAULT '{}';

COMMENT ON COLUMN interpretations.landscapes IS 'Extracted settings/places from AI (e.g. mall, forest). Optional; empty array if none.';
