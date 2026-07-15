'use server';
/**
 * @fileOverview Motor de Extração de Dados Jurídicos v960.0 ELITE
 * Estratégia de Fallback Quádruplo: xAI -> Airforce -> Groq -> Regex Resgate Ultra.
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved. See LICENSE file.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const API_KEYS = {
  XAI: 'xai-m2nfN0fkMwh5sbe0tKgoAAQxOfCF3pfb2OLjgE4FOxxMkqiMuTsTAtNoMrfxuYWfon3f4ryyMUPl3fDE',
  AIRFORCE: 'sk-air-Rxc7ygo5b0XpkZqUBqwSnhjwS0bZbWFnzwRLjfPtdAbYK6nj',
  GROQ: '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'
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

const SYSTEM_PROMPT = `Você é o Arquiteto Jurídico Sênior da W1 Capital. Extraia meticulosamente todos os dados do contrato ou procuração.
REGRAS CRÍTICAS:
1. CAPTURE O NOME COMPLETO. Frequentemente ele aparece no início de um bloco de texto seguido de uma data (Ex: NOME COMPLETO DD/MM/AAAA).
2. IDENTIFIQUE A DATA DE NASCIMENTO no formato YYYY-MM-DD.
3. EXTRAIA CEP (00000-000) e o ENDEREÇO RESIDENCIAL COMPLETO.
4. Identifique o BANCO (Instituição Financeira) ré.
5. Capture CPF e RG.
6. Se o endereço estiver em uma linha contendo o CEP ao final, separe-os.
7. RETORNE APENAS JSON PLANO. Sem explicações. Sem Markdown.

{
  "cliente": { 
    "nome": "", 
    "estadoCivil": "casado(a)", 
    "profissao": "autônomo(a)", 
    "rg": "", 
    "cpf": "", 
    "endereco": "", 
    "cep": "",
    "dataNascimento": "YYYY-MM-DD",
    "email": "", 
    "telefone": "",
    "genero": "M"|"F", 
    "nacionalidade": "brasileiro(a)" 
  },
  "processos": [{ 
    "banco": "", 
    "cnpjBanco": "", 
    "numero": "", 
    "acao": "AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA", 
    "estado": "UF" 
  }]
}`;

function regexResgate(text: string): any {
  const cleanText = text.replace(/\s+/g, ' ');
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Nome e Data de Nascimento Conjugados (Posicional)
  const firstLine = lines[0] || "";
  const nomeDataMatch = firstLine.match(/^([A-ZÀ-Ú\s]{10,80})\s+(\d{2}\/\d{2}\/\d{4})/i);
  
  // Nome Completo Fallback
  const nomeMatch = cleanText.match(/(?:CONTRATANTE|OUTORGANTE|CLIENTE|NOME|NOMEADO):\s*([A-ZÀ-Ú\s]{8,80})(?:\s|,|RG|CPF|DATA)/i);
  
  // CPF e RG
  const cpfMatch = cleanText.match(/(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})/);
  const rgMatch = cleanText.match(/(?:RG|IDENTIDADE|CEDULA):\s*(\d{2}\.\d{3}\.\d{3}-[\dX]|\d{7,10})/i);
  
  // CEP
  const cepMatch = cleanText.match(/(\d{5}-?\d{3})/);
  
  // Data de Nascimento
  let finalDataNasc = "";
  const dnMatch = cleanText.match(/(?:NASCIDO|NASCIMENTO|DATA DE NASC|DN):\s*(\d{2}\/\d{2}\/\d{4})/i) || (nomeDataMatch ? [null, nomeDataMatch[2]] : null);
  if (dnMatch) {
    const parts = dnMatch[1].split('/');
    if (parts.length === 3) finalDataNasc = `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  
  // Email e Telefone
  const emailMatch = cleanText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const telMatch = cleanText.match(/(?:\(?\d{2}\)?\s?)?9?\d{4}-?\d{4}/);

  // Endereço Residencial (Heurística Expandida)
  let detectedEnd = "Não localizado";
  const endKeywords = ['residente e domiciliado', 'morador', 'residente', 'domiciliado', 'endereço', 'residência'];
  for (const kw of endKeywords) {
    const regex = new RegExp(`${kw}\\s+(?:em|na|no|à|a)?\\s*(.*?)(?=\\s*(?:CEP|RG|CPF|TEL|E-MAIL|nacionalidade|inscrito|estado civil|profissão|nascido|portador))`, 'i');
    const match = cleanText.match(regex);
    if (match && match[1].trim().length > 10) {
      detectedEnd = match[1].trim();
      break;
    }
  }
  
  // Se não achou por palavra-chave, tenta por prefixo de rua
  if (detectedEnd === "Não localizado") {
     const streetPrefixMatch = cleanText.match(/(?:Rua|Av\.|Avenida|R\.|Alameda|Rodovia|Praça)\s+[^,]+,\s*\d+[^0-9]+(?=\d{5})/i);
     if (streetPrefixMatch) detectedEnd = streetPrefixMatch[0].trim();
  }

  // Estado Civil e Profissão
  const ecMatch = cleanText.match(/(?:ESTADO CIVIL|ESTADO):\s*(casado|solteiro|divorciado|viúvo|separado)(?:\(a\))?/i);
  const profMatch = cleanText.match(/(?:PROFISSÃO|OCUPAÇÃO|CARGO):\s*([A-ZÀ-Ú\s]{4,40})(?:\s|,|RG|CPF)/i);

  // Banco
  const bancoKeywords = ["ITAU", "SANTANDER", "BRADESCO", "CAIXA", "BRASIL", "PAN", "BV", "SAFRA", "VOTORANTIM", "AYMORE", "DIGIMAIS", "YAMAHA", "HONDA", "MERCANTIL", "SICOOB", "OMNI", "DAYCOVAL"];
  let detectedBanco = "INSTITUIÇÃO FINANCEIRA";
  for (const kw of bancoKeywords) {
    if (cleanText.toUpperCase().includes(kw)) {
      detectedBanco = `BANCO ${kw}`;
      break;
    }
  }

  return {
    cliente: {
      nome: nomeDataMatch ? nomeDataMatch[1].trim().toUpperCase() : (nomeMatch ? nomeMatch[1].trim().toUpperCase() : "NÃO IDENTIFICADO (RESGATE)"),
      cpf: cpfMatch ? cpfMatch[0] : "---",
      rg: rgMatch ? rgMatch[1] : "---",
      cep: cepMatch ? cepMatch[1] : "",
      dataNascimento: finalDataNasc,
      email: emailMatch ? emailMatch[0].toLowerCase() : "",
      telefone: telMatch ? telMatch[0] : "",
      estadoCivil: ecMatch ? `${ecMatch[1].toLowerCase()}(a)` : "casado(a)",
      profissao: profMatch ? profMatch[1].trim().toLowerCase() : "autônomo(a)",
      endereco: detectedEnd,
      genero: "M",
      nacionalidade: "brasileiro(a)"
    },
    processos: [{
      banco: detectedBanco,
      cnpjBanco: "",
      numero: "S/N",
      acao: "AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA",
      estado: "SP"
    }]
  };
}

function cleanJsonResponse(text: string): any {
  if (!text) return null;
  try {
    let clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      return JSON.parse(clean.substring(firstBrace, lastBrace + 1));
    }
    return null;
  } catch (e) { return null; }
}

async function fetchWithTimeout(url: string, options: any, timeout = 25000) {
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

async function callGroq(text: string) {
  const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEYS.GROQ}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: `DOCUMENTO: ${text}` }],
      response_format: { type: 'json_object' }
    })
  });
  if (!res?.ok) return null;
  const data = await res.json();
  return cleanJsonResponse(data?.choices?.[0]?.message?.content);
}

export const documentFlow = ai.defineFlow(
  { name: 'documentFlow', inputSchema: z.any(), outputSchema: z.any() },
  async (input) => {
    const slicedText = (input.text || "").substring(0, 15000);
    
    let parsed: any = null;

    try { parsed = await callXAI(slicedText); } catch (e) {}
    if (!parsed) { try { parsed = await callAirforce(slicedText); } catch (e) {} }
    if (!parsed) { try { parsed = await callGroq(slicedText); } catch (e) {} }

    if (!parsed) {
      parsed = regexResgate(slicedText);
    }

    const targetLawyer = input.preferredLawyer || "PABLO MATHEUS SILVA BASTOS PEREIRA";
    const lawyerInfo = (BANCA_DATA as any)[targetLawyer] || BANCA_DATA["PABLO MATHEUS SILVA BASTOS PEREIRA"];
    const processosArray = Array.isArray(parsed.processos) ? parsed.processos : parsed.processo ? [parsed.processo] : [];
    const finalState = (input.preferredState || processosArray[0]?.estado || "SP").toUpperCase();
    
    const selectedOAB = (lawyerInfo.oabs as any)[finalState] || (lawyerInfo.oabs as any)["SP"] || Object.values(lawyerInfo.oabs)[0];

    return {
      cliente: {
        nome: (parsed.cliente?.nome || "NÃO IDENTIFICADO").toUpperCase(),
        estadoCivil: parsed.cliente?.estadoCivil || "casado(a)",
        profissao: parsed.cliente?.profissao || "autônomo(a)",
        rg: parsed.cliente?.rg || "---",
        cpf: parsed.cliente?.cpf || "---",
        endereco: parsed.cliente?.endereco || "Não localizado",
        cep: parsed.cliente?.cep || "",
        dataNascimento: parsed.cliente?.dataNascimento || "",
        email: parsed.cliente?.email || "",
        telefone: parsed.cliente?.telefone || "",
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
