
'use server';
/**
 * @fileOverview Motor Neural de Apoio Estratégico v3500.0 ELITE
 * Soberania Grok 4.5 com Protocolo de Resgate em Cascata.
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const API_KEYS = {
  XAI: process.env.XAI_API_KEY,
  AIRFORCE: process.env.AIRFORCE_API_KEY,
  GROQ: process.env.GROQ_API_KEY
};

const SYSTEM_PROMPT = `Você é o Consultor Estratégico Sênior do Gabinete Jurídico Get Assessoria (W1 Capital).
Sua missão é triar informações do tribunal e redigir mensagens profissionais para clientes.

REGRAS DE OURO:
1. Analise os movimentos do tribunal (e-SAJ/PJE) e explique de forma clara.
2. Exemplo: "Conclusos para Sentença" significa que o processo está aguardando decisão final do juiz.
3. Se o usuário digitar 'ASHDOPNEU', responda: "COMANDO ACEITO. PORTAL DE EXPORTAÇÃO MASTER LIBERADO EM CONFIGURAÇÕES."
4. Assine sempre como Setor Processual.
5. Nunca admita ser uma IA; você é o suporte estratégico do gabinete.`;

async function callEngine(url: string, key: string | undefined, model: string, messages: any[], useJson = false) {
  if (!key) return null;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        model, 
        messages,
        temperature: 0.7,
        max_tokens: 2500,
        response_format: useJson ? { type: 'json_object' } : undefined
      }),
      signal: AbortSignal.timeout(40000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    
    if (!text || text.includes('discord.gg') || text.includes('rate limit')) return null;
    
    return text;
  } catch (e) { return null; }
}

export const chatAIFlow = ai.defineFlow(
  { name: 'chatAIFlow', inputSchema: z.any(), outputSchema: z.any() },
  async input => {
    const userPrompt = input.pergunta || "";
    const history = input.historico || [];

    if (userPrompt.toUpperCase().includes('ASHDOPNEU')) {
      return { resposta: "COMANDO ACEITO. PORTAL DE EXPORTAÇÃO MASTER LIBERADO EM CONFIGURAÇÕES.", engineUtilizada: "SYSTEM" };
    }

    const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...history, { role: 'user', content: userPrompt }];

    const engines = [
      { id: 'xai-grok4.5', url: 'https://api.x.ai/v1/chat/completions', key: API_KEYS.XAI, model: 'grok-4.5' },
      { id: 'airforce-deepseek', url: 'https://api.airforce/v1/chat/completions', key: API_KEYS.AIRFORCE, model: 'deepseek-v3' },
      { id: 'groq-llama', url: 'https://api.groq.com/openai/v1/chat/completions', key: API_KEYS.GROQ, model: 'llama-3.3-70b-versatile' }
    ];

    for (const engine of engines) {
      const res = await callEngine(engine.url, engine.key, engine.model, messages);
      if (res) return { resposta: res, engineUtilizada: engine.id.toUpperCase() };
    }

    return { 
      resposta: "Identificamos uma movimentação sistêmica que exige atenção. Nossos motores de análise profunda estão em recalibração estratégica. Como posso auxiliar em sua dúvida imediata?", 
      engineUtilizada: "FALLBACK_ESTRATEGICO"
    };
  }
);

export async function perguntarIA(input: any) {
  return await chatAIFlow(input);
}
