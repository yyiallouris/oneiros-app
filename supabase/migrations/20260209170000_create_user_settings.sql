-- User preferences (e.g. dream analysis depth). One row per user.
CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  interpretation_depth text NOT NULL DEFAULT 'standard' CHECK (interpretation_depth IN ('quick', 'standard', 'advanced')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE user_settings IS 'Per-user app settings. interpretation_depth: quick (80–180 words), standard (150–350), advanced (400–700).';

-- RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
  ON user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
