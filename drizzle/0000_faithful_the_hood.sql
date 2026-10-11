CREATE TABLE `academies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`timezone` text DEFAULT 'Asia/Kolkata' NOT NULL,
	`currency` text DEFAULT 'INR' NOT NULL,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`academy_id` text NOT NULL,
	`date` text NOT NULL,
	`batch` text NOT NULL,
	`member_id` text NOT NULL,
	`status` text NOT NULL,
	`marked_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`academy_id`) REFERENCES `academies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attendance_unique_idx` ON `attendance` (`academy_id`,`date`,`batch`,`member_id`);--> statement-breakpoint
CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`academy_id` text NOT NULL,
	`name` text NOT NULL,
	`member_monthly_amount` integer NOT NULL,
	`student_monthly_amount` integer NOT NULL,
	`guest_visit_amount` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`academy_id`) REFERENCES `academies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `member_games` (
	`id` text PRIMARY KEY NOT NULL,
	`academy_id` text NOT NULL,
	`member_id` text NOT NULL,
	`game_id` text NOT NULL,
	FOREIGN KEY (`academy_id`) REFERENCES `academies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `member_games_unique_idx` ON `member_games` (`academy_id`,`member_id`,`game_id`);--> statement-breakpoint
CREATE TABLE `member_status_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`academy_id` text NOT NULL,
	`member_id` text NOT NULL,
	`status` text NOT NULL,
	`reason` text,
	`changed_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`academy_id`) REFERENCES `academies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`academy_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`batch` text NOT NULL,
	`contact_number` text,
	`address` text,
	`status` text DEFAULT 'active' NOT NULL,
	`custom_monthly_amount` integer,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`academy_id`) REFERENCES `academies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `monthly_fees` (
	`id` text PRIMARY KEY NOT NULL,
	`academy_id` text NOT NULL,
	`member_id` text NOT NULL,
	`month` text NOT NULL,
	`amount_due` integer NOT NULL,
	`status` text DEFAULT 'standard' NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`academy_id`) REFERENCES `academies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `monthly_fees_unique_idx` ON `monthly_fees` (`academy_id`,`member_id`,`month`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`academy_id` text NOT NULL,
	`member_id` text NOT NULL,
	`amount` integer NOT NULL,
	`payment_method` text DEFAULT 'cash' NOT NULL,
	`paid_at` integer DEFAULT (unixepoch()),
	`notes` text,
	`reversal_of_id` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`academy_id`) REFERENCES `academies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `visit_charges` (
	`id` text PRIMARY KEY NOT NULL,
	`academy_id` text NOT NULL,
	`member_id` text NOT NULL,
	`date` text NOT NULL,
	`game_id` text NOT NULL,
	`amount` integer NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`academy_id`) REFERENCES `academies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
