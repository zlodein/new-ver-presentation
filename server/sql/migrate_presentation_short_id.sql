-- MySQL: короткий идентификатор презентации (6 символов A-Z0-9) для тех. поддержки
-- Выполнить при необходимости. Если колонка уже есть — пропустить.

ALTER TABLE `presentations` ADD COLUMN `short_id` varchar(6) DEFAULT NULL;
CREATE UNIQUE INDEX `idx_presentations_short_id` ON `presentations` (`short_id`);
