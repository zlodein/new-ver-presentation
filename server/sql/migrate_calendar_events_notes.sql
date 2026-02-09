-- Миграция: добавить поле notes в calendar_events для заметок к событиям.
-- Выполнить один раз на существующей БД:
--   mysql -u USER -p DATABASE < server/sql/migrate_calendar_events_notes.sql

ALTER TABLE `calendar_events`
  ADD COLUMN `notes` longtext DEFAULT NULL AFTER `color`;
