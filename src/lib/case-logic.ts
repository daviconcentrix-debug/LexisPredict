/**
 * MOTOR DE LÓGICA JURÍDICA PURA (v1000.0 ELITE)
 */

export type CaseStatus = 
  | 'Vencido' 
  | 'É Hoje' 
  | 'Atenção' 
  | 'Próximo' 
  | 'No Prazo' 
  | 'Sem Prazo' 
  | 'Encerrado' 
  | 'Arquivado';

export type RiskLevel = 'Crítico' | 'Atenção' | 'Normal';

export interface LegalCase {
  id: string;
  db_id?: string;
  cliente: string;
  protocolo: string;
  telefone?: string;
  advogado: string;
  escritorio?: string;
  situacao: string;
  proximoPrazo: string;
  ultimoRetorno: string;
  observacao?: string;
  status: CaseStatus;
  risco: RiskLevel;
  diasFaltando?: number | null;
  statusManual?: string;
  tribunal: string;
  linkConsulta: string;
  produtos?: string;
  statusInterno?: string;
  ultimaMovimentacao?: string;
  dataDistribuicao?: string;
}

export type CaseNote = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  color: string;
  updatedAt: string;
};

export function formatDateToISO(dateStr: string | null | undefined): string | null {
  if (!dateStr || dateStr.trim() === '') return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function calcularDiasFaltando(proximoISO: string | null): number | null {
  if (!proximoISO) return null;
  try {
    const dataProximo = new Date(proximoISO + 'T12:00:00');
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataProximo.setHours(0, 0, 0, 0);
    const diff = dataProximo.getTime() - hoje.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

export function calcularStatus(proximoRetorno: string | null | undefined, situacao: string | null | undefined): CaseStatus {
  const sit = (situacao || '').toUpperCase();
  if (sit.includes('ENCERRADO') || sit.includes('ARQUIVADO') || sit.includes('EXTINTO')) {
    return 'Arquivado';
  }
  
  if (!proximoRetorno) return 'Sem Prazo';
  
  const iso = formatDateToISO(proximoRetorno);
  const dias = calcularDiasFaltando(iso);
  
  if (dias === null) return 'Sem Prazo';
  if (dias < 0) return 'Vencido';
  if (dias === 0) return 'É Hoje';
  if (dias <= 3) return 'Atenção';
  if (dias <= 7) return 'Próximo';
  return 'No Prazo';
}

export function calcularRisco(observacoes: string | null | undefined, statusInterno: string | null | undefined, situacao: string | null | undefined): RiskLevel {
  const texto = `${observacoes || ''} ${statusInterno || ''} ${situacao || ''}`.toUpperCase();
  const criticas = ['INDEFERIDA', 'EXTINTO', 'IMPROCEDENTE', 'CLIENTE NÃO RESPONDE', 'NÃO PAGOU AS CUSTAS', 'CARTA DE DESISTÊNCIA', 'SUMI', 'BLOQUEOU', 'SUCUMBÊNCIA', 'BAIXA DEFINITIVAMENTE'];
  const atencao = ['CONCLUSO', 'AGUARDANDO', 'DOCUMENTAÇÃO', 'CUSTAS', 'DILAÇÃO', 'REDISTRIBUIÇÃO', 'SUBSTABELECIMENTO', 'JG INDEFERIDA'];

  if (criticas.some(p => texto.includes(p))) return 'Crítico';
  if (atencao.some(p => texto.includes(p))) return 'Atenção';
  return 'Normal';
}

export function processarCaso(linha: any): LegalCase {
  const proximoPrazo = linha['PRÓXIMO PRAZO'] || linha.proximoPrazo || '';
  const situacao = linha.SITUAÇÃO || linha.situacao || 'EM ANDAMENTO';
  const observacao = linha.OBSERVAÇÃO || linha.observacao || '';
  const statusInterno = linha.STATUS || linha.statusInterno || '';
  
  const status = calcularStatus(proximoPrazo, situacao);
  const risco = calcularRisco(observacao, statusInterno, situacao);
  const iso = formatDateToISO(proximoPrazo);
  const diasFaltando = calcularDiasFaltando(iso);

  return {
    id: linha.protocolo || linha.PROTOCOLO || `AUTO-${Math.random().toString(36).substring(2, 9)}`,
    cliente: (linha.CLIENTE || linha.cliente || 'DESCONHECIDO').toUpperCase(),
    protocolo: linha.PROTOCOLO || linha.protocolo || 'S/N',
    telefone: linha.TELEFONE || linha.telefone || '',
    advogado: linha.ADVOGADO || linha.advogado || 'NÃO ATRIBUÍDO',
    escritorio: linha.ESCRITÓRIO || linha.escritorio || '',
    situacao,
    statusInterno,
    observacao,
    proximoPrazo,
    ultimoRetorno: linha.RETORNO || linha.ultimoRetorno || '',
    status,
    risco,
    diasFaltando,
    tribunal: 'Outros',
    linkConsulta: '',
    produtos: linha.PRODUTOS || linha.produtos || '',
  };
}
