-- Миграция: создать таблицу tasks (задачи с привязкой к пользователю).
-- Выполнить один раз: mysql -u USER -p DATABASE < server/sql/migrate_tasks.sql

CREATE TABLE IF NOT EXISTS `tasks` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `title` varchar(500) NOT NULL,
  `description` longtext,
  `status` varchar(20) NOT NULL DEFAULT 'todo',
  `tag` varchar(100) DEFAULT NULL,
  `due_date` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `tasks_user_id_idx` (`user_id`),
  KEY `tasks_status_idx` (`status`)
);
