
'use server';
/**
 * @fileOverview Motor de Extração de Dados Jurídicos v620.0 ELITE
 * Núcleo: xAI (Grok 4.5) | Backup: Groq (Llama 3.3) | Reserva 1: Puter (Claude) | Reserva 2: Airforce (DeepSeek).
 * Proprietário: W1 Capital | Fundador: Davi Alves Figueredo
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DocumentInputSchema = z.object({
  text: z.string().describe('Texto bruto ou contrato do cliente.'),
  preferredLawyer: z.string().optional().describe('Nome do advogado selecionado.'),
  preferredState: z.string().optional().describe('Estado da OAB selecionado.'),
  preferredModel: z.string().optional().default('xai'),
});

const DocumentOutputSchema = z.object({
  cliente: z.object({
    nome: z.string(),
    estadoCivil: z.string(),
    profissao: z.string(),
    rg: z.string(),
    cpf: z.string(),
    endereco: z.string(),
    email: z.string(),
    genero: z.enum(['M', 'F']).default('M'),
  }),
  processos: z.array(z.object({
    banco: z.string(),
    cnpjBanco: z.string().optional().default(''),
    numero: z.string(),
    acao: z.string().default('AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA'),
    estado: z.string().optional(),
  })),
  advogado: z.object({
    nome: z.string(),
    oab: z.string(),
    endereco: z.string(),
    email: z.string(),
    cargo: z.string().default('advogado'),
  }),
});

export type DocumentOutput = z.infer<typeof DocumentOutputSchema>;

const XAI_API_KEY = 'xai-m2nfN0fkMwh5sbe0tKgoAAQxOfCF3pfb2OLjgE4FOxxMkqiMuTsTAtNoMrfxuYWfon3f4ryyMUPl3fDE';
const AIRFORCE_API_KEY = 'sk-air-Rxc7ygo5b0XpkZqUBqwSnhjwS0bZbWFnzwRLjfPtdAbYK6nj';

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

const SYSTEM_PROMPT = `Você é o Arquiteto Jurídico da W1 Capital. Extraia os dados do contrato.
RETORNE APENAS JSON PLANO. Não inclua Markdown.
{
  "cliente": { "nome": "", "estadoCivil": "", "profissao": "", "rg": "", "cpf": "", "endereco": "", "email": "", "genero": "M"|"F" },
  "processos": [{ "banco": "", "cnpjBanco": "", "numero": "", "acao": "AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA", "estado": "UF" }]
}`;

function cleanJsonResponse(text: string): string {
  if (!text) return "{}";
  let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

async function callXAIExtraction(text: string) {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${XAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'grok-4.5',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: `CONTRATO: ${text.substring(0, 5000)}` }],
      response_format: { type: 'json_object' }
    })
  });
  if (!response.ok) throw new Error(`XAI_ERR_${response.status}`);
  const data = await response.json();
  return JSON.parse(cleanJsonResponse(data.choices[0].message.content));
}

async function callAirforceExtraction(text: string) {
  const response = await fetch('https://api.airforce/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AIRFORCE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deepseek-v3',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: `CONTRATO: ${text.substring(0, 5000)}` }]
    })
  });
  if (!response.ok) throw new Error(`AIRFORCE_ERR_${response.status}`);
  const data = await response.json();
  return JSON.parse(cleanJsonResponse(data.choices[0].message.content));
}

async function callGroqExtraction(text: string) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: `CONTRATO: ${text.substring(0, 5000)}` }],
      response_format: { type: 'json_object' }
    })
  });
  if (!response.ok) throw new Error(`GROQ_ERR_${response.status}`);
  const data = await response.json();
  return JSON.parse(cleanJsonResponse(data.choices[0].message.content));
}

async function callPuterExtraction(text: string) {
  const response = await fetch('https://api.puter.com/v2/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-5', messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: `CONTRATO: ${text.substring(0, 5000)}` }] })
  });
  if (!response.ok) throw new Error(`PUTER_ERR_${response.status}`);
  const data = await response.json();
  return JSON.parse(cleanJsonResponse(data.message.content[0].text));
}

export const documentFlow = ai.defineFlow(
  {
    name: 'documentFlow',
    inputSchema: DocumentInputSchema,
    outputSchema: DocumentOutputSchema,
  },
  async (input) => {
    let parsed: any = null;
    const model = input.preferredModel;
    
    try {
      if (model === 'xai') parsed = await callXAIExtraction(input.text);
      else if (model === 'airforce') parsed = await callAirforceExtraction(input.text);
      else if (model === 'puter') parsed = await callPuterExtraction(input.text);
      else parsed = await callGroqExtraction(input.text);
    } catch (e) {
      try { parsed = await callGroqExtraction(input.text); }
      catch (e2) {
        try { parsed = await callAirforceExtraction(input.text); }
        catch (e3) { parsed = await callPuterExtraction(input.text); }
      }
    }

    if (!parsed) throw new Error("FALHA_MOTORES_NEURAIS");

    const targetLawyer = input.preferredLawyer || "PABLO MATHEUS SILVA BASTOS PEREIRA";
    const lawyerInfo = (BANCA_DATA as any)[targetLawyer] || BANCA_DATA["PABLO MATHEUS SILVA BASTOS PEREIRA"];
    const rawProcessos = parsed.processos || parsed.processo || [];
    const processosArray = Array.isArray(rawProcessos) ? rawProcessos : [rawProcessos];
    const finalState = (input.preferredState || processosArray[0]?.estado || "SP").toUpperCase();
    const selectedOAB = (lawyerInfo.oabs as any)[finalState] || (lawyerInfo.oabs as any)["SP"];

    return {
      cliente: {
        nome: (parsed.cliente?.nome || "NÃO IDENTIFICADO").toUpperCase(),
        estadoCivil: parsed.cliente?.estadoCivil || "casado(a)",
        profissao: parsed.cliente?.profissao || "autônomo(a)",
        rg: parsed.cliente?.rg || "---",
        cpf: parsed.cliente?.cpf || "---",
        endereco: parsed.cliente?.endereco || "Não localizado",
        email: parsed.cliente?.email || "---",
        genero: parsed.cliente?.genero || 'M',
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
