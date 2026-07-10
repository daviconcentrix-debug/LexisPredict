'use server';
/**
 * @fileOverview Motor de Consultoria Estratégica LexisPredict v650.0 Elite
 * Núcleo: xAI (Grok 4.5) | Redundância: Groq (Llama 3.3) | Reserva 1: Puter (Claude) | Reserva 2: Airforce (DeepSeek).
 * @fileOverview Motor de Consultoria Estratégica v750.0 ELITE
 * Núcleo: xAI (Grok 4.5) | Backup 1: Airforce (DeepSeek V3) | Backup 2: Groq (Llama 3.3).
* Proprietário: W1 Capital | Fundador: Davi Alves Figueredo
*/

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatInputSchema = z.object({
  pergunta: z.string().describe('A pergunta atual do usuário.'),
  historico: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional().default([]).describe('O histórico de mensagens anteriores para contexto.'),
  preferredModel: z.enum(['grok', 'xai', 'puter', 'airforce']).optional().default('xai'),
  deepThinking: z.boolean().optional().default(false),
});

const ChatOutputSchema = z.object({
  resposta: z.string().describe('A resposta estratégica completa.'),
  engineUtilizada: z.string().optional()
});

const SYSTEM_PROMPT = `Você é o Consultor Estratégico Sênior de Elite da W1 Capital.
Sua missão é fornecer orientações técnicas e resolutivas sobre processos judiciais brasileiros.

DIRETRIZES DE OURO:
1. MEMÓRIA: Utilize o histórico para manter a continuidade do raciocínio.
2. COMPLETUDE: Entregue a análise completa, sem cortes.
3. TOM: Profissional, assertivo e focado em resultados para o Gabinete.
4. FORMATO: Responda de forma estratégica, identificando riscos.
5. ASSINATURA: Finalize sempre com "Gabinete Técnico — W1 Capital".

RESTRIÇÃO: Retorne APENAS um JSON plano no formato: { "resposta": "todo_o_texto" }. Não inclua explicações fora do JSON.`;

const XAI_API_KEY = 'xai-m2nfN0fkMwh5sbe0tKgoAAQxOfCF3pfb2OLjgE4FOxxMkqiMuTsTAtNoMrfxuYWfon3f4ryyMUPl3fDE';
const AIRFORCE_API_KEY = 'sk-air-Rxc7ygo5b0XpkZqUBqwSnhjwS0bZbWFnzwRLjfPtdAbYK6nj';

function cleanJsonResponse(text: string): string {
  if (!text) return "{}";
  let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
const API_KEYS = {
  XAI: 'xai-m2nfN0fkMwh5sbe0tKgoAAQxOfCF3pfb2OLjgE4FOxxMkqiMuTsTAtNoMrfxuYWfon3f4ryyMUPl3fDE',
  AIRFORCE: 'sk-air-Rxc7ygo5b0XpkZqUBqwSnhjwS0bZbWFnzwRLjfPtdAbYK6nj',
  GROQ: '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'
};

const SYSTEM_PROMPT = `Você é o Consultor Estratégico Sênior da W1 Capital. Forneça orientações técnicas resolutivas.
RETORNE APENAS JSON PLANO: { "resposta": "todo_o_texto" }. Não use markdown explicativo.
Assine sempre como: "Gabinete Técnico — W1 Capital".`;

function cleanJsonResponse(text: string): any {
  if (!text) return null;
  try {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      return JSON.parse(text.substring(firstBrace, lastBrace + 1));
    }
    return null;
  } catch (e) { return null; }
}

async function callXAIChat(pergunta: string, historico: any[], deepThinking: boolean) {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${XAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'grok-4.5',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...historico, { role: 'user', content: pergunta }],
      temperature: deepThinking ? 0.2 : 0.5,
      response_format: { type: 'json_object' }
    })
  });
  if (!response.ok) throw new Error(`XAI_ERR_${response.status}`);
  const data = await response.json();
  const content = JSON.parse(cleanJsonResponse(data.choices[0].message.content));
  return { resposta: content.resposta || data.choices[0].message.content };
