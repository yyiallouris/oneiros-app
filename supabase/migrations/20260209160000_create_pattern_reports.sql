-- Pattern insight reports: one per user per month (YYYY-MM).
-- Used by Insights > Pattern recognition for monthly reflection essays.
CREATE TABLE IF NOT EXISTS pattern_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_key text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, month_key)
);

COMMENT ON TABLE pattern_reports IS 'Monthly pattern reflection reports (Insights > Pattern recognition). One row per user per month_key (YYYY-MM).';

CREATE INDEX IF NOT EXISTS pattern_reports_user_id_idx ON pattern_reports (user_id);
CREATE INDEX IF NOT EXISTS pattern_reports_user_month_idx ON pattern_reports (user_id, month_key);

-- RLS
ALTER TABLE pattern_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pattern reports"
  ON pattern_reports
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pattern reports"
  ON pattern_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pattern reports"
  ON pattern_reports
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pattern reports"
  ON pattern_reports
  FOR DELETE
  USING (auth.uid() = user_id);
