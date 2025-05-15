import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// User table - extending the existing users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  isTeacher: boolean("is_teacher").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Subjects (Math, Science, etc.)
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").default("menu_book"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Chapters under subjects
export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").default(1),
  subjectId: integer("subject_id").references(() => subjects.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Subchapters under chapters
export const subchapters = pgTable("subchapters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").default(1),
  chapterId: integer("chapter_id").references(() => chapters.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Study materials linked to subchapters
export const studyMaterials = pgTable("study_materials", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  documentUrl: text("document_url").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: text("file_size"),
  subchapterId: integer("subchapter_id").references(() => subchapters.id).notNull(),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// For storing AI-generated quizzes
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id").references(() => studyMaterials.id).notNull(),
  level: text("level").notNull(), // "Beginner", "Intermediate", "Advanced"
  questions: jsonb("questions").notNull(), // JSON containing questions, options, and answers
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// For storing quiz scores
export const quizScores = pgTable("quiz_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  quizId: integer("quiz_id").references(() => quizzes.id).notNull(),
  score: integer("score").notNull(), // Percentage score
  timeTaken: text("time_taken").notNull(), // Format: "MM:SS"
  completedAt: timestamp("completed_at").defaultNow().notNull()
});

// For storing AI-generated recommendations
export const studyRecommendations = pgTable("study_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  subchapterId: integer("subchapter_id").references(() => subchapters.id).notNull(),
  recommendation: text("recommendation").notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull()
});

// Define relationships
export const subjectsRelations = relations(subjects, ({ many }) => ({
  chapters: many(chapters)
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  subject: one(subjects, { fields: [chapters.subjectId], references: [subjects.id] }),
  subchapters: many(subchapters)
}));

export const subchaptersRelations = relations(subchapters, ({ one, many }) => ({
  chapter: one(chapters, { fields: [subchapters.chapterId], references: [chapters.id] }),
  studyMaterials: many(studyMaterials)
}));

export const studyMaterialsRelations = relations(studyMaterials, ({ one, many }) => ({
  subchapter: one(subchapters, { fields: [studyMaterials.subchapterId], references: [subchapters.id] }),
  quizzes: many(quizzes)
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  studyMaterial: one(studyMaterials, { fields: [quizzes.materialId], references: [studyMaterials.id] }),
  scores: many(quizScores)
}));

export const quizScoresRelations = relations(quizScores, ({ one }) => ({
  user: one(users, { fields: [quizScores.userId], references: [users.id] }),
  quiz: one(quizzes, { fields: [quizScores.quizId], references: [quizzes.id] })
}));

export const studyRecommendationsRelations = relations(studyRecommendations, ({ one }) => ({
  user: one(users, { fields: [studyRecommendations.userId], references: [users.id] }),
  subchapter: one(subchapters, { fields: [studyRecommendations.subchapterId], references: [subchapters.id] })
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  isTeacher: true
});

export const insertSubjectSchema = createInsertSchema(subjects).pick({
  name: true,
  description: true,
  icon: true
});

export const insertChapterSchema = createInsertSchema(chapters).pick({
  name: true,
  description: true,
  order: true,
  subjectId: true
});

export const insertSubchapterSchema = createInsertSchema(subchapters).pick({
  name: true,
  description: true,
  order: true,
  chapterId: true
});

export const insertStudyMaterialSchema = createInsertSchema(studyMaterials).pick({
  title: true,
  description: true,
  documentUrl: true,
  fileType: true,
  fileSize: true,
  subchapterId: true,
  uploadedBy: true
});

// Define a structured format for quiz questions
export const quizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correctAnswerIndex: z.number(),
  explanation: z.string().optional()
});

export const insertQuizSchema = createInsertSchema(quizzes).extend({
  questions: z.array(quizQuestionSchema)
});

export const insertQuizScoreSchema = createInsertSchema(quizScores);

export const insertStudyRecommendationSchema = createInsertSchema(studyRecommendations);

// Export type definitions
export type User = typeof users.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type Chapter = typeof chapters.$inferSelect;
export type Subchapter = typeof subchapters.$inferSelect;
export type StudyMaterial = typeof studyMaterials.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type QuizScore = typeof quizScores.$inferSelect;
export type StudyRecommendation = typeof studyRecommendations.$inferSelect;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type InsertChapter = z.infer<typeof insertChapterSchema>;
export type InsertSubchapter = z.infer<typeof insertSubchapterSchema>;
export type InsertStudyMaterial = z.infer<typeof insertStudyMaterialSchema>;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type InsertQuizScore = z.infer<typeof insertQuizScoreSchema>;
export type InsertStudyRecommendation = z.infer<typeof insertStudyRecommendationSchema>;
