-- MySQL: таблица кодов подтверждения (6 цифр) для регистрации и восстановления пароля
-- + колонка email_verified в users
-- Выполнить один раз: mysql -u USER -p DATABASE < server/sql/migrate_verification_codes.sql

-- Колонка подтверждения email (для регистрации через почту). Существующие пользователи получают 'true'
ALTER TABLE `users` ADD COLUMN `email_verified` varchar(10) NOT NULL DEFAULT 'true';

-- Таблица кодов подтверждения
CREATE TABLE IF NOT EXISTS `verification_codes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `code` varchar(6) NOT NULL,
  `type` varchar(32) NOT NULL DEFAULT 'email_verification',
  `user_id` int unsigned DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `verification_codes_email_idx` (`email`),
  KEY `verification_codes_expires_idx` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
