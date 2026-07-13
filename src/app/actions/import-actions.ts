'use server'

import { createClient } from '@/lib/supabase/server'
import { parse } from 'csv-parse/sync'
import { LegalCase, calcularStatus, calcularRisco, formatDateToISO } from '@/lib/case-logic'
import { revalidatePath } from 'next/cache'

export async function importarCSVAction(formData: FormData) {
  try {
    const file = formData.get('file') as File
    if (!file) return { error: 'Nenhum arquivo enviado' }

    const text = await file.text()
    
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão expirada' }

    const { data: profile } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    const empresa_id = profile?.empresa_id
    if (!empresa_id) return { error: 'Usuário sem empresa vinculada' }

    const payload = records.map((row: any) => {
      const cleanRow: any = {}
      Object.keys(row).forEach(k => cleanRow[k.trim().toUpperCase()] = row[k])

      const cliente = (cleanRow['CLIENTE'] || '').trim()
      const protocolo = (cleanRow['PROTOCOLO'] || cleanRow['PROCESSO'] || '').trim()

      if (!cliente || !protocolo) return null

      const situacao = cleanRow['SITUAÇÃO'] || ''
      const statusInterno = cleanRow['STATUS'] || ''
      const observacao = cleanRow['OBSERVAÇÕES'] || ''
      const ultimoRetorno = cleanRow['RETORNO'] || ''
      const proximoPrazo = cleanRow['PRÓXIMO RETORNO'] || cleanRow['PRAZO'] || ''

      const status = calcularStatus(proximoPrazo, situacao)
      const risco = calcularRisco(observacao, statusInterno, situacao)

      const dados: LegalCase = {
        id: protocolo,
        cliente,
        protocolo,
        telefone: cleanRow['TELEFONE'] || '',
        advogado: cleanRow['ADVOGADO RESPONSÁVEL'] || cleanRow['ADVOGADO'] || '',
        escritorio: cleanRow['ESCRITÓRIO'] || '',
        situacao,
        statusInterno,
        observacao,
        ultimoRetorno,
        proximoPrazo,
        status,
        risco,
        tribunal: 'Outros',
        linkConsulta: '',
        produtos: cleanRow['PRODUTOS'] || '',
      }

      return {
        dados,
        empresa_id,
        created_by: user.id,
        ultimo_retorno: formatDateToISO(ultimoRetorno),
        proximo_retorno: formatDateToISO(proximoPrazo),
        observacoes: observacao,
        status,
        risco,
        status_interno: statusInterno,
        escritorio: dados.escritorio,
        advogado: dados.advogado,
        telefone: dados.telefone,
        produtos: dados.produtos,
      }
    }).filter(Boolean)

    if (payload.length === 0) return { error: 'Nenhum registro válido encontrado' }

    const BATCH_SIZE = 50
    for (let i = 0; i < payload.length; i += BATCH_SIZE) {
      const batch = payload.slice(i, i + BATCH_SIZE)
      const { error } = await supabase.from('processos').insert(batch)
      if (error) throw error
    }

    revalidatePath('/cases')
    return { success: true, count: payload.length }
  } catch (e: any) {
    console.error('[Import Action]', e)
    return { error: e.message }
  }
}
