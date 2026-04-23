ALTER TABLE users
  ADD COLUMN IF NOT EXISTS two_factor_enabled VARCHAR(10) NOT NULL DEFAULT 'false',
  ADD COLUMN IF NOT EXISTS two_factor_secret_enc TEXT NULL,
  ADD COLUMN IF NOT EXISTS two_factor_backup_codes_hash TEXT NULL,
  ADD COLUMN IF NOT EXISTS two_factor_enabled_at TIMESTAMPTZ NULL;

CREATE TABLE IF NOT EXISTS user_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(64) NOT NULL,
  platform VARCHAR(20) NOT NULL,
  endpoint TEXT NULL,
  token TEXT NULL,
  p256dh TEXT NULL,
  auth TEXT NULL,
  app_version VARCHAR(50) NULL,
  user_agent TEXT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON user_push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS push_subscriptions_session_id_idx ON user_push_subscriptions(session_id);
CREATE INDEX IF NOT EXISTS push_subscriptions_platform_idx ON user_push_subscriptions(platform);
