
'use server';

import { supabase, isSupabaseConfigured, UserProfile } from './supabase';
import { LegalCase, CaseNote } from './case-logic';
import { cookies } from 'next/headers';

/**
 * REPOSITÓRIO CENTRAL LEXISPREDICT (v900.0 ELITE)
 * Camada de Abstração para isolamento de Banco de Dados e Lógica SaaS.
 * Propriedade de W1 Capital | Fundador: Davi Alves Figueredo
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

/**
 * BUSCA DE PROCESSOS COM ISOLAMENTO DE TENANT
 */
export async function getStoredCases(): Promise<LegalCase[]> {
  if (!isSupabaseConfigured) return [];
  const { auth_id, empresa_id, cargo } = await getUserContext();
  if (!auth_id || !empresa_id) return [];

  try {
    let query = supabase.from('processos').select('dados, created_by').eq('empresa_id', empresa_id);

    // ISOLAMENTO SaaS: Operador vê apenas o dele, Admin vê tudo da empresa.
    if (cargo !== 'Administrador') {
      query = query.eq('created_by', auth_id);
    }

    const { data, error } = await query.order('id', { ascending: false });
    if (error) throw error;
    
    return data ? data.map(item => item.dados as LegalCase) : [];
  } catch (error) {
    console.error('[DB] Fetch Cases Fail:', error);
    return [];
  }
}

/**
 * SINCRONIZAÇÃO EM LOTE COM UPSERT INTELIGENTE
 */
export async function saveStoredCases(cases: LegalCase[]): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) return { success: false, message: "Erro de Configuração." };
  const { auth_id, empresa_id } = await getUserContext();
  if (!empresa_id || !auth_id) return { success: false, message: "Sessão expirada." };

  try {
    // Filtragem de duplicatas no lote antes do envio
    const uniqueMap = new Map();
    cases.forEach(c => { if(c && c.protocolo) uniqueMap.set(c.protocolo, c); });
    const payload = Array.from(uniqueMap.values()).map(c => ({ 
      dados: c, 
      empresa_id: empresa_id, 
      created_by: auth_id,
      protocolo_ref: c.protocolo // Campo para facilitar buscas no PostgreSQL
    }));

    // Limpeza de registros anteriores do usuário para refresh total (Estratégia Elite)
    await supabase.from('processos').delete().eq('created_by', auth_id);
    
    if (payload.length > 0) {
      const { error } = await supabase.from('processos').insert(payload);
      if (error) throw error;
    }
    
    return { success: true, message: "Base sincronizada com sucesso." };
  } catch (error: any) {
    console.error('[DB] Sync Error:', error);
    return { success: false, message: error.message };
  }
}

/**
 * GESTÃO DE EVIDÊNCIAS E NOTAS
 */
export async function getStoredNotes(): Promise<CaseNote[]> {
  const { auth_id, empresa_id, cargo } = await getUserContext();
  if (!auth_id || !empresa_id) return [];

  try {
    let query = supabase.from('notes').select('*').eq('empresa_id', empresa_id);
    if (cargo !== 'Administrador') query = query.eq('created_by', auth_id);

    const { data, error } = await query.order('created_at', { ascending: false });
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
    await supabase.from('notes').delete().eq('created_by', auth_id);
    if (notes && notes.length > 0) {
      const dbNotes = notes.map(n => ({
        title: n.title || 'Nota',
        content: n.imageUrl ? JSON.stringify({ text: n.content, imageUrl: n.imageUrl }) : n.content,
        empresa_id: empresa_id,
        created_by: auth_id
      }));
      await supabase.from('notes').insert(dbNotes);
    }
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
