'use server';
/**
 * @fileOverview Motor de Consultoria Estratégica v9960.0 ELITE
 * Núcleo: Cascata Neural de Resiliência com Filtro de Ruído de Provedor.
 * Protocolo de Resgate de Texto Plano: Se não for JSON, trata como Texto Útil.
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
1. CURTO E DIRETO. Máximo 10 linhas.
2. Defenda os interesses da Assessoria em todas as respostas.
3. Se o cliente questionar valores, cite a Cláusula 3.2 do contrato (Custas do Juiz são responsabilidade do cliente).
4. Tom profissional, transparente e resolutivo.
5. Assine sempre como Setor Processual.
6. PREFIRA RETORNAR JSON: { "resposta": "texto_aqui" }`;

/**
 * Limpeza Forense com Filtro de Erros e Resgate de Texto Plano
 */
function cleanJsonResponse(text: string): any {
  if (!text || typeof text !== 'string') return null;

  const textLower = text.toLowerCase();
  
  // Lista de bloqueio de ruído de provedores (Filtro de Falsos Sucessos)
  const errorIndicators = [
    'discord.gg', 'rate limit', 'quota exceeded', 'api error', 
    'unauthorized', '404', 'not found', 'join our server', 
    'insufficient balance', 'system unavailable', 'retry later',
    'internal server error', 'bad gateway', 'insufficient'
  ];
  
  if (errorIndicators.some(indicator => textLower.includes(indicator))) {
    return null; 
  }

  try {
    let clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      const parsed = JSON.parse(clean.substring(firstBrace, lastBrace + 1));
      const content = parsed.resposta || parsed.answer || parsed.content || parsed.message;
      if (content && content.length > 5) return { resposta: content };
    }
    
    // Protocolo de Resgate de Texto Plano: Se não for JSON mas for texto útil e não for erro
    if (text.trim().length > 15) {
      return { resposta: text.trim() };
    }
    return null;
  } catch (e) { 
    return text.trim().length > 15 ? { resposta: text.trim() } : null; 
  }
}

async function fetchWithTimeout(url: string, options: any, timeout = 22000) {
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
  try {
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
  } catch (e) { return null; }
}

async function callGroqLlama(pergunta: string, historico: any[]) {
  try {
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
  } catch (e) { return null; }
}

async function callGroqDeepSeek(pergunta: string, historico: any[]) {
  try {
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
  } catch (e) { return null; }
}

async function callAirforce(pergunta: string, historico: any[]) {
  try {
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
  } catch (e) { return null; }
}

export const chatAIFlow = ai.defineFlow(
  { name: 'chatAIFlow', inputSchema: z.any(), outputSchema: z.any() },
  async input => {
    const engines = [
      { id: 'xai', call: callXAI },
      { id: 'groq-llama', call: callGroqLlama },
      { id: 'groq-deepseek', call: callGroqDeepSeek },
      { id: 'airforce', call: callAirforce }
    ];

    const modelId = input.preferredModel || 'xai';
    const sortedEngines = [
      engines.find(e => e.id === modelId) || engines[0],
      ...engines.filter(e => e.id !== modelId)
    ];

    for (const engine of sortedEngines) {
      try {
        const res = await engine.call(input.pergunta, input.historico || []);
        if (res && res.resposta && res.resposta.length > 5) {
          return { resposta: res.resposta, engineUtilizada: engine.id.toUpperCase() };
        }
      } catch (e) {
        // Pula silenciosamente para o próximo motor
      }
    }

    return { error: true, fallback: true };
  }
);

export async function perguntarIA(input: any) {
  try {
    const res = await chatAIFlow(input);
    if (!res || res.error) return { error: true, fallback: true };
    return res;
  } catch (e: any) {
    return { error: true, fallback: true };
  }
}
