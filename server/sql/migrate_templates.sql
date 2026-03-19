-- Таблица именованных шаблонов групп слайдов (админка «Слайды»).
-- content — JSON: { "slides": [...], "settings": { ... } }
-- Выполнить: mysql -u USER -p DATABASE < server/sql/migrate_templates.sql

CREATE TABLE IF NOT EXISTS `templates` (
  `id` varchar(64) NOT NULL,
  `name` varchar(255) NOT NULL,
  `content` longtext NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `templates_created_at_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
