
'use server';

import { createClient } from '@/lib/supabase/server';
import { parse } from 'csv-parse/sync';
import { calcularStatus, calcularRisco, formatDateToISO } from '@/lib/case-logic';

function toBR(dateISO: string | null): string {
  if (!dateISO) return '';
  const parts = dateISO.split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function calcularDias(iso: string | null): number | null {
  if (!iso) return null;
  try {
    const [y, m, d] = iso.split('-').map(Number);
    const data = new Date(y, m - 1, d);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return Math.floor((data.getTime() - hoje.getTime()) / 86400000);
  } catch { return null; }
}

export async function importarCSVAction(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) return { error: 'Nenhum arquivo detectado.' };

    const text = await file.text();
    const records = parse(text, { columns: true, skip_empty_lines: true, trim: true, relax_column_count: true, bom: true });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { error: 'Sessão expirada. Faça login novamente.' };

    const { data: profile } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    const empresa_id = profile?.empresa_id || 'd37fd4bb-1c71-4dca-b97e-292355918d39';
    const created_by = user.id;

    const payload: any[] = [];

    for (const row of records) {
      const cleanRow: any = {};
      Object.keys(row).forEach(k => cleanRow[k.trim().toUpperCase()] = row[k]);

      const cliente = (cleanRow['CLIENTE'] || cleanRow['NOME'] || '').trim();
      const protocolo = (cleanRow['PROTOCOLO'] || cleanRow['PROCESSO'] || '').trim();

      if (!cliente || !protocolo) continue;

      const situacao = (cleanRow['SITUAÇÃO'] || cleanRow['SITUACAO'] || '').trim();
      const statusInt = (cleanRow['STATUS'] || '').trim();
      const obs = (cleanRow['OBSERVAÇÕES'] || cleanRow['OBSERVACOES'] || '').trim();
      const proximoRaw = cleanRow['PRÓXIMO RETORNO'] || cleanRow['PROXIMO RETORNO'] || cleanRow['PRAZO'] || '';

      const proximo_iso = formatDateToISO(proximoRaw);
      const ultimo_iso = formatDateToISO(cleanRow['RETORNO'] || '');

      const status = calcularStatus(proximoRaw, situacao);
      const risco = calcularRisco(obs, statusInt, situacao);
      const dias = calcularDias(proximo_iso);

      const casoDados = {
        id: protocolo,
        tipo: 'NOVO',
        status,
        cliente: cliente.toUpperCase(),
        protocolo,
        telefone: (cleanRow['TELEFONE'] || '').trim() || null,
        advogado: (cleanRow['ADVOGADO RESPONSÁVEL'] || cleanRow['ADVOGADO'] || 'Não Atribuído').trim(),
        situacao: situacao || 'EM ANDAMENTO',
        observacao: obs,
        proximoPrazo: toBR(proximo_iso),
        ultimoRetorno: toBR(ultimo_iso),
        statusManual: 'Automatico',
        diasFaltando: dias,
        tribunal: (cleanRow['TRIBUNAL'] || 'Outros').trim(),
        linkConsulta: `https://www.google.com/search?q=processo+${protocolo}`,
        risco,
      };

      payload.push({
        dados: casoDados,
        empresa_id,
        created_by,
        ultimo_retorno: ultimo_iso,
        proximo_retorno: proximo_iso,
        observacoes: obs || null,
        status,
        risco,
        status_interno: statusInt || null,
        escritorio: (cleanRow['ESCRITÓRIO'] || '').trim() || null,
        advogado: casoDados.advogado,
        telefone: casoDados.telefone,
      });
    }

    if (payload.length === 0) return { error: 'CSV sem registros válidos.' };

    const { data, error } = await supabase.from('processos').insert(payload).select('id');

    if (error) return { error: `Falha na gravação: ${error.message}` };

    return { success: true, count: data?.length || payload.length, message: `Importação Concluída: ${data?.length || payload.length} processos sincronizados.` };

  } catch (err: any) {
    return { error: err.message || 'Erro crítico na ingestão.' };
  }
}
