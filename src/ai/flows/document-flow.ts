
'use server';
/**
 * @fileOverview Motor de Extração de Dados Jurídicos v3700.0 ELITE
 * Soberania Grok 4.5 com Cascata de Resiliência e Resgate Heurístico (Regex) 3.0.
 * Otimizado para identificar endereços, datas grudadas em nomes e dados de contato.
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const API_KEYS = {
  XAI: process.env.XAI_API_KEY,
  AIRFORCE: process.env.AIRFORCE_API_KEY,
  GROQ: process.env.GROQ_API_KEY
};

const BANCA_DATA = {
  "DIEGO GOMES DIAS": {
    oabs: { "BA": "77510", "CE": "52996-A", "MT": "34044-A", "PI": "22858", "RN": "21766A", "SP": "370.898" },
    endereco: "Av. São Miguel, nº 4810 – Jardim Cotinha – São Paulo – SP – CEP: 03870-100",
    email: "diego_gomesdias@yahoo.com.br",
    genero: "M"
  },
  "PABLO MATHEUS SILVA BASTOS PEREIRA": {
    oabs: { "SP": "520783", "MG": "249550", "PR": "520783", "RN": "520783", "PI": "520783", "MT": "520783", "CE": "520783", "BA": "520783", "SC": "520783", "ES": "520783", "MS": "520783" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-071",
    email: "pablobastos@adv.oabsp.org.br",
    genero: "M"
  }
};

const SYSTEM_PROMPT = `Você é o Arquiteto Jurídico Sênior da W1 Capital. 
Sua missão é extrair dados de documentos para gerar novas peças.

REGRAS OBRIGATÓRIAS DE EXTRAÇÃO:
1. NOME E DATA: O nome do cliente pode vir grudado com a data de nascimento (ex: Adriana Mesquita29/12/1975). SEPARE-OS.
2. EXTRAÇÃO DE CONTATO: Localize o e-mail e os telefones. Geralmente aparecem na mesma linha.
3. ENDEREÇO RESIDENCIAL: Ignore o endereço da Get Assessoria (Paraguassu Paulista). Capture o endereço do cliente.
4. Retorne EXCLUSIVAMENTE um JSON plano no formato:
{
  "cliente": { "nome": "", "cpf": "", "rg": "", "endereco": "", "cep": "", "dataNascimento": "", "email": "", "telefone": "", "estadoCivil": "", "profissao": "", "nacionalidade": "" },
  "processos": [{ "banco": "", "cnpjBanco": "", "numero": "", "acao": "", "estado": "" }]
}`;

/**
 * PROTOCOLO DE RESGATE HEURÍSTICO (REGEX) 3.0
 * Especialista em padrões GET Assessoria (Data grudada no nome, Email e Tel na mesma linha).
 */
function dumbExtract(text: string) {
  const cpfMatch = text.match(/\d{3}\.\d{3}\.\d{3}-\d{2}/) || text.match(/\d{11}/);
  const rgMatch = text.match(/\d{1,2}\.\d{3}\.\d{3}-[\dX]/i) || text.match(/\d{7,10}/);
  const cepMatch = text.match(/\d{5}-\d{3}/) || text.match(/\d{8}/);
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const telMatch = text.match(/\(\d{2}\)\d{4,5}-\d{4}/g);
  const dateMatch = text.match(/\d{2}\/\d{2}\/\d{4}/);
  
  const lines = text.split('\n').map(l => l.trim());
  let nome = "NÃO IDENTIFICADO";
  let endereco = "REVISAR MANUALMENTE";
  let dataNasc = dateMatch ? dateMatch[0] : "";

  for (const line of lines) {
    // Busca endereço (Linha com Rua/Av, vírgula e sem ser a sede da Get)
    if (endereco === "REVISAR MANUALMENTE" && 
        (line.toUpperCase().includes("RUA") || line.toUpperCase().includes("AV.")) && 
        line.includes(",") && 
        !line.includes("Paraguassu Paulista")) {
      endereco = line;
    }

    // Busca nome (Trata o caso do Nome29/12/1975)
    if (nome === "NÃO IDENTIFICADO" && 
        line.length > 10 && 
        !line.includes("SISTEMA") &&
        !line.includes("CONTRATO") &&
        !line.includes("AV.") &&
        !line.includes("@")) {
      
      let cleanName = line;
      // Se a data estiver grudada no final da linha
      const dateInLine = line.match(/\d{2}\/\d{2}\/\d{4}/);
      if (dateInLine) {
        cleanName = line.replace(dateInLine[0], '').trim();
        if (!dataNasc) dataNasc = dateInLine[0];
      }
      
      if (cleanName.split(' ').length >= 2) {
        nome = cleanName;
      }
    }
  }

  return {
    cliente: { 
      nome: nome.toUpperCase(), 
      cpf: cpfMatch ? cpfMatch[0] : "---", 
      rg: rgMatch ? rgMatch[0] : "---", 
      endereco: endereco.toUpperCase(), 
      cep: cepMatch ? cepMatch[0] : "",
      dataNascimento: dataNasc,
      email: emailMatch ? emailMatch[0] : "",
      telefone: telMatch ? telMatch[0] : ""
    },
    processos: [{ banco: "BANCO", numero: "S/N" }]
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
  } catch { return null; }
}

