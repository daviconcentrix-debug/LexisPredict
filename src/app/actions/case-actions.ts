'use server';

import { getStoredCases, saveStoredCases, getStoredNotes, saveStoredNotes } from '@/lib/server-db';
import { LegalCase, CaseNote } from '@/lib/case-logic';
import { supabase } from '@/lib/supabase';
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
 * EXCLUSÃO SEGURA COM VERIFICAÇÃO DE SENHA
 */
export async function deleteCaseSecureAction(caseId: string, password: string) {
  const cookieStore = await cookies();
  const email = cookieStore.get('lexis_user_email')?.value;

  if (!email) return { success: false, message: "Sessão expirada." };

  // 1. Validar Senha via Supabase Auth
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password: password
  });

  if (authError) {
    return { success: false, message: "Senha incorreta. Operação abortada." };
  }

  try {
    // 2. Soft Delete (Update deleted_at)
    // Nota: Como os dados estão dentro do campo 'dados' (JSON), 
    // atualizamos a linha no banco marcando-a para ser ignorada no fetch.
    const { error } = await supabase
      .from('processos')
      .update({ deleted_at: new Date().toISOString() })
      .eq('protocolo_ref', caseId);

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
