/**
 * MOTOR DE LÓGICA JURÍDICA PURA (v1800.0 ELITE)
 * Cálculos matemáticos de prazos, triagem de CNJ e normalização de status.
 * Propriedade de W1 Capital | Fundador: Davi Alves Figueredo
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
  db_id?: number | string;
  cliente: string;
  protocolo: string;
  telefone?: string;
  escritorio?: string;
  advogado: string;
  dataDistribuicao?: string;
  situacao: string;
  statusInterno?: string;
  ultimaMovimentacao?: string;
  ultimoRetorno?: string;
  proximoPrazo: string;
  observacao: string;
  produtos?: string;
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

export const TRIBUNAIS_CNJ: Record<string, { tribunal: string; url: string }> = {
  "8.01": { tribunal: "TJAC", url: "https://esaj.tjac.jus.br/cpopg/open.do" },
  "8.02": { tribunal: "TJAL", url: "https://www2.tjal.jus.br/cpopg/open.do" },
  "8.04": { tribunal: "TJAM", url: "https://consultas.tjam.jus.br/cpopg/" },
  "8.05": { tribunal: "TJBA", url: "https://consultapublicapje.tjba.jus.br/pje/ConsultaPublica/listView.seam" },
  "8.06": { tribunal: "TJCE", url: "https://esaj.tjce.jus.br/cpopg/open.do" },
  "8.07": { tribunal: "TJDFT", url: "https://pje.tjdft.jus.br/pje/ConsultaPublica/listView.seam" },
  "8.08": { tribunal: "TJES", url: "https://pje.tjes.jus.br/pje/ConsultaPublica/listView.seam" },
  "8.09": { tribunal: "TJGO", url: "https://projudi.tjgo.jus.br/BuscaProcessoPublica" },
  "8.10": { tribunal: "TJMA", url: "https://pje.tjma.jus.br/pje/ConsultaPublica/listView.seam" },
  "8.11": { tribunal: "TJMT", url: "https://pje.tjmt.jus.br/pje/ConsultaPublica/listView.seam" },
  "8.12": { tribunal: "TJMS", url: "https://esaj.tjms.jus.br/cpopg/open.do" },
  "8.13": { tribunal: "TJMG", url: "https://pje.tjmg.jus.br/pje/ConsultaPublica/listView.seam" },
  "8.14": { tribunal: "TJPA", url: "https://pje.tjpa.jus.br/pje/ConsultaPublica/listView.seam" },
  "8.15": { tribunal: "TJPB", url: "https://pje.tjpb.jus.br/pje/ConsultaPublica/listView.seam" },
  "8.16": { tribunal: "TJPR", url: "https://projudi.tjpr.jus.br/projudi/" },
  "8.17": { tribunal: "TJPE", url: "https://pje.tjpe.jus.br/1g/ConsultaPublica/listView.seam" },
  "8.18": { tribunal: "TJPI", url: "https://pje.tjpi.jus.br/1g/ConsultaPublica/listView.seam" },
  "8.19": { tribunal: "TJRJ", url: "https://www3.tjrj.jus.br/consultaprocessual/" },
  "8.20": { tribunal: "TJRN", url: "https://pje.tjrn.jus.br/pje/ConsultaPublica/listView.seam" },
  "8.21": { tribunal: "TJRS", url: "https://www.tjrs.jus.br/novo/processos-e-servicos/consulta-processual/" },
  "8.22": { tribunal: "TJRO", url: "https://pje.tjro.jus.br/pje/ConsultaPublica/listView.seam" },
  "8.23": { tribunal: "TJRR", url: "https://projudi.tjrr.jus.br/projudi/" },
  "8.24": { tribunal: "TJSC", url: "https://eproc1g.tjsc.jus.br/eproc/externo_controlador.php?acao=consulta_publica" },
  "8.25": { tribunal: "TJSE", url: "https://www.tjse.jus.br/portal/processos/consultas-processuais" },
  "8.26": { tribunal: "TJSP", url: "https://esaj.tjsp.jus.br/cpopg/open.do" },
  "8.27": { tribunal: "TJTO", url: "https://eproc.tjto.jus.br/eprocV2_prod/externo_controlador.php?acao=consulta_publica" }
};

export function parseBrazilianDate(value: string | null | undefined): Date | null {
  if (!value || value.trim() === '' || value === '#VALUE!' || value === '-') return null;
  const cleaned = value.trim().replace(/\s+/g, '');
  const match = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const year = parseInt(match[3], 10);
  const date = new Date(year, month, day);
  return isNaN(date.getTime()) ? null : date;
}

export function formatDateToISO(value: string | null | undefined): string | null {
  const date = parseBrazilianDate(value);
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calcularStatus(
  proximoRetorno: string | null | undefined,
  situacao: string | null | undefined
): CaseStatus {
  const situacaoUpper = (situacao || '').toUpperCase();
  const termosEncerrado = ['ENCERRADO', 'EXTINTO', 'BAIXA DEFINITIVAMENTE', 'IMPROCEDENTE', 'CANCELADA', 'TRANSITADO'];
  
  if (termosEncerrado.some(t => situacaoUpper.includes(t))) {
    return 'Encerrado';
  }

  const dataProximo = parseBrazilianDate(proximoRetorno);
  if (!dataProximo) return 'Sem Prazo';

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  dataProximo.setHours(0, 0, 0, 0);

  const diffTime = dataProximo.getTime() - hoje.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Vencido';
  if (diffDays === 0) return 'É Hoje';
  if (diffDays <= 3) return 'Atenção';
  if (diffDays <= 7) return 'Próximo';

  return 'No Prazo';
}

export function calcularRisco(
  observacoes?: string | null,
  statusInterno?: string | null,
  situacao?: string | null
): RiskLevel {
  const texto = `${observacoes || ''} ${statusInterno || ''} ${situacao || ''}`.toUpperCase();

  const palavrasCriticas = [
    'INDEFERIDA', 'EXTINTO', 'IMPROCEDENTE', 'CLIENTE NÃO RESPONDE',
    'NÃO PAGOU AS CUSTAS', 'CARTA DE DESISTÊNCIA', 'SUMI', 'BLOQUEOU',
    'SUCUMBÊNCIA', 'BAIXA DEFINITIVAMENTE', 'CANCELADA DISTRIBUIÇÃO',
    'CLIENTE SUMI', 'NÃO QUER ENVOLVIMENTO', 'TRANSITADO E JULGADO',
    'ARQUIVADO DEFINITIVAMENTE', 'EXTINTO POR AUSÊNCIA'
  ];

  const palavrasAtencao = [
    'CONCLUSO', 'AGUARDANDO', 'DOCUMENTAÇÃO', 'CUSTAS', 'DILAÇÃO',
    'REDISTRIBUIÇÃO', 'SUBSTABELECIMENTO', 'JG INDEFERIDA',
    'EMENDA', 'PROVAS', 'AUDIÊNCIA', 'CONTESTAÇÃO', 'RÉPLICA',
    'MANIFESTAÇÃO', 'PRAZO'
  ];

  if (palavrasCriticas.some(p => texto.includes(p))) return 'Crítico';
  if (palavrasAtencao.some(p => texto.includes(p))) return 'Atenção';

  return 'Normal';
}

export function processarCaso(linha: Record<string, string>): LegalCase {
  const situacao = (linha['SITUAÇÃO'] || linha['SITUACAO'] || '').toUpperCase();
  const proximoPrazoRaw = linha['PRÓXIMO RETORNO'] || linha['PROXIMO RETORNO'] || linha['PRÓXIMO PRAZO'] || '';
  const observacoes = linha['OBSERVAÇÕES'] || linha['OBSERVACOES'] || '';
  const statusInterno = linha['STATUS'] || '';
  
  let status = calcularStatus(proximoPrazoRaw, situacao);
  const risco = calcularRisco(observacoes, statusInterno, situacao);

  const dataProximo = parseBrazilianDate(proximoPrazoRaw);
  let diasFaltando: number | null = null;
  if (dataProximo) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataProximo.setHours(0, 0, 0, 0);
    const diffTime = dataProximo.getTime() - hoje.getTime();
    diasFaltando = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  if (risco === 'Crítico' && status !== 'Encerrado') {
    status = 'Caso Crítico';
  }

  let tribunal = 'Outros';
  let url = 'https://www.google.com/search?q=consulta+processo+judicial';
  const cnjLimpo = (linha['PROTOCOLO'] || linha['PROCESSO'] || '').replace(/[^0-9.-]/g, '');
  const cnjRegex = /\d{7}-\d{2}\.\d{4}\.(\d\.\d{2})\.\d{4}/;
  const match = cnjLimpo.match(cnjRegex);

  if (match && TRIBUNAIS_CNJ[match[1]]) {
    tribunal = TRIBUNAIS_CNJ[match[1]].tribunal;
    url = TRIBUNAIS_CNJ[match[1]].url;
  }

  return {
    id: `AUTO-${Math.random().toString(36).substr(2, 9)}`,
    cliente: (linha['CLIENTE'] || linha['NOME'] || 'DESCONHECIDO').toUpperCase(),
    advogado: (linha['ADVOGADO RESPONSÁVEL'] || linha['ADVOGADO'] || 'NÃO ATRIBUÍDO').toUpperCase(),
    protocolo: cnjLimpo || linha['PROTOCOLO'] || 'S/N',
    situacao: situacao || 'EM ANDAMENTO',
    proximoPrazo: proximoPrazoRaw,
    tribunal,
    status,
    risco,
    diasFaltando,
    linkConsulta: url,
    telefone: linha['TELEFONE'] || '',
    ultimoRetorno: linha['RETORNO'] || linha['ÚLTIMO RETORNO'] || '',
    observacao: observacoes,
    statusInterno: statusInterno,
    produtos: linha['PRODUTOS'] || '',
    escritorio: linha['ESCRITÓRIO'] || linha['ESCRITORIO'] || '',
    dataDistribuicao: linha['DISTRIB.'] || linha['DISTRIB'] || '',
    ultimaMovimentacao: linha['DATA MOVIMENTAÇÃO'] || linha['DATA MOVIMENTACAO'] || ''
  };
}
