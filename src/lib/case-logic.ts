/**
 * MOTOR DE LÓGICA JURÍDICA PURA (v56000.0 ELITE)
 * Cálculos matemáticos de prazos e normalização de status.
 */

export type CaseStatus = 
  | 'Vencido' 
  | 'É Hoje' 
  | 'Atenção' 
  | 'Próximo' 
  | 'No Prazo' 
  | 'Sem Prazo' 
  | 'Encerrado' 
  | 'Caso Crítico';

export type RiskLevel = 'Crítico' | 'Atenção' | 'Normal';

export interface LegalCase {
  id: string;
  db_id?: string;
  cliente: string;
  protocolo: string;
  telefone?: string;
  escritorio?: string;
  advogado: string;
  situacao: string;
  statusInterno?: string;
  ultimoRetorno?: string;
  proximoPrazo: string;
  observacao: string;
  status: CaseStatus;
  risco: RiskLevel;
  diasFaltando: number | null;
  linkConsulta: string;
  tribunal: string;
  statusManual?: string;
}

export type CaseNote = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  color: string;
  updatedAt: string;
};

export function parseBrazilianDate(value: string | null | undefined): Date | null {
  if (!value || value.trim() === '' || value === '#VALUE!' || value === '-') return null;
  const cleaned = value.trim().split(' ')[0];
  const match = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const year = parseInt(match[3], 10);
  const date = new Date(year, month, day);
  return isNaN(date.getTime()) ? null : date;
}

export function formatDateToISO(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = typeof value === 'string' && value.includes('/') ? parseBrazilianDate(value) : new Date(value);
  if (!date || isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

export function calcularStatus(proximoRetorno: string | null | undefined, situacao: string | null | undefined): CaseStatus {
  const situacaoUpper = (situacao || '').toUpperCase();
  if (['ENCERRADO', 'EXTINTO', 'BAIXA', 'IMPROCEDENTE', 'CANCELADA', 'TRANSITADO'].some(t => situacaoUpper.includes(t))) return 'Encerrado';

  const dataProximo = parseBrazilianDate(proximoRetorno);
  if (!dataProximo) return 'Sem Prazo';

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  dataProximo.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((dataProximo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Vencido';
  if (diffDays === 0) return 'É Hoje';
  if (diffDays <= 3) return 'Atenção';
  if (diffDays <= 7) return 'Próximo';
  return 'No Prazo';
}

export function calcularRisco(obs?: string | null, status?: string | null, sit?: string | null): RiskLevel {
  const texto = `${obs || ''} ${status || ''} ${sit || ''}`.toUpperCase();
  if (['INDEFERIDA', 'EXTINTO', 'IMPROCEDENTE', 'BLOQUEOU', 'SUCUMBÊNCIA'].some(p => texto.includes(p))) return 'Crítico';
  if (['CONCLUSO', 'AGUARDANDO', 'CUSTAS', 'DILAÇÃO', 'PRAZO'].some(p => texto.includes(p))) return 'Atenção';
  return 'Normal';
}

export function processarCaso(linha: Record<string, string>): LegalCase {
  const situacao = (linha['SITUAÇÃO'] || linha['SITUACAO'] || 'EM ANDAMENTO').trim();
  const proximoRaw = linha['PRÓXIMO RETORNO'] || linha['PROXIMO RETORNO'] || linha['PRÓXIMO PRAZO'] || '';
  const observacao = linha['OBSERVAÇÕES'] || linha['OBSERVACOES'] || linha['OBSERVACAO'] || '';
  
  const status = calcularStatus(proximoRaw, situacao);
  const risco = calcularRisco(observacao, linha['STATUS'], situacao);

  return {
    id: linha['PROTOCOLO'] || linha['PROCESSO'] || Math.random().toString(36).substr(2, 9),
    cliente: (linha['CLIENTE'] || linha['NOME'] || 'DESCONHECIDO').toUpperCase(),
    advogado: (linha['ADVOGADO RESPONSÁVEL'] || linha['ADVOGADO'] || 'NÃO ATRIBUÍDO').toUpperCase(),
    protocolo: linha['PROTOCOLO'] || linha['PROCESSO'] || 'S/N',
    situacao: situacao,
    proximoPrazo: proximoRaw,
    status,
    risco,
    diasFaltando: null,
    linkConsulta: `https://www.google.com/search?q=processo+${linha['PROTOCOLO']}`,
    tribunal: linha['TRIBUNAL'] || 'Outros',
    observacao: observacao,
    telefone: linha['TELEFONE'] || ''
  };
}
