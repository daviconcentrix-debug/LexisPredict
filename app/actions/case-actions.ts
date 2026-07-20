'use server';

/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 */

import { getStoredCases, getStoredNotes, saveStoredNotes, getUserContext } from '@/lib/server-db';
import { LegalCase, CaseNote } from '@/lib/case-logic';
import { createClient } from '@/lib/supabase/server';
import { buildProcessoRecord } from '@/lib/case-mapper';

export async function fetchRepoCases() {
  return await getStoredCases();
}

/**
 * Sincroniza uma lista de casos garantindo que passem pelo Mapeador Universal.
 */
export async function syncRepoCases(cases: LegalCase[]) {
  const { empresa_id, auth_id } = await getUserContext();
  if (!empresa_id || !auth_id) return { success: false, error: "Sessão expirada." };

  try {
    const payload = cases.map(c => {
      return buildProcessoRecord({
        empresaId: empresa_id,
        userId: auth_id,
        cliente: c.cliente,
        protocolo: c.protocolo,
        telefone: c.telefone,
        advogado: c.advogado,
        escritorio: c.escritorio,
        situacao: c.situacao,
        observacao: c.observacao,
        ultimoRetorno: c.ultimoRetorno,
        proximoRetorno: c.proximoPrazo,
        statusManual: c.statusManual,
        produtos: c.produtos,
        atendente: c.atendente
      });
    });

    const supabase = await createClient();
    const { error } = await supabase
      .from('processos')
      .upsert(payload, { onConflict: 'protocolo_ref,empresa_id' });

    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
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
