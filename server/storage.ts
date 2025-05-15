import { db } from "@db";
import { eq, and, desc, sql, asc, inArray } from "drizzle-orm";
import * as schema from "@shared/schema";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { extractTextFromDocument } from "./openai";

// User related functions
export async function getUserByUsername(username: string): Promise<schema.User | null> {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.username, username)
  });
  return user || null;
}

export async function createUser(userData: schema.InsertUser): Promise<schema.User> {
  const [user] = await db.insert(schema.users).values(userData).returning();
  return user;
}

// Subject related functions
export async function getAllSubjects(): Promise<schema.Subject[]> {
  try {
    // Try using the ORM approach first
    return await db.query.subjects.findMany();
  } catch (error) {
    console.log("Using fallback for getAllSubjects", error);
    // Fallback to direct SQL query
    const results = await db.execute(
      sql`SELECT id, name, description, COALESCE(icon, 'menu_book') as icon, COALESCE(created_at, NOW()) as created_at FROM subjects`
    );
    // Map the raw results to match our schema
    return (results.rows || []).map((row: any) => ({
      id: Number(row.id),
      name: String(row.name),
      description: row.description ? String(row.description) : '',
      icon: row.icon ? String(row.icon) : null,
      createdAt: new Date(row.created_at)
    }));
  }
}

export async function getSubjectById(id: number): Promise<schema.Subject | null> {
  try {
    // Try using the ORM approach first
    const subject = await db.query.subjects.findFirst({
      where: eq(schema.subjects.id, id)
    });
    return subject || null;
  } catch (error) {
    console.log("Using fallback for getSubjectById", error);
    // Fallback to direct SQL query
    const results = await db.execute(
      sql`SELECT id, name, description, COALESCE(icon, 'menu_book') as icon, COALESCE(created_at, NOW()) as created_at FROM subjects WHERE id = ${id}`
    );
    
    if (!results.rows || results.rows.length === 0) {
      return null;
    }
    
    const row = results.rows[0] as any;
    return {
      id: Number(row.id),
      name: String(row.name),
      description: row.description ? String(row.description) : '',
      icon: row.icon ? String(row.icon) : null,
      createdAt: new Date(row.created_at)
    };
  }
}

export async function createSubject(subjectData: schema.InsertSubject): Promise<schema.Subject> {
  const [subject] = await db.insert(schema.subjects).values(subjectData).returning();
  return subject;
}

export async function updateSubject(id: number, subjectData: Partial<schema.InsertSubject>): Promise<schema.Subject | null> {
  const [updatedSubject] = await db.update(schema.subjects)
    .set(subjectData)
    .where(eq(schema.subjects.id, id))
    .returning();
  return updatedSubject || null;
}

export async function deleteSubject(id: number): Promise<boolean> {
  const [deletedSubject] = await db.delete(schema.subjects)
    .where(eq(schema.subjects.id, id))
    .returning();
  return !!deletedSubject;
}

// Chapter related functions
export async function getChaptersBySubjectId(subjectId: number): Promise<schema.Chapter[]> {
  return await db.query.chapters.findMany({
    where: eq(schema.chapters.subjectId, subjectId),
    orderBy: asc(schema.chapters.id)
  });
}

export async function getChapterById(id: number): Promise<schema.Chapter | null> {
  const chapter = await db.query.chapters.findFirst({
    where: eq(schema.chapters.id, id)
  });
  return chapter || null;
}

export async function createChapter(chapterData: schema.InsertChapter): Promise<schema.Chapter> {
  const [chapter] = await db.insert(schema.chapters).values(chapterData).returning();
  return chapter;
}

export async function updateChapter(id: number, chapterData: Partial<schema.InsertChapter>): Promise<schema.Chapter | null> {
  const [updatedChapter] = await db.update(schema.chapters)
    .set(chapterData)
    .where(eq(schema.chapters.id, id))
    .returning();
  return updatedChapter || null;
}

export async function deleteChapter(id: number): Promise<boolean> {
  const [deletedChapter] = await db.delete(schema.chapters)
    .where(eq(schema.chapters.id, id))
    .returning();
  return !!deletedChapter;
}

// Subchapter related functions
export async function getSubchaptersByChapterId(chapterId: number): Promise<schema.Subchapter[]> {
  // Clear the query cache before fetching
  await db.execute(sql`SELECT pg_notify('subchapters_updated', 'refresh')`);
  
  return await db.query.subchapters.findMany({
    where: eq(schema.subchapters.chapterId, chapterId),
    orderBy: asc(schema.subchapters.id)
  });
}

export async function getSubchapterById(id: number): Promise<schema.Subchapter | null> {
  const subchapter = await db.query.subchapters.findFirst({
    where: eq(schema.subchapters.id, id)
  });
  return subchapter || null;
}

export async function createSubchapter(subchapterData: schema.InsertSubchapter): Promise<schema.Subchapter> {
  const [subchapter] = await db.insert(schema.subchapters).values(subchapterData).returning();
  
  // Notify about the update
  await db.execute(sql`SELECT pg_notify('subchapters_updated', 'refresh')`);
  
  return subchapter;
}

