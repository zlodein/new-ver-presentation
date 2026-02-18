-- MySQL: лимит презентаций для тарифа Эксперт (учитываются и удалённые)
-- Выполнить после migrate_user_tariff.sql. Если колонки уже есть — пропустить.

ALTER TABLE `users` ADD COLUMN `expert_plan_quantity` int unsigned DEFAULT 1;
ALTER TABLE `users` ADD COLUMN `expert_presentations_used` int unsigned NOT NULL DEFAULT 0;
