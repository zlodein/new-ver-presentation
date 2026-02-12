-- Таблица запросов в поддержку (MySQL)
CREATE TABLE IF NOT EXISTS support_requests (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  subject VARCHAR(500) NOT NULL,
  message LONGTEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX support_requests_user_id_idx (user_id),
  INDEX support_requests_created_at_idx (created_at)
);
