
/**
 * Lógica jurídica pura — status, risco, tribunal CNJ
 * W1 Capital / LexisPredict
 */

export type CaseStatus =
  | "Vencido"
  | "É Hoje"
  | "Atenção"
  | "Próximo"
  | "No Prazo"
  | "Sem Prazo"
  | "Encerrado"
  | "Arquivado";

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
  statusManual?: string;
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

export function formatDateToISO(
  dateStr: string | null | undefined
): string | null {
  if (!dateStr || String(dateStr).trim() === "") return null;
  const raw = String(dateStr).trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }

  const parts = raw.split(/[\/\-]/);
  if (parts.length !== 3) return null;

  let day = parts[0];
  let month = parts[1];
  let year = parts[2];

  if (year.length === 2) year = `20${year}`;
  if (day.length === 4) {
    // YYYY-MM-DD already split wrong — swap
    year = parts[0];
    month = parts[1];
    day = parts[2];
  }

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function calcularDiasFaltando(
  proximoISO: string | null
): number | null {
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

export function calcularStatus(
  proximoRetorno: string | null | undefined,
  situacao: string | null | undefined
): CaseStatus {
  const sit = (situacao || "").toUpperCase();
  if (
    sit.includes("ENCERRADO") ||
    sit.includes("ARQUIVADO") ||
    sit.includes("EXTINTO")
  ) {
    return "Arquivado";
  }

  if (!proximoRetorno) return "Sem Prazo";

  const iso = formatDateToISO(proximoRetorno);
  const dias = calcularDiasFaltando(iso);

  if (dias === null) return "Sem Prazo";
  if (dias < 0) return "Vencido";
  if (dias === 0) return "É Hoje";
  if (dias <= 3) return "Atenção";
  if (dias <= 7) return "Próximo";
  return "No Prazo";
}

export function calcularRisco(
  observacoes: string | null | undefined,
  statusInterno: string | null | undefined,
  situacao: string | null | undefined
): RiskLevel {
  const texto =
    `${observacoes || ""} ${statusInterno || ""} ${situacao || ""}`.toUpperCase();

  const criticas = [
    "INDEFERIDA",
    "EXTINTO",
    "IMPROCEDENTE",
    "CLIENTE NÃO RESPONDE",
    "NÃO PAGOU AS CUSTAS",
    "CARTA DE DESISTÊNCIA",
    "SUMI",
    "BLOQUEOU",
    "SUCUMBÊNCIA",
    "BAIXA DEFINITIVAMENTE",
  ];
  const atencao = [
    "CONCLUSO",
    "AGUARDANDO",
    "DOCUMENTAÇÃO",
    "CUSTAS",
    "DILAÇÃO",
    "REDISTRIBUIÇÃO",
    "SUBSTABELECIMENTO",
    "JG INDEFERIDA",
  ];

  if (criticas.some((p) => texto.includes(p))) return "Crítico";
  if (atencao.some((p) => texto.includes(p))) return "Atenção";
  return "Normal";
}

/**
 * CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO
 * dígitos: 7 + 2 + 4 + 1 + 2 + 4 = 20
 * índice 13 = J, 14-15 = TR
 */
export function extrairTribunal(protocolo: string): {
  tribunal: string;
  link: string;
} {
  const original = (protocolo || "").trim();
  const clean = original.replace(/\D/g, "");

  if (clean.length !== 20) {
    return {
      tribunal: "Outros",
      link: `https://www.google.com/search?q=consulta+processo+judicial+${encodeURIComponent(original || "")}`,
    };
  }

  const j = clean[13];
  const tr = clean.substring(14, 16);
  const code = `${j}.${tr}`;

  const maps: Record<string, { tribunal: string; link: string }> = {
    "8.01": { tribunal: "TJAC", link: "https://esaj.tjac.jus.br/cpopg/open.do" },
    "8.02": { tribunal: "TJAL", link: "https://www2.tjal.jus.br/cpopg/open.do" },
    "8.03": { tribunal: "TJAM", link: "https://consultas.tjam.jus.br/cpopg/" },
    "8.04": {
      tribunal: "TJAP",
      link: "https://tucujuris.tjap.jus.br/tucujuris/",
    },
    "8.05": {
      tribunal: "TJBA",
      link: "https://pje.tjba.jus.br/pje/ConsultaPublica/listView.seam",
    },
    "8.06": { tribunal: "TJCE", link: "https://esaj.tjce.jus.br/cpopg/open.do" },
    "8.07": {
      tribunal: "TJDFT",
      link: "https://pje.tjdft.jus.br/pje/ConsultaPublica/listView.seam",
    },
    "8.08": {
      tribunal: "TJES",
      link: "https://pje.tjes.jus.br/pje/ConsultaPublica/listView.seam",
    },
    "8.09": {
      tribunal: "TJGO",
      link: "https://projudi.tjgo.jus.br/BuscaProcessoPublica",
    },
    "8.10": {
      tribunal: "TJMA",
      link: "https://pje.tjma.jus.br/pje/ConsultaPublica/listView.seam",
    },
    "8.11": {
      tribunal: "TJMT",
      link: "https://pje.tjmt.jus.br/pje/ConsultaPublica/listView.seam",
    },
    "8.12": { tribunal: "TJMS", link: "https://esaj.tjms.jus.br/cpopg/open.do" },
    "8.13": {
      tribunal: "TJMG",
      link: "https://pje.tjmg.jus.br/pje/ConsultaPublica/listView.seam",
    },
    "8.14": {
      tribunal: "TJPA",
      link: "https://pje.tjpa.jus.br/pje/ConsultaPublica/listView.seam",
    },
    "8.15": {
      tribunal: "TJPB",
      link: "https://pje.tjpb.jus.br/pje/ConsultaPublica/listView.seam",
    },
    "8.16": { tribunal: "TJPR", link: "https://projudi.tjpr.jus.br/projudi/" },
    "8.17": {
      tribunal: "TJPE",
      link: "https://pje.tjpe.jus.br/1g/ConsultaPublica/listView.seam",
    },
    "8.18": {
      tribunal: "TJPI",
      link: "https://pje.tjpi.jus.br/1g/ConsultaPublica/listView.seam",
    },
    "8.19": {
      tribunal: "TJRJ",
      link: "http://www4.tjrj.jus.br/consultaProcessoPortal/consulta-principal.do",
    },
    "8.20": {
      tribunal: "TJRN",
      link: "https://pje.tjrn.jus.br/pje/ConsultaPublica/listView.seam",
    },
    "8.21": {
      tribunal: "TJRS",
      link: "https://www.tjrs.jus.br/novo/processos-e-servicos/consulta-processual/",
    },
    "8.22": {
      tribunal: "TJRO",
      link: "https://pje.tjro.jus.br/pje/ConsultaPublica/listView.seam",
    },
    "8.23": { tribunal: "TJRR", link: "https://projudi.tjrr.jus.br/projudi/" },
    "8.24": {
      tribunal: "TJSC",
      link: "https://eproc1g.tjsc.jus.br/eproc/externo_controlador.php?acao=consulta_publica",
    },
    "8.25": {
      tribunal: "TJSE",
      link: "https://www.tjse.jus.br/portal/processos/consultas-publicas",
    },
    "8.26": {
      tribunal: "TJSP",
      link: "https://esaj.tjsp.jus.br/cpopg/open.do",
    },
    "8.27": {
      tribunal: "TJTO",
      link: "https://eproc.tjto.jus.br/eprocV2_prod/externo_controlador.php?acao=consulta_publica",
    },
    "4.01": {
      tribunal: "TRF1",
      link: "https://pje1g.trf1.jus.br/pje/ConsultaPublica/listView.seam",
    },
    "4.02": {
      tribunal: "TRF2",
      link: "https://eproc.trf2.jus.br/eproc/externo_controlador.php?acao=consulta_publica",
    },
    "4.03": {
      tribunal: "TRF3",
      link: "https://pje1g.trf3.jus.br/pje/ConsultaPublica/listView.seam",
    },
    "4.04": {
      tribunal: "TRF4",
      link: "https://eproc.trf4.jus.br/eproc2g/externo_controlador.php?acao=consulta_publica",
    },
    "4.05": {
      tribunal: "TRF5",
      link: "https://pje.trf5.jus.br/pje/ConsultaPublica/listView.seam",
    },
    "4.06": {
      tribunal: "TRF6",
      link: "https://pje1g.trf6.jus.br/pje/ConsultaPublica/listView.seam",
    },
  };

  const found = maps[code];
  if (found) {
    return {
      tribunal: found.tribunal,
      link: found.link,
    };
  }

  return {
    tribunal: "Outros",
    link: `https://www.google.com/search?q=consulta+processo+judicial+${encodeURIComponent(original)}`,
  };
}

/**
 * Normaliza linha de CSV / formulário → LegalCase
 */
export function processarCaso(linha: Record<string, any>): LegalCase {
  const proximoPrazo =
    linha["PRÓXIMO PRAZO"] ||
    linha["PRÓXIMO RETORNO"] ||
    linha.proximoPrazo ||
    linha.proximo_retorno ||
    linha["PRAZO"] ||
    "";

  const situacao =
    linha.SITUAÇÃO ||
    linha.situacao ||
    linha["STATUS"] ||
    linha.status ||
    "EM ANDAMENTO";

  const observacao =
    linha.OBSERVAÇÃO ||
    linha.OBSERVAÇÕES ||
    linha.observacao ||
    linha.observacoes ||
    linha["NOTAS"] ||
    "";

  const statusInterno =
    linha.STATUS || linha.statusInterno || linha.status_interno || "";

  const protocolo = (
    linha.PROTOCOLO ||
    linha.protocolo ||
    linha["PROCESSO"] ||
    linha["Nº PROCESSO"] ||
    linha["NUMERO"] ||
    linha["NÚMERO"] ||
    "S/N"
  )
    .toString()
    .trim();

  const status = calcularStatus(String(proximoPrazo), String(situacao));
  const risco = calcularRisco(
    String(observacao),
    String(statusInterno),
    String(situacao)
  );
  const iso = formatDateToISO(String(proximoPrazo));
  const diasFaltando = calcularDiasFaltando(iso);

  // Tribunal já informado na planilha tem prioridade; senão detecta pelo CNJ
  const tribunalInformado = (
    linha.TRIBUNAL ||
    linha.tribunal ||
    ""
  )
    .toString()
    .trim();

  const detected = extrairTribunal(protocolo);
  const tribunal =
    tribunalInformado && tribunalInformado.toUpperCase() !== "OUTROS"
      ? tribunalInformado.toUpperCase()
      : detected.tribunal;

  const linkConsulta =
    linha.linkConsulta ||
    linha.LINK ||
    detected.link;

  return {
    id: protocolo !== "S/N" ? protocolo : `tmp-${Date.now()}`,
    cliente: (
      linha.CLIENTE ||
      linha.cliente ||
      "DESCONHECIDO"
    )
      .toString()
      .toUpperCase(),
    protocolo,
    telefone: (linha.TELEFONE || linha.telefone || "").toString(),
    advogado: (
      linha.ADVOGADO ||
      linha["ADVOGADO RESPONSÁVEL"] ||
      linha.advogado ||
      linha["RESPONSÁVEL"] ||
      "NÃO ATRIBUÍDO"
    ).toString(),
    escritorio: (
      linha.ESCRITÓRIO ||
      linha.escritorio ||
      linha.ESCRITORIO ||
      ""
    ).toString(),
    situacao: String(situacao),
    statusInterno: String(statusInterno),
    observacao: String(observacao),
    proximoPrazo: String(proximoPrazo || ""),
    ultimoRetorno: (
      linha.RETORNO ||
      linha["ÚLTIMO RETORNO"] ||
      linha.ultimoRetorno ||
      linha.ultimo_retorno ||
      ""
    ).toString(),
    status,
    risco,
    diasFaltando,
    tribunal,
    linkConsulta,
    produtos: (linha.PRODUTOS || linha.produtos || "").toString() || undefined,
    tipo: (linha.TIPO || linha.tipo || "NOVO").toString(),
    atendente: (linha.ATENDENTE || linha.assistente || linha.ASSISTENTE || "").toString(),
  };
}

/**
 * Agrupa casos por tribunal (dashboard / analytics)
 */
export function distribuirPorTribunal(
  cases: LegalCase[]
): { tribunal: string; total: number }[] {
  const map = new Map<string, number>();

  for (const c of cases || []) {
    let t = (c.tribunal || "").trim();
    if (!t || t === "undefined" || t === "null") {
      t = extrairTribunal(c.protocolo || c.id || "").tribunal;
    }
    if (!t) t = "Outros";
    map.set(t, (map.get(t) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([tribunal, total]) => ({ tribunal, total }))
    .sort((a, b) => b.total - a.total);
}
