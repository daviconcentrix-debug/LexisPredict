
'use server';

import { supabase, isSupabaseConfigured } from './supabase';
import { LegalCase, CaseNote, formatDateToISO } from './case-logic';
import { cookies } from 'next/headers';

/**
 * REPOSITÓRIO CENTRAL LEXISPREDICT (v50000.0 ELITE)
 * Camada de Abstração para isolamento total em Supabase.
 * Foco: Sincronização de colunas SQL + Objeto JSONB
 */

async function getUserContext() {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get('lexis_user_email')?.value;

    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!userEmail && !authUser) return { auth_id: null, empresa_id: null, cargo: null };

    const { data: profile } = await supabase
      .from('usuarios')
      .select('id, empresa_id, cargo, email, auth_user_id')
      .or(`email.eq.${userEmail || 'none'},auth_user_id.eq.${authUser?.id || 'none'}`)
      .maybeSingle();

    return { 
      auth_id: profile?.auth_user_id || authUser?.id || null,
      empresa_id: profile?.empresa_id || null, 
      cargo: profile?.cargo || 'Operador'
    };
  } catch (e) {
    return { auth_id: null, empresa_id: null, cargo: null };
  }
}

export async function getStoredCases(): Promise<LegalCase[]> {
  if (!isSupabaseConfigured) return [];
  const { auth_id, empresa_id, cargo } = await getUserContext();
  
  if (!auth_id) return [];

  try {
    let query = supabase.from('processos').select('*').is('deleted_at', null);

    // ADMIN vê tudo da empresa. Outros vêem o que criaram.
    if (cargo === 'Administrador' && empresa_id) {
      query = query.eq('empresa_id', empresa_id);
    } else if (empresa_id) {
      query = query.or(`empresa_id.eq.${empresa_id},created_by.eq.${auth_id}`);
    } else {
      query = query.eq('created_by', auth_id);
    }

    const { data, error } = await query.order('id', { ascending: false });
    
    if (error) throw error;
    
    return data ? data.map(item => ({
      ...(item.dados as LegalCase),
      db_id: item.id.toString(),
      // Garante que o ID usado no front seja o protocolo ou o ID do banco se falhar
      id: (item.dados as any).protocolo || item.id.toString()
    })) : [];
  } catch (error) {
    return [];
  }
}

export async function saveStoredCases(cases: LegalCase[]): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) return { success: false, message: "Supabase inacessível." };
  const { auth_id, empresa_id } = await getUserContext();
  
  if (!auth_id) return { success: false, message: "Sessão expirada." };

  try {
    const uniqueMap = new Map();
    cases.forEach(c => { if(c?.protocolo) uniqueMap.set(c.protocolo, c); });

    const payload = Array.from(uniqueMap.values()).map(c => {
      const item: any = {
        dados: c, 
        empresa_id: empresa_id, 
        created_by: auth_id,
        ultimo_retorno: formatDateToISO(c.ultimoRetorno),
        proximo_retorno: formatDateToISO(c.proximoPrazo),
        observacoes: c.observacao || null,
        status: c.status || null,
        risco: c.risco || null,
        status_interno: c.statusInterno || null,
        escritorio: c.escritorio || null,
        advogado: c.advogado || null,
        telefone: c.telefone || null,
        produtos: c.produtos || null,
      };

      // Só envia ID se for numérico (bigint). IDs temporários "AUTO-..." são ignorados.
      if (c.db_id && !isNaN(Number(c.db_id))) {
        item.id = Number(c.db_id);
      }

      return item;
    });

    const { error } = await supabase.from('processos').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    
    return { success: true, message: `${payload.length} registros sincronizados.` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function getStoredNotes(): Promise<CaseNote[]> {
  const { auth_id, empresa_id, cargo } = await getUserContext();
  if (!auth_id) return [];
  
  try {
    let query = supabase.from('notes').select('*');
    if (cargo === 'Administrador' && empresa_id) {
       query = query.eq('empresa_id', empresa_id);
    } else {
       query = query.eq('created_by', auth_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data ? data.map(item => {
      let displayContent = item.content || '';
      let imageUrl;
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
        imageUrl,
        color: 'bg-white',
        updatedAt: new Date(item.created_at).toLocaleString('pt-BR')
      };
    }) : [];
  } catch (error) { return []; }
}

export async function saveStoredNotes(notes: CaseNote[]): Promise<{ success: boolean }> {
  const { auth_id, empresa_id } = await getUserContext();
  if (!auth_id) return { success: false };
  
  try {
    // Soft sync: limpa anteriores do usuário e insere novas
    await supabase.from('notes').delete().eq('created_by', auth_id);
    if (notes.length > 0) {
      const dbNotes = notes.map(n => ({
        title: n.title,
        content: n.imageUrl ? JSON.stringify({ text: n.content, imageUrl: n.imageUrl }) : n.content,
        empresa_id: empresa_id,
        created_by: auth_id
      }));
      await supabase.from('notes').insert(dbNotes);
    }
    return { success: true };
  } catch (error) { return { success: false }; }
}

export async function getEmpresaUsers(): Promise<any[]> {
  const { empresa_id } = await getUserContext();
  if (!empresa_id) return [];
  const { data } = await supabase.from('usuarios').select('*').eq('empresa_id', empresa_id).order('nome', { ascending: true });
  return data || [];
}

export async function removeEmpresaUser(userId: string): Promise<boolean> {
  const { error } = await supabase.from('usuarios').delete().eq('id', userId);
  return !error;
}
