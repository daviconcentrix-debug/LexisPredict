'use server';

import { supabase, isSupabaseConfigured, UserProfile } from './supabase';
import { LegalCase, CaseNote, formatDateToISO } from './case-logic';
import { cookies } from 'next/headers';

/**
 * REPOSITÓRIO CENTRAL LEXISPREDICT (v1950.0 ELITE)
 * Refatorado para Sincronia Resiliente (Upsert) - Fim da perda de dados manuais.
 */

async function getUserContext() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('lexis_user_email')?.value;
  
  if (!userEmail) return { auth_id: null, empresa_id: null, cargo: null, email: null };

  const { data: profile } = await supabase
    .from('usuarios')
    .select('id, empresa_id, cargo, email, auth_user_id')
    .eq('email', userEmail.toLowerCase().trim())
    .maybeSingle();
    
  return { 
    auth_id: profile?.auth_user_id || null,
    empresa_id: profile?.empresa_id || null, 
    cargo: profile?.cargo || 'Operador',
    email: profile?.email || null
  };
}

export async function logAuditAction(action: string, detail: string) {
  const { auth_id, email, empresa_id } = await getUserContext();
  if (!auth_id) return;

  try {
    await supabase.from('audit_logs').insert({
      user_id: auth_id,
      user_email: email,
      empresa_id: empresa_id,
      action: action,
      detail: detail,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.warn('[Audit] Falha ao registrar log de conformidade.');
  }
}

export async function getStoredCases(): Promise<LegalCase[]> {
  if (!isSupabaseConfigured) return [];
  const { auth_id, empresa_id } = await getUserContext();
  if (!empresa_id || !auth_id) return [];

  try {
    const { data, error } = await supabase
      .from('processos')
      .select('*')
      .eq('empresa_id', empresa_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data ? data.map(item => ({
      ...(item.dados as LegalCase),
      db_id: item.id.toString(),
      proximoPrazo: item.proximo_retorno || (item.dados as any).proximoPrazo || '',
      ultimoRetorno: item.ultimo_retorno || (item.dados as any).ultimoRetorno || '',
    })) : [];
  } catch (error) {
    console.error('[DB] Fetch Fail:', error);
    return [];
  }
}

/**
 * Sincronia Inteligente v2.0
 * Utiliza UPSERT para preservar edições manuais e evitar perda de dados.
 */
export async function saveStoredCases(cases: LegalCase[]): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) return { success: false, message: "Erro de Configuração Supabase." };
  const { auth_id, empresa_id } = await getUserContext();
  if (!empresa_id || !auth_id) return { success: false, message: "Sessão de Gabinete expirada." };

  try {
    const uniqueMap = new Map();
    cases.forEach(c => { 
      if (c && c.protocolo) {
        // Normalização de protocolo para chave única
        const key = c.protocolo.replace(/\D/g, '');
        uniqueMap.set(key, c); 
      }
    });
    
    const payload = Array.from(uniqueMap.values()).map(c => {
      const isoPrazo = formatDateToISO(c.proximoPrazo);
      const isoRetorno = formatDateToISO(c.ultimoRetorno);
      return { 
        empresa_id: empresa_id, 
        created_by: auth_id,
        protocolo_ref: c.protocolo,
        advogado: c.advogado || 'NÃO ATRIBUÍDO',
        status: c.status || 'Sem Prazo',
        risco: c.risco || 'Normal',
        proximo_retorno: isoPrazo, 
        ultimo_retorno: isoRetorno,
        tribunal: c.tribunal || 'Outros',
        telefone: c.telefone || '',
        observacoes: c.observacao || '',
        dados: { ...c } 
      };
    });

    // Realiza o UPSERT baseado no protocolo_ref e empresa_id para não duplicar nem apagar melhorias
    const { error: upsertError } = await supabase
      .from('processos')
      .upsert(payload, { onConflict: 'protocolo_ref, empresa_id' });

    if (upsertError) throw upsertError;

    await logAuditAction('DATA_SYNC', `Sincronizou/Atualizou lote de ${payload.length} processos.`);
    return { success: true, message: "Base sincronizada com sucesso." };
  } catch (error: any) {
    console.error("[Sincronia] Falha Crítica:", error.message);
    return { success: false, message: error.message };
  }
}

export async function getStoredNotes(): Promise<CaseNote[]> {
  const { auth_id, empresa_id } = await getUserContext();
  if (!empresa_id || !auth_id) return [];

  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('empresa_id', empresa_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ? data.map(item => {
      let imageUrl;
      let displayContent = item.content || '';
      try {
        if (displayContent.startsWith('{')) {
          const parsed = JSON.parse(displayContent);
          displayContent = parsed.text;
          imageUrl = parsed.imageUrl;
        }
      } catch (e) {}

      return {
        id: item.id.toString(),
        title: item.title || 'Nota',
        content: displayContent,
        imageUrl: imageUrl,
        color: 'bg-white',
        updatedAt: new Date(item.created_at).toLocaleString('pt-BR')
      };
    }) : [];
  } catch (error) {
    return [];
  }
}

export async function saveStoredNotes(notes: CaseNote[]): Promise<{ success: boolean }> {
  const { auth_id, empresa_id } = await getUserContext();
  if (!empresa_id || !auth_id) return { success: false };

  try {
    // Para notas, mantemos a limpeza e reinserção por enquanto, ou podemos migrar para upsert por ID
    await supabase.from('notes').delete().eq('empresa_id', empresa_id).eq('created_by', auth_id);

    if (notes.length > 0) {
      const dbNotes = notes.map(n => ({
        title: n.title || 'Nota',
        content: n.imageUrl ? JSON.stringify({ text: n.content, imageUrl: n.imageUrl }) : n.content,
        empresa_id: empresa_id,
        created_by: auth_id
      }));
      const { error } = await supabase.from('notes').insert(dbNotes);
      if (error) throw error;
    }
    
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function getEmpresaUsers(): Promise<UserProfile[]> {
  const { empresa_id } = await getUserContext();
  if (!empresa_id) return [];

  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('empresa_id', empresa_id);

  if (error) return [];
  return data as UserProfile[];
}

export async function removeEmpresaUser(userId: string): Promise<boolean> {
  const { cargo } = await getUserContext();
  if (cargo !== 'Administrador') return false;

  const { error } = await supabase
    .from('usuarios')
    .delete()
    .eq('id', userId);

  return !error;
}
