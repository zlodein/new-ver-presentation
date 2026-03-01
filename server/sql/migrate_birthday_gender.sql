-- Миграция: birthday и gender для OAuth (Яндекс, VK)
-- Выполните, если колонок ещё нет: mysql -u user -p e_presentati < server/sql/migrate_birthday_gender.sql
-- Если колонки уже есть — пропустите или закомментируйте строки ниже.

ALTER TABLE `users` ADD COLUMN `birthday` varchar(20) DEFAULT NULL COMMENT 'YYYY-MM-DD';
ALTER TABLE `users` ADD COLUMN `gender` varchar(20) DEFAULT NULL COMMENT 'male | female';
