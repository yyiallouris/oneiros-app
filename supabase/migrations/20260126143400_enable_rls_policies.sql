-- Enable Row Level Security on dreams table
ALTER TABLE dreams ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on interpretations table
ALTER TABLE interpretations ENABLE ROW LEVEL SECURITY;

-- Dreams table policies
-- Users can only SELECT their own dreams
CREATE POLICY "Users can view their own dreams"
  ON dreams
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only INSERT dreams with their own user_id
CREATE POLICY "Users can insert their own dreams"
  ON dreams
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only UPDATE their own dreams
CREATE POLICY "Users can update their own dreams"
  ON dreams
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only DELETE their own dreams
CREATE POLICY "Users can delete their own dreams"
  ON dreams
  FOR DELETE
  USING (auth.uid() = user_id);

-- Interpretations table policies
-- Users can only SELECT their own interpretations
CREATE POLICY "Users can view their own interpretations"
  ON interpretations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only INSERT interpretations with their own user_id
CREATE POLICY "Users can insert their own interpretations"
  ON interpretations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only UPDATE their own interpretations
CREATE POLICY "Users can update their own interpretations"
  ON interpretations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only DELETE their own interpretations
CREATE POLICY "Users can delete their own interpretations"
  ON interpretations
  FOR DELETE
  USING (auth.uid() = user_id);
