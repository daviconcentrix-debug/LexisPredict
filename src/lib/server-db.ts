'use server';

import { supabase, isSupabaseConfigured, UserProfile, UserRole, checkIfSuperAdmin } from './supabase';
import { LegalCase, CaseNote, formatDateToISO } from './case-logic';
import { cookies } from 'next/headers';

/**
 * REPOSITÓRIO CENTRAL LEXISPREDICT (v5000.0 ELITE)
 * Governança de Superadmin e Sincronia Ilimitada (Bypass do Limite de 1000).
 */

export async function getUserContext() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('lexis_user_email')?.value;
  
  if (!userEmail) return { auth_id: null, empresa_id: null, cargo: null as UserRole | null, email: null, isSuperAdmin: false };

  const { data: profile } = await supabase
    .from('usuarios')
    .select('id, empresa_id, cargo, email, auth_user_id, role')
    .eq('email', userEmail.toLowerCase().trim())
    .maybeSingle();
    
  const cargo = (profile?.role === 'superadmin' || profile?.cargo === 'Superadmin') ? 'Superadmin' : profile?.cargo as UserRole;

  return { 
    auth_id: profile?.auth_user_id || null,
    empresa_id: profile?.empresa_id || null, 
    cargo: cargo || 'Operador',
    email: profile?.email || null,
    isSuperAdmin: cargo === 'Superadmin'
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
    console.warn('[Audit] Falha ao registrar log.');
  }
}

// --- GESTÃO DE ADVOGADOS DA BANCA ---

export async function listAdvogadosBanca() {
  const { empresa_id } = await getUserContext();
  if (!empresa_id) return [];

  const { data, error } = await supabase
    .from('advogados_banca')
    .select('*')
    .eq('empresa_id', empresa_id)
    .eq('ativo', true)
    .order('nome', { ascending: true });

  if (error) {
    console.error('[DB] Erro ao listar banca:', error.message);
    return [];
  }
  return data || [];
}

