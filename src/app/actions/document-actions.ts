

'use server';

/**
 * @fileOverview LexisPredict - W1 Capital Advanced Legal Operations
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 */

import React from 'react';

const BANCA_DATA: Record<string, any> = {
  "DIEGO GOMES DIAS": {
    oabs: { "BA": "77510/BA", "CE": "52996-A/CE", "MT": "34044-A/MT", "PI": "22858/PI", "RN": "21766A/RN", "SP": "370.898/SP" },
    endereco: "Av. São Miguel, nº 4810 – Jardim Cotinha – São Paulo – SP – CEP: 03870-100",
    email: "diego_gomesdias@yahoo.com.br",
    email1: "lucenadiasadvogados@gmail.com",
    genero: "M"
  },
  "LETICIA ALVES GODOY DA CRUZ": {
    oabs: { "TO": "12.528-A/TO", "AC": "6572/AC", "RS": "131831A/RS", "PB": "31888 A/PB", "PA": "36417-A/PA", "SP": "490.641/SP" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-070",
    email: "leticiagodoy.adv@gmail.com",
    email1: "leticiagodoy.adv@gmail.com",
    genero: "F"
  },
  "PABLO MATHEUS SILVA BASTOS PEREIRA": {
    oabs: { "SP": "520783/SP", "RN": "520783/SP", "PI": "520783/SP", "MT": "520783/SP", "CE": "520783/SP", "BA": "520783/SP", "MG": "249550/MG", "SC": "520783/SP", "ES": "520783/SP", "MS": "520783/SP", "PR": "520783/PR" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-071",
    email: "pablobastos@adv.oabsp.org.br",
    email1: "pablobastos@adv.oabsp.org.br",
    genero: "M"
  },
  "INGRID MICHAELLY TELES PACHECO OLIVEIRA ALVES": {
    oabs: { "MA": "490.641/SP", "RO": "13.438/RO", "AP": "5.819-A/AP", "SE": "1.601A/SE", "RR": "844-A/RR", "GO": "70699/GO", "SP": "490.641/SP" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-070",
    email: "pachecoingrid.adv@gmail.com",
    email1: "pachecoingrid.adv@gmail.com",
    genero: "F"
  },
  "ERALDO FRANCISCO DA SILVA JUNIOR": {
    oabs: { "SP": "327.677/SP" },
    endereco: "Av. São Miguel, nº 4810 – Jardim Cotinha – São Paulo – SP – CEP: 03870-100",
    email: "eraldojr@adv.oabsp.org.br",
    email1: "eraldojr@adv.oabsp.org.br",
    genero: "M"
  },
  "ISAI SAMPAIO MOREIRA": {
    oabs: { "SP": "437.886/SP" },
    endereco: "Av. São Miguel, nº 4810 – Jardim Cotinha – São Paulo – SP – CEP: 03870-100",
    email: "isai@adv.oabsp.org.br",
    email1: "isai@adv.oabsp.org.br",
    genero: "M"
  },
  "ANDRESSA EDUARDA TAVARES MATOS": {
    oabs: { "MG": "238.75/MG", "SP": "238.75/MG" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-070",
    email: "andressa@adv.oabsp.org.br",
    email1: "andressa@adv.oabsp.org.br",
    genero: "F"
  },
  "RENATO PRINCIPE STEVANIN": {
    oabs: { "PR": "115.910/PR", "SP": "346.790/SP" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-071",
    email: "renatostevanin@adv.oabsp.org.br",
    email1: "renatostevanin@adv.oabsp.org.br",
    genero: "M"
  }
};

const SYSTEM_PROMPT = `Você é especialista em extrair dados de contratos da Get Assessoria Financeira.
Extraia os dados conforme o JSON abaixo. Separe nomes de datas e documentos se estiverem colados.

RETORNE APENAS JSON PLANO.
{
  "cliente": { "nome": "", "dataNascimento": "", "rg": "", "cpf": "", "profissao": "", "estadoCivil": "", "email": "", "endereco": "", "cep": "", "nacionalidade": "brasileiro(a)", "genero": "M"|"F" },
  "processos": [{ "banco": "", "cnpjBanco": "", "numero": "", "vara": "", "comarca": "", "acao": "AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA" }]
}`;

function limparTextoContrato(texto: string): string {
  if (!texto) return "";
  return texto.substring(0, 10000).replace(/\s+/g, ' ').trim();
}

async function callAI(engine: 'xai' | 'airforce', text: string) {
  const url = engine === 'xai' ? 'https://api.x.ai/v1/chat/completions' : 'https://api.airforce/v1/chat/completions';
  const model = engine === 'xai' ? 'grok-4.5' : 'deepseek-v3';
  const key = engine === 'xai' ? 'xai-m2nfN0fkMwh5sbe0tKgoAAQxOfCF3pfb2OLjgE4FOxxMkqiMuTsTAtNoMrfxuYWfon3f4ryyMUPl3fDE' : 'sk-air-Rxc7ygo5b0XpkZqUBqwSnhjwS0bZbWFnzwRLjfPtdAbYK6nj';

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: `CONTRATO:\n${text}` }],
        temperature: 0.1
      })
    });
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || '';
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    return (start !== -1 && end !== -1) ? JSON.parse(content.substring(start, end + 1)) : null;
  } catch { return null; }
}

