CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`key_hash` text NOT NULL,
	`name` text NOT NULL,
	`tier` text DEFAULT 'free' NOT NULL,
	`owner_email` text NOT NULL,
	`created_at` text NOT NULL,
	`last_used_at` text,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_key_hash_unique` ON `api_keys` (`key_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_api_keys_hash` ON `api_keys` (`key_hash`);--> statement-breakpoint
CREATE TABLE `countries` (
	`iso3` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`currency_code` text NOT NULL,
	`currency_name` text NOT NULL,
	`flag_emoji` text NOT NULL,
	`region` text NOT NULL,
	`capital` text,
	`lat` real,
	`lon` real,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_countries_region` ON `countries` (`region`);--> statement-breakpoint
CREATE INDEX `idx_countries_currency` ON `countries` (`currency_code`);--> statement-breakpoint
CREATE TABLE `quarantine_rates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider` text NOT NULL,
	`base_currency` text NOT NULL,
	`quote_currency` text NOT NULL,
	`buy_rate` real NOT NULL,
	`sell_rate` real NOT NULL,
	`reason` text NOT NULL,
	`raw_payload` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_quarantine_created` ON `quarantine_rates` (`created_at`);--> statement-breakpoint
CREATE TABLE `rate_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider` text NOT NULL,
	`base_currency` text NOT NULL,
	`quote_currency` text NOT NULL,
	`buy_rate` real NOT NULL,
	`sell_rate` real NOT NULL,
	`mid_rate` real NOT NULL,
	`spread` real NOT NULL,
	`timestamp` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_history_pair_time` ON `rate_history` (`base_currency`,`quote_currency`,`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_history_provider` ON `rate_history` (`provider`);--> statement-breakpoint
CREATE TABLE `rates` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`base_currency` text NOT NULL,
	`quote_currency` text NOT NULL,
	`buy_rate` real NOT NULL,
	`sell_rate` real NOT NULL,
	`mid_rate` real NOT NULL,
	`spread` real NOT NULL,
	`retrieved_at` text NOT NULL,
	`provider_timestamp` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_rates_pair` ON `rates` (`base_currency`,`quote_currency`);--> statement-breakpoint
CREATE INDEX `idx_rates_provider` ON `rates` (`provider`);