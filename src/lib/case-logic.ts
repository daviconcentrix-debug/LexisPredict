export type LegalCase = {
  id: string;
  cliente: string;
  protocolo: string;
  advogado: string;
  situacao: string;
  proximoPrazo: string;
  tribunal: string;
  status: 'Vencido' | 'Atenção' | 'No Prazo' | 'Arquivado' | 'Sem Prazo' | 'É Hoje' | 'Caso Crítico' | 'Encerrado';
  diasFaltando: number | null;
  linkConsulta: string;
  tipo?: string;
  telefone?: string;
  atendente?: string;
  scoreIA?: number;
  riscoIA?: string;
  parecerIA?: string;
  origemPlanilha?: string;
  ultimoRetorno?: string;
  observacao?: string;
  statusManual?: 'Caso Crítico' | 'Atenção' | 'Encerrado' | 'Arquivado' | 'Automatico';
};

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
  "8.27": { tribunal: "TJTO", url: "https://eproc.tjto.jus.br/eprocV2_prod/externo_controlador.php?acao=consulta_publica" },
  "4.01": { tribunal: "TRF1", url: "https://pje1g.trf1.jus.br/consultapublica/ConsultaPublica/listView.seam" },
  "4.02": { tribunal: "TRF2", url: "https://eproc.trf2.jus.br/eproc.php?acao=consulta_publica" },
  "4.03": { tribunal: "TRF3", url: "https://pje1g.trf3.jus.br/pje/ConsultaPublica/listView.seam" },
  "4.04": { tribunal: "TRF4", url: "https://eproc.trf2trf4/externo_controlador.php?acao=consulta_publica" },
  "4.05": { tribunal: "TRF5", url: "https://pje.trf5.jus.br/pje/ConsultaPublica/listView.seam" },
  "4.06": { tribunal: "TRF6", url: "https://pje1g.trf6.jus.br/pje/ConsultaPublica/listView.seam" }
};

export function processarCaso(linha: Record<string, string>): LegalCase {
  const situacao = (linha.SITUACAO || linha.SITUAÇÃO || '').toUpperCase();
  let status: LegalCase['status'] = 'Sem Prazo';
  let diasFaltando: number | null = null;
  const dataPrazoOriginal = linha['PRÓXIMO PRAZO'] || linha['PRAZO'] || linha.RETORNO || '';

  if (dataPrazoOriginal) {
    const parts = dataPrazoOriginal.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const dataPrazo = new Date(year, month, day);
      
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      dataPrazo.setHours(0, 0, 0, 0);

      const diffTime = dataPrazo.getTime() - hoje.getTime();
      diasFaltando = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diasFaltando < 0) {
        status = 'Vencido';
      } else if (diasFaltando === 0) {
        status = 'É Hoje';
      } else if (diasFaltando <= 7) {
        status = 'Atenção';
      } else {
        status = 'No Prazo';
      }
    }
  }

  if (['ENCERRADO', 'SUSPENSO', 'ARQUIVADO'].some(s => situacao.includes(s))) {
    status = 'Arquivado';
  } 

  // Prioridade de Status Manual se existir e não for Automático
  const statusManual = linha.STATUS_MANUAL;
  if (statusManual && statusManual !== 'Automatico' && statusManual !== '') {
    status = statusManual as any;
  }

  let tribunal = 'Outros';
  let url = 'https://www.google.com/search?q=consulta+processo+judicial';
  const cnjLimpo = (linha.PROTOCOLO || linha.PROCESSO || '').replace(/[^0-9.-]/g, '');
  const cnjRegex = /\d{7}-\d{2}\.\d{4}\.(\d\.\d{2})\.\d{4}/;
  const match = cnjLimpo.match(cnjRegex);

  if (match && TRIBUNAIS_CNJ[match[1]]) {
    tribunal = TRIBUNAIS_CNJ[match[1]].tribunal;
    url = TRIBUNAIS_CNJ[match[1]].url;
  } else if (linha.TRIBUNAL) {
    tribunal = linha.TRIBUNAL;
  }

  const finalId = cnjLimpo || linha.PROTOCOLO || `AUTO-${Math.random().toString(36).substr(2, 9)}`;

  return {
    id: finalId,
    cliente: linha.CLIENTE || linha.NOME || 'Desconhecido',
    advogado: linha['ADVOGADO RESPONSÁVEL'] || linha.ADVOGADO || linha.RESPONSÁVEL || 'Não Atribuído',
    protocolo: cnjLimpo || linha.PROTOCOLO || 'S/N',
    situacao: situacao || 'EM ANDAMENTO',
    proximoPrazo: dataPrazoOriginal,
    tribunal,
    status,
    diasFaltando,
    linkConsulta: url,
    tipo: linha.TIPO || 'NOVO',
    telefone: linha.TELEFONE || '',
    atendente: linha.ATENDENTE || '',
    scoreIA: linha.RISCO ? parseInt(linha.RISCO, 10) : undefined,
    riscoIA: linha.ALERTA || '',
    parecerIA: linha.OBSERVAÇÕES || linha.OBSERVAÇÃO || '',
    ultimoRetorno: linha.ULTIMO_RETORNO || linha['ÚLTIMO RETORNO'] || undefined,
    observacao: linha.OBSERVACAO || linha.OBSERVAÇÃO || '',
    statusManual: linha.STATUS_MANUAL as any
  };
}
