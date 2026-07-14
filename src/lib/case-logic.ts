
/**
 * LÓGICA JURÍDICA PURA — STATUS, RISCO, TRIBUNAL CNJ
 * W1 Capital / LexisPredict v195.0
 */

export type CaseStatus =
  | "Vencido"
  | "É Hoje"
  | "Atenção"
  | "No Prazo"
  | "Sem Prazo"
  | "Encerrado"
  | "Arquivado"
  | "Caso Crítico";

export type RiskLevel = "Crítico" | "Atenção" | "Normal";

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
  statusManual: string;
  tribunal: string;
  linkConsulta: string;
  produtos?: string;
  statusInterno?: string;
  ultimaMovimentacao?: string;
  dataDistribuicao?: string;
  tipo?: string;
  atendente?: string;
  parecerIA?: string;
  riscoIA?: string;
}

export type CaseNote = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  color: string;
  updatedAt: string;
};

/**
 * Corrige erros de encoding comuns (UTF-8 interpretado como ISO-8859-1)
 */
export function fixEncoding(text: string): string {
  if (!text) return "";
  try {
    return text
      .replace(/Ã‡/g, 'Ç')
      .replace(/Ãƒ/g, 'Ã')
      .replace(/Ã/g, 'Á')
      .replace(/Ã‰/g, 'É')
      .replace(/Ã/g, 'Í')
      .replace(/Ã“/g, 'Ó')
      .replace(/Ãš/g, 'Ú')
      .replace(/Ã‚/g, 'Â')
      .replace(/ÃŠ/g, 'Ê')
      .replace(/Ã”/g, 'Ô')
      .replace(/Ã•/g, 'Õ')
      .replace(/Ã€/g, 'À')
      .replace(/Ã/g, 'Ç')
      .replace(/Ã§/g, 'ç')
      .replace(/Ã£/g, 'ã')
      .replace(/Ã¡/g, 'á')
      .replace(/Ã©/g, 'é')
      .replace(/Ã­/g, 'í')
      .replace(/Ã³/g, 'ó')
      .replace(/Ãº/g, 'ú')
      .replace(/Ã¢/g, 'â')
      .replace(/Ãª/g, 'ê')
      .replace(/Ã´/g, 'ô')
      .replace(/Ãµ/g, 'õ')
      .replace(/Ã /g, 'à')
      .replace(/Âº/g, 'º')
      .replace(/Âª/g, 'ª')
      .replace(/Â/g, ''); 
  } catch (e) {
    return text;
  }
}

/**
 * Validador Estrito de Datas para Postgres
 */
