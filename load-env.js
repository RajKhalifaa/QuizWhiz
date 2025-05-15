import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = dotenv.config();

if (result.error) {
  console.error('Error loading .env file:', result.error);
  
  // Let's try to debug by checking if the file exists
  try {
    const envPath = `${__dirname}/.env`;
    console.log(`Checking .env file at: ${envPath}`);
    const envContent = readFileSync(envPath, 'utf8');
    console.log('.env file exists and contains content');
    console.log('First few characters:', envContent.substring(0, 50) + '...');
  } catch (err) {
    console.error('Error reading .env file directly:', err);
  }
} else {
  console.log('.env file loaded successfully');
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL value starts with:', process.env.DATABASE_URL.substring(0, 20) + '...');
  }
}