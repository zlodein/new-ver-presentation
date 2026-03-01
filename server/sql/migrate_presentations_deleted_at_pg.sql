-- PostgreSQL: мягкое удаление презентаций (храним месяц).
-- Выполнить: psql -U USER -d DATABASE -f server/sql/migrate_presentations_deleted_at_pg.sql

ALTER TABLE presentations
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

CREATE INDEX IF NOT EXISTS presentations_deleted_at_idx ON presentations (deleted_at);

-- Рекомендация: кроном удалять записи, удалённые более месяца:
-- DELETE FROM presentations WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '1 month';
