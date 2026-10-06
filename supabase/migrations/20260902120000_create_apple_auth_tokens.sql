CREATE TABLE IF NOT EXISTS apple_auth_tokens (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE apple_auth_tokens ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE apple_auth_tokens FROM anon, authenticated;

DROP TRIGGER IF EXISTS apple_auth_tokens_set_updated_at ON apple_auth_tokens;
CREATE TRIGGER apple_auth_tokens_set_updated_at
  BEFORE UPDATE ON apple_auth_tokens
  FOR EACH ROW EXECUTE FUNCTION billing_set_updated_at();

COMMENT ON TABLE apple_auth_tokens IS
  'Server-only Sign in with Apple refresh tokens retained solely to revoke authorization during account deletion.';