export async function upsertAdvogadoBanca(adv: any) {
  const { empresa_id } = await getUserContext();
  if (!empresa_id) return { success: false, error: 'Sessão expirada' };

  const payload = {
    ...adv,
    empresa_id: empresa_id,
    ativo: adv.ativo ?? true
  };

  const { data, error } = await supabase
    .from('advogados_banca')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function desativarAdvogadoBanca(id: string) {
  const { empresa_id } = await getUserContext();
  if (!empresa_id) return { success: false };

  const { error } = await supabase
    .from('advogados_banca')
    .update({ ativo: false })
    .eq('id', id)
    .eq('empresa_id', empresa_id);

  return { success: !error };
}

// --- GESTÃO DE PROCESSOS (VISÃO GLOBAL PARA SUPERADMIN) ---

export async function getStoredCases(): Promise<LegalCase[]> {
  if (!isSupabaseConfigured) return [];
  const { empresa_id, auth_id, isSuperAdmin } = await getUserContext();
  if (!empresa_id || !auth_id) return [];

  try {
    let allData: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    // Motor de Paginação Automática: Captura todos os registros acima de 1000
    while (hasMore) {
      let query = supabase
        .from('processos')
        .select('*')
        .eq('empresa_id', empresa_id)
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      // Protocolo Elite: Superadmin vê tudo da empresa. Operador vê apenas o que criou.
      if (!isSuperAdmin) {
        query = query.eq('created_by', auth_id);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        hasMore = data.length === pageSize;
        page++;
      } else {
        hasMore = false;
      }
    }
    
    return allData.map(item => ({
      ...(item.dados as LegalCase),
      db_id: item.id.toString(),
      proximoPrazo: item.proximo_retorno || (item.dados as any).proximoPrazo || '',
      ultimoRetorno: item.ultimo_retorno || (item.dados as any).ultimoRetorno || '',
    }));
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
    cases.forEach(c => { if (c && c.protocolo) uniqueMap.set(c.protocolo, c); });
    
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

    // Salva em lotes de 50 para evitar limites de payload
    const chunkSize = 50;
    for (let i = 0; i < payload.length; i += chunkSize) {
      const chunk = payload.slice(i, i + chunkSize);
      const { error: upsertError } = await supabase
        .from('processos')
        .upsert(chunk, { onConflict: 'protocolo_ref, empresa_id' });
      if (upsertError) throw upsertError;
    }

    return { success: true, message: "Sincronia concluída." };
  } catch (error: any) {
    console.error("[DB Sync Fail]", error.message);
    return { success: false, message: error.message };
  }
}

export async function getStoredNotes(): Promise<CaseNote[]> {
  const { auth_id, empresa_id, isSuperAdmin } = await getUserContext();
  if (!empresa_id || !auth_id) return [];

  try {
    let allData: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from('notes')
        .select('*')
        .eq('empresa_id', empresa_id)
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (!isSuperAdmin) {
        query = query.eq('created_by', auth_id);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        hasMore = data.length === pageSize;
        page++;
      } else {
        hasMore = false;
      }
    }

    return allData.map(item => {
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
    });
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

    const { error } = await supabase.from('notes').upsert(dbNotes);
    if (error) throw error;
    
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

export async function removeEmpresaUser(userId: string): Promise<{ success: boolean, error?: string }> {
  const { cargo, auth_id, isSuperAdmin } = await getUserContext();
  
  if (cargo !== 'Administrador' && cargo !== 'Superadmin') return { success: false, error: 'Permissão insuficiente' };

  // 1. Buscar alvo para verificar se é superadmin
  const { data: target } = await supabase.from('usuarios').select('cargo, role, auth_user_id').eq('id', userId).single();
  if (!target) return { success: false, error: 'Usuário não encontrado' };

  const targetIsSuper = checkIfSuperAdmin(target);

  // 2. Regra Superadmin
  if (targetIsSuper && !isSuperAdmin) {
    return { success: false, error: 'Apenas Superadmins podem remover outros Superadmins.' };
  }

  // 3. Impedir auto-remoção insegura
  if (target.auth_user_id === auth_id) {
    return { success: false, error: 'Você não pode se auto-excluir da plataforma.' };
  }

  const { error } = await supabase
    .from('usuarios')
    .delete()
    .eq('id', userId);

  return { success: !error, error: error?.message };
}

export async function updateUserRole(userId: string, newRole: UserRole): Promise<{ success: boolean, error?: string }> {
  const { cargo, isSuperAdmin } = await getUserContext();
  
  if (cargo !== 'Administrador' && cargo !== 'Superadmin') return { success: false, error: 'Permissão insuficiente' };

  // 1. Buscar alvo
  const { data: target } = await supabase.from('usuarios').select('cargo, role').eq('id', userId).single();
  if (!target) return { success: false, error: 'Usuário não encontrado' };

  const targetIsSuper = checkIfSuperAdmin(target);

  // 2. Proteção Superadmin
  if (targetIsSuper && !isSuperAdmin) {
    return { success: false, error: 'Você não tem autoridade para alterar o cargo de um Superadmin.' };
  }

  if (newRole === 'Superadmin' && !isSuperAdmin) {
    return { success: false, error: 'Apenas um Superadmin pode promover outros usuários a Superadmin.' };
  }

  const payload: any = { cargo: newRole };
  if (isSuperAdmin && newRole === 'Superadmin') {
    payload.role = 'superadmin';
  } else if (targetIsSuper && newRole !== 'Superadmin') {
    payload.role = 'user'; // Rebaixa papel técnico se mudar o cargo
  }

  const { error } = await supabase
    .from('usuarios')
    .update(payload)
    .eq('id', userId);

  return { success: !error, error: error?.message };
}

export async function getWhatsAppHistory(phone: string) {
  const cleanPhone = phone.replace(/\D/g, '');
  let searchPhone = cleanPhone;
  
  if (cleanPhone.length === 10 || cleanPhone.length === 11) {
    searchPhone = `55${cleanPhone}`;
  }

  try {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('contact_number', searchPhone)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[DB] WhatsApp History Fetch Fail:', error);
    return [];
  }
}
