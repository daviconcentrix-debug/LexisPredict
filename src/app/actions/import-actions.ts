'use server';

/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 */

import { createClient } from '@/lib/supabase/server';
import { getUserContext } from '@/lib/server-db';
import { parse } from 'csv-parse/sync';

interface CsvRow {
  [key: string]: string;
}

/**
 * Normaliza datas brasileiras (DD/MM/YYYY) para o formato ISO (YYYY-MM-DD) aceito pelo Postgres.
 */
function parseBrazilianDate(value: string | null | undefined): string | null {
  if (!value) return null;
  
  const v = value.trim();
  if (!v || v === '-' || v === '—' || v === '00/00/0000' || v === '0') return null;

  // Se já estiver em formato ISO (YYYY-MM-DD), retorna diretamente
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return v;
  }

  // Tenta capturar o formato brasileiro DD/MM/YYYY ou DD-MM-YYYY
  const datePattern = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/;
  const match = v.match(datePattern);
  
  if (match) {
    const [, day, month, year] = match;
    const d = day.padStart(2, '0');
    const m = month.padStart(2, '0');
    return `${year}-${m}-${d}`;
  }

  // Fallback para datas que já começam com o ano mas usam barras
  if (/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/.test(v)) {
    return v.replace(/\//g, '-');
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

function mapCsvRowToProcesso(row: CsvRow, empresaId: string, userId: string) {
  // Mapeamento flexível de cabeçalhos para máxima compatibilidade
  const get = (...possibleNames: string[]) => {
    for (const name of possibleNames) {
      const key = Object.keys(row).find(
        (k) => normalizeHeader(k) === normalizeHeader(name)
      );
      if (key && row[key]?.trim()) return row[key].trim();
    }
    return '';
  };

  const protocolo = get('PROTOCOLO', 'PROCESSO', 'NÚMERO', 'NUMERO', 'CNJ');
  const cliente = get('CLIENTE', 'NOME', 'OUTORGANTE');
  const telefone = get('TELEFONE', 'CELULAR', 'WHATSAPP');
  const advogado = get('ADVOGADO', 'ADVOGADO RESPONSÁVEL', 'ADVOGADO RESPONSAVEL', 'ADVOCADO');
  const escritorio = get('ESCRITÓRIO', 'ESCRITORIO', 'BANCA');
  const situacao = get('SITUAÇÃO', 'SITUACAO', 'STATUS INTERNO');
  const status = get('STATUS', 'STATUS PRAZO');
  const risco = get('RISCO', 'RISCO IA');
  const observacoes = get('OBSERVAÇÕES', 'OBSERVACOES', 'OBS', 'OBSERVAÇÃO');
  const ultimoRetorno = get('ÚLTIMO RETORNO', 'ULTIMO RETORNO', 'RETORNO');
  const proximoRetorno = get('PRÓXIMO RETORNO', 'PROXIMO RETORNO', 'PRÓXIMO PRAZO', 'PROXIMO PRAZO', 'PRAZO');
  const tribunal = get('TRIBUNAL', 'FORO', 'COMARCA');
  const produtos = get('PRODUTOS', 'PRODUTO');
  const dataDistribuicao = get('DATA DISTRIBUIÇÃO', 'DISTRIB.', 'DISTRIBUICAO');

  // Objeto rico de dados para o JSONB
  const dados = {
    id: protocolo || crypto.randomUUID(),
    cliente: cliente || 'NÃO INFORMADO',
    protocolo: protocolo,
    telefone: telefone,
    advogado: advogado || 'Não Atribuído',
    escritorio: escritorio,
    situacao: situacao || 'EM ANDAMENTO',
    status: status || 'Sem Prazo',
    risco: risco || '',
    observacao: observacoes,
    ultimoRetorno: ultimoRetorno,
    proximoPrazo: proximoRetorno,
    tribunal: tribunal || 'Outros',
    produtos: produtos,
    statusManual: status || 'Automatico',
  };

  return {
    empresa_id: empresaId,
    created_by: userId,
    protocolo_ref: protocolo || null,
    dados: dados,
    telefone: telefone || null,
    advogado: advogado || null,
    escritorio: escritorio || null,
    status: status || null,
    risco: risco || null,
    observacoes: observacoes || null,
    tribunal: tribunal || null,
    produtos: produtos || null,
    // Normalização Temporal Crítica
    ultimo_retorno: parseBrazilianDate(ultimoRetorno),
    proximo_retorno: parseBrazilianDate(proximoRetorno),
    data_distribuicao: parseBrazilianDate(dataDistribuicao),
  };
}

/**
 * Realiza o processamento e sincronização incremental do CSV.
 */
export async function importCsvAction(csvText: string) {
  try {
    const { empresa_id, auth_id } = await getUserContext();

    if (!empresa_id || !auth_id) {
      return { success: false, error: 'Sessão administrativa expirada ou inválida.' };
    }

    // Parsing robusto com tratamento de BOM e contagem relaxada
    const records: CsvRow[] = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      bom: true,
    });

    if (!records || records.length === 0) {
      return { success: false, error: 'A planilha fornecida está vazia ou em formato incompatível.' };
    }

    // Filtragem e mapeamento atômico
    const rows = records
      .map((row) => mapCsvRowToProcesso(row, empresa_id, auth_id))
      .filter((r) => r.protocolo_ref);

    if (rows.length === 0) {
      return {
        success: false,
        error: 'Nenhum registro válido identificado. Certifique-se de que a coluna PROTOCOLO está presente.',
      };
    }

    const supabase = await createClient();

    // Protocolo de UPSERT Soberano
    const { data, error } = await supabase
      .from('processos')
      .upsert(rows, {
        onConflict: 'protocolo_ref,empresa_id',
        ignoreDuplicates: false,
      })
      .select('id');

    if (error) {
      console.error('[Import Critical] Erro no upsert:', error.message);
      return {
        success: false,
        error: error.message || 'Falha na gravação dos dados no repositório.',
      };
    }

    return {
      success: true,
      imported: data?.length || rows.length,
      message: `${data?.length || rows.length} processos sincronizados com sucesso no gabinete.`,
    };
  } catch (err: any) {
    console.error('[Import Logic Fail] Erro inesperado:', err.message);
    return {
      success: false,
      error: 'Falha interna na unidade de migração.',
    };
  }
}
