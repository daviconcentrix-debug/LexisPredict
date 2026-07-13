
'use server';

import { supabase, isSupabaseConfigured } from './supabase';
import { LegalCase, CaseNote, formatDateToISO } from './case-logic';
import { cookies } from 'next/headers';

/**
 * REPOSITÓRIO CENTRAL LEXISPREDICT (v46000.0 ELITE)
 * Camada de Abstração para isolamento de Banco de Dados e Lógica SaaS.
 * Blidagem contra erros de Bigint e Sessão Expirada.
 */

async function getUserContext() {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get('lexis_user_email')?.value;
    
    // Fallback para Auth direto se o cookie falhar
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!userEmail && !authUser) return { auth_id: null, empresa_id: null, cargo: null };

    // Busca perfil para obter empresa_id
    let query = supabase.from('usuarios').select('id, empresa_id, cargo, email, auth_user_id');
    
    if (userEmail) {
      query = query.eq('email', userEmail.toLowerCase().trim());
    } else if (authUser) {
      query = query.eq('auth_user_id', authUser.id);
    }

    const { data: profile } = await query.maybeSingle();

    if (!profile && authUser) {
      // Se logado mas sem perfil, tenta retornar o ID do auth pelo menos
      return { auth_id: authUser.id, empresa_id: null, cargo: 'Operador' };
    }

    return { 
      auth_id: profile?.auth_user_id || authUser?.id || null,
      empresa_id: profile?.empresa_id || null, 
      cargo: profile?.cargo || 'Operador'
    };
  } catch (e) {
    console.error('[DB] Erro ao recuperar contexto:', e);
    return { auth_id: null, empresa_id: null, cargo: null };
  }
}

export async function getStoredCases(): Promise<LegalCase[]> {
  if (!isSupabaseConfigured) return [];
  const { auth_id, empresa_id, cargo } = await getUserContext();
  
  if (!auth_id) return [];

  try {
    let query = supabase.from('processos')
      .select('*')
      .is('deleted_at', null);

    // Se houver empresa_id, filtra. Se não, tenta trazer os vinculados ao criador.
    if (empresa_id) {
      query = query.eq('empresa_id', empresa_id);
    }

    // Se não for admin, vê apenas os seus
    if (cargo !== 'Administrador') {
      query = query.eq('created_by', auth_id);
    }

    const { data, error } = await query.order('id', { ascending: false });
    
    if (error) throw error;
    
    return data ? data.map(item => ({
      ...(item.dados as LegalCase),
      db_id: item.id.toString(), // ID real do banco
      id: (item.dados as any).protocolo || item.id.toString() // ID de exibição
    })) : [];
  } catch (error) {
    console.error('[DB] Erro ao carregar processos:', error);
    return [];
  }
}

export async function saveStoredCases(cases: LegalCase[]): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) return { success: false, message: "Supabase inacessível." };
  const { auth_id, empresa_id } = await getUserContext();
  
  if (!auth_id) return { success: false, message: "Sessão expirada. Realize login." };

  try {
    // Filtro de unicidade por protocolo para evitar duplicação no payload
    const uniqueMap = new Map();
    cases.forEach(c => { if(c.protocolo) uniqueMap.set(c.protocolo, c); });

    const payload = Array.from(uniqueMap.values()).map(c => {
      // Prepara objeto de dados limpo
      const casoLimpo = { ...c };
      
      const item: any = {
        dados: casoLimpo, 
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
        data_distribuicao: formatDateToISO(c.dataDistribuicao),
        ultima_movimentacao: formatDateToISO(c.ultimaMovimentacao)
      };

      // Só envia ID se for numérico (bigint). IDs strings "AUTO-..." ou Protocolos são ignorados no insert.
      if (c.db_id && !isNaN(Number(c.db_id))) {
        item.id = Number(c.db_id);
      }

      return item;
    });

    const { error } = await supabase.from('processos').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    
    return { success: true, message: `${payload.length} registros sincronizados.` };
  } catch (error: any) {
    console.error('[DB] Erro ao salvar:', error.message);
    return { success: false, message: error.message };
  }
}

export async function getStoredNotes(): Promise<CaseNote[]> {
  const { auth_id, empresa_id, cargo } = await getUserContext();
  if (!auth_id) return [];
  
  try {
    let query = supabase.from('notes').select('*');
    
    if (empresa_id) query = query.eq('empresa_id', empresa_id);
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
    // Purga e reinjeta notas para manter o repositório sincronizado
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
