-- Пользователи: регистрация и авторизация
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(255) NOT NULL,
  "password_hash" varchar(255) NOT NULL,
  "first_name" varchar(120),
  "last_name" varchar(120),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");

-- Презентации: привязка к пользователю, контент в JSONB для быстрого доступа
CREATE TABLE IF NOT EXISTS "presentations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" varchar(500) DEFAULT 'Без названия' NOT NULL,
  "cover_image" text,
  "content" jsonb DEFAULT '{"slides":[]}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "presentations_user_id_idx" ON "presentations" ("user_id");
CREATE INDEX IF NOT EXISTS "presentations_updated_at_idx" ON "presentations" ("updated_at");
