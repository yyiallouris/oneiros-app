-- Add symbol_stances to interpretations: how each key symbol was experienced (playful, painful, stressful, etc.).
-- Used for pattern tracking and to avoid assuming fixed positive/negative meaning for symbols.
ALTER TABLE interpretations
  ADD COLUMN IF NOT EXISTS symbol_stances jsonb DEFAULT '[]';

COMMENT ON COLUMN interpretations.symbol_stances IS 'Array of { symbol, stance } from AI extraction. Stance = how the symbol was experienced in the dream (e.g. playful, stressful, reassuring).';
