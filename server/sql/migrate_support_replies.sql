-- Ответы в тикетах поддержки (MySQL)
CREATE TABLE IF NOT EXISTS support_replies (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  support_request_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  message LONGTEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX support_replies_request_id_idx (support_request_id),
  FOREIGN KEY (support_request_id) REFERENCES support_requests(id) ON DELETE CASCADE
);
