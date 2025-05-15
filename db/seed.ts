import { db } from "./index";
import * as schema from "@shared/schema";
import bcrypt from "bcrypt";

async function seed() {
  try {
    // Create default subjects
    const subjects = [
      { name: "Mathematics", icon: "calculate" },
      { name: "Science", icon: "science" },
      { name: "Bahasa Malaysia", icon: "language" },
      { name: "English", icon: "menu_book" }
    ];
    
    console.log("Seeding subjects...");
    for (const subject of subjects) {
      // Check if subject already exists
      const existingSubject = await db.query.subjects.findFirst({
        where: (subjects, { eq }) => eq(subjects.name, subject.name)
      });
      
      // Only insert if it doesn't exist
      if (!existingSubject) {
        await db.insert(schema.subjects).values(subject);
      }
    }

    // Create a demo account
    const username = "demo";
    const password = "password";
    
    // Check if the user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, username)
    });
    
    if (!existingUser) {
      console.log("Creating demo user...");
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create student account
      await db.insert(schema.users).values({
        username,
        password: hashedPassword,
        email: "demo@example.com",
        isTeacher: false
      });
      
      // Create teacher account
      await db.insert(schema.users).values({
        username: "teacher",
        password: hashedPassword,
        email: "teacher@example.com",
        isTeacher: true
      });
    }
    
    // Add sample chapters for Science
    const scienceSubject = await db.query.subjects.findFirst({
      where: (subjects, { eq }) => eq(subjects.name, "Science")
    });
    
    if (scienceSubject) {
      console.log("Seeding science chapters...");
      const chapters = [
        { name: "Plants", subjectId: scienceSubject.id },
        { name: "Animals", subjectId: scienceSubject.id },
        { name: "The Human Body", subjectId: scienceSubject.id },
        { name: "Environment", subjectId: scienceSubject.id }
      ];
      
      for (const chapter of chapters) {
        // Check if chapter already exists
        const existingChapter = await db.query.chapters.findFirst({
          where: (chapters, { eq, and }) => and(
            eq(chapters.name, chapter.name),
            eq(chapters.subjectId, chapter.subjectId)
          )
        });
        
        // Only insert if it doesn't exist
        if (!existingChapter) {
          await db.insert(schema.chapters).values(chapter);
        }
      }
      
      // Add subchapters for Plants chapter
      const plantsChapter = await db.query.chapters.findFirst({
        where: (chapters, { eq }) => eq(chapters.name, "Plants")
      });
      
      if (plantsChapter) {
        console.log("Seeding plant subchapters...");
        const subchapters = [
          { name: "Types of Plants", chapterId: plantsChapter.id },
          { name: "Parts of a Plant", chapterId: plantsChapter.id },
          { name: "How Plants Grow", chapterId: plantsChapter.id }
        ];
        
        for (const subchapter of subchapters) {
          // Check if subchapter already exists
          const existingSubchapter = await db.query.subchapters.findFirst({
            where: (subchapters, { eq, and }) => and(
              eq(subchapters.name, subchapter.name),
              eq(subchapters.chapterId, subchapter.chapterId)
            )
          });
          
          // Only insert if it doesn't exist
          if (!existingSubchapter) {
            await db.insert(schema.subchapters).values(subchapter);
          }
        }
        
        // Add a study material
        const typesOfPlantsSubchapter = await db.query.subchapters.findFirst({
          where: (subchapters, { eq }) => eq(subchapters.name, "Types of Plants")
        });
        
        if (typesOfPlantsSubchapter) {
          console.log("Seeding study materials...");
          
          const teacher = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.username, "teacher")
          });
          
          if (teacher) {
            // This is just a placeholder; in a real app, this would be a real file path
            await db.insert(schema.studyMaterials)
              .values({
                title: "Introduction to Plants",
                description: "Learn about different types of plants and their characteristics.",
                documentUrl: "introduction_to_plants.pdf",
                fileType: "application/pdf",
                fileSize: "2.1 MB",
                subchapterId: typesOfPlantsSubchapter.id,
                uploadedBy: teacher.id
              })
              .onConflictDoNothing();
          }
        }
      }
    }
    
    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
