'use server';

/**
 * MOTOR DE INGESTÃO MASSIVA - VERSÃO CORRIGIDA v65
 * Usa o cliente server correto do Supabase SSR
 */

import { parse } from 'csv-parse/sync';
import { createClient } from '@/lib/supabase/server';
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
      skip_records_with_error: true,
    });

    // ========== CLIENTE SERVER CORRETO SSR ==========
    const supabase = await createClient();

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return { error: 'Sessão expirada. Faça login novamente.' };
    }

    // Busca perfil
    const { data: profile } = await supabase
      .from('usuarios')
      .select('empresa_id, auth_user_id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    const empresa_id = profile?.empresa_id || 'd37fd4bb-1c71-4dca-b97e-292355918d39';
    const created_by = authUser.id;

    const payload: any[] = [];
    let skipped = 0;

    for (const row of records) {
      const cleanRow: Record<string, string> = {};
      Object.keys(row).forEach((key) => {
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
      const observacoes = (cleanRow['OBSERVAÇÕES'] || cleanRow['OBSERVACOES'] || cleanRow['OBSERVACAO'] || '').trim();
      const ultimoRaw = cleanRow['RETORNO'] || cleanRow['ULTIMO RETORNO'] || cleanRow['ULTIMORETORNO'] || '';
      const proximoRaw = cleanRow['PRÓXIMO RETORNO'] || cleanRow['PROXIMO RETORNO'] || cleanRow['PRAZO'] || cleanRow['PROXIMOPRAZO'] || '';

      const ultimo_retorno_iso = formatDateToISO(ultimoRaw);
      const proximo_retorno_iso = formatDateToISO(proximoRaw);

      const status = calcularStatus(proximoRaw, situacao);
      const risco = calcularRisco(observacoes, statusInterno, situacao);
      const diasFaltando = calcularDiasFaltando(proximo_retorno_iso);

      const casoDados = {
        id: protocolo,
        tipo: 'NOVO',
        status: status,
        cliente: cliente.toUpperCase(),
        protocolo: protocolo,
        telefone: (cleanRow['TELEFONE'] || '').trim() || null,
        advogado: (cleanRow['ADVOGADO RESPONSÁVEL'] || cleanRow['ADVOGADO'] || 'Não Atribuído').trim(),
        situacao: situacao || 'EM ANDAMENTO',
        observacao: observacoes,
        proximoPrazo: toBR(proximo_retorno_iso),
        ultimoRetorno: toBR(ultimo_retorno_iso),
        statusManual: 'Automatico',
        diasFaltando: diasFaltando,
        tribunal: (cleanRow['TRIBUNAL'] || 'Outros').trim(),
        linkConsulta: `https://www.google.com/search?q=consulta+processo+judicial+${protocolo}`,
        riscoIA: '',
        parecerIA: '',
        atendente: (cleanRow['ASSISTENTE'] || '').trim() || '',
        escritorio: (cleanRow['ESCRITÓRIO'] || cleanRow['ESCRITORIO'] || '').trim() || null,
        produtos: (cleanRow['PRODUTOS'] || '').trim() || null,
        risco: risco,
      };

      payload.push({
        dados: casoDados,
        empresa_id: empresa_id,
        created_by: created_by,
        ultimo_retorno: ultimo_retorno_iso,
        proximo_retorno: proximo_retorno_iso,
        observacoes: observacoes || null,
        status: status,
        risco: risco,
        status_interno: statusInterno || null,
        escritorio: casoDados.escritorio,
        advogado: casoDados.advogado,
        telefone: casoDados.telefone,
        produtos: casoDados.produtos,
      });
    }

    if (payload.length === 0) {
      return { error: 'Nenhum registro válido localizado no CSV.', skipped };
    }

    const { data: inserted, error: insertError } = await supabase
      .from('processos')
      .insert(payload)
      .select('id');

    if (insertError) {
      console.error('[IMPORT ERROR]', insertError);
      return { error: `Falha na gravação: ${insertError.message}` };
    }

    return {
      success: true,
      count: inserted?.length || payload.length,
      skipped,
      message: `Sucesso! Importados: ${inserted?.length || payload.length} | Pulados: ${skipped}`,
    };

  } catch (err: any) {
    console.error('[IMPORT FATAL]', err);
    return { error: err.message || 'Falha fatal no motor de triagem.' };
  }
}