export async function extrairTextoDoPDFAction(formData: FormData) {
  try {
    const file = formData.get('pdf') as File;
    if (!file) return { error: "Nenhum arquivo enviado" };
    const arrayBuffer = await file.arrayBuffer();
    const pdf = (await import('pdf-parse')).default;
    const data = await pdf(Buffer.from(arrayBuffer));
    return { success: true, text: data.text };
  } catch { return { error: "Falha na transcrição." }; }
}

export async function extrairDadosProcuracaoAction(inputText: string, lawyer: string, state: string) {
  const text = limparTextoContrato(inputText);
  let parsed = await callAI('xai', text);
  if (!parsed) parsed = await callAI('airforce', text);

  if (!parsed) return { error: "Falha na triagem neural." };

  const lawyerInfo = BANCA_DATA[lawyer] || BANCA_DATA["DIEGO GOMES DIAS"];
  const selectedOAB = lawyerInfo.oabs[state] || lawyerInfo.oabs["SP"] || Object.values(lawyerInfo.oabs)[0];

  const cliente = parsed.cliente || {};
  const proc = (parsed.processos && parsed.processos[0]) || {};

  return {
    success: true,
    cliente: {
      nome: (cliente.nome || "DESCONHECIDO").toUpperCase(),
      nacionalidade: cliente.nacionalidade || "brasileiro(a)",
      estadoCivil: cliente.estadoCivil || "casado(a)",
      profissao: cliente.profissao || "autônomo(a)",
      rg: cliente.rg || "---",
      cpf: cliente.cpf || "---",
      endereco: cliente.endereco || "Não localizado",
      cep: cliente.cep || "---",
      email: cliente.email || "",
      genero: cliente.genero || "M"
    },
    advogado: {
      nome: lawyer.toUpperCase(),
      oab: selectedOAB,
      endereco: lawyerInfo.endereco,
      cep: lawyerInfo.endereco.match(/\d{5}-\d{3}/)?.[0] || "00000-000",
      email1: lawyerInfo.email1 || lawyerInfo.email,
      email2: lawyerInfo.email,
      cargo: lawyerInfo.genero === 'F' ? 'advogada' : 'advogado'
    },
    processo: {
      vara: proc.vara || "02ª VARA CÍVEL",
      comarca: proc.comarca || (state === 'SP' ? "SÃO PAULO - SP" : state),
      numero: proc.numero || "S/N",
      acao: proc.acao || "AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA",
      banco: (proc.banco || "INSTITUIÇÃO FINANCEIRA").toUpperCase(),
      cnpjBanco: proc.cnpjBanco || "00.000.000/0001-00"
    }
  };
}

export async function generateProcuracaoPDFAction(data: any) {
  try {
    const { renderToBuffer } = await import('@react-pdf/renderer');
    const { ProcuracaoPDF } = await import('@/components/pdf/procuracao-pdf');
    const buffer = await renderToBuffer(React.createElement(ProcuracaoPDF, { data }));
    return { success: true, base64: Buffer.from(buffer).toString('base64') };
  } catch { return { error: "Falha ao gerar PDF." }; }
}

export async function generateSubstabelecimentoPDFAction(data: any) {
  try {
    const { renderToBuffer } = await import('@react-pdf/renderer');
    const { SubstabelecimentoPDF } = await import('@/components/pdf/substabelecimento-pdf');
    const buffer = await renderToBuffer(React.createElement(SubstabelecimentoPDF, { data }));
    return { success: true, base64: Buffer.from(buffer).toString('base64') };
  } catch { return { error: "Falha ao gerar PDF." }; }
}

export async function generateHabilitacaoPDFAction(data: any) {
  try {
    const { renderToBuffer } = await import('@react-pdf/renderer');
    const { HabilitacaoPDF } = await import('@/components/pdf/habilitacao-pdf');
    const buffer = await renderToBuffer(React.createElement(HabilitacaoPDF, { data }));
    return { success: true, base64: Buffer.from(buffer).toString('base64') };
  } catch { return { error: "Falha ao gerar PDF." }; }
}
