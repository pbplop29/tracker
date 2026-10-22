CREATE TABLE `recovery_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`code_hash` text NOT NULL,
	`used_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `recovery_codes_user_idx` ON `recovery_codes` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL,
	`totp_secret` text NOT NULL,
	`enrolled_at` text,
	`last_totp_step` integer DEFAULT 0 NOT NULL,
	`failed_attempts` integer DEFAULT 0 NOT NULL,
	`locked_until` integer,
	`invite_token_hash` text,
	`invite_expires_at` integer,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
DROP INDEX `body_weights_date_idx`;--> statement-breakpoint
ALTER TABLE `body_weights` ADD `user_id` text REFERENCES users(id);--> statement-breakpoint
CREATE UNIQUE INDEX `body_weights_user_date_idx` ON `body_weights` (`user_id`,`date`);--> statement-breakpoint
DROP INDEX `exercises_name_idx`;--> statement-breakpoint
ALTER TABLE `exercises` ADD `user_id` text REFERENCES users(id);--> statement-breakpoint
CREATE UNIQUE INDEX `exercises_user_name_idx` ON `exercises` (`user_id`,`name`);--> statement-breakpoint
DROP INDEX `workout_days_date_idx`;--> statement-breakpoint
ALTER TABLE `workout_days` ADD `user_id` text REFERENCES users(id);--> statement-breakpoint
CREATE UNIQUE INDEX `workout_days_user_date_idx` ON `workout_days` (`user_id`,`date`);