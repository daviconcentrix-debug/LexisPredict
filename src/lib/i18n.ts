/**
 * @fileOverview LexisPredict - W1 Capital Advanced Legal Operations
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 * @see LICENSE file for full terms.
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

export function fixEncoding(text: string): string {
  if (!text) return "";
  try {
    return text
      .replace(/Ã‡/g, 'Ç').replace(/Ãƒ/g, 'Ã').replace(/Ã/g, 'Á').replace(/Ã‰/g, 'É')
      .replace(/Ã/g, 'Í').replace(/Ã“/g, 'Ó').replace(/Ãš/g, 'Ú').replace(/Ã‚/g, 'Â')
      .replace(/ÃŠ/g, 'Ê').replace(/Ã”/g, 'Ô').replace(/Ã•/g, 'Õ').replace(/Ã€/g, 'À')
      .replace(/Ã/g, 'Ç').replace(/Ã§/g, 'ç').replace(/Ã£/g, 'ã').replace(/Ã¡/g, 'á')
      .replace(/Ã©/g, 'é').replace(/Ã­/g, 'í').replace(/Ã³/g, 'ó').replace(/Ãº/g, 'ú')
      .replace(/Ã¢/g, 'â').replace(/Ãª/g, 'ê').replace(/Ã´/g, 'ô').replace(/Ãµ/g, 'õ')
      .replace(/Ã /g, 'à').replace(/Âº/g, 'º').replace(/Âª/g, 'ª').replace(/Â/g, '');
  } catch (e) { return text; }
}

export function parseBrazilianDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  return isNaN(date.getTime()) ? null : date;
}

export function formatDateToISO(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const raw = String(dateStr).trim();
  if (raw === "" || raw === "-" || raw === "0" || raw === "00/00/0000") return null;

  const parts = raw.split(/[\/\-\.\s,]+/).filter(p => p.length > 0);
  if (parts.length !== 3) return null;

  let [day, month, year] = parts;
  if (day.length === 4) [year, month, day] = [day, month, year];
  
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);

  if (isNaN(d) || isNaN(m) || isNaN(y) || d === 0 || m === 0) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function calcularDiasFaltando(proximoISO: string | null): number | null {
  if (!proximoISO) return null;
  try {
    const hoje = new Date();
    const dataPrazo = new Date(proximoISO + 'T12:00:00');
    const dataHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 12, 0, 0);
    return Math.round((dataPrazo.getTime() - dataHoje.getTime()) / (1000 * 60 * 60 * 24));
  } catch { return null; }
}

export function calcularStatus(proximoRetorno: string | null | undefined, situacao: string | null | undefined): CaseStatus {
  const sit = (situacao || "").toUpperCase();
  if (sit.includes("ENCERRADO") || sit.includes("ARQUIVADO") || sit.includes("EXTINTO") || sit.includes("SUSPENSO")) return "Sem Prazo";
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
  const criticas = ["INDEFERIDA", "EXTINTO", "IMPROCEDENTE", "NÃO RESPONDE", "SUMI", "BAIXA DEFINITIVAMENTE"];
  if (criticas.some((p) => texto.includes(p))) return "Crítico";
  return "Normal";
}

export function extrairTribunal(protocolo: string): { tribunal: string; link: string; } {
  const clean = (protocolo || "").replace(/\D/g, "");
  if (clean.length !== 20) return { tribunal: "Outros", link: "#" };
  const code = `${clean[13]}.${clean.substring(14, 16)}`;
  const maps: Record<string, { tribunal: string; link: string }> = {
    "8.26": { tribunal: "TJSP", link: "https://esaj.tjsp.jus.br/cpopg/open.do" },
    "8.13": { tribunal: "TJMG", link: "https://pje.tjmg.jus.br/pje/ConsultaPublica/listView.seam" }
  };
  return maps[code] || { tribunal: "Outros", link: "#" };
}

export function processarCaso(linha: Record<string, any>): LegalCase {
  const protocolo = String(linha.PROTOCOLO || linha.PROCESSO || "S/N").trim();
  const cliente = fixEncoding(String(linha.CLIENTE || "DESCONHECIDO")).toUpperCase();
  const situacao = String(linha.SITUACAO || "EM ANDAMENTO").toUpperCase();
  const proximoPrazo = String(linha["PRÓXIMO RETORNO"] || linha.PRAZO || "");
  
  return {
    id: protocolo.replace(/\D/g, "") || crypto.randomUUID(),
    cliente,
    protocolo,
    telefone: String(linha.TELEFONE || ""),
    advogado: String(linha.ADVOGADO || "NÃO ATRIBUÍDO"),
    situacao,
    proximoPrazo,
    ultimoRetorno: String(linha.RETORNO || ""),
    status: calcularStatus(proximoPrazo, situacao),
    risco: calcularRisco(linha.OBSERVACOES, "", situacao),
    tribunal: extrairTribunal(protocolo).tribunal,
    linkConsulta: extrairTribunal(protocolo).link,
    statusManual: "Automatico"
  };
}
