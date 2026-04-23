ALTER TABLE users
  ADD COLUMN IF NOT EXISTS two_factor_enabled VARCHAR(10) NOT NULL DEFAULT 'false',
  ADD COLUMN IF NOT EXISTS two_factor_secret_enc LONGTEXT NULL,
  ADD COLUMN IF NOT EXISTS two_factor_backup_codes_hash LONGTEXT NULL,
  ADD COLUMN IF NOT EXISTS two_factor_enabled_at TIMESTAMP NULL;

CREATE TABLE IF NOT EXISTS user_push_subscriptions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  session_id VARCHAR(64) NOT NULL,
  platform VARCHAR(20) NOT NULL,
  endpoint VARCHAR(1024) NULL,
  token VARCHAR(1024) NULL,
  p256dh VARCHAR(1024) NULL,
  auth VARCHAR(1024) NULL,
  app_version VARCHAR(50) NULL,
  user_agent VARCHAR(512) NULL,
  last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY push_subscriptions_user_id_idx (user_id),
  KEY push_subscriptions_session_id_idx (session_id),
  KEY push_subscriptions_platform_idx (platform),
  CONSTRAINT fk_push_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
