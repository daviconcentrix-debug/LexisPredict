
'use server';

import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';

const BANCA_DATA = {
  "DIEGO GOMES DIAS": {
    oabs: { "BA": "77510/BA", "CE": "52996-A/CE", "MT": "34044-A/MT", "PI": "22858/PI", "RN": "21766A/RN", "SP": "370.898/SP" },
    endereco: "Av. São Miguel, nº 4810 – Jardim Cotinha – São Paulo – SP – CEP: 03870-100",
    email: "diego_gomesdias@yahoo.com.br",
    genero: "M"
  },
  "LETICIA ALVES GODOY DA CRUZ": {
    oabs: { "TO": "12.528-A/TO", "AC": "6572/AC", "RS": "131831A/RS", "PB": "31888 A/PB", "PA": "36417-A/PA", "SP": "490.641/SP" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-070",
    email: "leticiagodoy.adv@gmail.com",
    genero: "F"
  },
  "PABLO MATHEUS SILVA BASTOS PEREIRA": {
    oabs: { "SP": "520783/SP", "RN": "520783/SP", "PI": "520783/SP", "MT": "520783/SP", "CE": "520783/SP", "BA": "520783/SP", "MG": "249550/MG", "SC": "520783/SP", "ES": "520783/SP", "MS": "520783/SP", "PR": "520783/PR" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-071",
    email: "pablobastos@adv.oabsp.org.br",
    genero: "M"
  },
  "INGRID MICHAELLY TELES PACHECO OLIVEIRA ALVES": {
    oabs: { "MA": "490.641/SP", "RO": "13.438/RO", "AP": "5.819-A/AP", "SE": "1.601A/SE", "RR": "844-A/RR", "GO": "70699/GO", "SP": "490.641/SP" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-070",
    email: "pachecoingrid.adv@gmail.com",
    genero: "F"
  },
  "LUCAS DOS SANTOS DE JESUS": {
    oabs: { "DF": "78116/DF", "AL": "21512A/AL", "AM": "A2373/AM", "PE": "66465/PE", "RJ": "261767/RJ", "SP": "520783/SP" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-070",
    email: "lucassj.adv01@gmail.com",
    genero: "M"
  }
};

const API_KEYS = {
  XAI: process.env.XAI_API_KEY || 'xai-m2nfN0fkMwh5sbe0tKgoAAQxOfCF3pfb2OLjgE4FOxxMkqiMuTsTAtNoMrfxuYWfon3f4ryyMUPl3fDE',
  AIRFORCE: process.env.AIRFORCE_API_KEY || 'sk-air-Rxc7ygo5b0XpkZqUBqwSnhjwS0bZbWFnzwRLjfPtdAbYK6nj'
};

const SYSTEM_PROMPT = `Você é o Arquiteto Jurídico da W1 Capital. Extraia os dados do contrato para gerar uma procuração.
O texto pode vir bagunçado. Separe corretamente nome, cpf, rg, endereço, email, telefone, banco e cnpj do banco.
RETORNE APENAS JSON PLANO. Sem markdown.
{
  "cliente": { "nome": "", "estadoCivil": "", "profissao": "", "rg": "", "cpf": "", "endereco": "", "email": "", "telefone": "", "cep": "", "genero": "M"|"F" },
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

async function callEngine(engine: 'xai' | 'airforce', text: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  const url = engine === 'xai' 
    ? 'https://api.x.ai/v1/chat/completions' 
    : 'https://api.airforce/v1/chat/completions';
  
  const body = engine === 'xai' 
    ? { 
        model: 'grok-4.5', 
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: `CONTRATO: ${text}` }],
        response_format: { type: 'json_object' },
        temperature: 0.1
      }
    : { 
        model: 'deepseek-v3', 
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: `CONTRATO: ${text}` }],
        temperature: 0.1
      };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${engine === 'xai' ? API_KEYS.XAI : API_KEYS.AIRFORCE}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`${engine} error: ${res.status}`);
    const data = await res.json();
    return cleanJsonResponse(data?.choices?.[0]?.message?.content);
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function extrairTextoDoPDFAction(formData: FormData) {
  try {
    const file = formData.get('pdf') as File;
    if (!file) return { error: "Nenhum arquivo enviado" };
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdf = (await import('pdf-parse')).default;
    const data = await pdf(buffer);
    return { success: true, text: data.text };
  } catch (e: any) {
    return { error: "Falha na transcrição do arquivo." };
  }
}

export async function extrairDadosProcuracaoAction(text: string, lawyer: string, state: string) {
  try {
    const slicedText = (text || "").substring(0, 7000);
    let parsed: any = null;

    try {
      parsed = await callEngine('xai', slicedText);
    } catch (e) {
      try {
        parsed = await callEngine('airforce', slicedText);
      } catch (e2) {
        return { error: "Falha na extração neural." };
      }
    }

    if (!parsed || !parsed.cliente) {
      return { error: "Dados estruturados não localizados." };
    }

    const lawyerInfo = (BANCA_DATA as any)[lawyer] || BANCA_DATA["PABLO MATHEUS SILVA BASTOS PEREIRA"];
    const processosArray = Array.isArray(parsed.processos) ? parsed.processos : parsed.processo ? [parsed.processo] : [];
    const finalState = state.toUpperCase();
    const selectedOAB = (lawyerInfo.oabs as any)[finalState] || (lawyerInfo.oabs as any)["SP"];

    return {
      success: true,
      cliente: {
        nome: (parsed.cliente.nome || "").toUpperCase(),
        estadoCivil: parsed.cliente.estadoCivil || "casado(a)",
        profissao: parsed.cliente.profissao || "autônomo(a)",
        rg: parsed.cliente.rg || "---",
        cpf: parsed.cliente.cpf || "---",
        endereco: parsed.cliente.endereco || "Endereço não localizado",
        email: parsed.cliente.email || "",
        telefone: parsed.cliente.telefone || "",
        cep: parsed.cliente.cep || "",
        genero: parsed.cliente.genero || 'M',
      },
      advogado: {
        nome: lawyer.toUpperCase(),
        oab: selectedOAB,
        endereco: lawyerInfo.endereco,
        email: lawyerInfo.email,
        cargo: lawyerInfo.genero === 'F' ? 'advogada' : 'advogado',
      },
      processos: processosArray.map((p: any) => ({
        banco: (p.banco || "BANCO").toUpperCase(),
        cnpjBanco: p.cnpjBanco || "",
        numero: p.numero || "S/N",
        acao: p.acao || 'AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA',
        estado: finalState
      }))
    };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function generateProcuracaoPDFAction(data: any) {
  try {
    const { ProcuracaoPDF } = await import('@/components/pdf/procuracao-pdf');
    const pdfBuffer = await renderToBuffer(React.createElement(ProcuracaoPDF, { data }));
    return { success: true, base64: Buffer.from(pdfBuffer).toString('base64') };
  } catch (e: any) {
    console.error('[PDF Generation]', e);
    return { error: "Falha ao selar o PDF." };
  }
}
