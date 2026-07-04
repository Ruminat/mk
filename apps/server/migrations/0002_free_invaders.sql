CREATE TABLE `telegram_chat_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`telegram_user_id_hash` text NOT NULL,
	`role` text NOT NULL,
	`text` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `telegram_chat_messages_user_idx` ON `telegram_chat_messages` (`telegram_user_id_hash`);