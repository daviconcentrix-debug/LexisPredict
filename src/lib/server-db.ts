
import fs from 'fs/promises';
import path from 'path';
import { LegalCase } from './case-logic';

const DB_PATH = path.join(process.cwd(), 'src/data/cases.json');

/**
 * Ensures the data directory exists.
 */
async function ensureDb() {
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
  await ensureDb();
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading from repo database:', error);
    return [];
  }
}

/**
 * Saves cases to the local repository file.
 */
export async function saveStoredCases(cases: LegalCase[]): Promise<void> {
  await ensureDb();
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(cases, null, 2));
  } catch (error) {
    console.error('Error writing to repo database:', error);
  }
}
