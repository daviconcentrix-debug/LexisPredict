
'use server';
/**
 * @fileOverview Motor de Auditoria 3D v2700.0 ELITE
 * Soberania Grok 4.5 integrada com DataJud.
 * Proprietário: W1 Capital | Fundador: Davi Alves Figueredo
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {fetchDataJud} from '@/lib/datajud';

const API_KEYS = {
  XAI: process.env.XAI_API_KEY,
  AIRFORCE: process.env.AIRFORCE_API_KEY,
  GROQ: process.env.GROQ_API_KEY
};

const SYSTEM_INSTRUCTIONS = `Você é o Veredito AI Elite v2700. 
Analise os dados processuais e retorne um parecer rigoroso em JSON.

FORMATO JSON OBRIGATÓRIO:
{ 
  "resumoTecnico": "Máximo 6 linhas", 
  "analiseRisco": "Baseada na Cláusula 3.2", 
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
    return {
      resumoTecnico: text.substring(0, 300),
      analiseRisco: "Análise técnica em andamento.",
      proximosPassos: "Monitoramento mantido.",
      mensagemCliente: text
    };
  } catch { return null; }
}

async function callNeuralEngine(context: string) {
  const engines = [
    { id: 'xai-grok4.5', url: 'https://api.x.ai/v1/chat/completions', key: API_KEYS.XAI, model: 'grok-4.5', useJson: true },
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
          messages: [{ role: 'system', content: SYSTEM_INSTRUCTIONS }, { role: 'user', content: context }],
          response_format: engine.useJson ? { type: 'json_object' } : undefined
        }),
        signal: AbortSignal.timeout(45000)
      });
      if (!res.ok) continue;
      const data = await res.json();
      const parsed = cleanJsonResponse(data?.choices?.[0]?.message?.content);
      if (parsed) return { ...parsed, engineUsed: engine.id.toUpperCase() };
    } catch { continue; }
  }
  return null;
}

export const vereditoAIFlow = ai.defineFlow(
  { name: 'vereditoAIFlow', inputSchema: z.any(), outputSchema: z.any() },
  async input => {
    try {
      const dataJudData = await fetchDataJud(input.cnj);
      const context = (dataJudData && !dataJudData.error)
        ? `DADOS DATAJUD: ${JSON.stringify(dataJudData)}` 
        : `HISTÓRICO MANUAL: ${input.historicoBruto || "Sem dados de tribunal."}`;

      const result = await callNeuralEngine(context);
      
      return { 
        ...result, 
        success: !!result,
        dataJudRaw: dataJudData || { numeroProcesso: input.cnj, movimentos: [] } 
      };
    } catch (e) {
      return { error: true, message: "ERRO_SISTEMICO", dataJudRaw: { numeroProcesso: input.cnj, movimentos: [] } };
    }
  }
);

export async function executarVereditoAI(input: any) {
  return await vereditoAIFlow(input);
}