export function formatDateToISO(dateStr: string | null | undefined): string | null {
  if (!dateStr || String(dateStr).trim() === "" || dateStr === "-") return null;
  const raw = String(dateStr).trim();

  // Se já for ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  // Parser para DD/MM/AAAA ou AAAA/MM/DD
  const parts = raw.split(/[\/\-]/);
  if (parts.length !== 3) return null;
  
  // Verifica se são números
  if (parts.some(p => isNaN(Number(p.trim())))) return null;

  let day, month, year;
  if (parts[0].length === 4) {
    [year, month, day] = parts;
  } else {
    [day, month, year] = parts;
    if (year.length === 2) year = `20${year}`;
  }

  if (Number(month) > 12 || Number(day) > 31) return null;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function calcularDiasFaltando(proximoISO: string | null): number | null {
  if (!proximoISO) return null;
  try {
    const dataProximo = new Date(proximoISO + "T12:00:00");
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
  const sit = (situacao || "").toUpperCase();
  
  if (sit.includes("ENCERRADO") || sit.includes("ARQUIVADO") || sit.includes("EXTINTO")) {
    return "Sem Prazo";
  }

  const iso = formatDateToISO(proximoRetorno);
  if (!iso) return "Sem Prazo";

  const dias = calcularDiasFaltando(iso);
  if (dias === null) return "Sem Prazo";
  if (dias < 0) return "Vencido";
  if (dias === 0) return "É Hoje";
  if (dias <= 3) return "Atenção";
  // "Próximo" consolidado em "No Prazo"
  return "No Prazo";
}

export function calcularRisco(observacoes: string | null | undefined, statusInterno: string | null | undefined, situacao: string | null | undefined): RiskLevel {
  const texto = `${observacoes || ""} ${statusInterno || ""} ${situacao || ""}`.toUpperCase();
  const criticas = ["INDEFERIDA", "EXTINTO", "IMPROCEDENTE", "NÃO RESPONDE", "NÃO PAGOU", "DESISTÊNCIA", "SUMI", "BLOQUEOU", "SUCUMBÊNCIA", "BAIXA DEFINITIVAMENTE"];
  const atencao = ["CONCLUSO", "AGUARDANDO", "DOCUMENTAÇÃO", "CUSTAS", "DILAÇÃO", "REDISTRIBUIÇÃO", "SUBSTABELECIMENTO", "JG INDEFERIDA"];

  if (criticas.some((p) => texto.includes(p))) return "Crítico";
  if (atencao.some((p) => texto.includes(p))) return "Atenção";
  return "Normal";
}

export function extrairTribunal(protocolo: string): { tribunal: string; link: string; } {
  const original = (protocolo || "").trim();
  const clean = original.replace(/\D/g, "");

  if (clean.length !== 20) {
    return {
      tribunal: "Outros",
      link: `https://www.google.com/search?q=consulta+processo+judicial+${encodeURIComponent(original)}`,
    };
  }

  const j = clean[13];
  const tr = clean.substring(14, 16);
  const code = `${j}.${tr}`;

  const maps: Record<string, { tribunal: string; link: string }> = {
    "8.01": { tribunal: "TJAC", link: "https://esaj.tjac.jus.br/cpopg/open.do" },
    "8.02": { tribunal: "TJAL", link: "https://www2.tjal.jus.br/cpopg/open.do" },
    "8.03": { tribunal: "TJAM", link: "https://consultas.tjam.jus.br/cpopg/" },
    "8.04": { tribunal: "TJAP", link: "https://tucujuris.tjap.jus.br/tucujuris/" },
    "8.05": { tribunal: "TJBA", link: "https://pje.tjba.jus.br/pje/ConsultaPublica/listView.seam" },
    "8.06": { tribunal: "TJCE", link: "https://esaj.tjce.jus.br/cpopg/open.do" },
    "8.07": { tribunal: "TJDFT", link: "https://pje.tjdft.jus.br/pje/ConsultaPublica/listView.seam" },
    "8.08": { tribunal: "TJES", link: "https://pje.tjes.jus.br/pje/ConsultaPublica/listView.seam" },
    "8.09": { tribunal: "TJGO", link: "https://projudi.tjgo.jus.br/BuscaProcessoPublica" },
    "8.10": { tribunal: "TJMA", link: "https://pje.tjma.jus.br/pje/ConsultaPublica/listView.seam" },
    "8.11": { tribunal: "TJMT", link: "https://pje.tjmt.jus.br/pje/ConsultaPublica/listView.seam" },
    "8.12": { tribunal: "TJMS", link: "https://esaj.tjms.jus.br/cpopg/open.do" },
    "8.13": { tribunal: "TJMG", link: "https://pje.tjmg.jus.br/pje/ConsultaPublica/listView.seam" },
    "8.14": { tribunal: "TJPA", link: "https://pje.tjpa.jus.br/pje/ConsultaPublica/listView.seam" },
    "8.15": { tribunal: "TJPB", link: "https://pje.tjpb.jus.br/pje/ConsultaPublica/listView.seam" },
    "8.16": { tribunal: "TJPR", link: "https://projudi.tjpr.jus.br/projudi/" },
    "8.17": { tribunal: "TJPE", link: "https://pje.tjpe.jus.br/1g/ConsultaPublica/listView.seam" },
    "8.18": { tribunal: "TJPI", link: "https://pje.tjpi.jus.br/1g/ConsultaPublica/listView.seam" },
    "8.19": { tribunal: "TJRJ", link: "http://www4.tjrj.jus.br/consultaProcessoPortal/consulta-principal.do" },
    "8.20": { tribunal: "TJRN", link: "https://pje.tjrn.jus.br/pje/ConsultaPublica/listView.seam" },
    "8.21": { tribunal: "TJRS", link: "https://www.tjrs.jus.br/novo/processos-e-servicos/consulta-processual/" },
    "8.22": { tribunal: "TJRO", link: "https://pje.tjro.jus.br/pje/ConsultaPublica/listView.seam" },
    "8.23": { tribunal: "TJRR", link: "https://projudi.tjrr.jus.br/projudi/" },
    "8.24": { tribunal: "TJSC", link: "https://eproc1g.tjsc.jus.br/eproc/externo_controlador.php?acao=consulta_publica" },
    "8.25": { tribunal: "TJSE", link: "https://www.tjse.jus.br/portal/processos/consultas-publicas" },
    "8.26": { tribunal: "TJSP", link: "https://esaj.tjsp.jus.br/cpopg/open.do" },
    "8.27": { tribunal: "TJTO", link: "https://eproc.tjto.jus.br/eprocV2_prod/externo_controlador.php?acao=consulta_publica" },
    "4.01": { tribunal: "TRF1", link: "https://pje1g.trf1.jus.br/pje/ConsultaPublica/listView.seam" },
    "4.02": { tribunal: "TRF2", link: "https://eproc.trf2.jus.br/eproc/externo_controlador.php?acao=consulta_publica" },
    "4.03": { tribunal: "TRF3", link: "https://pje1g.trf3.jus.br/pje/ConsultaPublica/listView.seam" },
    "4.04": { tribunal: "TRF4", link: "https://eproc.trf4.jus.br/eproc2g/externo_controlador.php?acao=consulta_publica" },
    "4.05": { tribunal: "TRF5", link: "https://pje.trf5.jus.br/pje/ConsultaPublica/listView.seam" },
    "4.06": { tribunal: "TRF6", link: "https://pje1g.trf6.jus.br/pje/ConsultaPublica/listView.seam" }
  };

  const found = maps[code];
  if (found) return { tribunal: found.tribunal, link: found.link };

  return {
    tribunal: "Outros",
    link: `https://www.google.com/search?q=consulta+processo+judicial+${encodeURIComponent(original)}`,
  };
}

function getValue(obj: Record<string, any>, ...keys: string[]): string {
  const map = Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [fixEncoding(k).trim().toUpperCase(), v])
  );

  for (const key of keys) {
    const value = map[key.toUpperCase()];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return fixEncoding(String(value).trim());
    }
  }
  return "";
}

