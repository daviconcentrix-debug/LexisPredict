
'use server';

/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 */

import { createClient } from '@/lib/supabase/server';
import { getUserContext } from '@/lib/server-db';
import { parse } from 'csv-parse/sync';
import { processarCaso, formatDateToISO } from '@/lib/case-logic';

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
 * Motor de Ingestão P0: Separa Situação da Planilha do Status de Prazo do App.
 */
export async function importCsvAction(csvText: string) {
  try {
    const { empresa_id, auth_id } = await getUserContext();

    if (!empresa_id || !auth_id) {
      return { success: false, error: 'Sessão administrativa expirada. Refaça o login.' };
    }

    const records: CsvRow[] = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      bom: true,
    });

    if (!records || records.length === 0) {
      return { success: false, error: 'Arquivo vazio ou formato incompatível.' };
    }

    const alertLimit = 3; 

    // Mapeamento e Deduplicação Atômica por Protocolo
    const byProto = new Map();

    records.forEach((row) => {
      const rawData: any = {};
      Object.keys(row).forEach(k => {
        const key = normalizeHeader(k);
        rawData[key] = row[k];
      });

      // Forçamos o motor a calcular o prazo automaticamente
      rawData['STATUS_MANUAL'] = 'Automatico';

      const caso = processarCaso(rawData, { alertLimit });

      if (caso.protocolo && caso.protocolo.length >= 8) {
        const isoPrazo = formatDateToISO(caso.proximoPrazo);
        const isoRetorno = formatDateToISO(caso.ultimoRetorno);

        const dbRow = {
          empresa_id: empresa_id,
          created_by: auth_id,
          protocolo_ref: caso.protocolo,
          advogado: caso.advogado,
          status: caso.status,
          risco: caso.risco,
          tribunal: caso.tribunal,
          telefone: caso.telefone,
          status_interno: caso.situacao, // EM ANDAMENTO, IMÓVEL, etc.
          observacoes: caso.observacao,
          ultimo_retorno: isoRetorno,
          proximo_retorno: isoPrazo,
          dados: { ...caso }
        };

        // Mantém apenas a última ocorrência do mesmo protocolo no lote
        byProto.set(caso.protocolo, dbRow);
      }
    });

    const uniqueRows = Array.from(byProto.values());

    if (uniqueRows.length === 0) {
      return { success: false, error: 'Nenhum protocolo válido identificado no arquivo.' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('processos')
      .upsert(uniqueRows, {
        onConflict: 'protocolo_ref,empresa_id',
        ignoreDuplicates: false,
      })
      .select('id');

    if (error) {
      console.error('[Import DB Error]', error);
      if (error.code === '23505') return { success: false, error: 'Conflito de duplicidade no banco.' };
      return { success: false, error: 'Falha na gravação dos dados processados.' };
    }

    return {
      success: true,
      imported: data?.length || uniqueRows.length,
      message: `${data?.length || uniqueRows.length} processos sincronizados com inteligência de prazos ativa.`,
    };
  } catch (err: any) {
    console.error('[Import Critical]', err);
    return { success: false, error: 'Erro crítico no processamento neural da planilha.' };
  }
}
