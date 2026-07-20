'use server';

import { getStoredCases, saveStoredCases, getStoredNotes, saveStoredNotes, getUserContext } from '@/lib/server-db';
import { LegalCase, CaseNote } from '@/lib/case-logic';
import { createClient } from '@/lib/supabase/server';

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

/**
 * Protocolo de Purga Soberana: Apaga todos os processos da empresa do usuário.
 */
export async function deleteAllCasesAction() {
  try {
    const { empresa_id } = await getUserContext();
    if (!empresa_id) return { success: false, error: "Sessão expirada." };

    const supabase = await createClient();
    const { error } = await supabase
      .from('processos')
      .delete()
      .eq('empresa_id', empresa_id);

    if (error) throw error;

    return { success: true, message: "Base de dados purgada com sucesso." };
  } catch (e: any) {
    console.error("[Purga Fail]", e);
    return { success: false, error: e.message };
  }
}
