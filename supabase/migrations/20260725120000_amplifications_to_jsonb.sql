-- Mythic Echoes (amplifications): rare interpretive enrichment objects, not Dream Fabric strings.
-- Migrate text[] → jsonb so each item can be { dream_image, echo, resonance }.
-- Legacy string arrays become a JSON string array via to_jsonb; app readers normalize both shapes.

ALTER TABLE interpretations
  ALTER COLUMN amplifications DROP DEFAULT;

ALTER TABLE interpretations
  ALTER COLUMN amplifications TYPE jsonb
  USING (
    CASE
      WHEN amplifications IS NULL THEN '[]'::jsonb
      ELSE to_jsonb(amplifications)
    END
  );

ALTER TABLE interpretations
  ALTER COLUMN amplifications SET DEFAULT '[]'::jsonb;

COMMENT ON COLUMN interpretations.amplifications IS
  'Mythic Echoes: optional provisional interpretive enrichment as jsonb array of {dream_image, echo, resonance} (or legacy strings). Prefer empty. Not Dream Fabric / not Insights aggregation.';