export async function updateSubchapter(id: number, subchapterData: Partial<schema.InsertSubchapter>): Promise<schema.Subchapter | null> {
  const [updatedSubchapter] = await db.update(schema.subchapters)
    .set(subchapterData)
    .where(eq(schema.subchapters.id, id))
    .returning();
  return updatedSubchapter || null;
}

export async function deleteSubchapter(id: number): Promise<boolean> {
  const [deletedSubchapter] = await db.delete(schema.subchapters)
    .where(eq(schema.subchapters.id, id))
    .returning();
  return !!deletedSubchapter;
}

// Study material related functions
export async function getStudyMaterialsBySubchapterId(subchapterId: number): Promise<schema.StudyMaterial[]> {
  return await db.query.studyMaterials.findMany({
    where: eq(schema.studyMaterials.subchapterId, subchapterId),
    orderBy: desc(schema.studyMaterials.createdAt)
  });
}

export async function getStudyMaterialById(id: number): Promise<schema.StudyMaterial | null> {
  const material = await db.query.studyMaterials.findFirst({
    where: eq(schema.studyMaterials.id, id)
  });
  return material || null;
}

export async function createStudyMaterial(materialData: schema.InsertStudyMaterial): Promise<schema.StudyMaterial> {
  const [material] = await db.insert(schema.studyMaterials).values(materialData).returning();
  return material;
}

export async function updateStudyMaterial(id: number, materialData: Partial<schema.InsertStudyMaterial>): Promise<schema.StudyMaterial | null> {
  const [updatedMaterial] = await db.update(schema.studyMaterials)
    .set(materialData)
    .where(eq(schema.studyMaterials.id, id))
    .returning();
  return updatedMaterial || null;
}

export async function deleteStudyMaterial(id: number): Promise<boolean> {
  const [deletedMaterial] = await db.delete(schema.studyMaterials)
    .where(eq(schema.studyMaterials.id, id))
    .returning();
  return !!deletedMaterial;
}

// Quiz related functions
export async function getQuizzesByMaterialId(materialId: number): Promise<schema.Quiz[]> {
  return await db.query.quizzes.findMany({
    where: eq(schema.quizzes.materialId, materialId),
    orderBy: desc(schema.quizzes.createdAt)
  });
}

export async function getQuizById(id: number): Promise<schema.Quiz | null> {
  const quiz = await db.query.quizzes.findFirst({
    where: eq(schema.quizzes.id, id)
  });
  return quiz || null;
}

export async function createQuiz(quizData: schema.InsertQuiz): Promise<schema.Quiz> {
  // Always create a new quiz, never reuse
  const [quiz] = await db.insert(schema.quizzes).values(quizData).returning();
  return quiz;
}

// Quiz score related functions
export async function createQuizScore(scoreData: schema.InsertQuizScore): Promise<schema.QuizScore> {
  const [score] = await db.insert(schema.quizScores).values(scoreData).returning();
  return score;
}

export async function getLeaderboardByQuizId(quizId: number): Promise<any[]> {
  const results = await db.select({
    id: schema.quizScores.id,
    username: schema.users.username,
    score: schema.quizScores.score,
    timeTaken: schema.quizScores.timeTaken,
    completedAt: schema.quizScores.completedAt
  })
  .from(schema.quizScores)
  .innerJoin(schema.users, eq(schema.quizScores.userId, schema.users.id))
  .where(eq(schema.quizScores.quizId, quizId))
  .orderBy(desc(schema.quizScores.score), asc(schema.quizScores.timeTaken));
  
  return results;
}

export async function getLeaderboardByMaterialId(materialId: number): Promise<any[]> {
  // First get all quizzes for this material
  const quizzes = await db.query.quizzes.findMany({
    where: eq(schema.quizzes.materialId, materialId)
  });
  
  const quizIds = quizzes.map(quiz => quiz.id);
  
  // Get all scores for these quizzes
  const results = await db.select({
    id: schema.quizScores.id,
    username: schema.users.username,
    score: schema.quizScores.score,
    timeTaken: schema.quizScores.timeTaken,
    completedAt: schema.quizScores.completedAt,
    level: schema.quizzes.level
  })
  .from(schema.quizScores)
  .innerJoin(schema.users, eq(schema.quizScores.userId, schema.users.id))
  .innerJoin(schema.quizzes, eq(schema.quizScores.quizId, schema.quizzes.id))
  .where(sql`${schema.quizScores.quizId} = ANY(ARRAY[${quizIds.join(',')}]::int[])`)
  .orderBy(schema.quizzes.level, desc(schema.quizScores.score), asc(schema.quizScores.timeTaken));
  
  return results;
}

// Study recommendation related functions
export async function createStudyRecommendation(recommData: schema.InsertStudyRecommendation): Promise<schema.StudyRecommendation> {
  const [recommendation] = await db.insert(schema.studyRecommendations).values(recommData).returning();
  return recommendation;
}

export async function getStudyRecommendationsByUserId(userId: number): Promise<schema.StudyRecommendation[]> {
  return await db.query.studyRecommendations.findMany({
    where: eq(schema.studyRecommendations.userId, userId),
    orderBy: desc(schema.studyRecommendations.generatedAt)
  });
}

