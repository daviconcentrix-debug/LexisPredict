'use server'

import { createClient } from '@/lib/supabase/server'
import { LegalCase, CaseNote, formatDateToISO } from './case-logic'

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
    empresa_id: profile?.empresa_id || 'd37fd4bb-1c71-4dca-b97e-292355918d39',
    cargo: profile?.cargo || 'Operador'
  }
}

export async function getStoredCases(): Promise<LegalCase[]> {
  const supabase = await createClient()
  const { auth_id, empresa_id } = await getUserContext()
  
  if (!auth_id) return []

  try {
    let query = supabase
      .from('processos')
      .select('*')

    // Visibilidade Aberta: Empresa OU Criador. Removido deleted_at (não existe)
    if (empresa_id) {
      query = query.or(`empresa_id.eq.${empresa_id},created_by.eq.${auth_id}`)
    } else {
      query = query.eq('created_by', auth_id)
    }

    const { data, error } = await query.order('id', { ascending: false })
    
    console.log('[getStoredCases] auth_id:', auth_id, 'empresa_id:', empresa_id, 'total:', data?.length)

    if (error) {
      console.error('[getStoredCases Error]', error)
      return []
    }
    
    return (data || []).map(item => ({
      ...(item.dados as LegalCase),
      db_id: item.id.toString(),
      id: (item.dados as any)?.protocolo || item.id.toString()
    }))
  } catch (error) {
    console.error(error)
    return []
  }
}

export async function saveStoredCases(cases: LegalCase[]): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient()
  const { auth_id, empresa_id } = await getUserContext()
  
  if (!auth_id) return { success: false, message: 'Sessão expirada. Faça login novamente.' }

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
    
    return { success: true, message: `${payload.length} registros sincronizados.` }
  } catch (error: any) {
    console.error('[saveStoredCases]', error)
    return { success: false, message: error.message }
  }
}

export async function getStoredNotes(): Promise<CaseNote[]> {
  const supabase = await createClient()
  const { auth_id, empresa_id, cargo } = await getUserContext()
  if (!auth_id) return []
  
  try {
    let query = supabase.from('notes').select('*')
    
    if (cargo === 'Administrador' && empresa_id) {
      query = query.eq('empresa_id', empresa_id)
    } else {
      query = query.eq('created_by', auth_id)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error

    return (data || []).map(item => {
      let displayContent = item.content || ''
      let imageUrl
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
        updatedAt: new Date(item.created_at).toLocaleString('pt-BR')
      }
    })
  } catch {
    return []
  }
}

export async function saveStoredNotes(notes: CaseNote[]): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const { auth_id, empresa_id } = await getUserContext()
  if (!auth_id) return { success: false }
  
  try {
    await supabase.from('notes').delete().eq('created_by', auth_id)
    
    if (notes.length > 0) {
      const dbNotes = notes.map(n => ({
        title: n.title,
        content: n.imageUrl ? JSON.stringify({ text: n.content, imageUrl: n.imageUrl }) : n.content,
        empresa_id,
        created_by: auth_id
      }))
      await supabase.from('notes').insert(dbNotes)
    }
    return { success: true }
  } catch {
    return { success: false }
  }
}

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
  
  const { error } = await supabase
    .from('usuarios')
    .delete()
    .eq('id', userId)

  return !error
}
