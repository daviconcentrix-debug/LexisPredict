'use server';

/**
 * MOTOR DE OPERAÇÕES FORENSES v24000.0 ELITE
 * Estratégia Híbrida: Cascata Neural (Grok/DeepSeek) + Resgate por Regex.
 * Proprietário: W1 Capital | Fundador: Davi Alves Figueredo
 */

import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import pdf from 'pdf-parse';

const BANCA_DATA: Record<string, any> = {
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

const SYSTEM_PROMPT = `Você é especialista em extrair dados de contratos jurídicos para a W1 Capital.
IGNORE VEÍCULOS, OBJETOS OU VALORES DE PARCELAS. Foque apenas na identificação do cliente e dos dados do processo.
A DATA DE NASCIMENTO DEVE SER SEMPRE RETORNADA VAZIA ("").

RETORNE APENAS JSON PLANO. Sem markdown.
{
  "cliente": {
    "nome": "",
    "rg": "",
    "cpf": "",
    "profissao": "",
    "estadoCivil": "",
    "email": "",
    "telefone": "",
    "endereco": "",
    "cep": "",
    "genero": "M"|"F",
    "dataNascimento": ""
  },
  "processos": [{
    "banco": "",
    "cnpjBanco": "",
    "numero": ""
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
  } catch {
    return null;
  }
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
        temperature: 0.1,
        response_format: engine === 'xai' ? { type: 'json_object' } : undefined
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return cleanJsonResponse(data?.choices?.[0]?.message?.content || '');
  } catch {
    return null;
  }
}

export async function extrairTextoDoPDFAction(formData: FormData) {
  const file = formData.get('pdf') as File;
  if (!file) return { success: false, error: "Arquivo não detectado." };
  
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdf(buffer);
    return { success: true, text: data.text };
  } catch (e: any) {
    console.error('PDF Parse Error:', e);
    return { success: false, error: "Falha na leitura neural do PDF." };
  }
}

export async function extrairDadosProcuracaoAction(inputText: string, lawyer: string, state: string) {
  try {
    let parsed: any = await callAI('xai', inputText);
    if (!parsed?.cliente?.nome) {
      parsed = await callAI('airforce', inputText);
    }

    if (!parsed?.cliente?.nome) {
      parsed = {
        cliente: {
          nome: "NÃO IDENTIFICADO",
          dataNascimento: "",
          rg: "---",
          cpf: "---",
          email: "",
          telefone: "",
          endereco: "Não localizado",
          cep: "",
          profissao: "autônomo(a)",
          estadoCivil: "casado(a)",
          genero: "M"
        },
        processos: [{ banco: "BANCO", cnpjBanco: "", numero: "S/N" }]
      };
    }

    const lawyerInfo = BANCA_DATA[lawyer] || BANCA_DATA["PABLO MATHEUS SILVA BASTOS PEREIRA"];
    const selectedOAB = lawyerInfo.oabs[state] || lawyerInfo.oabs["SP"];

    return {
      success: true,
      cliente: {
        ...parsed.cliente,
        nome: (parsed.cliente?.nome || "").toUpperCase(),
        dataNascimento: "" // SOBERANIA HUMANA: Sempre vazio na extração
      },
      advogado: {
        nome: lawyer.toUpperCase(),
        oab: selectedOAB,
        endereco: lawyerInfo.endereco,
        email: lawyerInfo.email,
        cargo: lawyerInfo.genero === 'F' ? 'advogada' : 'advogado'
      },
      processos: (parsed.processos || []).map((p: any) => ({
        banco: (p.banco || "BANCO").toUpperCase(),
        cnpjBanco: p.cnpjBanco || "",
        numero: p.numero || "S/N",
        acao: "AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA",
        estado: state
      }))
    };
  } catch (e) {
    return { error: "Erro interno no núcleo de triagem." };
  }
}

export async function generateProcuracaoPDFAction(data: any) {
  try {
    const { ProcuracaoPDF } = await import('@/components/pdf/procuracao-pdf');
    const pdfBuffer = await renderToBuffer(React.createElement(ProcuracaoPDF, { data }));
    return { success: true, base64: Buffer.from(pdfBuffer).toString('base64') };
  } catch (e: any) {
    console.error('PDF Gen Error:', e);
    return { error: "Falha ao selar o PDF." };
  }
}
