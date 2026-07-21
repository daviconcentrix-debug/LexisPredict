
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
 * Protocolo de Purga Segura:
 * - Operadores: Apagam apenas os próprios processos.
 * - Administradores: Apagam todos da empresa se confirmarem explicitamente.
 */
export async function deleteAllCasesAction(confirmWholeCompany: boolean = false) {
  try {
    const { auth_id, empresa_id, cargo } = await getUserContext();
    if (!empresa_id || !auth_id) return { success: false, error: "Sessão expirada." };

    const supabase = await createClient();
    let query = supabase.from('processos').delete().eq('empresa_id', empresa_id);

    // Proteção de Visibilidade e Autoridade
    if (cargo === 'Administrador' && confirmWholeCompany) {
      // Admin pode limpar a empresa inteira se confirmado
      console.log(`[Purga Master] Empresa ${empresa_id} por Admin ${auth_id}`);
    } else {
      // Operadores ou Admin sem confirmação limpam apenas a própria carteira
      query = query.eq('created_by', auth_id);
    }

    const { error } = await query;
    if (error) throw error;

    return { 
      success: true, 
      message: cargo === 'Administrador' && confirmWholeCompany 
        ? "Base de dados da empresa purgada com sucesso." 
        : "Sua carteira de processos foi limpa com sucesso."
    };
  } catch (e: any) {
    console.error("[Purga Fail]", e);
    return { success: false, error: e.message };
  }
}
