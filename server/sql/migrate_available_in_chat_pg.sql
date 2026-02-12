-- Доступен в чате (PostgreSQL)
ALTER TABLE users ADD COLUMN IF NOT EXISTS available_in_chat BOOLEAN NOT NULL DEFAULT false;
