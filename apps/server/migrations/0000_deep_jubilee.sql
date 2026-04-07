CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`avatar_url` text,
	`email` text,
	`password_hash` text,
	`telegram_id` text,
	`auth_provider` text DEFAULT 'telegram' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `mood_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`value` integer NOT NULL,
	`comment` text,
	`telegram_user_id_hash` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
