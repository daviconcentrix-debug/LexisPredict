
'use server';
/**
 * @fileOverview Motor de Consultoria Estratégica v9600.0 ELITE
 * Núcleo: Pentade de Motores Neurais com Resgate de Texto Plano.
 * Proprietário: W1 Capital | Versão: SaaS White-Label
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const API_KEYS = {
  XAI: 'xai-m2nfN0fkMwh5sbe0tKgoAAQxOfCF3pfb2OLjgE4FOxxMkqiMuTsTAtNoMrfxuYWfon3f4ryyMUPl3fDE',
  AIRFORCE: 'sk-air-Rxc7ygo5b0XpkZqUBqwSnhjwS0bZbWFnzwRLjfPtdAbYK6nj',
  GROQ: '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'
};

const SYSTEM_PROMPT = `Você é o Consultor Estratégico Sênior do Gabinete Jurídico Get Assessoria. 
REGRAS DE OURO:
1. CURTO E DIRETO. Máximo 8 linhas.
2. Defenda os interesses da Assessoria em todas as respostas.
3. Se o cliente questionar valores, cite a Cláusula 3.2 do contrato (Custas do Juiz são responsabilidade do cliente).
4. Tom profissional, transparente e resolutivo.
5. Assine como Setor Processual.
RETORNE JSON: { "resposta": "texto_aqui" } ou apenas o texto direto.`;

/**
 * Função de Limpeza Forense de Resposta IA
 * Tenta extrair JSON, se falhar, retorna o texto bruto como resposta.
 */
function cleanJsonResponse(text: string): any {
  if (!text) return null;
  try {
    let clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      const parsed = JSON.parse(clean.substring(firstBrace, lastBrace + 1));
      if (parsed.resposta) return parsed;
    }
    // Fallback: Se não é JSON ou não tem a chave, usa o texto todo
    return { resposta: text.trim() };
  } catch (e) { 
    return { resposta: text.trim() }; 
  }
}

async function fetchWithTimeout(url: string, options: any, timeout = 12000) {
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

async function callXAI(pergunta: string, historico: any[]) {
  const res = await fetchWithTimeout('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEYS.XAI}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'grok-4.5',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...historico, { role: 'user', content: pergunta }],
      response_format: { type: 'json_object' }
    })
  });
  if (!res?.ok) return null;
  const data = await res.json();
  return cleanJsonResponse(data?.choices?.[0]?.message?.content);
}

async function callAirforce(pergunta: string, historico: any[]) {
  const res = await fetchWithTimeout('https://api.airforce/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEYS.AIRFORCE}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deepseek-v3',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...historico, { role: 'user', content: pergunta }]
    })
  });
  if (!res?.ok) return null;
  const data = await res.json();
  return cleanJsonResponse(data?.choices?.[0]?.message?.content);
}

async function callGroqLlama(pergunta: string, historico: any[]) {
  const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEYS.GROQ}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...historico, { role: 'user', content: pergunta }]
    })
  });
  if (!res?.ok) return null;
  const data = await res.json();
  return cleanJsonResponse(data?.choices?.[0]?.message?.content);
}

export const chatAIFlow = ai.defineFlow(
  { name: 'chatAIFlow', inputSchema: z.any(), outputSchema: z.any() },
  async input => {
    const engines = [
      { id: 'xai', call: callXAI },
      { id: 'airforce', call: callAirforce },
      { id: 'groq-llama', call: callGroqLlama }
    ];

    const modelId = input.preferredModel || 'xai';
    const sortedEngines = [
      engines.find(e => e.id === modelId) || engines[0],
      ...engines.filter(e => e.id !== modelId)
    ];

    for (const engine of sortedEngines) {
      try {
        const res = await engine.call(input.pergunta, input.historico || []);
        if (res && res.resposta) return { resposta: res.resposta, engineUtilizada: engine.id.toUpperCase() };
      } catch (e) {
        console.warn(`Engine ${engine.id} falhou, tentando fallback...`);
      }
    }

    return { resposta: "SISTEMA_INDISPONIVEL_TEMPORARIAMENTE", error: true };
  }
);

export async function perguntarIA(input: any) {
  try {
    const result = await chatAIFlow(input);
    return result;
  } catch (e: any) {
    return { resposta: "ERRO_CONEXÃO_NEURAL", error: true };
  }
}
