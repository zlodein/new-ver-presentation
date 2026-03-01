-- Схема БД e_presentati для новой версии сайта презентаций
-- По образцу cq88845_present.sql (только структура таблиц)
-- MySQL 8.x, кодировка utf8mb4
--
-- Запуск на сервере (база уже должна существовать или будет создана):
--   mysql -h localhost -u root -p e_presentati < server/sql/e_presentati_schema.sql
-- Или подключиться и выполнить:
--   mysql -h localhost -u root -p
--   source /path/to/server/sql/e_presentati_schema.sql

CREATE DATABASE IF NOT EXISTS `e_presentati` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `e_presentati`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- user_roles (справочник ролей)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `permissions` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- tariffs (тарифы)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tariffs` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `price` decimal(10,2) DEFAULT '0.00',
  `duration_days` int DEFAULT '0',
  `tariff_type` varchar(50) NOT NULL DEFAULT 'standard',
  `custom_base_price` decimal(10,2) DEFAULT '900.00',
  `max_presentations` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `features` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_default` tinyint(1) DEFAULT '0',
  `can_print` tinyint(1) NOT NULL DEFAULT '1',
  `can_share` tinyint(1) NOT NULL DEFAULT '0',
  `can_public_link` tinyint(1) NOT NULL DEFAULT '0',
  `max_public_links` int NOT NULL DEFAULT '0',
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- users
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL DEFAULT '',
  `last_name` varchar(100) DEFAULT NULL,
  `middle_name` varchar(255) DEFAULT NULL,
  `user_img` varchar(255) DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password_reset_token` varchar(255) DEFAULT NULL,
  `password_reset_expires` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `trial_tariff_used` tinyint(1) DEFAULT '0',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `role_id` int DEFAULT '1',
  `tariff_id` int DEFAULT NULL,
  `tariff_expires_at` datetime DEFAULT NULL,
  `trial_used` tinyint(1) NOT NULL DEFAULT '0',
  `custom_presentations_count` int DEFAULT NULL,
  `theme` varchar(50) DEFAULT NULL,
  `theme_color_scheme` varchar(50) DEFAULT NULL,
  `theme_font_family` varchar(100) DEFAULT NULL,
  `theme_corner_radius` varchar(20) DEFAULT NULL,
  `workplace` varchar(255) DEFAULT NULL,
  `company_logo` varchar(500) DEFAULT NULL,
  `position` varchar(255) DEFAULT NULL,
  `work_email` varchar(255) DEFAULT NULL,
  `work_phone` varchar(20) DEFAULT NULL,
  `work_website` varchar(500) DEFAULT NULL,
  `personal_phone` varchar(20) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `messengers` json DEFAULT NULL,
  `presentation_display_settings` text,
  `auth_provider` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `password_reset_token` (`password_reset_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- password_reset_tokens (для нового бэкенда: сброс пароля)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int UNSIGNED NOT NULL,
  `token` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `password_reset_tokens_user_id` (`user_id`),
  KEY `password_reset_tokens_token` (`token`),
  KEY `password_reset_tokens_expires_at` (`expires_at`),
  CONSTRAINT `fk_password_reset_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- user_presentation_stats
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_presentation_stats` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int UNSIGNED NOT NULL,
  `total_created` int UNSIGNED NOT NULL DEFAULT '0',
  `current_active` int UNSIGNED NOT NULL DEFAULT '0',
  `last_reset_date` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `idx_total_created` (`total_created`),
  KEY `idx_current_active` (`current_active`),
  CONSTRAINT `fk_user_presentation_stats_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Триггер: при создании пользователя создать запись в user_presentation_stats
DROP TRIGGER IF EXISTS `init_presentation_stats_after_user_insert`;
DELIMITER $$
CREATE TRIGGER `init_presentation_stats_after_user_insert`
AFTER INSERT ON `users` FOR EACH ROW
BEGIN
  INSERT INTO `user_presentation_stats` (`user_id`, `total_created`, `current_active`)
  VALUES (NEW.id, 0, 0);
END$$
DELIMITER ;

-- --------------------------------------------------------
-- presentations
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `presentations` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT 'Новая презентация',
  `description` text,
  `slides_data` longtext,
  `cover_image` varchar(255) DEFAULT NULL,
  `status` enum('draft','published') DEFAULT 'draft',
  `public_hash` varchar(32) DEFAULT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT '0',
  `public_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `published_at` timestamp NULL DEFAULT NULL,
  `theme_color` varchar(7) DEFAULT '#2c7f8d',
  `theme_style` varchar(20) NOT NULL DEFAULT 'classic',
  `decoration_shape` varchar(20) NOT NULL DEFAULT 'square',
  `show_top_decorations` tinyint(1) NOT NULL DEFAULT '1',
  `show_bottom_decorations` tinyint(1) NOT NULL DEFAULT '1',
  `heading_font_size` varchar(20) NOT NULL DEFAULT 'default',
  `text_font_size` varchar(20) NOT NULL DEFAULT 'default',
  `font_style` varchar(20) NOT NULL DEFAULT 'normal',
  `line_height` varchar(20) NOT NULL DEFAULT 'normal',
  `spacing` varchar(20) NOT NULL DEFAULT 'normal',
  `last_autosave` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `show_all_currencies` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_public_hash` (`public_hash`),
  KEY `user_id` (`user_id`),
  KEY `status` (`status`),
  KEY `idx_status` (`status`),
  KEY `idx_user_status` (`user_id`,`status`),
  KEY `idx_updated` (`updated_at`),
  CONSTRAINT `fk_presentations_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- images
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `images` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int UNSIGNED NOT NULL,
  `presentation_id` int UNSIGNED DEFAULT NULL,
  `filename` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `file_size` int NOT NULL,
  `path` varchar(500) NOT NULL,
  `slide_type` enum('cover','gallery','characteristics') DEFAULT 'gallery',
  `slide_index` int DEFAULT '0',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `presentation_id` (`presentation_id`),
  KEY `is_deleted` (`is_deleted`),
  CONSTRAINT `fk_images_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- feature_requests
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `feature_requests` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `status` enum('new','in_progress','completed','rejected') DEFAULT 'new',
  `is_implemented` tinyint(1) DEFAULT '0',
  `admin_notes` text,
  `votes` int DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_feature_requests_status` (`status`),
  KEY `idx_feature_requests_created_at` (`created_at`),
  KEY `idx_feature_requests_votes` (`votes`),
  CONSTRAINT `feature_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- feature_votes
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `feature_votes` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int UNSIGNED NOT NULL,
  `feature_id` int UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_vote` (`user_id`,`feature_id`),
  KEY `feature_id` (`feature_id`),
  KEY `idx_feature_votes_created_at` (`created_at`),
  CONSTRAINT `feature_votes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `feature_votes_ibfk_2` FOREIGN KEY (`feature_id`) REFERENCES `feature_requests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- login_attempts
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `login_attempts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `success` tinyint(1) DEFAULT '0',
  `attempted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email` (`email`),
  KEY `idx_attempted_at` (`attempted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- payments
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payments` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int UNSIGNED NOT NULL,
  `tariff_id` int UNSIGNED NOT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `payment_id` varchar(255) DEFAULT NULL,
  `metadata` text,
  `status` enum('pending','waiting_for_capture','succeeded','canceled','completed','failed','refunded') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `tariff_id` (`tariff_id`),
  KEY `idx_payments_payment_id` (`payment_id`),
  KEY `idx_payments_status` (`status`),
  KEY `idx_payments_created_at` (`created_at`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`tariff_id`) REFERENCES `tariffs` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- presentation_audit_log
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `presentation_audit_log` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int UNSIGNED NOT NULL,
  `presentation_id` int UNSIGNED DEFAULT NULL,
  `action` enum('create','delete','restore') NOT NULL,
  `tariff_name` varchar(100) DEFAULT NULL,
  `tariff_limit` int DEFAULT NULL,
  `total_created_before` int UNSIGNED DEFAULT NULL,
  `total_created_after` int UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_presentation_id` (`presentation_id`),
  KEY `idx_action` (`action`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- slides (отдельные слайды, опционально)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `slides` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `presentation_id` int UNSIGNED NOT NULL,
  `type` varchar(50) NOT NULL,
  `position` int UNSIGNED NOT NULL DEFAULT '0',
  `title` varchar(255) DEFAULT NULL,
  `content` text,
  `location_name` varchar(255) DEFAULT NULL,
  `location_address` varchar(500) DEFAULT NULL,
  `location_lat` decimal(10,8) DEFAULT NULL,
  `location_lng` decimal(11,8) DEFAULT NULL,
  `data` json DEFAULT NULL,
  `hidden` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `presentation_idx` (`presentation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Минимальные справочные данные для работы сайта
INSERT IGNORE INTO `user_roles` (`id`, `name`, `permissions`) VALUES
(1, 'user', '{"create_presentation": true, "view_presentations": true}'),
(2, 'admin', '{"create_presentation": true, "view_presentations": true, "manage_users": true, "manage_settings": true, "view_reports": true}');

INSERT IGNORE INTO `tariffs` (`id`, `name`, `description`, `price`, `duration_days`, `tariff_type`, `custom_base_price`, `max_presentations`, `is_active`, `features`, `is_default`, `can_print`, `can_share`, `can_public_link`, `max_public_links`) VALUES
(1, 'Базовый', 'Базовый тариф', 0.00, 0, 'standard', 900.00, 1, 1, '[]', 1, 1, 0, 0, 0),
(9, 'Индивидуальный', '', 0.00, 0, 'custom_presentations', 900.00, 0, 1, '[""]', 0, 1, 1, 1, 0);
