'use server';
/**
 * @fileOverview Motor de Auditoria 3D v900.0 ELITE
 * Núcleo: Pentade de Motores Neurais com Timeouts Estendidos e Filtro de Erros.
 * Proprietário: W1 Capital | Versão: SaaS White-Label
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {fetchDataJud} from '@/lib/datajud';

const API_KEYS = {
  XAI: 'xai-m2nfN0fkMwh5sbe0tKgoAAQxOfCF3pfb2OLjgE4FOxxMkqiMuTsTAtNoMrfxuYWfon3f4ryyMUPl3fDE',
  AIRFORCE: 'sk-air-Rxc7ygo5b0XpkZqUBqwSnhjwS0bZbWFnzwRLjfPtdAbYK6nj',
  GROQ: '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'
};

const SYSTEM_INSTRUCTIONS = `Você é o Veredito AI Elite do Gabinete Jurídico Get Assessoria. 
Analise os dados processuais e retorne um parecer técnico-comercial em JSON.
REGRAS:
1. RESUMO DIRETO (MÁX 6 LINHAS).
2. Defenda os interesses da Assessoria.
3. Se houver menção a custos, cite a Cláusula 3.2.
FORMATO:
{ "resumoTecnico": "", "analiseRisco": "", "proximosPassos": "", "mensagemCliente": "" }`;

function cleanJsonResponse(text: string): any {
  if (!text) return null;
  
  const textLower = text.toLowerCase();
  const errorIndicators = ['discord.gg', 'rate limit', 'quota exceeded', 'api error', 'not found', 'insufficient'];
  if (errorIndicators.some(indicator => textLower.includes(indicator))) return null;

  try {
    let clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      const parsed = JSON.parse(clean.substring(firstBrace, lastBrace + 1));
      if (parsed.resumoTecnico) return parsed;
    }
    return null;
  } catch (e) { return null; }
}

async function fetchWithTimeout(url: string, options: any, timeout = 25000) {
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

async function callXAI(datajud: any) {
  const res = await fetchWithTimeout('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEYS.XAI}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'grok-4.5',
      messages: [{ role: 'system', content: SYSTEM_INSTRUCTIONS }, { role: 'user', content: `DADOS: ${JSON.stringify(datajud).substring(0, 8000)}` }],
      response_format: { type: 'json_object' }
    })
  });
  if (!res?.ok) return null;
  const data = await res.json();
  return cleanJsonResponse(data?.choices?.[0]?.message?.content);
}

async function callGroqLlama(datajud: any) {
  const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEYS.GROQ}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: SYSTEM_INSTRUCTIONS }, { role: 'user', content: `DADOS: ${JSON.stringify(datajud).substring(0, 8000)}` }],
      response_format: { type: 'json_object' }
    })
  });
  if (!res?.ok) return null;
  const data = await res.json();
  return cleanJsonResponse(data?.choices?.[0]?.message?.content);
}

async function callGroqDeepSeek(datajud: any) {
  const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEYS.GROQ}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deepseek-r1-distill-llama-70b',
      messages: [{ role: 'system', content: SYSTEM_INSTRUCTIONS }, { role: 'user', content: `DADOS: ${JSON.stringify(datajud).substring(0, 8000)}` }]
    })
  });
  if (!res?.ok) return null;
  const data = await res.json();
  return cleanJsonResponse(data?.choices?.[0]?.message?.content);
}

export const vereditoAIFlow = ai.defineFlow(
  { name: 'vereditoAIFlow', inputSchema: z.any(), outputSchema: z.any() },
  async input => {
    try {
      const dataJudData = await fetchDataJud(input.cnj);
      if (!dataJudData) return { resumoTecnico: "", error: true, message: "PROCESSO_NAO_LOCALIZADO" };

      const engines = [
        { id: 'xai', call: callXAI },
        { id: 'groq-llama', call: callGroqLlama },
        { id: 'groq-deepseek', call: callGroqDeepSeek }
      ];
      
      const model = input.preferredModel || 'xai';
      const sorted = [engines.find(e => e.id === model) || engines[0], ...engines.filter(e => e.id !== model)].filter(Boolean);

      for (const engine of sorted) {
        try {
          const result = await engine!.call(dataJudData);
          if (result && result.resumoTecnico) {
            return { ...result, dataJudRaw: dataJudData, engineUtilizada: engine!.id.toUpperCase(), success: true };
          }
        } catch (e) {
          console.error(`[IA] Engine ${engine!.id} fail...`);
        }
      }
      return { resumoTecnico: "", error: true, message: "FALHA_MOTORES_NEURAIS" };
    } catch (criticalError: any) {
      return { resumoTecnico: "", error: true, message: "ERRO_INTERNO_GABINETE" };
    }
  }
);

export async function executarVereditoAI(input: any) {
  return await vereditoAIFlow(input);
}
