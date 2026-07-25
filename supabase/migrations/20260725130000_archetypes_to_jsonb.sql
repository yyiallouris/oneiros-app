-- Archetypal Echoes: store dream-specific constellation objects, not bare tags.
-- Postgres forbids subqueries in ALTER ... USING, so convert in two steps:
-- 1) text[] → jsonb string array via to_jsonb
-- 2) upgrade bare JSON strings into { canonical_label, expression, resonance, evidence }

ALTER TABLE interpretations
  ALTER COLUMN archetypes DROP DEFAULT;

ALTER TABLE interpretations
  ALTER COLUMN archetypes TYPE jsonb
  USING (
    CASE
      WHEN archetypes IS NULL THEN '[]'::jsonb
      ELSE to_jsonb(archetypes)
    END
  );

ALTER TABLE interpretations
  ALTER COLUMN archetypes SET DEFAULT '[]'::jsonb;

-- Upgrade legacy string elements ("Child") into echo objects. App readers also normalize.
UPDATE interpretations
SET archetypes = COALESCE(
  (
    SELECT jsonb_agg(upgraded.obj)
    FROM (
      SELECT
        CASE
          WHEN jsonb_typeof(elem) = 'string' AND btrim(elem #>> '{}') <> '' THEN
            jsonb_build_object(
              'canonical_label', btrim(elem #>> '{}'),
              'expression', '',
              'resonance', '',
              'evidence', '[]'::jsonb
            )
          WHEN jsonb_typeof(elem) = 'object' THEN elem
          ELSE NULL
        END AS obj
      FROM jsonb_array_elements(
        CASE
          WHEN jsonb_typeof(archetypes) = 'array' THEN archetypes
          ELSE '[]'::jsonb
        END
      ) AS elem
    ) AS upgraded
    WHERE upgraded.obj IS NOT NULL
  ),
  '[]'::jsonb
)
WHERE archetypes IS NOT NULL
  AND jsonb_typeof(archetypes) = 'array'
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(archetypes) AS e
    WHERE jsonb_typeof(e) = 'string'
  );

COMMENT ON COLUMN interpretations.archetypes IS
  'Archetypal Echoes as jsonb objects: {canonical_label, expression, resonance, evidence[]}. Prefer 0–2. Insights aggregates canonical_label.';