async function fetchWithTimeout(url: string, options: any, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function callAirforceChat(pergunta: string, historico: any[]) {
  const response = await fetch('https://api.airforce/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AIRFORCE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deepseek-v3',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...historico, { role: 'user', content: pergunta }],
      temperature: 0.3
    })
  });
  if (!response.ok) throw new Error(`AIRFORCE_ERR_${response.status}`);
  const data = await response.json();
  const content = JSON.parse(cleanJsonResponse(data.choices[0].message.content));
  return { resposta: content.resposta || data.choices[0].message.content };
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
    if (!res.ok) return null;
    const data = await res.json();
    return cleanJsonResponse(data?.choices?.[0]?.message?.content);
  } catch (e) { return null; }
}

async function callGroqChat(pergunta: string, historico: any[], deepThinking: boolean) {
  const GROQ_API_KEY = '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';
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...historico, { role: 'user', content: pergunta }],
      temperature: deepThinking ? 0.1 : 0.4,
      response_format: { type: 'json_object' }
    })
  });
  if (!response.ok) throw new Error(`GROQ_CHAT_ERR_${response.status}`);
  const data = await response.json();
  const content = JSON.parse(cleanJsonResponse(data.choices[0].message.content));
  return { resposta: content.resposta || data.choices[0].message.content };
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
    if (!res.ok) return null;
    const data = await res.json();
    return cleanJsonResponse(data?.choices?.[0]?.message?.content);
  } catch (e) { return null; }
}

async function callPuterChat(pergunta: string, historico: any[]) {
  const response = await fetch('https://api.puter.com/v2/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-5', messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...historico, { role: 'user', content: pergunta }], stream: false })
  });
  if (!response.ok) throw new Error(`PUTER_CHAT_ERR_${response.status}`);
  const data = await response.json();
  const content = JSON.parse(cleanJsonResponse(data.message.content[0].text));
  return { resposta: content.resposta || data.message.content[0].text };
async function callGroq(pergunta: string, historico: any[]) {
  try {
    const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEYS.GROQ}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...historico, { role: 'user', content: pergunta }],
        response_format: { type: 'json_object' }
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return cleanJsonResponse(data?.choices?.[0]?.message?.content);
  } catch (e) { return null; }
}

export const chatAIFlow = ai.defineFlow(
  {
    name: 'chatAIFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  { name: 'chatAIFlow', inputSchema: z.any(), outputSchema: z.any() },
async input => {
    const hist = Array.isArray(input.historico) ? input.historico : [];
    const model = input.preferredModel;
    
const engines = [
      { id: 'xai', call: (p: string, h: any[]) => callXAIChat(p, h, input.deepThinking) },
      { id: 'grok', call: (p: string, h: any[]) => callGroqChat(p, h, input.deepThinking) },
      { id: 'airforce', call: (p: string, h: any[]) => callAirforceChat(p, h) },
      { id: 'puter', call: (p: string, h: any[]) => callPuterChat(p, h) }
      { id: 'xai', call: callXAI },
      { id: 'airforce', call: callAirforce },
      { id: 'grok', call: callGroq }
];

    const sortedEngines = [
      engines.find(e => e.id === model) || engines[0],
      ...engines.filter(e => e.id !== model)
    ].filter(Boolean);
    const model = input.preferredModel || 'xai';
    const sorted = [engines.find(e => e.id === model) || engines[0], ...engines.filter(e => e.id !== model)].filter(Boolean);

    for (const engine of sortedEngines) {
    for (const engine of sorted) {
try {
        const res = await engine!.call(input.pergunta, hist);
        return { ...res, engineUtilizada: engine!.id.toUpperCase() };
      } catch (e) {
        console.error(`Chat motor ${engine!.id} falhou.`);
      }
        const res = await engine!.call(input.pergunta, input.historico || []);
        if (res && res.resposta) return { resposta: res.resposta, engineUtilizada: engine!.id.toUpperCase() };
      } catch (e) {}
}
    
    throw new Error("FALHA_SISTEMA_CHAT_TOTAL");
    return { resposta: "FALHA_SISTEMA_TOTAL", error: true };
}
);
