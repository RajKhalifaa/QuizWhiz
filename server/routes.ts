import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import * as storage from "./storage";
import { generateQuiz, generateStudyRecommendations } from "./openai";
import * as schema from "@shared/schema";
import bcrypt from "bcrypt";
import multer from "multer";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        isTeacher: boolean;
        username?: string;
      };
    }
  }
}

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-in-production";

// Auth middleware
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Authorization header:', req.headers.authorization);
    
    // Check different auth header formats for flexibility
    let token: string | undefined;
    
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.headers.authorization) {
      // Try to use the authorization header directly if no Bearer prefix
      token = req.headers.authorization;
    } else if (req.query.token) {
      // Allow token as query parameter for testing
      token = req.query.token as string;
    }
    
    if (!token) {
      console.log('No token found in request');
      return res.status(401).json({ message: "No token provided" });
    }

    console.log('Token found, verifying...', token.substring(0, 10) + '...');
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; isTeacher: boolean; username?: string };
      req.user = { 
        id: decoded.userId, 
        isTeacher: decoded.isTeacher,
        username: decoded.username || '' // Initialize with empty string to avoid undefined
      };
      console.log('Auth successful for user:', req.user.id, 'isTeacher:', req.user.isTeacher);
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return res.status(401).json({ message: "Invalid token" });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: "Authentication failed" });
  }
};

