/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 */
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const API_KEYS = {
  XAI: process.env.XAI_API_KEY,
  AIRFORCE: process.env.AIRFORCE_API_KEY,
  GROQ: process.env.GROQ_API_KEY
};

const SYSTEM_PROMPT = `Você é o Arquiteto Jurídico Sênior Elite. 
Sua missão é extrair dados de documentos e leads da GET ASSESSORIA.

REGRAS OBRIGATÓRIAS:
1. DATA NASCIMENTO: Identifique a data DD/MM/AAAA. Ela vem colada ao final do nome do cliente. Separe-as.
2. BANCO: Localize o "Banco responsável" no objeto do contrato. Ex: "Banco responsável: Votorantim".
3. CONTATO: Capture e-mail e telefones.
4. ENDEREÇO: Priorize o endereço do CONTRATANTE (Rua/Av).
5. Retorne EXCLUSIVAMENTE um JSON plano no formato:
{
  "cliente": { "nome": "", "cpf": "", "rg": "", "endereco": "", "cep": "", "dataNascimento": "", "email": "", "telefone": "", "estadoCivil": "", "profissao": "", "nacionalidade": "" },
  "processos": [{ "banco": "", "cnpjBanco": "", "numero": "", "acao": "", "estado": "" }]
}`;

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

function dumbExtract(text: string) {
  const cpfMatch = text.match(/\d{3}\.\d{3}\.\d{3}-\d{2}/) || text.match(/\d{11}/);
  const rgMatch = text.match(/\d{1,2}\.\d{3}\.\d{3}-[\dX]/i) || text.match(/\d{7,10}/);
  const dateMatch = text.match(/\d{2}\/\d{2}\/\d{4}/);
  const bankMatch = text.match(/Banco responsável:\s*([^\n\r]*)/i);
  
  let dataNasc = dateMatch ? dateMatch[0] : "";
  let endereco = "REVISAR MANUALMENTE";
  const lines = text.split('\n').map(l => l.trim());
  for (const line of lines) {
    if ((line.startsWith('Rua') || line.startsWith('Av')) && line.includes(',') && !line.includes('Paraguassu')) {
      endereco = line.toUpperCase();
    }
  }

  return {
    cliente: { 
      nome: "REVISAR", 
      cpf: cpfMatch ? cpfMatch[0] : "---", 
      rg: rgMatch ? rgMatch[0] : "---", 
      endereco: endereco, 
      dataNascimento: dataNasc
    },
    processos: [{ banco: bankMatch ? bankMatch[1].trim() : "BANCO", numero: "S/N", acao: "AÇÃO DE REVISÃO CONTRATUAL" }]
  };
}

async function callNeuralEngine(text: string) {
  const engines = [
    { id: 'xai-grok', url: 'https://api.x.ai/v1/responses', key: API_KEYS.XAI, model: 'grok-4.5' },
    { id: 'airforce-deepseek', url: 'https://api.airforce/v1/chat/completions', key: API_KEYS.AIRFORCE, model: 'deepseek-v3' }
  ];

  for (const engine of engines) {
    if (!engine.key) continue;
    try {
      const isResponses = engine.url.endsWith('/responses');
      const messages = [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: `TEXTO:\n${text}` }];
      
      const body: any = { model: engine.model, temperature: 0.1 };
      if (isResponses) {
        body.input = messages;
        body.reasoning_effort = "high";
      } else {
        body.messages = messages;
      }

      const res = await fetch(engine.url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${engine.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(45000)
      });
      
      if (!res.ok) continue;
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || data?.output?.message?.content;
      const parsed = cleanJsonResponse(content);
      if (parsed) return parsed;
    } catch { continue; }
  }
  return null;
}

export const documentFlow = ai.defineFlow(
  { name: 'documentFlow', inputSchema: z.any(), outputSchema: z.any() },
  async (input) => {
    const text = (input.text || "").substring(0, 20000);
    let parsed = await callNeuralEngine(text);
    if (!parsed) parsed = dumbExtract(text);
    return parsed;
  }
);

export async function extrairDadosProcuracao(input: any) {
  return await documentFlow(input);
}