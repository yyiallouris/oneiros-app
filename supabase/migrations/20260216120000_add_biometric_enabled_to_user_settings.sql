-- Add biometric_enabled to user_settings (user's preference to sign in with fingerprint/Face ID).
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS biometric_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN user_settings.biometric_enabled IS 'Whether the user has enabled sign-in with fingerprint or Face ID on at least one device.';