async function callNeuralEngine(text: string) {
  const engines = [
    { id: 'xai-grok', url: 'https://api.x.ai/v1/chat/completions', key: API_KEYS.XAI, model: 'grok-4.5', useJson: true },
    { id: 'airforce-deepseek', url: 'https://api.airforce/v1/chat/completions', key: API_KEYS.AIRFORCE, model: 'deepseek-v3', useJson: false },
    { id: 'groq-llama', url: 'https://api.groq.com/openai/v1/chat/completions', key: API_KEYS.GROQ, model: 'llama-3.3-70b-versatile', useJson: false }
  ];

  for (const engine of engines) {
    if (!engine.key) continue;
    try {
      const res = await fetch(engine.url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${engine.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: engine.model,
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: `DADOS DO DOCUMENTO:\n${text}` }],
          response_format: engine.useJson ? { type: 'json_object' } : undefined,
          temperature: 0.1
        }),
        signal: AbortSignal.timeout(45000)
      });
      if (!res.ok) continue;
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) continue;
      
      const parsed = cleanJsonResponse(content);
      if (parsed) return { ...parsed, engineUsed: engine.id.toUpperCase() };
    } catch { continue; }
  }
  return null;
}

export const documentFlow = ai.defineFlow(
  { name: 'documentFlow', inputSchema: z.any(), outputSchema: z.any() },
  async (input) => {
    const text = (input.text || "").substring(0, 25000);
    let parsed = await callNeuralEngine(text);

    // RESGATE HEURÍSTICO SE A IA FALHAR OU DADOS CRÍTICOS ESTIVEREM VAZIOS
    if (!parsed || !parsed.cliente?.endereco || parsed.cliente.endereco.includes("REVISAR") || !parsed.cliente.dataNascimento) {
      console.warn("[Triagem] IA incompleta. Iniciando resgate Heurístico 3.0...");
      const fallback = dumbExtract(text);
      if (!parsed) {
        parsed = { ...fallback, engineUsed: "RESGATE_HEURISTICO_3.0" };
      } else {
        // Preserva o que a IA acertou e completa com o Regex
        if (!parsed.cliente.endereco || parsed.cliente.endereco.includes("REVISAR")) parsed.cliente.endereco = fallback.cliente.endereco;
        if (!parsed.cliente.dataNascimento) parsed.cliente.dataNascimento = fallback.cliente.dataNascimento;
        if (!parsed.cliente.email) parsed.cliente.email = fallback.cliente.email;
        if (!parsed.cliente.telefone) parsed.cliente.telefone = fallback.cliente.telefone;
      }
    }

    const targetLawyer = input.preferredLawyer || "PABLO MATHEUS SILVA BASTOS PEREIRA";
    const lawyerInfo = (BANCA_DATA as any)[targetLawyer] || BANCA_DATA["PABLO MATHEUS SILVA BASTOS PEREIRA"];
    const finalState = (input.preferredState || parsed?.processos?.[0]?.estado || "SP").toUpperCase();
    const selectedOAB = lawyerInfo.oabs[finalState] || lawyerInfo.oabs["SP"] || Object.values(lawyerInfo.oabs)[0];

    return {
      cliente: {
        nome: (parsed?.cliente?.nome || "NÃO IDENTIFICADO").toUpperCase(),
        estadoCivil: parsed?.cliente?.estadoCivil || "casado(a)",
        profissao: parsed?.cliente?.profissao || "autônomo(a)",
        rg: parsed?.cliente?.rg || "---",
        cpf: parsed?.cliente?.cpf || "---",
        endereco: (parsed?.cliente?.endereco || "Não localizado").toUpperCase(),
        cep: parsed?.cliente?.cep || "",
        dataNascimento: parsed?.cliente?.dataNascimento || "",
        email: (parsed?.cliente?.email || "").toLowerCase(),
        telefone: parsed?.cliente?.telefone || "",
        genero: parsed?.cliente?.genero || 'M',
        nacionalidade: parsed?.cliente?.nacionalidade || 'brasileiro(a)'
      },
      advogado: {
        nome: targetLawyer.toUpperCase(),
        oab: selectedOAB,
        endereco: lawyerInfo.endereco,
        email: lawyerInfo.email,
        cargo: lawyerInfo.genero === 'F' ? 'advogada' : 'advogado',
      },
      processos: (parsed?.processos || []).map((p: any) => ({
        banco: (p.banco || "BANCO").toUpperCase(),
        cnpjBanco: p.cnpjBanco || '',
        numero: p.numero || "S/N",
        acao: p.acao || 'AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA',
        estado: finalState
      })),
      engineUsed: parsed.engineUsed
    };
  }
);

export async function extrairDadosProcuracao(input: any) {
  return await documentFlow(input);
}
