-- Шаблон презентации (тип недвижимости) для визуального стиля
-- Если колонка уже есть, выполните только при необходимости или игнорируйте ошибку.
ALTER TABLE presentations ADD COLUMN template_id VARCHAR(50) NULL COMMENT 'id шаблона: elite, apartment, commercial, general' AFTER theme_color;
