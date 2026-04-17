CREATE TABLE `answers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lessonId` int NOT NULL,
	`questionNumber` int NOT NULL,
	`answerText` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `answers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `lessons` ADD `language` enum('english','hindi') DEFAULT 'english' NOT NULL;--> statement-breakpoint
ALTER TABLE `answers` ADD CONSTRAINT `answers_lessonId_lessons_id_fk` FOREIGN KEY (`lessonId`) REFERENCES `lessons`(`id`) ON DELETE cascade ON UPDATE no action;