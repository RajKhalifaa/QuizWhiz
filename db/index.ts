import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Try connecting to the Replit PostgreSQL database
// Fall back to a memory-based solution if database connection fails
let dbUrl = process.env.DATABASE_URL;
console.log("Attempting to connect to PostgreSQL database");

// Use standard pg Pool for direct PostgreSQL connection
export const pool = new Pool({ 
  connectionString: dbUrl,
  // Add these settings for better connection handling
  max: 20, 
  idleTimeoutMillis: 30000
});

// Handle database connection errors gracefully
let db: any;

try {
  // Connect to the database
  pool.connect((err) => {
    if (err) {
      console.error('Database connection error:', err);
      console.log('Application will continue to run with limited functionality');
    } else {
      console.log('Successfully connected to PostgreSQL database');
    }
  });

  db = drizzle(pool, { schema });
} catch (error) {
  console.error('Error initializing Drizzle ORM:', error);
  console.log('Application will continue to run with limited functionality');
  
  // Create a minimal implementation to prevent crashes
  db = {
    query: {
      users: {
        findFirst: async () => null,
        findMany: async () => []
      },
      subjects: {
        findFirst: async () => null,
        findMany: async () => []
      },
      chapters: {
        findFirst: async () => null,
        findMany: async () => []
      },
      subchapters: {
        findFirst: async () => null,
        findMany: async () => []
      },
      studyMaterials: {
        findFirst: async () => null,
        findMany: async () => []
      },
      quizzes: {
        findFirst: async () => null,
        findMany: async () => []
      }
    },
    insert: () => ({ values: () => ({ returning: async () => [] }) }),
    select: () => ({ from: () => ({ where: () => ({ execute: async () => [] }) }) }),
    delete: () => ({ from: () => ({ where: () => ({ execute: async () => [] }) }) })
  };
}

export { db };