-- Миграция: расширить cover_image для хранения base64 обложек.
-- Без этого обложки обрезаются до 255 символов и отображаются как битые.
-- Выполнить один раз на существующей БД:
--   mysql -u USER -p DATABASE < server/sql/migrate_cover_image_longtext.sql

ALTER TABLE `presentations`
  MODIFY COLUMN `cover_image` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;
