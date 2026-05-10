-- Add deeper pattern fields to interpretations for contextual anchors and conflict tracking.
ALTER TABLE interpretations
  ADD COLUMN IF NOT EXISTS thresholds text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS central_conflicts text[] DEFAULT '{}';

COMMENT ON COLUMN interpretations.thresholds IS 'Moments of transition, departure, arrival, sleep, work, crossing, or change of ground from AI extraction.';
COMMENT ON COLUMN interpretations.central_conflicts IS 'Psychological oppositions staged by the dream, stated as "X vs Y", from AI extraction.';
