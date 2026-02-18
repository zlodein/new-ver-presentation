-- MySQL: тариф пользователя (null | test_drive | expert), тест драйв доступен только один раз
-- Выполнить один раз на существующей БД. Если колонки уже есть — пропустить или закомментировать соответствующие строки.

ALTER TABLE `users` ADD COLUMN `tariff` varchar(20) DEFAULT NULL;
ALTER TABLE `users` ADD COLUMN `test_drive_used` varchar(10) NOT NULL DEFAULT 'false';
