
'use server';

/**
 * MOTOR DE INGESTÃO MASSIVA v50000.0 ELITE
 * Processamento ultra-robusto focado em Supabase.
 * Inserção massiva com mapeamento de colunas SQL.
 */

import { parse } from 'csv-parse/sync';
import { supabase } from '@/lib/supabase';
import { calcularStatus, calcularRisco, formatDateToISO } from '@/lib/case-logic';

function toBR(dateISO: string | null): string {
  if (!dateISO) return '';
  const parts = dateISO.split('-');
  if (parts.length !== 3) return '';
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function calcularDiasFaltando(proximoISO: string | null): number | null {
  if (!proximoISO) return null;
  try {
    const [y, m, d] = proximoISO.split('-').map(Number);
    const dataProximo = new Date(y, m - 1, d);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return Math.floor((dataProximo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

export async function importarCSVAction(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) return { error: 'Nenhum arquivo detectado.' };

    const text = await file.text();
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      bom: true,
      skip_records_with_error: true
    });

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { error: 'Sessão expirada. Realize login novamente.' };

    const { data: profile } = await supabase.from('usuarios')
      .select('empresa_id, auth_user_id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();
    
    const empresa_id = profile?.empresa_id || null;
    const created_by = authUser.id;

    const payload: any[] = [];
    let skipped = 0;

    for (const row of records) {
      // Normalização de chaves para evitar problemas de espaços no CSV
      const cleanRow: Record<string, string> = {};
      Object.keys(row).forEach(key => {
        cleanRow[key.trim().toUpperCase()] = row[key];
      });

      const cliente = (cleanRow['CLIENTE'] || cleanRow['NOME'] || '').trim();
      const protocolo = (cleanRow['PROTOCOLO'] || cleanRow['PROCESSO'] || '').trim();

      if (!cliente || !protocolo) {
        skipped++;
        continue;
      }

      const situacao = (cleanRow['SITUAÇÃO'] || cleanRow['SITUACAO'] || '').trim();
      const statusInterno = (cleanRow['STATUS'] || '').trim();
      const observacoes = (cleanRow['OBSERVAÇÕES'] || cleanRow['OBSERVACOES'] || '').trim();
      const ultimoRaw = cleanRow['RETORNO'] || cleanRow['ULTIMO RETORNO'] || '';
      const proximoRaw = cleanRow['PRÓXIMO RETORNO'] || cleanRow['PROXIMO RETORNO'] || cleanRow['PRAZO'] || '';

      const ultimo_retorno_iso = formatDateToISO(ultimoRaw);
      const proximo_retorno_iso = formatDateToISO(proximoRaw);

      const status = calcularStatus(proximoRaw, situacao);
      const risco = calcularRisco(observacoes, statusInterno, situacao);
      const diasFaltando = calcularDiasFaltando(proximo_retorno_iso);

      // Objeto oficial que o app usa
      const casoDados = {
        id: protocolo,
        tipo: 'NOVO',
        status: status,
        cliente: cliente.toUpperCase(),
        protocolo: protocolo,
        telefone: (cleanRow['TELEFONE'] || '').trim(),
        advogado: (cleanRow['ADVOGADO RESPONSÁVEL'] || cleanRow['ADVOGADO'] || 'Não Atribuído').trim(),
        situacao: situacao,
        observacao: observacoes,
        proximoPrazo: toBR(proximo_retorno_iso || ''),
        ultimoRetorno: toBR(ultimo_retorno_iso || ''),
        statusManual: 'Automatico',
        diasFaltando: diasFaltando,
        tribunal: 'Outros',
        linkConsulta: `https://www.google.com/search?q=consulta+processo+judicial+${protocolo}`,
        riscoIA: '',
        parecerIA: '',
        atendente: (cleanRow['ASSISTENTE'] || '').trim(),
        escritorio: (cleanRow['ESCRITÓRIO'] || cleanRow['ESCRITORIO'] || '').trim(),
        produtos: (cleanRow['PRODUTOS'] || '').trim(),
        risco: risco
      };

      payload.push({
        dados: casoDados,
        empresa_id: empresa_id,
        created_by: created_by,
        ultimo_retorno: ultimo_retorno_iso,
        proximo_retorno: proximo_retorno_iso,
        observacoes: observacoes,
        status: status,
        risco: risco,
        status_interno: statusInterno,
        escritorio: casoDados.escritorio,
        advogado: casoDados.advogado,
        telefone: casoDados.telefone,
        produtos: casoDados.produtos
      });
    }

    if (payload.length === 0) return { error: 'Nenhum registro válido localizado no CSV.' };

    // Gravação Massiva Atômica
    const { data: inserted, error: insertError } = await supabase
      .from('processos')
      .insert(payload)
      .select('id');

    if (insertError) {
      return { error: `Falha na gravação: ${insertError.message}` };
    }

    return {
      success: true,
      count: inserted?.length || payload.length,
      message: `Sucesso! Importados: ${inserted?.length || payload.length} | Pulados: ${skipped}`
    };

  } catch (err: any) {
    return { error: 'Falha fatal no motor de triagem.' };
  }
}
