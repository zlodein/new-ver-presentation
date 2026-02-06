-- Миграция: добавить колонку "Должность" (work_position) в таблицу users.
-- Остальные поля блока "Работа" (company_name, company_logo, work_email, work_phone, work_website) уже есть в базе.
-- Выполнить: mysql -h localhost -u root -p e_presentati < server/sql/migration_work_fields.sql
USE `e_presentati`;

-- MySQL 8.0.17+: добавить колонку, если её ещё нет
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `work_position` varchar(255) DEFAULT NULL;

-- Если MySQL 5.7 или ошибка "Duplicate column": выполнить вручную один раз:
-- ALTER TABLE `users` ADD COLUMN `work_position` varchar(255) DEFAULT NULL;
