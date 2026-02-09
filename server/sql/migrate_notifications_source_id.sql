-- Миграция: добавить source_id в notifications (связь с событием календаря при удалении).
-- Выполнить один раз: mysql -u USER -p DATABASE < server/sql/migrate_notifications_source_id.sql

ALTER TABLE `notifications`
  ADD COLUMN `source_id` varchar(64) DEFAULT NULL AFTER `read`;
