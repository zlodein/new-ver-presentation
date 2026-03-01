-- Миграция: поля для OAuth (Яндекс, VK) — дата рождения, пол
-- Выполнить один раз на существующей БД MySQL (e_presentati).
-- user_img и personal_phone уже есть в таблице.
-- Проверка: SHOW COLUMNS FROM users LIKE 'birthday';
-- Если колонок нет — выполнить:

ALTER TABLE `users` ADD COLUMN `birthday` varchar(20) DEFAULT NULL;
ALTER TABLE `users` ADD COLUMN `gender` varchar(20) DEFAULT NULL;
