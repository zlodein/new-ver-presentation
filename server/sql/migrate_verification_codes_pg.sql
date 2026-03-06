-- PostgreSQL: таблица кодов подтверждения и колонка email_verified
-- Выполнить: psql -f server/sql/migrate_verification_codes_pg.sql DATABASE

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified varchar(10) NOT NULL DEFAULT 'true';

CREATE TABLE IF NOT EXISTS verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL,
  code varchar(6) NOT NULL,
  type varchar(32) NOT NULL DEFAULT 'email_verification',
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS verification_codes_email_idx ON verification_codes(email);
CREATE INDEX IF NOT EXISTS verification_codes_expires_idx ON verification_codes(expires_at);
