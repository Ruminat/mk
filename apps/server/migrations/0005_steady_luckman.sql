DROP TABLE `users`;--> statement-breakpoint
DROP INDEX `mood_entries_user_idx`;--> statement-breakpoint
CREATE INDEX `mood_entries_user_created_idx` ON `mood_entries` (`telegram_user_id_hash`,`created_at`);