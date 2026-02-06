-- Миграция: добавить поля блока "Работа" в таблицу users (если их ещё нет).
-- Выполнить: mysql -h localhost -u root -p e_presentati < server/sql/migration_work_fields.sql
USE `e_presentati`;

-- Добавить company_name и work_position, если в вашей БД есть только workplace
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `company_name` varchar(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `work_position` varchar(255) DEFAULT NULL;

-- MySQL 5.7 не поддерживает IF NOT EXISTS для ADD COLUMN — тогда выполните вручную по одному:
-- ALTER TABLE `users` ADD COLUMN `company_name` varchar(255) DEFAULT NULL;
-- ALTER TABLE `users` ADD COLUMN `work_position` varchar(255) DEFAULT NULL;
