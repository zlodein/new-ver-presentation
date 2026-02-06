-- Миграция: добавить колонку "Должность" (work_position) в таблицу users.
-- Остальные поля блока "Работа" уже есть в базе.
-- Выполнить (из каталога server): mysql -h localhost -u root -p e_presentati < sql/migration_work_fields.sql
USE `e_presentati`;

ALTER TABLE `users` ADD COLUMN `work_position` varchar(255) DEFAULT NULL;
