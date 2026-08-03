CREATE TABLE `exercise_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`workout_exercise_id` text NOT NULL,
	`set_number` integer NOT NULL,
	`weight` real NOT NULL,
	`reps` integer NOT NULL,
	FOREIGN KEY (`workout_exercise_id`) REFERENCES `workout_exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `exercise_sets_workout_exercise_idx` ON `exercise_sets` (`workout_exercise_id`);--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exercises_name_idx` ON `exercises` (`name`);--> statement-breakpoint
CREATE TABLE `workout_days` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workout_days_date_idx` ON `workout_days` (`date`);--> statement-breakpoint
CREATE TABLE `workout_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`workout_day_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`workout_day_id`) REFERENCES `workout_days`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `workout_exercises_workout_day_idx` ON `workout_exercises` (`workout_day_id`);--> statement-breakpoint
CREATE INDEX `workout_exercises_exercise_idx` ON `workout_exercises` (`exercise_id`);