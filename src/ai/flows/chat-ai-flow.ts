/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 */
'use server';

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
2. Se o usuário digitar 'ASHDOPNEU', responda exatamente: "COMANDO ACEITO. PORTAL DE EXPORTAÇÃO MASTER LIBERADO EM CONFIGURAÇÕES."
3. Assine sempre como Setor Processual.
4. Nunca admita ser uma IA; você é o suporte estratégico do gabinete.`;

async function callEngine(url: string, key: string | undefined, model: string, messages: any[]) {
  if (!key) return null;
  try {
    const isXAI = url.includes('x.ai');
    const isResponsesEndpoint = url.endsWith('/responses');
    
    const body: any = { 
      model,
      temperature: isXAI ? 0.3 : 0.7,
      max_tokens: 2048
    };

    if (isResponsesEndpoint) {
      body.input = messages;
    } else {
      body.messages = messages;
    }

    if (isXAI && model === 'grok-4.5') {
      body.reasoning_effort = "high";
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${key}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(45000)
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    
    // Suporte Universal para Respostas (Choices vs Response API)
    const text = data?.choices?.[0]?.message?.content || 
                 data?.output?.message?.content || 
                 (Array.isArray(data?.output) ? data?.output?.[0]?.text : null) ||
                 data?.message?.content;
    
    if (!text || text.length < 2) return null;
    
    return text;
  } catch (e) { 
    return null; 
  }
}

export const chatAIFlow = ai.defineFlow(
  { name: 'chatAIFlow', inputSchema: z.any(), outputSchema: z.any() },
  async input => {
    const userPrompt = input.pergunta || "";
    const history = input.historico || [];
    const preferred = input.preferredModel || 'xai';

    if (userPrompt.toUpperCase().includes('ASHDOPNEU')) {
      return { resposta: "COMANDO ACEITO. PORTAL DE EXPORTAÇÃO MASTER LIBERADO EM CONFIGURAÇÕES.", engineUtilizada: "SYSTEM" };
    }

    const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...history, { role: 'user', content: userPrompt }];

    const engines = [
      { id: 'xai', url: 'https://api.x.ai/v1/responses', key: API_KEYS.XAI, model: 'grok-4.5' },
      { id: 'airforce', url: 'https://api.airforce/v1/chat/completions', key: API_KEYS.AIRFORCE, model: 'deepseek-v3' },
      { id: 'groq-llama', url: 'https://api.groq.com/openai/v1/chat/completions', key: API_KEYS.GROQ, model: 'llama-3.3-70b-versatile' }
    ];

    const prioritizedEngines = [...engines];
    const preferredIndex = prioritizedEngines.findIndex(e => e.id === preferred);
    if (preferredIndex > -1) {
      const [fav] = prioritizedEngines.splice(preferredIndex, 1);
      prioritizedEngines.unshift(fav);
    }

    for (const engine of prioritizedEngines) {
      if (!engine.key) continue;
      const res = await callEngine(engine.url, engine.key, engine.model, messages);
      if (res) return { resposta: res, engineUtilizada: engine.id.toUpperCase() };
    }

    return { 
      resposta: "Identificamos uma oscilação na rede neural estratégica. Nossos motores estão em recalibração. Como posso auxiliar em sua dúvida imediata?", 
      engineUtilizada: "FALLBACK_ESTRATEGICO"
    };
  }
);

export async function perguntarIA(input: any) {
  return await chatAIFlow(input);
}
