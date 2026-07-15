/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved. See LICENSE file.
 */

/**
 * LÓGICA JURÍDICA PURA — STATUS, RISCO, TRIBUNAL CNJ
 * W1 Capital / LexisPredict v220.0 ELITE
 */

export type CaseStatus =
  | "Vencido"
  | "É Hoje"
  | "Atenção"
  | "No Prazo"
  | "Sem Prazo"
  | "Encerrado"
  | "Arquivado"
  | "Caso Crítico"
  | string; 

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

export function fixEncoding(text: string): string {
  if (!text) return "";
  try {
    return text
      .replace(/Ã‡/g, 'Ç')
      .replace(/Ã§/g, 'ç')
      .replace(/Ã£/g, 'ã')
      .replace(/Ã¡/g, 'á')
      .replace(/Ã©/g, 'é')
      .replace(/Ã­/g, 'í')
      .replace(/Ã³/g, 'ó')
      .replace(/Ãº/g, 'ú')
      .replace(/Âº/g, 'º')
      .replace(/Âª/g, 'ª')
      .replace(/Â/g, ''); 
  } catch (e) {
    return text;
  }
}

export function parseBrazilianDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const clean = dateStr.trim();
  if (clean === "" || clean === "-" || clean === "00/00/0000" || clean === "0") return null;
  
  // Suporte a ISO 2026-07-27
  if (clean.includes('-') && clean.split('-')[0].length === 4) {
     return new Date(clean);
  }

  const parts = clean.split(/[\/\-\.]/);
  if (parts.length !== 3) return null;
  
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const y = parseInt(parts[2], 10);
  
  const date = new Date(y, m, d);
  return isNaN(date.getTime()) ? null : date;
}

