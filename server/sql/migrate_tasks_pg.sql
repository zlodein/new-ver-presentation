-- Миграция PostgreSQL: создать таблицу tasks (задачи с привязкой к пользователю).
-- Выполнить при использовании PostgreSQL.

CREATE TABLE IF NOT EXISTS "tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" varchar(500) NOT NULL,
  "description" text,
  "status" varchar(20) NOT NULL DEFAULT 'todo',
  "tag" varchar(100),
  "due_date" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  "updated_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "tasks_user_id_idx" ON "tasks" ("user_id");
CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "tasks" ("status");
