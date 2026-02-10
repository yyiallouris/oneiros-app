-- Add pattern-recognition fields to interpretations (for monthly/periodic insights).
-- Affects, motifs, relational_dynamics, core_mode, amplifications are extracted by AI and used for pattern tracking over time.
ALTER TABLE interpretations
  ADD COLUMN IF NOT EXISTS affects text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS motifs text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS relational_dynamics text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS core_mode text,
  ADD COLUMN IF NOT EXISTS amplifications text[] DEFAULT '{}';

COMMENT ON COLUMN interpretations.affects IS 'Dominant emotional/bodily energies (felt-sense) from AI extraction. For pattern tracking.';
COMMENT ON COLUMN interpretations.motifs IS 'Recurring action patterns (verbs of psychic action) from AI extraction. For pattern tracking.';
COMMENT ON COLUMN interpretations.relational_dynamics IS 'How figures regulate pace, permission, urgency. For pattern tracking.';
COMMENT ON COLUMN interpretations.core_mode IS 'One of: Core Tension, Core State, Core Shift, Core Restoration.';
COMMENT ON COLUMN interpretations.amplifications IS 'Brief echoes/resonances for 1–2 key symbols. For pattern tracking.';