// Get a student's progress report
export async function getStudentReport(userId: number): Promise<any> {
  // Get all quiz scores for the user
  const quizScores = await db.select({
    id: schema.quizScores.id,
    score: schema.quizScores.score,
    timeTaken: schema.quizScores.timeTaken,
    completedAt: schema.quizScores.completedAt,
    quizId: schema.quizScores.quizId,
    level: schema.quizzes.level,
    materialId: schema.quizzes.materialId,
    materialTitle: schema.studyMaterials.title,
    subchapterId: schema.studyMaterials.subchapterId,
    subchapterName: schema.subchapters.name,
    chapterId: schema.subchapters.chapterId,
    chapterName: schema.chapters.name,
    subjectId: schema.chapters.subjectId,
    subjectName: schema.subjects.name
  })
  .from(schema.quizScores)
  .innerJoin(schema.quizzes, eq(schema.quizScores.quizId, schema.quizzes.id))
  .innerJoin(schema.studyMaterials, eq(schema.quizzes.materialId, schema.studyMaterials.id))
  .innerJoin(schema.subchapters, eq(schema.studyMaterials.subchapterId, schema.subchapters.id))
  .innerJoin(schema.chapters, eq(schema.subchapters.chapterId, schema.chapters.id))
  .innerJoin(schema.subjects, eq(schema.chapters.subjectId, schema.subjects.id))
  .where(eq(schema.quizScores.userId, userId))
  .orderBy(desc(schema.quizScores.completedAt));
  
  // Get all recommendations
  const recommendations = await getStudyRecommendationsByUserId(userId);
  
  // Calculate statistics
  const totalQuizzes = quizScores.length;
  const averageScore = totalQuizzes > 0 
    ? quizScores.reduce((sum, score) => sum + score.score, 0) / totalQuizzes 
    : 0;
    
  // Group by subject
  type SubjectPerformance = {
    [key: string]: {
      totalQuizzes: number;
      totalScore: number;
      averageScore: number;
      quizzes: any[];
    }
  };
  
  const subjectPerformance = quizScores.reduce<SubjectPerformance>((acc, score) => {
    const subject = score.subjectName;
    if (!acc[subject]) {
      acc[subject] = {
        totalQuizzes: 0,
        totalScore: 0,
        averageScore: 0,
        quizzes: []
      };
    }
    
    acc[subject].totalQuizzes++;
    acc[subject].totalScore += score.score;
    acc[subject].quizzes.push(score);
    acc[subject].averageScore = acc[subject].totalScore / acc[subject].totalQuizzes;
    
    return acc;
  }, {});
  
  return {
    totalQuizzes,
    averageScore,
    quizScores,
    recommendations,
    subjectPerformance
  };
}

// File handling for study materials
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function saveUploadedFile(file: Express.Multer.File): Promise<string> {
  // Generate a unique filename
  const uniqueId = crypto.randomBytes(16).toString('hex');
  const originalExtension = path.extname(file.originalname);
  const fileName = `${uniqueId}${originalExtension}`;
  const filePath = path.join(UPLOADS_DIR, fileName);
  
  // Write the file
  await fs.promises.writeFile(filePath, file.buffer);
  
  return fileName;
}

export async function getFileContent(filename: string): Promise<string> {
  const filePath = path.join(UPLOADS_DIR, filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filename}, using default study material content`);
    // Return default content for development/testing purposes
    return `This is a default study material for Malaysian Standard 1 students.
    
    It covers topics such as:
    - Introduction to Plants
    - Animals in our environment
    - Basic science concepts
    
    Plants need sunlight, water, and soil to grow healthy. They have different parts like roots, stems, and leaves.
    Roots help plants get water and nutrients from the soil.
    Stems carry water and nutrients to all parts of the plant.
    Leaves use sunlight to make food for the plant.
    
    Animals are living things that need food, water, and shelter to survive.
    Some animals are mammals, some are birds, some are reptiles, and some are fish.
    
    Weather changes throughout the year. Sometimes it's hot, sometimes it's cold.
    Malaysia has a tropical climate with plenty of rain and sunshine.`;
  }
  
<<<<<<< HEAD
  try {
    // Extract text based on file type
    return await extractTextFromDocument(filePath);
  } catch (error) {
    console.warn(`Error extracting text from file: ${filename}, using default study material content`);
    console.error(error);
    
    // Return default content if text extraction fails
    return `This is a default study material about ${path.basename(filename, path.extname(filename))}.
    
    It covers essential topics for Malaysian Standard 1 students including basic science concepts,
    language fundamentals, and important mathematical skills.
    
    Students will learn about plants, animals, and their environment.
    Plants need sunlight, water, and soil to grow.
    Animals need food, water, and shelter to survive.
    
    Science, mathematics, and language skills are important building blocks for education.`;
  }
}
=======
  // Extract text based on file type
  return extractTextFromDocument(filePath);
}
>>>>>>> 37a751984f3548f5d683088ca45e79327fc6d778
