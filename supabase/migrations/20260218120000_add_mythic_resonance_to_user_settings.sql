-- Add mythic_resonance to user_settings (Advanced/Deeper Dive only: when ON, adds mythic/folkloric echoes to amplification).
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS mythic_resonance boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN user_settings.mythic_resonance IS 'When interpretation_depth is advanced: adds brief mythic echoes as metaphors in amplification (not spiritual claims).';
