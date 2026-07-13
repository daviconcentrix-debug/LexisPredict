
'use server';

/**
 * MOTOR DE INGESTÃO MASSIVA v46000.0 ELITE
 * Processamento ultra-robusto com mapeamento total de colunas.
 * Proprietário: W1 Capital | Fundador: Davi Alves Figueredo
 */

import { parse } from 'csv-parse/sync';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { calcularStatus, calcularRisco, parseBrazilianDate, formatDateToISO } from '@/lib/case-logic';

// Helper para converter ISO para DD/MM/YYYY (exibição no frontend)
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

    const cookieStore = await cookies();
    const userEmail = cookieStore.get('lexis_user_email')?.value;
    const { data: auth } = await supabase.auth.getUser();
    const authUser = auth.user;

    if (!userEmail && !authUser) return { error: 'Sessão expirada. Realize login novamente.' };

    let query = supabase.from('usuarios').select('empresa_id, auth_user_id');
    if (userEmail) query = query.eq('email', userEmail.toLowerCase().trim());
    else if (authUser) query = query.eq('auth_user_id', authUser.id);

    const { data: profile } = await query.maybeSingle();
    
    // Se não tiver perfil, tenta usar o ID do auth como fallback para empresa genérica ou nula
    const empresa_id = profile?.empresa_id || null;
    const created_by = profile?.auth_user_id || authUser?.id;

    const payload: any[] = [];
    let skipped = 0;

    for (const row of records) {
      // Normalização de chaves para evitar falhas de trim
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

      // Objeto DADOS no formato que o Frontend espera (Chaves específicas)
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
        tribunal: 'Outros', // Será recalculado pelo motor no frontend ou aqui
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
        ultima_movimentacao: formatDateToISO(cleanRow['DATA MOVIMENTAÇÃO'] || cleanRow['DATA MOVIMENTACAO']),
        escritorio: casoDados.escritorio,
        advogado: casoDados.advogado,
        data_distribuicao: formatDateToISO(cleanRow['DISTRIB.'] || cleanRow['DISTRIB']),
        produtos: casoDados.produtos,
        telefone: casoDados.telefone
      });
    }

    if (payload.length === 0) return { error: 'Nenhum registro válido localizado no CSV.' };

    // Ingestão massiva atômica
    const { data: inserted, error: insertError } = await supabase
      .from('processos')
      .insert(payload)
      .select('id');

    if (insertError) {
      console.error('[DB] Falha na Gravação Massiva:', insertError.message);
      return { error: `Erro técnico: ${insertError.message}` };
    }

    return {
      success: true,
      count: inserted?.length || payload.length,
      message: `Sucesso! Importados: ${inserted?.length || payload.length} | Pulados: ${skipped} | Total detectado: ${records.length}`
    };

  } catch (err: any) {
    console.error('[ImportAction] Erro Crítico:', err);
    return { error: 'Falha fatal no motor de triagem. Verifique o formato do arquivo.' };
  }
}
