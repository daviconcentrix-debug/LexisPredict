
'use server';

import { supabase, isSupabaseConfigured, UserProfile } from './supabase';
import { LegalCase, CaseNote, formatDateToISO } from './case-logic';
import { cookies } from 'next/headers';

/**
 * REPOSITÓRIO CENTRAL LEXISPREDICT (v160.0 ELITE)
 * Estratégia de Sincronia Blindada contra Erros de Tipagem (Date/Text).
 */

async function getUserContext() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('lexis_user_email')?.value;
  
  if (!userEmail) return { auth_id: null, empresa_id: null, cargo: null };

  const { data: profile } = await supabase
    .from('usuarios')
    .select('id, empresa_id, cargo, email, auth_user_id')
    .eq('email', userEmail.toLowerCase().trim())
    .maybeSingle();
    
  return { 
    auth_id: profile?.auth_user_id || null,
    empresa_id: profile?.empresa_id || null, 
    cargo: profile?.cargo || 'Operador'
  };
}

export async function getStoredCases(): Promise<LegalCase[]> {
  if (!isSupabaseConfigured) return [];
  const { empresa_id } = await getUserContext();
  if (!empresa_id) return [];

  try {
    const { data, error } = await supabase
      .from('processos')
      .select('*')
      .eq('empresa_id', empresa_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ? data.map(item => ({
      ...(item.dados as LegalCase),
      db_id: item.id.toString()
    })) : [];
  } catch (error) {
    console.error('[DB] Fetch Fail:', error);
    return [];
  }
}

export async function saveStoredCases(cases: LegalCase[]): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) return { success: false, message: "Erro de Configuração." };
  const { auth_id, empresa_id } = await getUserContext();
  if (!empresa_id || !auth_id) return { success: false, message: "Sessão expirada." };

  try {
    const uniqueMap = new Map();
    cases.forEach(c => { 
      if (c && c.protocolo) uniqueMap.set(c.protocolo, c); 
    });
    
    const payload = Array.from(uniqueMap.values()).map(c => {
      // SANEAMENTO ESTRITO: Garante que apenas datas reais cheguem às colunas date
      const isoPrazo = formatDateToISO(c.proximoPrazo);
      const isoRetorno = formatDateToISO(c.ultimoRetorno);

      return { 
        dados: c, 
        empresa_id: empresa_id, 
        created_by: auth_id,
        protocolo_ref: c.protocolo,
        advogado: c.advogado || 'NÃO ATRIBUÍDO',
        escritorio: c.escritorio || '',
        status: c.status || 'Sem Prazo',
        risco: c.risco || 'Normal',
        proximo_retorno: isoPrazo, // Se for texto, isoPrazo será null
        ultimo_retorno: isoRetorno,   // Se for texto, isoRetorno será null
        tribunal: c.tribunal || 'Outros',
        telefone: c.telefone || '',
        observacoes: c.observacao || '',
        status_interno: c.statusInterno || '',
        produtos: c.produtos || ''
      };
    });

    if (payload.length === 0) return { success: true, message: "Nenhum dado para salvar." };

    // Limpeza por empresa para evitar duplicatas infinitas
    const { error: deleteError } = await supabase
      .from('processos')
      .delete()
      .eq('empresa_id', empresa_id);

    if (deleteError) throw deleteError;

    const { error: insertError } = await supabase
      .from('processos')
      .insert(payload);

    if (insertError) throw insertError;

    return { success: true, message: "Sincronia concluída com sucesso." };
  } catch (error: any) {
    console.error('[DB] Sync Error:', error.message);
    return { success: false, message: error.message };
  }
}

export async function getStoredNotes(): Promise<CaseNote[]> {
  const { empresa_id } = await getUserContext();
  if (!empresa_id) return [];

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
    const dbNotes = notes.map(n => ({
      title: n.title || 'Nota',
      content: n.imageUrl ? JSON.stringify({ text: n.content, imageUrl: n.imageUrl }) : n.content,
      empresa_id: empresa_id,
      created_by: auth_id
    }));
    
    await supabase.from('notes').upsert(dbNotes);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function getEmpresaUsers(): Promise<UserProfile[]> {
  const { empresa_id } = await getUserContext();
  if (!empresa_id) return [];
  const { data } = await supabase.from('usuarios').select('*').eq('empresa_id', empresa_id).order('nome', { ascending: true });
  return data ? (data as UserProfile[]) : [];
}

export async function removeEmpresaUser(userId: string): Promise<boolean> {
  const { error } = await supabase.from('usuarios').delete().eq('id', userId);
  return !error;
}
