-- Таблица компаний для единой библиотеки ресурсов (логотипы, шрифты, палитра, иконки)
CREATE TABLE IF NOT EXISTS companies (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT '',
  resources LONGTEXT NULL COMMENT 'JSON: logos, fonts, palette, icons',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX companies_user_id_idx (user_id),
  CONSTRAINT companies_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
