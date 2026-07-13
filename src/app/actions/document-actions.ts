'use server';

/**
 * MOTOR DE OPERAÇÕES FORENSES v15000.0 ELITE
 * Estratégia Híbrida: Cascata Neural (Grok/DeepSeek) + Resgate por Regex.
 * Proprietário: W1 Capital | Fundador: Davi Alves Figueredo
 */

import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';

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

const SYSTEM_PROMPT = `Você é especialista em extrair dados de contratos da Get Assessoria Financeira.
O texto vem MUITO bagunçado (campos colados sem espaço). Você DEVE separar corretamente.

RETORNE APENAS JSON PLANO. Sem markdown.
{
  "cliente": {
    "nome": "",
    "dataNascimento": "",
    "rg": "",
    "cpf": "",
    "profissao": "",
    "estadoCivil": "",
    "email": "",
    "telefone": "",
    "endereco": "",
    "cep": "",
    "genero": "M"|"F"
  },
  "processos": [{
    "banco": "",
    "cnpjBanco": "",
    "numero": "",
    "valorFinanciamento": "",
    "valorParcela": ""
  }]
}

REGRAS:
1. Separe nome da data de nascimento (ex: SANTOS14/10/1990 -> nome + data).
2. Separe RG e CPF colados.
3. Extraia e-mail, telefone e CEP.
4. Identifique o Banco do contrato.`;

function limparTextoContrato(texto: string): string {
  if (!texto) return "";
  return texto
    .replace(/\s+/g, ' ')
    .replace(/(\r\n|\n|\r)/gm, ' ')
    .replace(/CONTRATANTEDATA NASCIMENTO/gi, 'CONTRATANTE DATA NASCIMENTO ')
    .replace(/RGCPF\/ CNPJPROFISSÃOESTADO CIVIL/gi, 'RG CPF PROFISSÃO ESTADO CIVIL ')
    .replace(/EMAILTELEFONE 1TELEFONE 2/gi, 'EMAIL TELEFONE ')
    .replace(/ENDEREÇOCEP/gi, 'ENDEREÇO CEP ')
    .trim()
    .substring(0, 8000);
}

function cleanJsonResponse(text: string): any {
  if (!text) return null;
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return JSON.parse(text.substring(start, end + 1));
    }
    return JSON.parse(text.trim());
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

export async function extrairDadosProcuracaoAction(inputText: string, lawyer: string, state: string) {
  try {
    const text = limparTextoContrato(inputText);
    if (text.length < 30) return { error: "Texto muito curto" };

    let parsed: any = null;

    // 1. TENTATIVA NEURAL (CASCATA)
    parsed = await callAI('xai', text);
    if (!parsed?.cliente?.nome) {
      parsed = await callAI('airforce', text);
    }

    // 2. RESGATE POR REGEX
    if (!parsed?.cliente?.nome) {
      const nomeMatch = text.match(/([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\s]{8,60})(?=\d{2}\/\d{2}\/\d{4}|RG|CPF)/i);
      const dataMatch = text.match(/(\d{2}\/\d{2}\/\d{4})/);
      const cpfMatch = text.match(/(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/);
      const rgMatch = text.match(/(\d{7,9})/);
      const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
      const telefoneMatch = text.match(/(?:\(?\d{2}\)?\s?)?(?:9\d{4}|\d{4})[-\s]?\d{4}/);
      const enderecoMatch = text.match(/(Rua|Av\.|Avenida|Alameda)[^,]{5,80}/i);
      const cepMatch = text.match(/(\d{5}-?\d{3})/);
      const bancoMatch = text.match(/(Ita[uú]|Bradesco|Santander|Banco do Brasil|Caixa|Nubank|Inter)/i);

      parsed = {
        cliente: {
          nome: nomeMatch ? nomeMatch[1].trim().toUpperCase() : "",
          dataNascimento: dataMatch ? dataMatch[1] : "",
          rg: rgMatch ? rgMatch[1] : "",
          cpf: cpfMatch ? cpfMatch[1] : "",
          email: emailMatch ? emailMatch[1].toLowerCase() : "",
          telefone: telefoneMatch ? telefoneMatch[0] : "",
          endereco: enderecoMatch ? enderecoMatch[0] : "Não localizado",
          cep: cepMatch ? cepMatch[1] : "",
          profissao: "autônomo(a)",
          estadoCivil: "casado(a)",
          genero: "M"
        },
        processos: [{
          banco: bancoMatch ? bancoMatch[1].toUpperCase() : "BANCO",
          cnpjBanco: "",
          numero: "S/N",
          valorFinanciamento: "",
          valorParcela: ""
        }]
      };
    }

    const lawyerInfo = BANCA_DATA[lawyer] || BANCA_DATA["PABLO MATHEUS SILVA BASTOS PEREIRA"];
    const selectedOAB = lawyerInfo.oabs[state] || lawyerInfo.oabs["SP"];

    const clienteData = parsed.cliente || parsed;
    const processosRaw = Array.isArray(parsed.processos) ? parsed.processos : [];

    return {
      success: true,
      cliente: {
        nome: (clienteData.nome || "").toUpperCase(),
        dataNascimento: clienteData.dataNascimento || "",
        rg: clienteData.rg || "---",
        cpf: clienteData.cpf || "---",
        endereco: clienteData.endereco || "Não localizado",
        cep: clienteData.cep || "",
        profissao: clienteData.profissao || "autônomo(a)",
        estadoCivil: clienteData.estadoCivil || "casado(a)",
        email: clienteData.email || "",
        telefone: clienteData.telefone || "",
        genero: clienteData.genero || "M"
      },
      advogado: {
        nome: lawyer.toUpperCase(),
        oab: selectedOAB,
        endereco: lawyerInfo.endereco,
        email: lawyerInfo.email,
        cargo: lawyerInfo.genero === 'F' ? 'advogada' : 'advogado'
      },
      processos: processosRaw.length > 0 ? processosRaw.map((p: any) => ({
        banco: (p.banco || "BANCO").toUpperCase(),
        cnpjBanco: p.cnpjBanco || '',
        numero: p.numero || "S/N",
        acao: "AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA",
        estado: state,
        valorFinanciamento: p.valorFinanciamento || "",
        valorParcela: p.valorParcela || ""
      })) : [{
        banco: (parsed.processos?.[0]?.banco || "BANCO").toUpperCase(),
        cnpjBanco: "",
        numero: "S/N",
        acao: "AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA",
        estado: state,
        valorFinanciamento: "",
        valorParcela: ""
      }]
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
    return { error: "Falha ao selar o PDF." };
  }
}