'use server';
/**
 * @fileOverview Motor de Análise de Evidências v900.0 ELITE
 * Analisa anotações para extrair pontos fortes e negativos.
 * Motor: Cascata xAI Grok 4.5 -> DeepSeek V3.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const API_KEYS = {
  XAI: 'xai-m2nfN0fkMwh5sbe0tKgoAAQxOfCF3pfb2OLjgE4FOxxMkqiMuTsTAtNoMrfxuYWfon3f4ryyMUPl3fDE',
  AIRFORCE: 'sk-air-Rxc7ygo5b0XpkZqUBqwSnhjwS0bZbWFnzwRLjfPtdAbYK6nj'
};

const SYSTEM_PROMPT = `Você é o Auditor Sênior da W1 Capital.
Sua missão é analisar o log de notas/evidências do gabinete e retornar JSON:
{
  "strongPoints": "Lista curta de vitórias ou pontos fortes operacionais baseados nas notas.",
  "negativePoints": "Lista curta de falhas, riscos ou atrasos identificados.",
  "executiveSummary": "Resumo técnico de 3 linhas sobre a saúde do gabinete."
}
REGRAS: 
1. Use tom executivo e direto.
2. Identifique datas se houver prazos citados.
3. Foque em compliance jurídica.`;

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

async function callXAI(notesText: string) {
  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEYS.XAI}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'grok-4.5',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: `LOG DE NOTAS:\n${notesText}` }],
        response_format: { type: 'json_object' }
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return cleanJsonResponse(data?.choices?.[0]?.message?.content);
  } catch { return null; }
}

async function callAirforce(notesText: string) {
  try {
    const res = await fetch('https://api.airforce/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEYS.AIRFORCE}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-v3',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: `LOG DE NOTAS:\n${notesText}` }]
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return cleanJsonResponse(data?.choices?.[0]?.message?.content);
  } catch { return null; }
}

export const noteAnalysisFlow = ai.defineFlow(
  { name: 'noteAnalysisFlow', inputSchema: z.any(), outputSchema: z.any() },
  async (input) => {
    const notesText = input.notes.map((n: any) => `[${n.updatedAt}] ${n.title}: ${n.content}`).join('\n\n');
    if (notesText.length < 10) return { error: "Notas insuficientes." };

    let result = await callXAI(notesText);
    if (!result) result = await callAirforce(notesText);

    return result || { strongPoints: "Não identificado.", negativePoints: "Não identificado.", executiveSummary: "Falha no motor de análise." };
  }
);

export async function analisarNotasIA(notes: any[]) {
  return await noteAnalysisFlow({ notes });
}
