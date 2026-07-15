/**
 * @fileOverview LexisPredict - W1 Capital Advanced Legal Operations
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 * @see LICENSE file for full terms.
 */

'use server';

import { getStoredCases, saveStoredCases, getStoredNotes, saveStoredNotes } from '@/lib/server-db';
import { LegalCase, CaseNote } from '@/lib/case-logic';

export async function fetchRepoCases() {
  return await getStoredCases();
}

export async function syncRepoCases(cases: LegalCase[]) {
  return await saveStoredCases(cases);
}

export async function fetchRepoNotes() {
  return await getStoredNotes();
}

export async function syncRepoNotes(notes: CaseNote[]) {
  return await saveStoredNotes(notes);
}
