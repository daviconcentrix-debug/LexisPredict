
'use server';

import { getStoredCases, saveStoredCases, getStoredNotes, saveStoredNotes, getUserContext } from '@/lib/server-db';
import { LegalCase, CaseNote, processarCaso } from '@/lib/case-logic';
import { createClient } from '@/lib/supabase/server';
import { isCasoEncerrado } from '@/lib/status-encerrado';

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
 * Motor de Recalibração de Prazos v2.0
 * Executa o recálculo de status de todos os processos ativos no servidor.
 * Divide a gravação em lotes (chunks) para evitar falhas de timeout.
 */
export async function recalibrateCasesAction(alertLimit: number = 3) {
  try {
    const { auth_id, empresa_id } = await getUserContext();
    if (!empresa_id || !auth_id) return { success: false, error: "Sessão expirada." };

    const cases = await getStoredCases();
    if (!cases || cases.length === 0) return { success: true, count: 0 };

    // 1. Recalcular apenas os não encerrados
    const updatedCases = cases.map(c => {
      if (isCasoEncerrado(c)) return c;
      // Força o motor a reassumir o status baseado nas datas
      return processarCaso({ ...c, statusManual: 'Automatico' }, { alertLimit });
    });

    // 2. Salvar em lotes de 50 para garantir estabilidade
    const chunkSize = 50;
    for (let i = 0; i < updatedCases.length; i += chunkSize) {
      const chunk = updatedCases.slice(i, i + chunkSize);
      const res = await saveStoredCases(chunk);
      if (!res.success) throw new Error(res.message);
    }

    return { 
      success: true, 
      count: updatedCases.length,
      message: "Todos os prazos foram reprocessados pelo motor neural."
    };
  } catch (e: any) {
    console.error("[Recalibrate Fail]", e);
    return { success: false, error: e.message || "Erro interno no recálculo." };
  }
}

/**
 * Protocolo de Purga Restrita:
 * Garante que apenas os processos criados pelo usuário logado sejam removidos.
 */
export async function deleteAllCasesAction() {
  try {
    const { auth_id, empresa_id } = await getUserContext();
    if (!empresa_id || !auth_id) return { success: false, error: "Sessão expirada." };

    const supabase = await createClient();
    
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
