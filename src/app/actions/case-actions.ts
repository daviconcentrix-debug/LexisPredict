
'use server';

import { getStoredCases, saveStoredCases } from '@/lib/server-db';
import { LegalCase } from '@/lib/case-logic';

/**
 * Fetches all cases from the server-side repository.
 */
export async function fetchRepoCases() {
  return await getStoredCases();
}

/**
 * Synchronizes client cases with the server-side repository.
 */
export async function syncRepoCases(cases: LegalCase[]) {
  await saveStoredCases(cases);
  return { success: true };
}
