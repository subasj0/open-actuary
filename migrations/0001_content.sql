CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`course_id` text NOT NULL,
	`draft` text NOT NULL,
	`revision` integer NOT NULL,
	`published` text,
	`published_revision` integer,
	`review` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `learner_progress` (
	`user_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`data` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `lesson_id`)
);
--> statement-breakpoint
CREATE TABLE `revisions` (
	`document_id` text NOT NULL,
	`revision` integer NOT NULL,
	`content` text NOT NULL,
	`created_at` text NOT NULL,
	`message` text NOT NULL,
	PRIMARY KEY(`document_id`, `revision`)
);

ALTER TABLE documents ADD published_review TEXT;
CREATE INDEX documents_course_kind ON documents(course_id,kind);
CREATE INDEX documents_kind ON documents(kind);
