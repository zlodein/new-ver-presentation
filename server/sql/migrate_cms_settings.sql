-- =============================================================================
-- ТОЛЬКО MySQL / MariaDB — выполняйте этот файл в phpMyAdmin или mysql CLI.
-- НЕ используйте migrate_cms_settings_pg.sql в MySQL: там синтаксис PostgreSQL
-- (jsonb, timestamptz) и запрос выдаст ошибку #1064.
-- =============================================================================
--
-- Таблица ключ-значение для настроек CMS (страницы, тарифы, флаги сайта).

CREATE TABLE IF NOT EXISTS `cms_settings` (
  `key` varchar(64) NOT NULL,
  `payload` longtext NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
