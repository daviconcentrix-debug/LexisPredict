'use server';

/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 */

import { createClient } from '@/lib/supabase/server';
import { getUserContext } from '@/lib/server-db';
import { parse } from 'csv-parse/sync';
import { buildProcessoRecord } from '@/lib/case-mapper';

interface CsvRow {
  [key: string]: string;
}

function normalizeHeader(header: string): string {
  return header
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

/**
 * Motor de Ingestão Resiliente v1500.0
 * Utiliza o Mapeador Universal para garantir integridade.
 */
export async function importCsvAction(csvText: string) {
  try {
    const { empresa_id, auth_id } = await getUserContext();
    if (!empresa_id || !auth_id) return { success: false, error: 'Sessão administrativa expirada.' };

    const records: CsvRow[] = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      bom: true,
    });

    if (!records || records.length === 0) return { success: false, error: 'Planilha vazia ou em formato incompatível.' };

    const getVal = (row: CsvRow, ...keys: string[]) => {
      for (const k of keys) {
        const foundKey = Object.keys(row).find(rk => normalizeHeader(rk) === normalizeHeader(k));
        if (foundKey && row[foundKey]) return row[foundKey].trim();
      }
      return '';
    };

    // Processamento e Deduplicação Atômica
    const mappedBatch = new Map();

    records.forEach(row => {
      const protocolo = getVal(row, 'PROTOCOLO', 'PROCESSO', 'NUMERO', 'CNJ');
      if (!protocolo || protocolo.length < 8) return;

      const record = buildProcessoRecord({
        empresaId: empresa_id,
        userId: auth_id,
        cliente: getVal(row, 'CLIENTE', 'NOME', 'OUTORGANTE'),
        protocolo,
        telefone: getVal(row, 'TELEFONE', 'CELULAR', 'WHATSAPP'),
        advogado: getVal(row, 'ADVOGADO', 'RESPONSAVEL'),
        escritorio: getVal(row, 'ESCRITORIO', 'BANCA'),
        situacao: getVal(row, 'STATUS', 'SITUACAO', 'STATUS INTERNO'), // STATUS da planilha vira SITUACAO (Em Andamento, etc)
        observacao: getVal(row, 'OBSERVACOES', 'OBS', 'RESUMO'),
        proximoRetorno: getVal(row, 'PROXIMO_RETORNO', 'PRÓXIMO PRAZO', 'VENCIMENTO'),
        ultimoRetorno: getVal(row, 'RETORNO', 'ULTIMO_RETORNO'),
        produtos: getVal(row, 'PRODUTOS'),
        atendente: getVal(row, 'ASSISTENTE', 'ATENDENTE'),
        statusManual: 'Automatico' // Força o app a calcular o prazo na importação
      });

      mappedBatch.set(record.protocolo_ref, record);
    });

    const rowsToUpsert = Array.from(mappedBatch.values());
    if (rowsToUpsert.length === 0) return { success: false, error: 'Nenhum protocolo válido detectado.' };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('processos')
      .upsert(rowsToUpsert, {
        onConflict: 'protocolo_ref,empresa_id',
        ignoreDuplicates: false,
      })
      .select('id');

    if (error) throw error;

    return {
      success: true,
      imported: data?.length || rowsToUpsert.length,
      message: `${data?.length || rowsToUpsert.length} processos sincronizados via Mapeador Universal.`,
    };
  } catch (err: any) {
    console.error("[Import Fail]", err.message);
    return { success: false, error: 'Falha na unidade de migração neural.' };
  }
}
