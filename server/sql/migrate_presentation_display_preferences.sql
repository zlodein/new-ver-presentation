-- Настройки подстановки данных профиля в блок контактов презентации
-- Выполнить: mysql -h localhost -u root -p e_presentati < sql/migrate_presentation_display_preferences.sql
USE `e_presentati`;

ALTER TABLE `users` ADD COLUMN `presentation_display_preferences` longtext DEFAULT NULL;
