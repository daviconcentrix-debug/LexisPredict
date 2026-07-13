'use server'

import { createClient } from '@/lib/supabase/server'
import { LegalCase, CaseNote, formatDateToISO } from './case-logic'

/**
 * Contexto do usuário logado
 * - SEM fallback fixo de empresa (multi-tenant real)
 */
export async function getUserContext() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { auth_id: null, empresa_id: null, cargo: null }
  }

  const { data: profile } = await supabase
    .from('usuarios')
    .select('empresa_id, cargo, auth_user_id, nome, email')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  return {
    auth_id: user.id,
    empresa_id: profile?.empresa_id || null,
    cargo: profile?.cargo || 'Operador',
    nome: profile?.nome || user.email,
    email: user.email
  }
}

/**
 * Lista de processos
 * Cada empresa só vê os seus processos
 */
export async function getStoredCases(): Promise<LegalCase[]> {
  const supabase = await createClient()
  const { auth_id, empresa_id } = await getUserContext()

  if (!auth_id) {
    console.log('[getStoredCases] Sem usuário logado')
    return []
  }

  try {
    let query = supabase
      .from('processos')
      .select('*')

    // Multi-tenant: só a empresa do usuário
    if (empresa_id) {
      query = query.eq('empresa_id', empresa_id)
    } else {
      // Usuário sem empresa → só o que ele mesmo criou
      query = query.eq('created_by', auth_id)
    }

    const { data, error } = await query
      .order('id', { ascending: false })
      .limit(1000)

    if (error) {
      console.error('[getStoredCases] ERRO SQL:', error)
      return []
    }

    return (data || []).map((item) => {
      const dados = item.dados && typeof item.dados === 'object' ? item.dados : {}

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
        produtos: (dados as any)?.produtos || item.produtos || null,
        statusInterno: (dados as any)?.statusInterno || item.status_interno || null,
      } as LegalCase
    })
  } catch (error) {
    console.error('[getStoredCases] Exception:', error)
    return []
  }
}

/**
 * Salva / atualiza processos
 * Sempre grava na empresa do usuário logado
 */
export async function saveStoredCases(
  cases: LegalCase[]
): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient()
  const { auth_id, empresa_id } = await getUserContext()

  if (!auth_id) {
    return { success: false, message: 'Sessão expirada. Faça login novamente.' }
  }

  if (!empresa_id) {
    return {
      success: false,
      message: 'Usuário sem empresa vinculada. Contate o administrador.',
    }
  }

  try {
    const uniqueMap = new Map<string, LegalCase>()
    cases.forEach((c) => {
      if (c?.protocolo) uniqueMap.set(c.protocolo, c)
    })

    const payload = Array.from(uniqueMap.values()).map((c) => {
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

      // Só envia id se for número válido (bigint)
      if (c.db_id && !isNaN(Number(c.db_id))) {
        item.id = Number(c.db_id)
      }

      return item
    })

    if (payload.length === 0) {
      return { success: false, message: 'Nenhum caso válido para salvar.' }
    }

    const { error } = await supabase
      .from('processos')
      .upsert(payload, { onConflict: 'id' })

    if (error) throw error

    return {
      success: true,
      message: `${payload.length} registros sincronizados.`,
    }
  } catch (error: any) {
    console.error('[saveStoredCases]', error)
    return { success: false, message: error.message || 'Erro ao gravar' }
  }
}

export async function saveStoredCase(c: LegalCase) {
  return await saveStoredCases([c])
}

/**
 * Notas / Evidências
 */
export async function getStoredNotes(): Promise<CaseNote[]> {
  const supabase = await createClient()
  const { auth_id, empresa_id } = await getUserContext()

  if (!auth_id) return []

  try {
    let query = supabase.from('notes').select('*')

    if (empresa_id) {
      query = query.eq('empresa_id', empresa_id)
    } else {
      query = query.eq('created_by', auth_id)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error

    return (data || []).map((item) => {
      let displayContent = item.content || ''
      let imageUrl: string | undefined

      try {
        if (displayContent.startsWith('{')) {
          const parsed = JSON.parse(displayContent)
          displayContent = parsed.text
          imageUrl = parsed.imageUrl
        }
      } catch {}

      return {
        id: item.id.toString(),
        title: item.title || 'Nota',
        content: displayContent,
        imageUrl,
        color: 'bg-white',
        updatedAt: new Date(item.created_at).toLocaleString('pt-BR'),
      }
    })
  } catch {
    return []
  }
}

export async function saveStoredNotes(
  notes: CaseNote[]
): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const { auth_id, empresa_id } = await getUserContext()

  if (!auth_id || !empresa_id) return { success: false }

  try {
    await supabase.from('notes').delete().eq('created_by', auth_id)

    if (notes.length > 0) {
      const dbNotes = notes.map((n) => ({
        title: n.title,
        content: n.imageUrl
          ? JSON.stringify({ text: n.content, imageUrl: n.imageUrl })
          : n.content,
        empresa_id: empresa_id,
        created_by: auth_id,
      }))

      await supabase.from('notes').insert(dbNotes)
    }

    return { success: true }
  } catch {
    return { success: false }
  }
}

/**
 * Usuários da empresa
 */
export async function getEmpresaUsers(): Promise<any[]> {
  const supabase = await createClient()
  const { empresa_id } = await getUserContext()

  if (!empresa_id) return []

  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('empresa_id', empresa_id)
    .order('nome', { ascending: true })

  if (error) {
    console.error('[getEmpresaUsers]', error)
    return []
  }

  return data || []
}

export async function removeEmpresaUser(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { empresa_id } = await getUserContext()

  if (!empresa_id) return false

  const { error } = await supabase
    .from('usuarios')
    .delete()
    .eq('id', userId)
    .eq('empresa_id', empresa_id)

  return !error
}