export function formatDateToISO(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const raw = String(dateStr).trim();
  if (raw === "" || raw === "-" || raw === "0" || raw === "00/00/0000") return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const parts = raw.split(/[\/\-\.\s,]+/).filter(p => p.length > 0);
  if (parts.length !== 3) return null;

  let day, month, year;
  if (parts[0].length === 4) {
    [year, month, day] = parts;
  } else {
    [day, month, year] = parts;
    if (year.length === 2) {
      const yNum = parseInt(year, 10);
      year = yNum > 50 ? `19${year}` : `20${year}`;
    }
  }

  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);

  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return null;
  
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function calcularDiasFaltando(proximoISO: string | null): number | null {
  if (!proximoISO) return null;
  try {
    const hoje = new Date();
    const hojeAno = hoje.getFullYear();
    const hojeMes = hoje.getMonth();
    const hojeDia = hoje.getDate();
    
    const [pAno, pMes, pDia] = proximoISO.split('-').map(Number);
    const dataPrazo = new Date(pAno, pMes - 1, pDia, 12, 0, 0);
    const dataHojeMeioDia = new Date(hojeAno, hojeMes, hojeDia, 12, 0, 0);
    
    const diffMs = dataPrazo.getTime() - dataHojeMeioDia.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

export function calcularStatus(proximoRetorno: string | null | undefined, situacao: string | null | undefined): CaseStatus {
  const sit = (situacao || "").toUpperCase();
  if (sit.includes("ENCERRADO") || sit.includes("ARQUIVADO") || sit.includes("EXTINTO") || sit.includes("SUSPENSO")) return "Arquivado";

  const iso = formatDateToISO(proximoRetorno);
  if (!iso) return "Sem Prazo";

  const dias = calcularDiasFaltando(iso);
  if (dias === null) return "Sem Prazo";
  if (dias < 0) return "Vencido";
  if (dias === 0) return "É Hoje";
  if (dias <= 3) return "Atenção";
  return "No Prazo";
}

export function calcularRisco(observacoes: string | null | undefined, statusInterno: string | null | undefined, situacao: string | null | undefined): RiskLevel {
  const texto = `${observacoes || ""} ${statusInterno || ""} ${situacao || ""}`.toUpperCase();
  const criticas = ["INDEFERIDA", "EXTINTO", "IMPROCEDENTE", "NÃO RESPONDE", "SUCUMBÊNCIA", "BAIXA DEFINITIVAMENTE"];
  const atencao = ["CONCLUSO", "AGUARDANDO", "CUSTAS", "SUBSTABELECIMENTO", "JG INDEFERIDA"];

  if (criticas.some((p) => texto.includes(p))) return "Crítico";
  if (atencao.some((p) => texto.includes(p))) return "Atenção";
  return "Normal";
}

export function extrairTribunal(protocolo: string): { tribunal: string; link: string; } {
  const original = (protocolo || "").trim();
  const clean = original.replace(/\D/g, "");

  if (clean.length !== 20) return { tribunal: "Outros", link: `https://www.google.com/search?q=consulta+processo+judicial+${encodeURIComponent(original)}` };

  const j = clean[13];
  const tr = clean.substring(14, 16);
  const code = `${j}.${tr}`;

  const maps: Record<string, { tribunal: string; link: string }> = {
    "8.26": { tribunal: "TJSP", link: "https://esaj.tjsp.jus.br/cpopg/open.do" },
    "8.13": { tribunal: "TJMG", link: "https://pje.tjmg.jus.br/pje/ConsultaPublica/listView.seam" },
    "8.19": { tribunal: "TJRJ", link: "http://www4.tjrj.jus.br/consultaProcessoPortal/consulta-principal.do" },
    "8.02": { tribunal: "TJAL", link: "https://www2.tjal.jus.br/cpopg/open.do" },
    "8.09": { tribunal: "TJGO", link: "https://projudi.tjgo.jus.br/BuscaProcessoPublica" },
    "8.16": { tribunal: "TJPR", link: "https://projudi.tjpr.jus.br/projudi/" }
  };

  const found = maps[code];
  if (found) return { tribunal: found.tribunal, link: found.link };
  return { tribunal: "Outros", link: `https://www.google.com/search?q=consulta+processo+judicial+${encodeURIComponent(original)}` };
}

export function processarCaso(raw: any): LegalCase {
  const normalized: any = {};
  Object.keys(raw).forEach(k => {
    normalized[k.toUpperCase().replace(/\s+/g, '_').trim()] = raw[k];
  });

  const cliente = fixEncoding(normalized.CLIENTE || 'CLIENTE NÃO IDENTIFICADO').toUpperCase();
  const protocolo = (normalized.PROTOCOLO || '').trim();
  const advogado = fixEncoding(normalized.ADVOGADO_RESPONSÁVEL || normalized.ADVOGADO || 'NÃO ATRIBUÍDO').toUpperCase();
  const situacao = (normalized.SITUAÇÃO || normalized.SITUACAO || 'EM ANDAMENTO').toUpperCase();
  
  // Mapeamento Resiliente de Cabeçalhos
  const proximoPrazo = normalized.PROXIMO_RETORNO || normalized.PRÓXIMO_RETORNO || normalized.PRÓXIMO_PRAZO || normalized.PROXIMO_PRAZO || normalized.PROXIMO_RETORNO || '';
  const ultimoRetorno = normalized.ULTIMO_RETORNO || normalized.ÚLTIMO_RETORNO || normalized.RETORNO || normalized.ULTIMO_RETORNO || '';
  const observacao = fixEncoding(normalized.OBSERVAÇÕES || normalized.OBSERVACAO || normalized.OBSERVAÇÃO || '');
  const telefone = (normalized.TELEFONE || '').replace(/\D/g, '');
  
  const statusPlanilha = normalized.STATUS || normalized.STATUS_MANUAL || 'Automatico';

  const tribunalData = extrairTribunal(protocolo);
  const statusCalculado = calcularStatus(proximoPrazo, situacao);
  const riscoCalculado = calcularRisco(observacao, '', situacao);

  return {
    id: raw.id || crypto.randomUUID(),
    cliente,
    protocolo,
    advogado,
    situacao,
    proximoPrazo,
    ultimoRetorno,
    status: (statusPlanilha && statusPlanilha !== 'Automatico' && statusPlanilha !== '') ? statusPlanilha : statusCalculado,
    risco: riscoCalculado,
    diasFaltando: calcularDiasFaltando(formatDateToISO(proximoPrazo)),
    statusManual: statusPlanilha,
    tribunal: tribunalData.tribunal,
    linkConsulta: tribunalData.link,
    observacao,
    telefone
  };
}
