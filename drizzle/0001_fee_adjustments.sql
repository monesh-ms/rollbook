CREATE TABLE `fee_adjustments` (
	`id` text PRIMARY KEY NOT NULL,
	`academy_id` text NOT NULL,
	`member_id` text NOT NULL,
	`month` text NOT NULL,
	`action` text NOT NULL,
	`amount_before` integer,
	`amount_after` integer NOT NULL,
	`reason` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`academy_id`) REFERENCES `academies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
