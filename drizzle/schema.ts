import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Lessons table: stores AI-generated lesson content (Simplify Concept, Class Activity, Check Understanding)
 */
export const lessons = mysqlTable("lessons", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  class: varchar("class", { length: 10 }).notNull(), // e.g., "1", "10", "11-Science"
  subject: varchar("subject", { length: 64 }).notNull(), // e.g., "Mathematics", "Physics"
  topic: text("topic").notNull(), // e.g., "Newton's Third Law"
  toolType: mysqlEnum("toolType", ["simplify", "activity", "understanding"]).notNull(),
  language: mysqlEnum("language", ["english", "hindi", "gujarati", "marathi", "punjabi", "bengali", "tamil", "telugu", "kannada", "malayalam", "other"]).default("english").notNull(), // Language for content generation
  content: text("content").notNull(), // AI-generated response
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = typeof lessons.$inferInsert;

/**
 * Answers table: stores answers for Check Understanding questions
 */
export const answers = mysqlTable("answers", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: int("lessonId").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  questionNumber: int("questionNumber").notNull(), // 1, 2, 3 for the three questions
  answerText: text("answerText").notNull(), // Answer content
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = typeof answers.$inferInsert;

/**
 * Refinements table: stores follow-up refinements and AI responses
 */
export const refinements = mysqlTable("refinements", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: int("lessonId").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  refinementType: varchar("refinementType", { length: 64 }).notNull(), // e.g., "Make simpler", "Add examples", "Shorter", or custom text
  refinedContent: text("refinedContent").notNull(), // AI-refined response
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Refinement = typeof refinements.$inferSelect;
export type InsertRefinement = typeof refinements.$inferInsert;

/**
 * Sessions table: tracks user sessions for conversation history
 */
export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionName: varchar("sessionName", { length: 255 }).notNull(), // e.g., "Class 10 Physics - Nov 16"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;