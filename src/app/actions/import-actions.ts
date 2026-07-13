
'use server';

/**
 * MOTOR DE INGESTÃO MASSIVA v45000.0 ELITE
 * Processamento Ultra-Robusto com Ingestão de Alta Capacidade.
 * Proprietário: W1 Capital | Fundador: Davi Alves Figueredo
 */

import { parse } from 'csv-parse/sync';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

// ====================== HELPERS DE LOGICA ======================
function parseBrazilianDate(value: string | null | undefined): string | null {
  if (!value || value.trim() === '' || value === '-' || value === '#VALUE!') return null;
  const cleaned = value.trim();
  const match = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

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

function calcularStatus(proximoISO: string | null, situacao: string | null): string {
  const sit = (situacao || '').toUpperCase();
  const termosEncerrado = ['ENCERRADO', 'EXTINTO', 'BAIXA DEFINITIVAMENTE', 'IMPROCEDENTE', 'CANCELADA', 'TRANSITADO'];
  if (termosEncerrado.some(t => sit.includes(t))) return 'Encerrado';
  
  if (!proximoISO) return 'Sem Prazo';
  const dias = calcularDiasFaltando(proximoISO);
  if (dias === null) return 'Sem Prazo';
  if (dias < 0) return 'Vencido';
  if (dias === 0) return 'É Hoje';
  if (dias <= 3) return 'Atenção';
  if (dias <= 7) return 'Próximo';
  return 'No Prazo';
}

function calcularRisco(observacoes: string | null, statusInterno: string | null, situacao: string | null): string {
  const texto = `${observacoes || ''} ${statusInterno || ''} ${situacao || ''}`.toUpperCase();
  const criticas = ['INDEFERIDA', 'EXTINTO', 'IMPROCEDENTE', 'CLIENTE NÃO RESPONDE', 'NÃO PAGOU AS CUSTAS', 'CARTA DE DESISTÊNCIA', 'SUMI', 'BLOQUEOU', 'SUCUMBÊNCIA', 'BAIXA DEFINITIVAMENTE', 'CANCELADA DISTRIBUIÇÃO', 'CLIENTE SUMI', 'NÃO QUER ENVOLVIMENTO', 'ARQUIVADO DEFINITIVAMENTE'];
  const atencao = ['CONCLUSO', 'AGUARDANDO', 'DOCUMENTAÇÃO', 'CUSTAS', 'DILAÇÃO', 'REDISTRIBUIÇÃO', 'SUBSTABELECIMENTO', 'JG INDEFERIDA', 'EMENDA', 'PROVAS', 'AUDIÊNCIA', 'CONTESTAÇÃO', 'RÉPLICA'];

  if (criticas.some(p => texto.includes(p))) return 'Crítico';
  if (atencao.some(p => texto.includes(p))) return 'Atenção';
  return 'Normal';
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
    const user = auth.user;

    if (!userEmail && !user) return { error: 'Sessão expirada. Realize login novamente.' };

    let query = supabase.from('usuarios').select('empresa_id, auth_user_id');
    if (userEmail) query = query.eq('email', userEmail.toLowerCase().trim());
    else if (user) query = query.eq('auth_user_id', user.id);

    const { data: profile } = await query.maybeSingle();
    if (!profile) return { error: 'Perfil de gabinete não localizado.' };

    const payload: any[] = [];
    let skipped = 0;

    for (const row of records) {
      // Normalização de chaves para evitar falhas de trim em nomes de colunas
      const cleanRow: Record<string, string> = {};
      Object.keys(row).forEach(key => {
        cleanRow[key.trim().toUpperCase()] = row[key];
      });

      const cliente = (cleanRow['CLIENTE'] || '').trim();
      const protocolo = (cleanRow['PROTOCOLO'] || '').trim();

      if (!cliente || !protocolo) {
        skipped++;
        continue;
      }

      const situacao = (cleanRow['SITUAÇÃO'] || cleanRow['SITUACAO'] || '').trim();
      const statusInterno = (cleanRow['STATUS'] || '').trim();
      const observacoes = (cleanRow['OBSERVAÇÕES'] || cleanRow['OBSERVACOES'] || '').trim();
      const ultimoRaw = cleanRow['RETORNO'] || '';
      const proximoRaw = cleanRow['PRÓXIMO RETORNO'] || cleanRow['PROXIMO RETORNO'] || '';

      const ultimo_retorno_iso = parseBrazilianDate(ultimoRaw);
      const proximo_retorno_iso = parseBrazilianDate(proximoRaw);

      const status = calcularStatus(proximo_retorno_iso, situacao);
      const risco = calcularRisco(observacoes, statusInterno, situacao);
      const diasFaltando = calcularDiasFaltando(proximo_retorno_iso);

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
        proximoPrazo: toBR(proximo_retorno_iso),
        ultimoRetorno: toBR(ultimo_retorno_iso),
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
        empresa_id: profile.empresa_id,
        created_by: profile.auth_user_id,
        ultimo_retorno: ultimo_retorno_iso,
        proximo_retorno: proximo_retorno_iso,
        observacoes: observacoes,
        status,
        risco,
        status_interno: statusInterno,
        ultima_movimentacao: parseBrazilianDate(cleanRow['DATA MOVIMENTAÇÃO'] || cleanRow['DATA MOVIMENTACAO']),
        escritorio: casoDados.escritorio,
        advogado: casoDados.advogado,
        data_distribuicao: parseBrazilianDate(cleanRow['DISTRIB.'] || cleanRow['DISTRIB']),
        produtos: casoDados.produtos,
        telefone: casoDados.telefone
      });
    }

    if (payload.length === 0) return { error: 'Nenhum registro íntegro no CSV.' };

    // Ingestão Massiva Direta (Alta Performance)
    const { data: inserted, error: insertError } = await supabase
      .from('processos')
      .insert(payload)
      .select('id');

    if (insertError) {
      console.error('[DB] Falha na Gravação:', insertError.message);
      return { error: `Erro técnico: ${insertError.message}` };
    }

    return {
      success: true,
      count: inserted?.length || payload.length,
      message: `Sucesso! Importados: ${inserted?.length || payload.length} | Pulados: ${skipped} | Total: ${records.length}`
    };

  } catch (err: any) {
    console.error('[ImportAction] Erro Crítico:', err);
    return { error: 'Falha fatal no motor de triagem.' };
  }
}
