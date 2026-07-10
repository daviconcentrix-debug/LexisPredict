
'use server';

import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';

/**
 * MOTOR DE DOCUMENTOS v10500.0 ELITE
 * Processamento robusto de PDFs (Transcrição + Geração) no servidor.
 */

// BANCA DE ADVOGADOS OFICIAL
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
  AIRFORCE: process.env.AIRFORCE_API_KEY || 'sk-air-Rxc7ygo5b0XpkZqUBqwSnhjwS0bZbWFnzwRLjfPtdAbYK6nj',
};

const SYSTEM_PROMPT = `Você é o Arquiteto Jurídico da W1 Capital. Extraia os dados do contrato para gerar uma procuração judicial.
REGRAS ESTRITAS:
- Retorne APENAS um JSON válido, sem markdown.
- Separe corretamente cada campo.
- Se não encontrar o campo, retorne "".
- Nome do cliente deve vir completo e em MAIÚSCULAS.

Exemplo de saída:
{
  "cliente": {
    "nome": "CLEISON DE SOUSA SANTOS",
    "rg": "47288986",
    "cpf": "389.801.868-78",
    "profissao": "GERENTE",
    "estadoCivil": "CASADO",
    "email": "cleison.sousa@icloud.com",
    "telefone": "11 97373-1104",
    "endereco": "Rua Oito, 52 - Jardim São Marcos - Vargem Grande Paulista - SP - 06732-520"
  },
  "processos": [{
    "banco": "ITAU",
    "numero": "",
    "veiculo": "Renault Master 2021"
  }]
}`;

function cleanJsonResponse(text: string): any {
  if (!text) return null;
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return JSON.parse(text.substring(start, end + 1));
    }
    return null;
  } catch { return null; }
}

async function callEngine(engine: 'xai' | 'airforce', text: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 14000);
  const url = engine === 'xai' ? 'https://api.x.ai/v1/chat/completions' : 'https://api.airforce/v1/chat/completions';
  const body = {
    model: engine === 'xai' ? 'grok-4.5' : 'deepseek-v3',
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: `CONTRATO:\n${text}` }],
    temperature: 0.1,
    max_tokens: 1800
  };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${engine === 'xai' ? API_KEYS.XAI : API_KEYS.AIRFORCE}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`${engine} error: ${res.status}`);
    const data = await res.json();
    return cleanJsonResponse(data?.choices?.[0]?.message?.content || '');
  } catch (error) { clearTimeout(timeout); throw error; }
}

export async function extrairDadosProcuracao(input: { text: string; preferredLawyer?: string; preferredState?: string; }) {
  try {
    const contractText = input.text || '';
    if (contractText.trim().length < 50) return { error: true, code: 'TEXTO_INVALIDO', message: 'Texto muito curto' };

    const slicedText = contractText.substring(0, 8000);
    let parsed: any = null;

    try {
      console.log('[Triagem] Tentando xAI...');
      parsed = await callEngine('xai', slicedText);
    } catch { console.warn('[Triagem] xAI falhou, tentando Airforce...'); }

    if (!parsed || (!parsed.cliente?.nome && !parsed.nome)) {
      try {
        parsed = await callEngine('airforce', slicedText);
      } catch { console.error('[Triagem] Airforce também falhou'); }
    }

    if (!parsed || (!parsed.cliente?.nome && !parsed.nome)) {
      return { error: true, code: 'EXTRACAO_FALHOU', message: 'Extração neural falhou. Verifique se o contrato é legível.' };
    }

    const targetLawyer = input.preferredLawyer || "PABLO MATHEUS SILVA BASTOS PEREIRA";
    const lawyerInfo = (BANCA_DATA as any)[targetLawyer] || BANCA_DATA["PABLO MATHEUS SILVA BASTOS PEREIRA"];
    const processosArray = Array.isArray(parsed.processos) ? parsed.processos : [];
    const finalState = (input.preferredState || processosArray[0]?.estado || "SP").toUpperCase();
    const selectedOAB = (lawyerInfo.oabs as any)[finalState] || (lawyerInfo.oabs as any)["SP"];

    return {
      cliente: {
        nome: (parsed.cliente?.nome || parsed.nome || "NÃO IDENTIFICADO").toUpperCase(),
        estadoCivil: parsed.cliente?.estadoCivil || parsed.estadoCivil || "casado(a)",
        profissao: parsed.cliente?.profissao || parsed.profissao || "autônomo(a)",
        rg: parsed.cliente?.rg || parsed.rg || "---",
        cpf: parsed.cliente?.cpf || parsed.cpf || "---",
        endereco: parsed.cliente?.endereco || parsed.endereco || "Não localizado",
        email: parsed.cliente?.email || parsed.email || "",
        telefone: parsed.cliente?.telefone || parsed.telefone || "",
        genero: parsed.cliente?.genero || parsed.genero || 'M',
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
        numero: p.numero || "S/N",
        acao: p.acao || 'AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA',
        estado: finalState
      }))
    };
  } catch (error) { return { error: true, message: 'Erro interno ao processar contrato.' }; }
}

export async function extrairTextoDoPDFAction(formData: FormData) {
  try {
    const file = formData.get('pdf') as File;
    if (!file) return { error: 'Nenhum arquivo enviado' };
    const pdfParser = (await import('pdf-parse')).default;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdfParser(buffer);
    return { success: true, text: data.text };
  } catch (error) { return { error: 'Falha ao processar arquivo no servidor' }; }
}

export async function generateProcuracaoPDFAction(data: any) {
  try {
    const { ProcuracaoPDF } = await import('@/components/pdf/procuracao-pdf');
    const pdfBuffer = await renderToBuffer(React.createElement(ProcuracaoPDF, { data }));
    return { success: true, base64: Buffer.from(pdfBuffer).toString('base64') };
  } catch (error) { return { success: false, error: 'Falha ao gerar o documento' }; }
}