// Teacher middleware
const teacherMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isTeacher) {
    return res.status(403).json({ message: "Teacher access required" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Extend Request type to include user
  // We're already importing Request from express, no need to redeclare it
  // We'll just use it directly with the `user` property

  // API Routes
  const apiPrefix = "/api";

  // Auth routes
  app.post(`${apiPrefix}/register`, async (req: Request, res: Response) => {
    try {
      const { username, password, email, isTeacher } = schema.insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        isTeacher: isTeacher || false
      });

      res.status(201).json({ message: "User registered successfully", userId: user.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: fromZodError(error).message });
      }
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(`${apiPrefix}/login`, async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      // Get user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user.id, isTeacher: user.isTeacher },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.status(200).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isTeacher: user.isTeacher,
          is_teacher: user.isTeacher // Include both forms for compatibility with frontend
        }
      });
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // OpenAI status check endpoint
  app.get(`${apiPrefix}/check-openai`, async (req: Request, res: Response) => {
    try {
      // This endpoint doesn't actually connect to OpenAI, it just returns the status
      // based on the initialization status in the server startup
      const isKeyAvailable = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0;
      
      if (isKeyAvailable) {
        return res.status(200).json({ 
          status: "available", 
          message: "OpenAI API key is available" 
        });
      } else {
        return res.status(400).json({ 
          status: "unavailable", 
          message: "OpenAI API key is not available" 
        });
      }
    } catch (error) {
      console.error("Error checking OpenAI status:", error);
      return res.status(500).json({ 
        status: "error", 
        message: "Error checking OpenAI API key status" 
      });
    }
  });

  // User routes
  app.get(`${apiPrefix}/user`, authMiddleware, async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user.username) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUserByUsername(req.user.username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        isTeacher: user.isTeacher,
        is_teacher: user.isTeacher // Include both forms for compatibility with frontend
      });
    } catch (error) {
      console.error("Error getting user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Subject routes
  app.get(`${apiPrefix}/subjects`, async (req: Request, res: Response) => {
    try {
      const subjects = await storage.getAllSubjects();
      res.status(200).json(subjects);
    } catch (error) {
      console.error("Error getting subjects:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(`${apiPrefix}/subjects`, authMiddleware, teacherMiddleware, async (req: Request, res: Response) => {
    try {
      const subjectData = schema.insertSubjectSchema.parse(req.body);
      const subject = await storage.createSubject(subjectData);
      res.status(201).json(subject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: fromZodError(error).message });
      }
      console.error("Error creating subject:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update a subject (teachers only)
  app.put(`${apiPrefix}/subjects/:id`, authMiddleware, teacherMiddleware, async (req: Request, res: Response) => {
    try {
      const subjectId = Number(req.params.id);
      if (isNaN(subjectId)) {
        return res.status(400).json({ message: "Valid subject ID required" });
      }
      
      // Get the existing subject first
      const existingSubject = await storage.getSubjectById(subjectId);
      if (!existingSubject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      
      // Validate the update data
      const subjectData = schema.insertSubjectSchema.parse(req.body);
      const updatedSubject = await storage.updateSubject(subjectId, subjectData);
      
      res.status(200).json(updatedSubject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: fromZodError(error).message });
      }
      console.error("Error updating subject:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Delete a subject (teachers only)
  app.delete(`${apiPrefix}/subjects/:id`, authMiddleware, teacherMiddleware, async (req: Request, res: Response) => {
    try {
      const subjectId = Number(req.params.id);
      if (isNaN(subjectId)) {
        return res.status(400).json({ message: "Valid subject ID required" });
      }
      
      // Get the existing subject first
      const existingSubject = await storage.getSubjectById(subjectId);
      if (!existingSubject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      
      const success = await storage.deleteSubject(subjectId);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete subject" });
      }
      
      res.status(200).json({ message: "Subject deleted successfully" });
    } catch (error) {
      console.error("Error deleting subject:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Chapter routes
  app.get(`${apiPrefix}/chapters`, async (req: Request, res: Response) => {
    try {
      const subjectId = Number(req.query.subjectId);
      if (isNaN(subjectId)) {
        return res.status(400).json({ message: "Valid subjectId required" });
      }
      
      const chapters = await storage.getChaptersBySubjectId(subjectId);
      res.status(200).json(chapters);
    } catch (error) {
      console.error("Error getting chapters:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(`${apiPrefix}/chapters`, authMiddleware, teacherMiddleware, async (req: Request, res: Response) => {
    try {
      const chapterData = schema.insertChapterSchema.parse(req.body);
      const chapter = await storage.createChapter(chapterData);
      res.status(201).json(chapter);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: fromZodError(error).message });
      }
      console.error("Error creating chapter:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update a chapter (teachers only)
  app.put(`${apiPrefix}/chapters/:id`, authMiddleware, teacherMiddleware, async (req: Request, res: Response) => {
    try {
      const chapterId = Number(req.params.id);
      if (isNaN(chapterId)) {
        return res.status(400).json({ message: "Valid chapter ID required" });
      }
      
      // Get the existing chapter first
      const existingChapter = await storage.getChapterById(chapterId);
      if (!existingChapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      
      // Validate the update data
      const chapterData = schema.insertChapterSchema.parse(req.body);
      const updatedChapter = await storage.updateChapter(chapterId, chapterData);
      
      res.status(200).json(updatedChapter);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: fromZodError(error).message });
      }
      console.error("Error updating chapter:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Delete a chapter (teachers only)
  app.delete(`${apiPrefix}/chapters/:id`, authMiddleware, teacherMiddleware, async (req: Request, res: Response) => {
    try {
      const chapterId = Number(req.params.id);
      if (isNaN(chapterId)) {
        return res.status(400).json({ message: "Valid chapter ID required" });
      }
      
      // Get the existing chapter first
      const existingChapter = await storage.getChapterById(chapterId);
      if (!existingChapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      
      const success = await storage.deleteChapter(chapterId);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete chapter" });
      }
      
      res.status(200).json({ message: "Chapter deleted successfully" });
    } catch (error) {
      console.error("Error deleting chapter:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Subchapter routes
  app.get(`${apiPrefix}/subchapters`, async (req: Request, res: Response) => {
    try {
      const chapterId = Number(req.query.chapterId);
      if (isNaN(chapterId)) {
        return res.status(400).json({ message: "Valid chapterId required" });
      }
      
      const subchapters = await storage.getSubchaptersByChapterId(chapterId);
      res.status(200).json(subchapters);
    } catch (error) {
      console.error("Error getting subchapters:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(`${apiPrefix}/subchapters`, authMiddleware, teacherMiddleware, async (req: Request, res: Response) => {
    try {
      const subchapterData = schema.insertSubchapterSchema.parse(req.body);
      const subchapter = await storage.createSubchapter(subchapterData);
      res.status(201).json(subchapter);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: fromZodError(error).message });
      }
      console.error("Error creating subchapter:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update a subchapter (teachers only)
  app.put(`${apiPrefix}/subchapters/:id`, authMiddleware, teacherMiddleware, async (req: Request, res: Response) => {
    try {
      const subchapterId = Number(req.params.id);
      if (isNaN(subchapterId)) {
        return res.status(400).json({ message: "Valid subchapter ID required" });
      }
      
      // Get the existing subchapter first
      const existingSubchapter = await storage.getSubchapterById(subchapterId);
      if (!existingSubchapter) {
        return res.status(404).json({ message: "Subchapter not found" });
      }
      
      // Validate the update data
      const subchapterData = schema.insertSubchapterSchema.parse(req.body);
      const updatedSubchapter = await storage.updateSubchapter(subchapterId, subchapterData);
      
      res.status(200).json(updatedSubchapter);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: fromZodError(error).message });
      }
      console.error("Error updating subchapter:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Delete a subchapter (teachers only)
  app.delete(`${apiPrefix}/subchapters/:id`, authMiddleware, teacherMiddleware, async (req: Request, res: Response) => {
    try {
      const subchapterId = Number(req.params.id);
      if (isNaN(subchapterId)) {
        return res.status(400).json({ message: "Valid subchapter ID required" });
      }
      
      // Get the existing subchapter first
      const existingSubchapter = await storage.getSubchapterById(subchapterId);
      if (!existingSubchapter) {
        return res.status(404).json({ message: "Subchapter not found" });
      }
      
      const success = await storage.deleteSubchapter(subchapterId);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete subchapter" });
      }
      
      res.status(200).json({ message: "Subchapter deleted successfully" });
    } catch (error) {
      console.error("Error deleting subchapter:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Study material routes
  app.get(`${apiPrefix}/materials`, async (req: Request, res: Response) => {
    try {
      const subchapterId = Number(req.query.subchapterId);
      if (isNaN(subchapterId)) {
        return res.status(400).json({ message: "Valid subchapterId required" });
      }
      
      const materials = await storage.getStudyMaterialsBySubchapterId(subchapterId);
      res.status(200).json(materials);
    } catch (error) {
      console.error("Error getting study materials:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(
    `${apiPrefix}/materials`,
    authMiddleware,
    teacherMiddleware,
    upload.single('document'),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Document file required" });
        }

        // Save the uploaded file
        const fileName = await storage.saveUploadedFile(req.file);

        // Get file type and size
        const fileType = req.file.mimetype;
        const fileSize = `${(req.file.size / 1024).toFixed(1)} KB`;

        // Parse and validate other fields
        const materialData = {
          title: req.body.title,
          description: req.body.description || null,
          documentUrl: fileName,
          fileType,
          fileSize,
          subchapterId: Number(req.body.subchapterId),
          uploadedBy: req.user?.id
        };

        const validatedData = schema.insertStudyMaterialSchema.parse(materialData);
        const material = await storage.createStudyMaterial(validatedData);
        
        res.status(201).json(material);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid input", errors: fromZodError(error).message });
        }
        console.error("Error creating study material:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Update study material (without document)
  app.put(
    `${apiPrefix}/materials/:id`,
    authMiddleware,
    teacherMiddleware,
    async (req: Request, res: Response) => {
      try {
        const materialId = Number(req.params.id);
        if (isNaN(materialId)) {
          return res.status(400).json({ message: "Valid material ID required" });
        }
        
        // Get the existing material first
        const existingMaterial = await storage.getStudyMaterialById(materialId);
        if (!existingMaterial) {
          return res.status(404).json({ message: "Study material not found" });
        }
        
        // Only update allowed fields (title, description, subchapterId)
        const updateData: Partial<schema.InsertStudyMaterial> = {
          title: req.body.title,
          description: req.body.description || null
        };
        
        // Only update subchapterId if provided
        if (req.body.subchapterId) {
          updateData.subchapterId = Number(req.body.subchapterId);
        }
        
        const updatedMaterial = await storage.updateStudyMaterial(materialId, updateData);
        
        res.status(200).json(updatedMaterial);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid input", errors: fromZodError(error).message });
        }
        console.error("Error updating study material:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );
  
  // Update study material with new document
  app.put(
    `${apiPrefix}/materials/:id/document`,
    authMiddleware,
    teacherMiddleware,
    upload.single('document'),
    async (req: Request, res: Response) => {
      try {
        const materialId = Number(req.params.id);
        if (isNaN(materialId)) {
          return res.status(400).json({ message: "Valid material ID required" });
        }
        
        if (!req.file) {
          return res.status(400).json({ message: "Document file required" });
        }
        
        // Get the existing material first
        const existingMaterial = await storage.getStudyMaterialById(materialId);
        if (!existingMaterial) {
          return res.status(404).json({ message: "Study material not found" });
        }
        
        // Save the uploaded file
        const fileName = await storage.saveUploadedFile(req.file);
        
        // Get file type and size
        const fileType = req.file.mimetype;
        const fileSize = `${(req.file.size / 1024).toFixed(1)} KB`;
        
        // Update the material with new document info
        const updateData: Partial<schema.InsertStudyMaterial> = {
          documentUrl: fileName,
          fileType,
          fileSize
        };
        
        // Also update title and description if provided
        if (req.body.title) updateData.title = req.body.title;
        if (req.body.description !== undefined) updateData.description = req.body.description || null;
        if (req.body.subchapterId) updateData.subchapterId = Number(req.body.subchapterId);
        
        const updatedMaterial = await storage.updateStudyMaterial(materialId, updateData);
        
        res.status(200).json(updatedMaterial);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid input", errors: fromZodError(error).message });
        }
        console.error("Error updating study material document:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  app.delete(
    `${apiPrefix}/materials/:id`,
    authMiddleware,
    teacherMiddleware,
    async (req: Request, res: Response) => {
      try {
        const materialId = Number(req.params.id);
        if (isNaN(materialId)) {
          return res.status(400).json({ message: "Valid material ID required" });
        }

        const success = await storage.deleteStudyMaterial(materialId);
        if (!success) {
          return res.status(404).json({ message: "Study material not found" });
        }

        res.status(200).json({ message: "Study material deleted successfully" });
      } catch (error) {
        console.error("Error deleting study material:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Quiz generation routes
  app.post(
    `${apiPrefix}/generate-quiz/:materialId`,
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        console.log('Quiz generation request received for user:', req.user?.id, 'materialId:', req.params.materialId);
        
        const materialId = Number(req.params.materialId);
        if (isNaN(materialId)) {
          return res.status(400).json({ message: "Valid material ID required" });
        }

        const { level } = req.body;
        if (!level || !['Beginner', 'Intermediate', 'Advanced'].includes(level)) {
          return res.status(400).json({ message: "Valid level required (Beginner, Intermediate, or Advanced)" });
        }

        console.log(`Generating quiz for material ID ${materialId} at ${level} level`);

        // Get the study material
        const material = await storage.getStudyMaterialById(materialId);
        if (!material) {
          console.log(`Study material with ID ${materialId} not found`);
          return res.status(404).json({ message: "Study material not found" });
        }

        console.log(`Found study material: ${material.title} (${material.documentUrl})`);

        // Always generate a new quiz when POST endpoint is called
        console.log(`Generating new quiz for material ${materialId} at ${level} level`);

        // Create a more robust fallback content based on the material title
        let quizContent: string;
        let questions: any;
        let usedFallback = false;

        try {
          // Extract content from the material document
          console.log(`Attempting to get content from file: ${material.documentUrl}`);
          quizContent = await storage.getFileContent(material.documentUrl);
          console.log('Successfully retrieved file content');
          
          // Generate quiz using OpenAI
          console.log('Generating quiz with file content...');
          questions = await generateQuiz(quizContent, level);
          console.log('Quiz questions generated successfully with file content');
        } catch (fileError) {
          console.error("Error accessing or processing study material:", fileError);
          
          // If there was a file error, use a more comprehensive fallback content
          usedFallback = true;
          quizContent = `Study material about ${material.title} for Standard 1 students.
          
          This material covers important concepts about ${material.title.toLowerCase()} including:
          - Basic facts and definitions
          - Examples and exercises
          - Practice activities
          
          Standard 1 students in Malaysia learn basic concepts about ${material.title.toLowerCase()}
          in an engaging and interactive way. The curriculum focuses on building fundamental
          knowledge while making learning fun and accessible.`;
          
          console.log("Using fallback content for quiz generation:", quizContent.substring(0, 100) + "...");
          questions = await generateQuiz(quizContent, level);
          console.log('Quiz questions generated successfully with fallback content');
        }
        
        // Save the quiz to the database
        console.log('Saving quiz to database...');
        const quiz = await storage.createQuiz({
          materialId,
          level,
          questions
        });
        
        const message = usedFallback 
          ? `Successfully created new quiz with fallback content, ID ${quiz.id}` 
          : `Successfully created new quiz ID ${quiz.id} for material ${materialId} at ${level} level`;
        
        console.log(message);
        return res.status(201).json(quiz);
      } catch (error: any) {
        console.error("Error generating quiz:", error);
        res.status(500).json({ message: "Error generating quiz: " + (error.message || "Unknown error") });
      }
    }
  );

  // GET endpoint to retrieve a generated quiz by material ID and level (if exists)
  app.get(`${apiPrefix}/generate-quiz/:materialId`, authMiddleware, async (req: Request, res: Response) => {
    try {
      console.log('GET quiz request received for user:', req.user?.id, 'materialId:', req.params.materialId);
      
      const materialId = Number(req.params.materialId);
      if (isNaN(materialId)) {
        return res.status(400).json({ message: "Valid material ID required" });
      }

      const level = req.query.level as string || 'Beginner';
      if (!['Beginner', 'Intermediate', 'Advanced'].includes(level)) {
        return res.status(400).json({ message: "Valid level required (Beginner, Intermediate, or Advanced)" });
      }

      console.log(`Looking for quiz with material ID ${materialId} at ${level} level`);
      
      // First verify that the material exists
      const material = await storage.getStudyMaterialById(materialId);
      if (!material) {
        console.log(`Study material with ID ${materialId} not found`);
        return res.status(404).json({ message: "Study material not found" });
      }

      console.log(`Found study material: ${material.title}`);

      // Find quizzes for this material with the specified level
      const quizzes = await storage.getQuizzesByMaterialId(materialId);
      console.log(`Found ${quizzes.length} quizzes for material ID ${materialId}`);
      
      // Filter for quizzes with the requested level
      const matchingQuizzes = quizzes.filter(q => q.level === level);
      
      if (matchingQuizzes.length === 0) {
        // No quiz exists yet
        console.log(`No quiz found for material ID ${materialId} at ${level} level`);
        return res.status(404).json({ message: "No quiz found for this material and level" });
      }
      
      // Get the most recently created quiz (should be at the beginning since we're ordering by desc createdAt)
      const quiz = matchingQuizzes[0];

      console.log(`Found quiz ID ${quiz.id} for material ID ${materialId} at ${level} level`);
      res.status(200).json(quiz);
    } catch (error: any) {
      console.error("Error retrieving quiz:", error);
      res.status(500).json({ message: "Error retrieving quiz: " + (error.message || "Unknown error") });
    }
  });

  // Quiz retrieval route by ID
  app.get(`${apiPrefix}/quizzes/:id`, authMiddleware, async (req: Request, res: Response) => {
    try {
      const quizId = Number(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ message: "Valid quiz ID required" });
      }

      const quiz = await storage.getQuizById(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      res.status(200).json(quiz);
    } catch (error) {
      console.error("Error retrieving quiz:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Quiz submission routes
  app.post(
    `${apiPrefix}/quiz-scores`,
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const scoreData = schema.insertQuizScoreSchema.parse({
          ...req.body,
          userId: req.user!.id
        });
        
        const score = await storage.createQuizScore(scoreData);
        
        // Get the quiz to extract questions for recommendation generation
        const quiz = await storage.getQuizById(scoreData.quizId);
        if (!quiz) {
          return res.status(404).json({ message: "Quiz not found" });
        }
        
        // Get the material to get its title
        const material = await storage.getStudyMaterialById(quiz.materialId);
        if (!material) {
          return res.status(404).json({ message: "Study material not found" });
        }
        
        // Get user to get username
        if (!req.user || !req.user.username) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        
        const user = await storage.getUserByUsername(req.user.username);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Generate recommendations based on quiz performance
        const incorrectAnswers: Array<{question: string}> = [];  // In a real app, you'd determine these from the submitted answers
        const recommendation = await generateStudyRecommendations(
          user.username,
          material.title,
          scoreData.score,
          incorrectAnswers
        );
        
        // Save the recommendation
        await storage.createStudyRecommendation({
          userId: req.user!.id,
          subchapterId: material.subchapterId,
          recommendation
        });
        
        res.status(201).json({
          score,
          recommendation
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid input", errors: fromZodError(error).message });
        }
        console.error("Error submitting quiz score:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Leaderboard routes
  app.get(
    `${apiPrefix}/leaderboard/material/:materialId`,
    async (req: Request, res: Response) => {
      try {
        const materialId = Number(req.params.materialId);
        if (isNaN(materialId)) {
          return res.status(400).json({ message: "Valid material ID required" });
        }

        const leaderboard = await storage.getLeaderboardByMaterialId(materialId);
        res.status(200).json(leaderboard);
      } catch (error) {
        console.error("Error retrieving leaderboard:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Student report routes
  app.get(
    `${apiPrefix}/student-report`,
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const report = await storage.getStudentReport(req.user!.id);
        res.status(200).json(report);
      } catch (error) {
        console.error("Error retrieving student report:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
