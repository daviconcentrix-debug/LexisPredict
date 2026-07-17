/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 */
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {fetchDataJud} from '@/lib/datajud';

const API_KEYS = {
  XAI: process.env.XAI_API_KEY,
  AIRFORCE: process.env.AIRFORCE_API_KEY,
  GROQ: process.env.GROQ_API_KEY
};

const SYSTEM_INSTRUCTIONS = `Você é o Veredito AI Elite v5.0. 
Analise os dados processuais e retorne um parecer rigoroso em JSON.

FORMATO JSON OBRIGATÓRIO:
{ 
  "resumoTecnico": "Máximo 6 linhas", 
  "analiseRisco": "Análise técnica de risco", 
  "proximosPassos": "Estratégia operativa", 
  "mensagemCliente": "Texto para WhatsApp assinado pelo Setor Processual" 
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

async function callNeuralEngine(context: string) {
  const engines = [
    { id: 'xai-grok', url: 'https://api.x.ai/v1/responses', key: API_KEYS.XAI, model: 'grok-4.5' },
    { id: 'airforce-deepseek', url: 'https://api.airforce/v1/chat/completions', key: API_KEYS.AIRFORCE, model: 'deepseek-v3' }
  ];

  for (const engine of engines) {
    if (!engine.key) continue;
    try {
      const isResponses = engine.url.endsWith('/responses');
      const messages = [{ role: 'system', content: SYSTEM_INSTRUCTIONS }, { role: 'user', content: context }];
      
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

export const vereditoAIFlow = ai.defineFlow(
  { name: 'vereditoAIFlow', inputSchema: z.any(), outputSchema: z.any() },
  async input => {
    const cnj = input.cnj;
    const dataJudData = await fetchDataJud(cnj);
    const context = dataJudData ? JSON.stringify(dataJudData) : `Processo: ${cnj}`;
    
    const result = await callNeuralEngine(context);
    return {
      ...result,
      success: true,
      dataJudRaw: dataJudData || { numeroProcesso: cnj, movimentos: [] }
    };
  }
);

export async function executarVereditoAI(input: any) {
  return await vereditoAIFlow(input);
}