-- =============================================================================
-- ТОЛЬКО PostgreSQL — psql, pgAdmin, DBeaver и т.д.
-- НЕ выполняйте этот файл в MySQL / MariaDB / phpMyAdmin для MySQL.
-- Для MySQL используйте migrate_cms_settings.sql (longtext + timestamp).
-- =============================================================================

CREATE TABLE IF NOT EXISTS cms_settings (
  key varchar(64) PRIMARY KEY,
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
