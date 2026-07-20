
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

/**
 * Normaliza datas brasileiras (DD/MM/YYYY) para o formato ISO (YYYY-MM-DD).
 */
function parseBrazilianDate(value: string | null | undefined): string | null {
  if (!value) return null;
  
  const v = value.trim();
  if (!v || v === '-' || v === '—' || v === '00/00/0000' || v === '0') return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return v;
  }

  const datePattern = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/;
  const match = v.match(datePattern);
  
  if (match) {
    const [, day, month, year] = match;
    const d = day.padStart(2, '0');
    const m = month.padStart(2, '0');
    return `${year}-${m}-${d}`;
  }

  return null;
}

function normalizeHeader(header: string): string {
  return header
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

/**
 * Realiza a ingestão inteligente tratando a coluna "STATUS" da planilha como a situação interna.
 */
export async function importCsvAction(csvText: string) {
  try {
    const { empresa_id, auth_id } = await getUserContext();

    if (!empresa_id || !auth_id) {
      return { success: false, error: 'Sessão administrativa expirada.' };
    }

    const records: CsvRow[] = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      bom: true,
    });

    if (!records || records.length === 0) {
      return { success: false, error: 'Planilha vazia ou em formato incompatível.' };
    }

    const savedThreshold = 3; 

    const rows = records.map((row) => {
      const rawData: any = {};
      Object.keys(row).forEach(k => {
        const key = normalizeHeader(k);
        // Se a coluna for "STATUS", no app ela vira a "SITUAÇÃO" interna
        if (key === 'STATUS') {
           rawData['SITUACAO'] = row[k];
        } else {
           rawData[key] = row[k];
        }
      });

      // Forçamos o motor a calcular o prazo automaticamente na importação
      rawData['STATUS_MANUAL'] = 'Automatico';

      // Pré-converte datas
      if (rawData.PROXIMO_RETORNO || rawData.PROXIMO_PRAZO) {
         const p = rawData.PROXIMO_RETORNO || rawData.PROXIMO_PRAZO;
         rawData.PROXIMO_RETORNO = parseBrazilianDate(p);
      }
      if (rawData.ULTIMO_RETORNO || rawData.RETORNO) {
         const u = rawData.ULTIMO_RETORNO || rawData.RETORNO;
         rawData.ULTIMO_RETORNO = parseBrazilianDate(u);
      }

      const casoProcessado = processarCaso(rawData, { alertLimit: savedThreshold });

      return {
        empresa_id: empresa_id,
        created_by: auth_id,
        protocolo_ref: casoProcessado.protocolo || null,
        advogado: casoProcessado.advogado || null,
        status: casoProcessado.status || null,
        risco: casoProcessado.risco || null,
        tribunal: casoProcessado.tribunal || null,
        telefone: casoProcessado.telefone || null,
        observacoes: casoProcessado.observacao || null,
        ultimo_retorno: formatDateToISO(casoProcessado.ultimoRetorno),
        proximo_retorno: formatDateToISO(casoProcessado.proximoPrazo),
        dados: casoProcessado
      };
    }).filter(r => r.protocolo_ref);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('processos')
      .upsert(rows, {
        onConflict: 'protocolo_ref,empresa_id',
        ignoreDuplicates: false,
      })
      .select('id');

    if (error) throw error;

    return {
      success: true,
      imported: data?.length || rows.length,
      message: `${data?.length || rows.length} processos processados e sincronizados via Motor Elite.`,
    };
  } catch (err: any) {
    return { success: false, error: 'Falha na unidade de migração neural.' };
  }
}
