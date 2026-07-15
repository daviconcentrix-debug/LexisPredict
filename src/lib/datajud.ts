/**
 * @fileOverview Serviço de Integração com a API Pública do DataJud (CNJ)
 * Proprietário: W1 Capital | Fundador: Davi Alves Figueredo
 */

export const COURT_ALIASES: Record<string, string> = {
  "8.01": "tjac", "8.02": "tjal", "8.03": "tjam", "8.04": "tjam", "8.05": "tjba",
  "8.06": "tjce", "8.07": "tjdft", "8.08": "tjes", "8.09": "tjgo", "8.10": "tjma",
  "8.11": "tjmt", "8.12": "tjms", "8.13": "tjmg", "8.14": "tjpa", "8.15": "tjpb",
  "8.16": "tjpr", "8.17": "tjpe", "8.18": "tjpi", "8.19": "tjrj", "8.20": "tjrn",
  "8.21": "tjrs", "8.22": "tjro", "8.23": "tjrr", "8.24": "tjsc", "8.25": "tjse",
  "8.26": "tjsp", "8.27": "tjto", "4.01": "trf1", "4.02": "trf2", "4.03": "trf3",
  "4.04": "trf4", "4.05": "trf5", "4.06": "trf6"
};

export async function fetchDataJud(cnj: string) {
  const DATAJUD_API_KEY = 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==';
  
  const cnjLimpo = cnj.replace(/\D/g, '');
  if (cnjLimpo.length !== 20) throw new Error("CNJ_INVALIDO_TAMANHO");
  
  const aliasPart = `${cnjLimpo[13]}.${cnjLimpo.substring(14, 16)}`;
  const alias = COURT_ALIASES[aliasPart] || "tjsp";

  const url = `https://api-publica.datajud.cnj.jus.br/api_publica_${alias}/_search`;
  
  const payload = {
    query: {
      term: {
        "numeroProcesso.keyword": cnjLimpo
      }
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'APIKey ' + DATAJUD_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new Error("DATAJUD_API_KEY_INVALIDA");
      throw new Error(`TRIBUNAL_${alias.toUpperCase()}_OFFLINE`);
    }
    
    const data = await response.json();
    const result = data.hits?.hits?.[0]?._source || null;
    
    if (!result) {
      return null;
    }
    
    return result;
  } catch (error: any) {
    console.error("DataJud Integration Failure:", error);
    throw error;
  }
}
