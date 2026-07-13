
'use server'

import { createClient } from '@/lib/supabase/server'
import { LegalCase, CaseNote, formatDateToISO } from './case-logic'

/**
 * Recupera o contexto do usuário atual sem fallbacks fixos.
 */
async function getUserContext() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { auth_id: null, empresa_id: null, cargo: null }

  const { data: profile } = await supabase
    .from('usuarios')
    .select('empresa_id, cargo, auth_user_id')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  return {
    auth_id: user.id,
    empresa_id: profile?.empresa_id || null,
    cargo: profile?.cargo || 'Operador'
  }
}

/**
 * Busca de processos com visibilidade multi-tenant real.
 * Removido o filtro 'deleted_at' (coluna inexistente).
 */
export async function getStoredCases(): Promise<LegalCase[]> {
  const supabase = await createClient()
  const { auth_id, empresa_id } = await getUserContext()
  
  if (!auth_id) {
    console.log('[getStoredCases] Falha: Usuário não identificado.')
    return []
  }

  try {
    let query = supabase.from('processos').select('*')

    if (empresa_id) {
      // Vê processos da empresa OU criados pelo usuário
      query = query.or(`empresa_id.eq.${empresa_id},created_by.eq.${auth_id}`)
    } else {
      query = query.eq('created_by', auth_id)
    }

    const { data, error } = await query.order('id', { ascending: false }).limit(1000)
    
    if (error) {
      console.error('[getStoredCases] Erro SQL:', error.message)
      return []
    }

    console.log(`[getStoredCases] Sucesso: ${data?.length || 0} registros localizados.`)
    
    return (data || []).map(item => {
      const dados = (item.dados && typeof item.dados === 'object') ? item.dados : {}
      return {
        ...dados,
        db_id: item.id?.toString(),
        id: (dados as any)?.protocolo || item.id?.toString(),
        cliente: (dados as any)?.cliente || '',
        protocolo: (dados as any)?.protocolo || '',
        status: (dados as any)?.status || item.status || 'Sem Prazo',
        risco: (dados as any)?.risco || item.risco || 'Normal',
        proximoPrazo: (dados as any)?.proximoPrazo || '',
        ultimoRetorno: (dados as any)?.ultimoRetorno || '',
        observacao: (dados as any)?.observacao || item.observacoes || '',
        advogado: (dados as any)?.advogado || item.advogado || '',
        escritorio: (dados as any)?.escritorio || item.escritorio || '',
        telefone: (dados as any)?.telefone || item.telefone || '',
        situacao: (dados as any)?.situacao || '',
        diasFaltando: (dados as any)?.diasFaltando ?? null,
        tribunal: (dados as any)?.tribunal || 'Outros',
        linkConsulta: (dados as any)?.linkConsulta || '',
      } as LegalCase
    })
  } catch (error) {
    console.error('[getStoredCases] Falha Crítica:', error)
    return []
  }
}

/**
 * Sincronização de processos com mapeamento espelhado.
 */
export async function saveStoredCases(cases: LegalCase[]): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient()
  const { auth_id, empresa_id } = await getUserContext()
  
  if (!auth_id || !empresa_id) {
    return { success: false, message: 'Sessão expirada ou empresa não vinculada.' }
  }

  try {
    const uniqueMap = new Map()
    cases.forEach(c => {
      if (c?.protocolo) uniqueMap.set(c.protocolo, c)
    })

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
      }

      if (c.db_id && !isNaN(Number(c.db_id))) {
        item.id = Number(c.db_id)
      }

      return item
    })

    const { error } = await supabase
      .from('processos')
      .upsert(payload, { onConflict: 'id' })

    if (error) throw error
    
    return { success: true, message: `${payload.length} registros selados no gabinete.` }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

/**
 * Gestão de Equipe e Permissões
 */
export async function getEmpresaUsers(): Promise<any[]> {
  const supabase = await createClient()
  const { empresa_id } = await getUserContext()
  if (!empresa_id) return []
  const { data } = await supabase.from('usuarios').select('*').eq('empresa_id', empresa_id).order('nome', { ascending: true })
  return data || []
}

/**
 * Exclusão Segura com Senha (SSR)
 */
export async function deleteCaseSecureAction(caseId: string, password: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, message: "Sessão expirada." }

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: password
  })

  if (authError) return { success: false, message: "Autorização negada: Senha incorreta." }

  try {
    // Soft delete marcado por timestamp na coluna 'observacoes' já que deleted_at não existe
    const { error } = await supabase
      .from('processos')
      .update({ observacoes: `[ARQUIVADO EM ${new Date().toLocaleString()}]` })
      .eq('id', caseId)

    if (error) throw error
    return { success: true }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}

export async function getStoredNotes(): Promise<CaseNote[]> {
  const supabase = await createClient();
  const { auth_id, empresa_id } = await getUserContext();
  if (!auth_id) return [];
  try {
    let query = supabase.from('notes').select('*');
    if (empresa_id) {
      query = query.or(`empresa_id.eq.${empresa_id},created_by.eq.${auth_id}`);
    } else {
      query = query.eq('created_by', auth_id);
    }
    const { data } = await query.order('created_at', { ascending: false });
    return (data || []).map(item => {
      let displayContent = item.content || '';
      let imageUrl;
      try { if (displayContent.startsWith('{')) { const p = JSON.parse(displayContent); displayContent = p.text; imageUrl = p.imageUrl; } } catch {}
      return { id: item.id.toString(), title: item.title || 'Nota', content: displayContent, imageUrl, color: 'bg-white', updatedAt: new Date(item.created_at).toLocaleString('pt-BR') };
    });
  } catch { return []; }
}

export async function saveStoredNotes(notes: CaseNote[]): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const { auth_id, empresa_id } = await getUserContext();
  if (!auth_id) return { success: false };
  try {
    await supabase.from('notes').delete().eq('created_by', auth_id);
    if (notes.length > 0) {
      const dbNotes = notes.map(n => ({ title: n.title, content: n.imageUrl ? JSON.stringify({ text: n.content, imageUrl: n.imageUrl }) : n.content, empresa_id, created_by: auth_id }));
      await supabase.from('notes').insert(dbNotes);
    }
    return { success: true };
  } catch { return { success: false }; }
}
