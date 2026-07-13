
/**
 * MOTOR DE LÓGICA JURÍDICA PURA (v1200.0 ELITE)
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

/**
 * Detecta o tribunal e gera link de consulta a partir do CNJ
 */
export function extrairTribunal(protocolo: string): { tribunal: string; link: string } {
  const clean = (protocolo || "").replace(/\D/g, "");
  if (clean.length !== 20) {
    return { tribunal: "Outros", link: `https://www.google.com/search?q=consulta+processo+${protocolo}` };
  }

  const j = clean[13];
  const tr = clean.substring(14, 16);
  const code = `${j}.${tr}`;

  const maps: Record<string, { nome: string; link: string }> = {
    "8.01": { nome: "TJAC", link: "https://esaj.tjac.jus.br/cpopg/open.do" },
    "8.02": { nome: "TJAL", link: "https://www2.tjal.jus.br/cpopg/open.do" },
    "8.03": { nome: "TJAM", link: "https://consultas.tjam.jus.br/cpopg/" },
    "8.04": { nome: "TJAP", link: "https://tucujuris.tjap.jus.br/tucujuris/" },
    "8.05": { nome: "TJBA", link: "https://pje.tjba.jus.br/pje/ConsultaPublica/listView.seam" },
    "8.06": { nome: "TJCE", link: "https://esaj.tjce.jus.br/cpopg/open.do" },
    "8.07": { nome: "TJDFT", link: "https://pje.tjdft.jus.br/pje/ConsultaPublica/listView.seam" },
    "8.08": { nome: "TJES", link: "https://pje.tjes.jus.br/pje/ConsultaPublica/listView.seam" },
    "8.09": { nome: "TJGO", link: "https://projudi.tjgo.jus.br/BuscaProcessoPublica" },
    "8.10": { nome: "TJMA", link: "https://pje.tjma.jus.br/pje/ConsultaPublica/listView.seam" },
    "8.11": { nome: "TJMT", link: "https://pje.tjmt.jus.br/pje/ConsultaPublica/listView.seam" },
    "8.12": { nome: "TJMS", link: "https://esaj.tjms.jus.br/cpopg/open.do" },
    "8.13": { nome: "TJMG", link: "https://pje.tjmg.jus.br/pje/ConsultaPublica/listView.seam" },
    "8.14": { nome: "TJPA", link: "https://pje.tjpa.jus.br/pje/ConsultaPublica/listView.seam" },
    "8.15": { nome: "TJPB", link: "https://pje.tjpb.jus.br/pje/ConsultaPublica/listView.seam" },
    "8.16": { nome: "TJPR", link: "https://projudi.tjpr.jus.br/projudi/" },
    "8.17": { nome: "TJPE", link: "https://pje.tjpe.jus.br/1g/ConsultaPublica/listView.seam" },
    "8.18": { nome: "TJPI", link: "https://pje.tjpi.jus.br/1g/ConsultaPublica/listView.seam" },
    "8.19": { nome: "TJRJ", link: "http://www4.tjrj.jus.br/consultaProcessoPortal/consulta-principal.do" },
    "8.20": { nome: "TJRN", link: "https://pje.tjrn.jus.br/pje/ConsultaPublica/listView.seam" },
    "8.21": { nome: "TJRS", link: "https://www.tjrs.jus.br/novo/processos-e-servicos/consulta-processual/" },
    "8.22": { nome: "TJRO", link: "https://pje.tjro.jus.br/pje/ConsultaPublica/listView.seam" },
    "8.23": { nome: "TJRR", link: "https://projudi.tjrr.jus.br/projudi/" },
    "8.24": { nome: "TJSC", link: "https://eproc1g.tjsc.jus.br/eproc/externo_controlador.php?acao=consulta_publica" },
    "8.25": { nome: "TJSE", link: "https://www.tjse.jus.br/portal/processos/consultas-publicas" },
    "8.26": { nome: "TJSP", link: "https://esaj.tjsp.jus.br/cpopg/open.do" },
    "8.27": { nome: "TJTO", link: "https://eproc.tjto.jus.br/eprocV2_prod/externo_controlador.php?acao=consulta_publica" },
    "4.01": { nome: "TRF1", link: "https://pje1g.trf1.jus.br/pje/ConsultaPublica/listView.seam" },
    "4.02": { nome: "TRF2", link: "https://eproc.trf2.jus.br/eproc/externo_controlador.php?acao=consulta_publica" },
    "4.03": { nome: "TRF3", link: "https://pje1g.trf3.jus.br/pje/ConsultaPublica/listView.seam" },
    "4.04": { nome: "TRF4", link: "https://eproc.trf4.jus.br/eproc2g/externo_controlador.php?acao=consulta_publica" },
    "4.05": { nome: "TRF5", link: "https://pje.trf5.jus.br/pje/ConsultaPublica/listView.seam" },
    "4.06": { nome: "TRF6", link: "https://pje1g.trf6.jus.br/pje/ConsultaPublica/listView.seam" }
  };

  return maps[code] || { nome: "Outros", link: `https://www.google.com/search?q=consulta+processo+${protocolo}` };
}

export function processarCaso(linha: any): LegalCase {
  const proximoPrazo = linha['PRÓXIMO PRAZO'] || linha.proximoPrazo || linha['PRAZO'] || '';
  const situacao = linha.SITUAÇÃO || linha.situacao || linha['STATUS'] || 'EM ANDAMENTO';
  const observacao = linha.OBSERVAÇÃO || linha.observacao || linha['NOTAS'] || '';
  const statusInterno = linha.STATUS || linha.statusInterno || '';
  const protocolo = (linha.PROTOCOLO || linha.protocolo || linha['PROCESSO'] || linha['NUMERO'] || 'S/N').toString().trim();
  
  const status = calcularStatus(proximoPrazo, situacao);
  const risco = calcularRisco(observacao, statusInterno, situacao);
  const iso = formatDateToISO(proximoPrazo);
  const diasFaltando = calcularDiasFaltando(iso);
  const { tribunal, link } = extrairTribunal(protocolo);

  return {
    id: protocolo !== 'S/N' ? protocolo : `AUTO-${Math.random().toString(36).substring(2, 9)}`,
    cliente: (linha.CLIENTE || linha.cliente || 'DESCONHECIDO').toUpperCase(),
    protocolo,
    telefone: linha.TELEFONE || linha.telefone || '',
    advogado: linha.ADVOGADO || linha.advogado || linha['RESPONSÁVEL'] || 'NÃO ATRIBUÍDO',
    escritorio: linha.ESCRITÓRIO || linha.escritorio || '',
    situacao,
    statusInterno,
    observacao,
    proximoPrazo,
    ultimoRetorno: linha.RETORNO || linha.ultimoRetorno || '',
    status,
    risco,
    diasFaltando,
    tribunal,
    linkConsulta: link,
    produtos: linha.PRODUTOS || linha.produtos || '',
  };
}
