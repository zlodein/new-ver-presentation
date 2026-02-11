-- Миграция: last_login_at, is_active для админ-панели
-- Выполнить ТОЛЬКО если колонок нет (e_presentati_schema.sql уже содержит их)
-- Проверка: SHOW COLUMNS FROM users LIKE 'last_login_at';
-- Если колонок нет — раскомментируйте и выполните:

-- ALTER TABLE `users` ADD COLUMN `last_login_at` timestamp NULL DEFAULT NULL;
-- ALTER TABLE `users` ADD COLUMN `is_active` tinyint(1) NOT NULL DEFAULT 1;
