'use server';
/**
 * @fileOverview Motor de Auditoria 3D v750.0 ELITE
 * Núcleo: xAI (Grok 4.5) | Backup 1: Airforce (DeepSeek V3) | Backup 2: Groq (Llama 3.3).
 * Proprietário: W1 Capital | Fundador: Davi Alves Figueredo
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {fetchDataJud} from '@/lib/datajud';

const API_KEYS = {
  XAI: 'xai-m2nfN0fkMwh5sbe0tKgoAAQxOfCF3pfb2OLjgE4FOxxMkqiMuTsTAtNoMrfxuYWfon3f4ryyMUPl3fDE',
  AIRFORCE: 'sk-air-Rxc7ygo5b0XpkZqUBqwSnhjwS0bZbWFnzwRLjfPtdAbYK6nj',
  GROQ: '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'
};

const SYSTEM_INSTRUCTIONS = `Você é o Veredito AI v750.0 Elite da W1 Capital. 
Analise os dados do DataJud e retorne APENAS JSON plano. Não inclua markdown.
{ "resumoTecnico": "", "analiseRisco": "", "proximosPassos": "", "mensagemCliente": "" }`;

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

async function callXAI(datajud: any) {
  try {
    const res = await fetchWithTimeout('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEYS.XAI}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'grok-4.5',
        messages: [{ role: 'system', content: SYSTEM_INSTRUCTIONS }, { role: 'user', content: `DADOS: ${JSON.stringify(datajud).substring(0, 8000)}` }],
        response_format: { type: 'json_object' }
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return cleanJsonResponse(data?.choices?.[0]?.message?.content);
  } catch (e) { return null; }
}

async function callAirforce(datajud: any) {
  try {
    const res = await fetchWithTimeout('https://api.airforce/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEYS.AIRFORCE}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-v3',
        messages: [{ role: 'system', content: SYSTEM_INSTRUCTIONS }, { role: 'user', content: `DADOS: ${JSON.stringify(datajud).substring(0, 8000)}` }]
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return cleanJsonResponse(data?.choices?.[0]?.message?.content);
  } catch (e) { return null; }
}

async function callGroq(datajud: any) {
  try {
    const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEYS.GROQ}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: SYSTEM_INSTRUCTIONS }, { role: 'user', content: `DADOS: ${JSON.stringify(datajud).substring(0, 8000)}` }],
        response_format: { type: 'json_object' }
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return cleanJsonResponse(data?.choices?.[0]?.message?.content);
  } catch (e) { return null; }
}

export const vereditoAIFlow = ai.defineFlow(
  { name: 'vereditoAIFlow', inputSchema: z.any(), outputSchema: z.any() },
  async input => {
    const dataJudData = await fetchDataJud(input.cnj);
    const engines = [{ id: 'xai', call: callXAI }, { id: 'airforce', call: callAirforce }, { id: 'grok', call: callGroq }];
    const model = input.preferredModel || 'xai';
    const sorted = [engines.find(e => e.id === model) || engines[0], ...engines.filter(e => e.id !== model)].filter(Boolean);

    for (const engine of sorted) {
      try {
        const result = await engine!.call(dataJudData);
        if (result && result.resumoTecnico) return { ...result, dataJudRaw: dataJudData, engineUtilizada: engine!.id.toUpperCase() };
      } catch (e) {}
    }
    return { resumoTecnico: "", error: true };
  }
);

export async function executarVereditoAI(input: any) {
  return await vereditoAIFlow(input);
}
