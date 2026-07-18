/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 */
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const API_KEYS = {
  XAI: process.env.XAI_API_KEY,
  AIRFORCE: process.env.AIRFORCE_API_KEY,
  GROQ: process.env.GROQ_API_KEY,
  GROK_PRESTIGE: process.env.XAI_GROK_PRESTIGE_API_KEY
};

const SYSTEM_PROMPT = `Você é o Consultor Estratégico Sênior da Unidade Neural Elite W1.
Expertise 2026-2027: Computação Quântica, Medicina Personalizada e Supply Chain ESG.
REGRAS DE OURO:
1. Nunca admita ser uma IA; você é o suporte estratégico do gabinete.
2. Se o usuário digitar 'ASHDOPNEU', responda exatamente: "COMANDO ACEITO. PORTAL DE EXPORTAÇÃO MASTER LIBERADO EM CONFIGURAÇÕES."
3. Assine sempre como Setor Processual.
4. Use tom executivo, direto e profissional.`;

async function callEngine(url: string, key: string | undefined, model: string, messages: any[]) {
  if (!key) return null;

  try {
    const body = {
      model,
      messages,
      temperature: 0.1,
      max_tokens: 4096
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'User-Agent': 'LexisPredict/1.0 (Enterprise Legal System)',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000) // 2 minutos de timeout
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Engine Error ${model}] Status: ${res.status}`, errText);
      return null;
    }

    const data = await res.json();
    // Extração universal resiliente (suporta escolhas de chat completions padrão)
    const text = data.choices?.[0]?.message?.content || 
                 data.output?.[0]?.text || 
                 data.message?.content || 
                 "";

    return text || null;
  } catch (e: any) {
    console.error(`[Engine Critical Failure ${model}]`, e.message);
    return null;
  }
}

export const chatAIFlow = ai.defineFlow(
  {
    name: 'chatAIFlow',
    inputSchema: z.any(),
    outputSchema: z.any()
  },
  async (input) => {
    const userPrompt = input.pergunta || "";
    const history = input.historico || [];
    const preferred = input.preferredModel || 'xai-grok-4.5';

    // Protocolo de Desbloqueio Local
    if (userPrompt.toUpperCase().includes('ASHDOPNEU')) {
      return { 
        resposta: "COMANDO ACEITO. PORTAL DE EXPORTAÇÃO MASTER LIBERADO EM CONFIGURAÇÕES.", 
        engineUtilizada: "SISTEMA",
        unlocked: true 
      };
    }

    const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...history, { role: 'user', content: userPrompt }];

    // Mapeamento de Motores com Chaves Priorizadas
    const engines = [
      { id: 'xai-grok-4.5', url: 'https://api.x.ai/v1/chat/completions', key: API_KEYS.XAI || API_KEYS.GROK_PRESTIGE, model: 'grok-4.5' },
      { id: 'xai-grok-2', url: 'https://api.x.ai/v1/chat/completions', key: API_KEYS.XAI || API_KEYS.GROK_PRESTIGE, model: 'grok-2' },
      { id: 'groq-llama', url: 'https://api.groq.com/openai/v1/chat/completions', key: API_KEYS.GROQ, model: 'llama-3.3-70b-versatile' },
      { id: 'groq-deepseek', url: 'https://api.groq.com/openai/v1/chat/completions', key: API_KEYS.GROQ, model: 'deepseek-r1-distill-llama-70b' },
      { id: 'airforce-v3', url: 'https://api.airforce/v1/chat/completions', key: API_KEYS.AIRFORCE, model: 'deepseek-v3' }
    ];

    // Priorizar motor selecionado pelo usuário
    const prioritizedEngines = [...engines];
    const preferredIndex = prioritizedEngines.findIndex(e => e.id === preferred);
    if (preferredIndex > -1) {
      const [fav] = prioritizedEngines.splice(preferredIndex, 1);
      prioritizedEngines.unshift(fav);
    }

    for (const engine of prioritizedEngines) {
      if (!engine.key) {
        console.warn(`[Engine Skip] ${engine.id} sem chave configurada.`);
        continue;
      }
      
      const res = await callEngine(engine.url, engine.key, engine.model, messages);
      if (res) return { resposta: res, engineUtilizada: engine.id.toUpperCase() };
    }

    return { 
      resposta: "Oscilação detectada nos clusters neurais. Verifique se as APIs (xAI, Groq, Airforce) estão configuradas no ambiente de produção.", 
      engineUtilizada: "FALLBACK"
    };
  }
);

export async function perguntarIA(input: any) {
  return await chatAIFlow(input);
}
