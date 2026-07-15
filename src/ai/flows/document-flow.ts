'use server';
/**
 * @fileOverview Motor de Extração de Dados Jurídicos v870.0 ELITE
 * Estratégia de Fallback Circular: xAI -> Airforce -> Groq.
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved. See LICENSE file.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const API_KEYS = {
  XAI: 'xai-m2nfN0fkMwh5sbe0tKgoAAQxOfCF3pfb2OLjgE4FOxxMkqiMuTsTAtNoMrfxuYWfon3f4ryyMUPl3fDE',
  AIRFORCE: 'sk-air-Rxc7ygo5b0XpkZqUBqwSnhjwS0bZbWFnzwRLjfPtdAbYK6nj'
};

const BANCA_DATA = {
  "DIEGO GOMES DIAS": {
    oabs: { "BA": "77510", "CE": "52996-A", "MT": "34044-A", "PI": "22858", "RN": "21766A", "SP": "370.898" },
    endereco: "Av. São Miguel, nº 4810 – Jardim Cotinha – São Paulo – SP – CEP: 03870-100",
    email: "diego_gomesdias@yahoo.com.br",
    genero: "M"
  },
  "LETICIA ALVES GODOY DA CRUZ": {
    oabs: { "TO": "12.528-A", "AC": "6572", "RS": "131831A", "PB": "31888 A", "PA": "36417-A", "SP": "490.641" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-070",
    email: "leticiagodoy.adv@gmail.com",
    genero: "F"
  },
  "PABLO MATHEUS SILVA BASTOS PEREIRA": {
    oabs: { "SP": "520783", "MG": "249550", "PR": "520783", "RN": "520783", "PI": "520783", "MT": "520783", "CE": "520783", "BA": "520783", "SC": "520783", "ES": "520783", "MS": "520783" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-071",
    email: "pablobastos@adv.oabsp.org.br",
    genero: "M"
  },
  "INGRID MICHAELLY TELES PACHECO OLIVEIRA ALVES": {
    oabs: { "MA": "490.641", "RO": "13.438", "AP": "5.819-A", "SE": "1.601A", "RR": "844-A", "GO": "70699", "SP": "490.641" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-070",
    email: "pachecoingrid.adv@gmail.com",
    genero: "F"
  },
  "LUCAS DOS SANTOS DE JESUS": {
    oabs: { "DF": "78116", "AL": "21512A", "AM": "A2373", "PE": "66465", "RJ": "261767", "SP": "520783" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-070",
    email: "lucassj.adv01@gmail.com",
    genero: "M"
  },
  "ERALDO FRANCISCO DA SILVA JUNIOR": {
    oabs: { "SP": "327.677" },
    endereco: "Av. São Miguel, nº 4810 – Jardim Cotinha – São Paulo – SP – CEP: 03870-100",
    email: "eraldojr@adv.oabsp.org.br",
    genero: "M"
  },
  "ISAI SAMPAIO MOREIRA": {
    oabs: { "SP": "437.886" },
    endereco: "Av. São Miguel, nº 4810 – Jardim Cotinha – São Paulo – SP – CEP: 03870-100",
    email: "isai@adv.oabsp.org.br",
    genero: "M"
  },
  "GILBERTO BONFIM CAVALCANTI FILHO": {
    oabs: { "SP": "337.930" },
    endereco: "Av. São Miguel, nº 4810 – Jardim Cotinha – São Paulo – SP – CEP: 03870-100",
    email: "gilberto@adv.oabsp.org.br",
    genero: "M"
  },
  "FABIO RODRIGUES SAMPAIO MOREIRA": {
    oabs: { "SP": "437.886" },
    endereco: "Av. São Miguel, nº 4810 – Jardim Cotinha – São Paulo – SP – CEP: 03870-100",
    email: "fabio@adv.oabsp.org.br",
    genero: "M"
  },
  "MATHEUS SANTOS DIAS": {
    oabs: { "SP": "472.089" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-071",
    email: "matheus@adv.oabsp.org.br",
    genero: "M"
  },
  "MAIKON ALVES LOPES DOS SANTOS": {
    oabs: { "SP": "470.735" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-071",
    email: "maikon@adv.oabsp.org.br",
    genero: "M"
  },
  "ANDRESSA EDUARDA TAVARES MATOS": {
    oabs: { "MG": "238.75", "SP": "238.75" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-070",
    email: "andressa@adv.oabsp.org.br",
    genero: "F"
  },
  "RENATO PRINCIPE STEVANIN": {
    oabs: { "PR": "115.910", "SP": "346.790" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-071",
    email: "renatostevanin@adv.oabsp.org.br",
    genero: "M"
  }
};

const SYSTEM_PROMPT = `Você é o Arquiteto Jurídico. Extraia os dados do contrato ou de uma procuração antiga.
RETORNE APENAS JSON PLANO. Sem markdown.
{
  "cliente": { "nome": "", "estadoCivil": "casado(a)", "profissao": "autônomo(a)", "rg": "", "cpf": "", "endereco": "", "email": "", "genero": "M"|"F", "nacionalidade": "brasileiro(a)" },
  "processos": [{ "banco": "", "cnpjBanco": "", "numero": "", "acao": "AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA", "estado": "UF" }]
}`;

function cleanJsonResponse(text: string): any {
  if (!text) return null;
  try {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      return JSON.parse(text.substring(firstBrace, lastBrace + 1));
    }
    return null;
  } catch (e) { return null; }
}

async function fetchWithTimeout(url: string, options: any, timeout = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    return null;
  }
}

async function callXAI(text: string) {
  const res = await fetchWithTimeout('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEYS.XAI}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'grok-4.5',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: `DOCUMENTO: ${text}` }],
      response_format: { type: 'json_object' }
    })
  });
  if (!res?.ok) return null;
  const data = await res.json();
  return cleanJsonResponse(data?.choices?.[0]?.message?.content);
}

async function callAirforce(text: string) {
  const res = await fetchWithTimeout('https://api.airforce/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEYS.AIRFORCE}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deepseek-v3',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: `DOCUMENTO: ${text}` }]
    })
  });
  if (!res?.ok) return null;
  const data = await res.json();
  return cleanJsonResponse(data?.choices?.[0]?.message?.content);
}

export const documentFlow = ai.defineFlow(
  { name: 'documentFlow', inputSchema: z.any(), outputSchema: z.any() },
  async (input) => {
    const slicedText = (input.text || "").substring(0, 8000);
    
    let parsed: any = null;

    // TENTATIVA 1: xAI Grok
    try {
      parsed = await callXAI(slicedText);
    } catch (e) {}

    // TENTATIVA 2: Airforce DeepSeek (Fallback)
    if (!parsed) {
      try {
        parsed = await callAirforce(slicedText);
      } catch (e) {}
    }

    if (!parsed) return { error: true, code: "SISTEMA_INDISPONIVEL" };

    const targetLawyer = input.preferredLawyer || "PABLO MATHEUS SILVA BASTOS PEREIRA";
    const lawyerInfo = (BANCA_DATA as any)[targetLawyer] || BANCA_DATA["PABLO MATHEUS SILVA BASTOS PEREIRA"];
    const processosArray = Array.isArray(parsed.processos) ? parsed.processos : parsed.processo ? [parsed.processo] : [];
    const finalState = (input.preferredState || processosArray[0]?.estado || "SP").toUpperCase();
    const selectedOAB = (lawyerInfo.oabs as any)[finalState] || (lawyerInfo.oabs as any)["SP"] || (lawyerInfo.oabs as any)[Object.keys(lawyerInfo.oabs)[0]];

    return {
      cliente: {
        nome: (parsed.cliente?.nome || "NÃO IDENTIFICADO").toUpperCase(),
        estadoCivil: parsed.cliente?.estadoCivil || "casado(a)",
        profissao: parsed.cliente?.profissao || "autônomo(a)",
        rg: parsed.cliente?.rg || "---",
        cpf: parsed.cliente?.cpf || "---",
        endereco: parsed.cliente?.endereco || "Não localizado",
        email: parsed.cliente?.email || "",
        genero: parsed.cliente?.genero || 'M',
        nacionalidade: parsed.cliente?.nacionalidade || 'brasileiro(a)'
      },
      advogado: {
        nome: targetLawyer.toUpperCase(),
        oab: selectedOAB,
        endereco: lawyerInfo.endereco,
        email: lawyerInfo.email,
        cargo: lawyerInfo.genero === 'F' ? 'advogada' : 'advogado',
      },
      processos: processosArray.map((p: any) => ({
        banco: (p.banco || "BANCO").toUpperCase(),
        cnpjBanco: p.cnpjBanco || '',
        numero: p.numero || "S/N",
        acao: p.acao || 'AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA',
        estado: finalState
      }))
    };
  }
);

export async function extrairDadosProcuracao(input: any) {
  return await documentFlow(input);
}
