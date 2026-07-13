'use server';

import { getStoredCases, saveStoredCases, getStoredNotes, saveStoredNotes } from '@/lib/server-db';
import { LegalCase, CaseNote } from '@/lib/case-logic';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

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
 * EXCLUSÃO SEGURA COM VERIFICAÇÃO DE SENHA (SSR)
 */
export async function deleteCaseSecureAction(caseId: string, password: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Sessão expirada." };

  // 1. Validar Senha via Supabase Auth
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: password
  });

  if (authError) {
    return { success: false, message: "Senha incorreta. Operação abortada." };
  }

  try {
    // 2. Soft Delete
    const { error } = await supabase
      .from('processos')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', caseId);

    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

/**
 * GERA BACKUP COMPLETO (JSON)
 */
export async function generateFullBackupAction() {
  const [cases, notes] = await Promise.all([
    getStoredCases(),
    getStoredNotes()
  ]);

  return {
    exportedAt: new Date().toISOString(),
    data: {
      cases,
      notes
    }
  };
}

/**
 * RESTAURA BACKUP
 */
export async function restoreBackupAction(data: any) {
  try {
    if (!data.cases || !data.notes) throw new Error("Formato de backup inválido.");
    
    await Promise.all([
      saveStoredCases(data.cases),
      saveStoredNotes(data.notes)
    ]);

    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
