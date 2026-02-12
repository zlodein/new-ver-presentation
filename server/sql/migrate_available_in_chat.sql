-- Доступен в чате (MySQL): пользователи с флагом 1 отображаются в списке для начала чата
ALTER TABLE users ADD COLUMN IF NOT EXISTS available_in_chat INT UNSIGNED NOT NULL DEFAULT 0;
