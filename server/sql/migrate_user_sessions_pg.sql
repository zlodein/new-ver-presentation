-- Сессии пользователей (PostgreSQL) — для отслеживания устройств и выхода со всех
CREATE TABLE IF NOT EXISTS "user_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "session_id" varchar(64) NOT NULL,
  "user_agent" text,
  "ip" varchar(45),
  "country" varchar(100),
  "city" varchar(120),
  "lat" varchar(20),
  "lng" varchar(20),
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "user_sessions_user_id_idx" ON "user_sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "user_sessions_session_id_idx" ON "user_sessions" ("session_id");
