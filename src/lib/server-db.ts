
'use server';

import { supabase, isSupabaseConfigured, UserProfile } from './supabase';
import { LegalCase, CaseNote, formatDateToISO } from './case-logic';
import { cookies } from 'next/headers';

/**
 * REPOSITÓRIO CENTRAL LEXISPREDICT (v1800.0 ELITE)
 * Suporte a Logs de Auditoria LGPD e Gerenciamento de Identidade.
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

/**
 * PROTOCOLO DE AUDITORIA LGPD
 * Registra cada ação sensível no banco de dados para compliance.
 */
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
    
    // Log de acesso a dados (apenas para auditores se necessário)
    // await logAuditAction('DATA_ACCESS', `Recuperou ${data?.length || 0} registros processuais.`);

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
        dados: { ...c }, 
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
        observacoes: c.observacao || ''
      };
    });

    const { error: deleteError } = await supabase.from('processos').delete().eq('empresa_id', empresa_id);
    if (deleteError) throw deleteError;

    if (payload.length > 0) {
      const { error: insertError } = await supabase.from('processos').insert(payload);
      if (insertError) throw insertError;
    }

    await logAuditAction('DATA_SYNC', `Sincronizou lote de ${payload.length} processos.`);
    return { success: true, message: "Sincronia concluída." };
  } catch (error: any) {
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
    
    await logAuditAction('NOTE_SYNC', `Sincronizou ${notes.length} notas de evidência.`);
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

  if (!error) {
    await logAuditAction('USER_REMOVAL', `Removeu acesso do usuário ID: ${userId}`);
  }
  return !error;
}

