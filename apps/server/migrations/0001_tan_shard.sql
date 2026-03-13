ALTER TABLE `mood_entries` RENAME COLUMN "user_id" TO "telegram_user_id";--> statement-breakpoint
DROP TABLE `user_settings`;--> statement-breakpoint
ALTER TABLE `mood_entries` ALTER COLUMN "telegram_user_id" TO "telegram_user_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `email` text;--> statement-breakpoint
ALTER TABLE `users` ADD `password_hash` text;--> statement-breakpoint
ALTER TABLE `users` ADD `telegram_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `auth_provider` text DEFAULT 'telegram' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `created_at` text;--> statement-breakpoint
UPDATE `users` SET `created_at` = datetime('now') WHERE `created_at` IS NULL;