export function processarCaso(linha: Record<string, any>): LegalCase {
  const proximoPrazo = getValue(linha, "PRÓXIMO PRAZO", "PROXIMO PRAZO", "PRÓXIMO RETORNO", "PROXIMO RETORNO", "PRAZO", "VENCIMENTO");
  const situacao = getValue(linha, "SITUACAO", "SITUAÇÃO", "STATUS").toUpperCase() || "EM ANDAMENTO";
  const observacao = getValue(linha, "OBSERVACAO", "OBSERVAÇÃO", "OBSERVAÇÕES", "OBSERVAÃ‡Ã•ES", "NOTAS", "DADOS");
  const statusInterno = getValue(linha, "STATUS", "STATUS_INTERNO", "STATUS INTERNO");
  const protocolo = getValue(linha, "PROTOCOLO", "PROCESSO", "Nº PROCESSO", "NUMERO", "NÚMERO").trim() || "S/N";
  const cliente = getValue(linha, "CLIENTE", "NOME").toUpperCase() || "DESCONHECIDO";

  // Lógica de Status: Calculado vs Estratégico (Manual)
  let status = calcularStatus(proximoPrazo, situacao);
  const statusManual = getValue(linha, "STATUS_MANUAL", "STATUS MANUAL");
  
  if (statusManual && statusManual !== "Automatico") {
     status = statusManual as CaseStatus;
  }

  const risco = calcularRisco(observacao, statusInterno, situacao);
  const tribunalInformado = getValue(linha, "TRIBUNAL");
  const detected = extrairTribunal(protocolo);
  
  const tribunal = tribunalInformado && tribunalInformado.toUpperCase() !== "OUTROS"
      ? tribunalInformado.toUpperCase()
      : detected.tribunal;

  const stableId = protocolo !== "S/N" 
    ? protocolo.replace(/\D/g, "") 
    : `tmp-${cliente.replace(/\W/g, "")}-${(proximoPrazo || "").replace(/\D/g, "")}`;

  return {
    id: stableId,
    cliente,
    protocolo,
    telefone: getValue(linha, "TELEFONE", "CELULAR", "WHATSAPP"),
    advogado: getValue(linha, "ADVOGADO", "ADVOGADO RESPONSÁVEL", "ADVOGADO RESPONSÃVEL", "RESPONSÁVEL") || "NÃO ATRIBUÍDO",
    escritorio: getValue(linha, "ESCRITORIO", "ESCRITÓRIO", "ESCRITÃ“RIO", "UNIDADE"),
    situacao,
    statusInterno,
    observacao,
    proximoPrazo,
    ultimoRetorno: getValue(linha, "RETORNO", "ÚLTIMO RETORNO", "ULTIMO RETORNO"),
    status,
    risco,
    diasFaltando: calcularDiasFaltando(formatDateToISO(proximoPrazo)),
    tribunal,
    linkConsulta: linha.linkConsulta || linha.LINK || detected.link,
    statusManual: statusManual || "Automatico",
    tipo: getValue(linha, "TIPO", "TIPO_CASO") || "NOVO",
    atendente: getValue(linha, "ATENDENTE", "ASSISTENTE", "ASSISTENTE")
  };
}

export function distribuirPorTribunal(cases: LegalCase[]): { tribunal: string; total: number }[] {
  const map = new Map<string, number>();
  for (const c of cases || []) {
    let t = (c.tribunal || "Outros").trim();
    map.set(t, (map.get(t) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([tribunal, total]) => ({ tribunal, total }))
    .sort((a, b) => b.total - a.total);
}
