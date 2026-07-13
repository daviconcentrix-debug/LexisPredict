'use server';

/**
 * MOTOR DE INGESTÃO MASSIVA v41000.0 ELITE
 * Processamento Ultra-Robusto com Lotes Dinâmicos, Tripla Tentativa (Retry) 
 * e Mapeamento de Esquema Corrigido para o campo "dados".
 * Proprietário: W1 Capital | Fundador: Davi Alves Figueredo
 */

import { parse } from 'csv-parse/sync';
import { calcularStatus, calcularRisco, formatDateToISO, parseBrazilianDate, LegalCase } from '@/lib/case-logic';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

async function getContext() {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get('lexis_user_email')?.value;
    
    let authUser = null;
    const { data: { user } } = await supabase.auth.getUser();
    authUser = user;

    if (!userEmail && !authUser) return null;

    let query = supabase.from('usuarios').select('empresa_id, auth_user_id');
    if (userEmail) query = query.eq('email', userEmail.toLowerCase().trim());
    else if (authUser) query = query.eq('auth_user_id', authUser.id);

    const { data: profile } = await query.maybeSingle();
    return profile;
  } catch (e) {
    return null;
  }
}

function toBR(dateISO: string | null): string {
  if (!dateISO) return '';
  const parts = dateISO.split('-');
  if (parts.length !== 3) return '';
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export async function importarCSVAction(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) return { error: 'Nenhum arquivo enviado para triagem.' };

    const profile = await getContext();
    if (!profile) return { error: 'Sessão expirada. Faça login novamente.' };

    const text = await file.text();
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      bom: true,
    });

    const payload: any[] = [];
    let skipped = 0;

    for (const row of records) {
      const cliente = (row['CLIENTE'] || row['cliente'] || '').trim();
      const protocolo = (row['PROTOCOLO'] || row['protocolo'] || '').trim();

      if (!cliente || !protocolo) {
        skipped++;
        continue;
      }

      const situacao = (row['SITUAÇÃO'] || row['situacao'] || '').trim();
      const statusInterno = (row['STATUS'] || row['status_interno'] || '').trim();
      const observacao = (row['OBSERVAÇÕES'] || row['observacoes'] || '').trim();
      const proximoRetornoRaw = row['PRÓXIMO RETORNO'] || row['proximo_retorno'] || '';
      const ultimoRetornoRaw = row['RETORNO'] || row['ultimo_retorno'] || '';

      const ultimo_retorno_iso = formatDateToISO(ultimoRetornoRaw);
      const proximo_retorno_iso = formatDateToISO(proximoRetornoRaw);

      const status = calcularStatus(proximoRetornoRaw, situacao);
      const risco = calcularRisco(observacao, statusInterno, situacao);

      const dataProximo = parseBrazilianDate(proximoRetornoRaw);
      let diasFaltando: number | null = null;
      if (dataProximo) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        dataProximo.setHours(0, 0, 0, 0);
        const diffTime = dataProximo.getTime() - hoje.getTime();
        diasFaltando = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      // MAPEAMENTO DE ESQUEMA OFICIAL DO APP
      const casoDados: any = {
        id: protocolo,
        tipo: 'NOVO',
        status: status,
        cliente: cliente.toUpperCase(),
        protocolo: protocolo,
        telefone: (row['TELEFONE'] || row['telefone'] || '').trim(),
        advogado: (row['ADVOGADO RESPONSÁVEL'] || row['advogado'] || 'Não Atribuído').trim(),
        situacao: situacao,
        observacao: observacao,
        proximoPrazo: toBR(proximo_retorno_iso),
        ultimoRetorno: toBR(ultimo_retorno_iso),
        statusManual: 'Automatico',
        diasFaltando: diasFaltando,
        tribunal: 'Outros',
        linkConsulta: 'https://www.google.com/search?q=consulta+processo+judicial+' + protocolo,
        riscoIA: '',
        parecerIA: '',
        atendente: (row['ASSISTENTE'] || row['assistente'] || '').trim(),
        escritorio: (row['ESCRITÓRIO'] || row['escritorio'] || '').trim(),
        produtos: (row['PRODUTOS'] || row['produtos'] || '').trim(),
        risco: risco
      };

      payload.push({
        dados: casoDados,
        empresa_id: profile.empresa_id,
        created_by: profile.auth_user_id,
        ultimo_retorno: ultimo_retorno_iso,
        proximo_retorno: proximo_retorno_iso,
        observacoes: observacao,
        status,
        risco,
        status_interno: statusInterno,
        ultima_movimentacao: formatDateToISO(row['DATA MOVIMENTAÇÃO'] || row['ultima_movimentacao']),
        escritorio: casoDados.escritorio,
        advogado: casoDados.advogado,
        data_distribuicao: formatDateToISO(row['DISTRIB.'] || row['data_distribuicao']),
        produtos: casoDados.produtos,
        telefone: casoDados.telefone
      });
    }

    if (payload.length === 0) return { error: 'Nenhum registro válido no CSV.' };

    const BATCH_SIZE = 25; 
    let totalImported = 0;
    const batchErrors: string[] = [];
    
    for (let i = 0; i < payload.length; i += BATCH_SIZE) {
      const batch = payload.slice(i, i + BATCH_SIZE);
      let success = false;
      let lastError = '';

      for (let attempt = 1; attempt <= 3; attempt++) {
        const { error } = await supabase.from('processos').insert(batch);
        if (!error) {
          totalImported += batch.length;
          success = true;
          break; 
        } else {
          lastError = error.message;
          await new Promise(resolve => setTimeout(resolve, 800 * attempt));
        }
      }

      if (!success) {
        batchErrors.push(`Lote ${Math.floor(i / BATCH_SIZE) + 1} falhou após 3 tentativas: ${lastError}`);
      }
    }

    return {
      success: totalImported > 0,
      count: totalImported,
      message: `Importados com sucesso: ${totalImported} de ${payload.length} | Pulados: ${skipped}`,
      errors: batchErrors.length > 0 ? batchErrors : undefined
    };

  } catch (err: any) {
    console.error('[ImportAction] Falha Crítica:', err);
    return { error: err.message || 'Erro fatal na infraestrutura de triagem.' };
  }
}
