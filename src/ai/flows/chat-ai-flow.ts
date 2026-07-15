
'use server';
/**
 * @fileOverview Motor de Consultoria Estratégica v9500.0 ELITE
 * Núcleo: Pentade de Motores (xAI, Airforce, 2x Groq, Puter)
 * Proprietário: W1 Capital | Versão: SaaS White-Label
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const API_KEYS = {
  XAI: 'xai-m2nfN0fkMwh5sbe0tKgoAAQxOfCF3pfb2OLjgE4FOxxMkqiMuTsTAtNoMrfxuYWfon3f4ryyMUPl3fDE',
  AIRFORCE: 'sk-air-Rxc7ygo5b0XpkZqUBqwSnhjwS0bZbWFnzwRLjfPtdAbYK6nj',
  GROQ: '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'
};

const SYSTEM_PROMPT = `Você é o Consultor Estratégico Sênior do Gabinete Jurídico. 
REGRAS DE OURO:
1. CURTO E DIRETO. Máximo 6 linhas.
2. Defenda os interesses da Assessoria/Escritório em todas as respostas.
3. Se o cliente questionar valores, cite a Cláusula 3.2 do contrato (Custas do Juiz/Justiça são responsabilidade do cliente se a gratuidade for indeferida).
4. Separe: Honorários da Assessoria ≠ Custas do Juiz.
5. Estrutura: Reconhecer -> Fato/Prova -> Posição -> Próximo Passo.
6. Assine: Gabinete Técnico.
RETORNE APENAS JSON PLANO: { "resposta": "todo_o_texto" }.`;

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

async function fetchWithTimeout(url: string, options: any, timeout = 10000) {
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
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...historico, { role: 'user', content: pergunta }],
      response_format: { type: 'json_object' }
    })
  });
  if (!res?.ok) return null;
  const data = await res.json();
  return cleanJsonResponse(data?.choices?.[0]?.message?.content);
}

async function callGroqDeepSeek(pergunta: string, historico: any[]) {
  const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEYS.GROQ}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deepseek-r1-distill-llama-70b',
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
      { id: 'groq-llama', call: callGroqLlama },
      { id: 'groq-deepseek', call: callGroqDeepSeek }
    ];

    const modelId = input.preferredModel || 'xai';
    const engine = engines.find(e => e.id === modelId) || engines[0];

    try {
      const res = await engine.call(input.pergunta, input.historico || []);
      if (res && res.resposta) return { resposta: res.resposta, engineUtilizada: engine.id.toUpperCase() };
    } catch (e) {}

    // Fallback circular de segurança
    for (const fallback of engines.filter(e => e.id !== modelId)) {
      try {
        const res = await fallback.call(input.pergunta, input.historico || []);
        if (res && res.resposta) return { resposta: res.resposta, engineUtilizada: fallback.id.toUpperCase() };
      } catch (e) {}
    }

    return { resposta: "SISTEMA_INDISPONIVEL_CONTATE_TI", error: true };
  }
);

export async function perguntarIA(input: any) {
  try {
    const result = await chatAIFlow(input);
    return result;
  } catch (e: any) {
    return { resposta: e.message || "ERRO_SISTEMA_AÇÃO", error: true };
  }
}
