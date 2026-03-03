-- MySQL: цвет темы презентации (для настроек отображения)
-- Выполнить при необходимости. Если колонка уже есть — пропустить.

ALTER TABLE `presentations` ADD COLUMN `theme_color` varchar(7) DEFAULT '#2c7f8d';
