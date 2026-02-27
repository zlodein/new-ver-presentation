-- MySQL: мягкое удаление презентаций (храним месяц, затем можно удалять по крону).
-- Выполнить: mysql -h HOST -u USER -p DATABASE < server/sql/migrate_presentations_deleted_at.sql
-- Если колонка deleted_at уже есть в таблице presentations — этот скрипт не выполнять.

ALTER TABLE `presentations`
  ADD COLUMN `deleted_at` datetime DEFAULT NULL COMMENT 'Когда помечена удалённой; NULL = активна';

CREATE INDEX `presentations_deleted_at_idx` ON `presentations` (`deleted_at`);

-- Рекомендация: раз в день удалять записи, удалённые более месяца назад:
-- DELETE FROM presentations WHERE deleted_at IS NOT NULL AND deleted_at < DATE_SUB(NOW(), INTERVAL 1 MONTH);
