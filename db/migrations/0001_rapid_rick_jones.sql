CREATE TABLE `body_weights` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`weight` real NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `body_weights_date_idx` ON `body_weights` (`date`);