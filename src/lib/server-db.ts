
import fs from 'fs/promises';
import path from 'path';
import { LegalCase } from './case-logic';

const DB_PATH = path.join(process.cwd(), 'src/data/cases.json');

/**
 * Ensures the data directory exists.
 */
async function ensureDb() {
  // Only attempt file writes in local development. 
  // Vercel filesystem is read-only in production.
  if (process.env.NODE_ENV === 'production') return;

  const dir = path.dirname(DB_PATH);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }

  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify([], null, 2));
  }
}

/**
 * Reads cases from the local repository file.
 */
export async function getStoredCases(): Promise<LegalCase[]> {
  try {
    // In production, we just read the file included in the build
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Info: Repository file not found or empty. Using default empty set.');
    return [];
  }
}

/**
 * Saves cases to the local repository file.
 * NOTE: This only works locally. On Vercel, updates are handled via Git commits.
 */
export async function saveStoredCases(cases: LegalCase[]): Promise<{ success: boolean; message: string }> {
  if (process.env.NODE_ENV === 'production') {
    return { 
      success: false, 
      message: "Runtime saving is disabled in Production (Vercel). Please commit changes to GitHub to update global data." 
    };
  }

  await ensureDb();
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(cases, null, 2));
    return { success: true, message: "Changes saved to local repository file." };
  } catch (error) {
    console.error('Error writing to repo database:', error);
    return { success: false, message: "Failed to write to local filesystem." };
  }
}
