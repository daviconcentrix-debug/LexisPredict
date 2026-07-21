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
 * Protocolo de Purga Restrita:
 * Garante que apenas os processos criados pelo usuário logado sejam removidos.
 * Impede a deleção acidental de dados de outros membros da mesma empresa,
 * independentemente do nível de acesso (Administrador ou Operador).
 */
export async function deleteAllCasesAction() {
  try {
    const { auth_id, empresa_id } = await getUserContext();
    if (!empresa_id || !auth_id) return { success: false, error: "Sessão expirada." };

    const supabase = await createClient();
    
    // Executa a purga filtrando obrigatoriamente pelo criador (Isolamento Real)
    // Deleta apenas registros onde empresa_id coincide E o criador é o usuário da sessão.
    const { error } = await supabase
      .from('processos')
      .delete()
      .eq('empresa_id', empresa_id)
      .eq('created_by', auth_id);

    if (error) throw error;

    return { 
      success: true, 
      message: "Sua carteira de processos foi purgada com sucesso."
    };
  } catch (e: any) {
    console.error("[Purga Fail]", e);
    return { success: false, error: e.message };
  }
}
