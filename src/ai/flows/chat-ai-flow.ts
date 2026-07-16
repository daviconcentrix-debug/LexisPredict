
'use server';
/**
 * @fileOverview Motor Neural de Apoio Estratégico v1100.0 ELITE
 * Protocolo de Resgate e Cascata Neural de Resiliência.
 * Proprietário: W1 Capital | Versão: SaaS White-Label
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const API_KEYS = {
  XAI: 'xai-m2nfN0fkMwh5sbe0tKgoAAQxOfCF3pfb2OLjgE4FOxxMkqiMuTsTAtNoMrfxuYWfon3f4ryyMUPl3fDE',
  GROQ: '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'
};

const SYSTEM_PROMPT = `Você é o Consultor Estratégico Sênior da Get Assessoria. 
REGRAS:
1. Respostas curtas e profissionais (máx 10 linhas).
2. Defenda os interesses da assessoria.
3. Se o usuário digitar 'ASHDOPNEU', responda: "COMANDO ACEITO. PORTAL DE EXPORTAÇÃO MASTER LIBERADO EM CONFIGURAÇÕES." e nada mais.
4. Use tom resolutivo. Assine como Setor Processual.
5. Prefira retornar texto limpo e direto.`;

/**
 * Filtro de Erros e Limpeza Forense
 */
function cleanResponse(text: string): string | null {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase();
  
  const errorIndicators = [
    'discord.gg', 'rate limit', 'quota exceeded', 'api error', 
    'unauthorized', '404', 'insufficient balance', 'system unavailable'
  ];
  
  if (errorIndicators.some(indicator => lower.includes(indicator))) return null;
  
  // Limpeza de Markdown JSON
  let clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
       const parsed = JSON.parse(clean.substring(firstBrace, lastBrace + 1));
       return parsed.resposta || parsed.answer || parsed.content || parsed.message || clean;
    }
  } catch (e) {}

  return clean.length > 5 ? clean : null;
}

async function callXAI(pergunta: string, historico: any[]) {
  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEYS.XAI}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'grok-4.5',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...historico, { role: 'user', content: pergunta }]
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return cleanResponse(data?.choices?.[0]?.message?.content);
  } catch (e) { return null; }
}

async function callGroq(pergunta: string, historico: any[], model: string) {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEYS.GROQ}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...historico, { role: 'user', content: pergunta }]
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return cleanResponse(data?.choices?.[0]?.message?.content);
  } catch (e) { return null; }
}

export const chatAIFlow = ai.defineFlow(
  { name: 'chatAIFlow', inputSchema: z.any(), outputSchema: z.any() },
  async input => {
    const engines = [
      { id: 'xai', call: (p: string, h: any[]) => callXAI(p, h) },
      { id: 'groq-llama', call: (p: string, h: any[]) => callGroq(p, h, 'llama-3.3-70b-versatile') },
      { id: 'groq-deepseek', call: (p: string, h: any[]) => callGroq(p, h, 'deepseek-r1-distill-llama-70b') }
    ];

    const preferredId = input.preferredModel || 'xai';
    const sorted = [ engines.find(e => e.id === preferredId) || engines[0], ...engines.filter(e => e.id !== preferredId) ];

    for (const engine of sorted) {
      const res = await engine.call(input.pergunta, input.historico || []);
      if (res) {
        if (res.includes("PORTAL DE EXPORTAÇÃO")) {
           // Lado do servidor não salva LS, a interface deve detectar esta string
        }
        return { resposta: res, engineUtilizada: engine.id.toUpperCase() };
      }
    }

    return { error: true, fallback: true };
  }
);

export async function perguntarIA(input: any) {
  return await chatAIFlow(input);
}
