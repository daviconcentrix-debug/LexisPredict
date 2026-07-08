
'use server';
/**
 * @fileOverview Motor de Consultoria Estratégica LexisPredict v620.0 Elite
 * Núcleo: xAI (Grok 4.5) | Redundância: Groq (Llama 3.3) | Reserva 1: Puter (Claude) | Reserva 2: Airforce (DeepSeek).
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
}

async function callXAIChat(pergunta: string, historico: any[], deepThinking: boolean) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...historico, { role: 'user', content: pergunta }];
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${XAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'grok-4.5',
        messages,
        temperature: deepThinking ? 0.2 : 0.5,
        response_format: { type: 'json_object' }
      })
    });
    if (!response.ok) throw new Error(`XAI_CHAT_ERR_${response.status}`);
    const data = await response.json();
    const content = JSON.parse(cleanJsonResponse(data.choices[0].message.content));
    return { resposta: content.resposta || data.choices[0].message.content };
  } catch (e: any) { throw e; }
}

async function callAirforceChat(pergunta: string, historico: any[]) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...historico, { role: 'user', content: pergunta }];
  try {
    const response = await fetch('https://api.airforce/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${AIRFORCE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-v3',
        messages,
        temperature: 0.3
      })
    });
    if (!response.ok) throw new Error(`AIRFORCE_ERR_${response.status}`);
    const data = await response.json();
    const content = JSON.parse(cleanJsonResponse(data.choices[0].message.content));
    return { resposta: content.resposta || data.choices[0].message.content };
  } catch (e: any) { throw e; }
}

async function callGroqChat(pergunta: string, historico: any[], deepThinking: boolean) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...historico, { role: 'user', content: pergunta }];
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: deepThinking ? 0.1 : 0.4,
        response_format: { type: 'json_object' }
      })
    });
    if (!response.ok) throw new Error(`GROQ_CHAT_ERR_${response.status}`);
    const data = await response.json();
    const content = JSON.parse(cleanJsonResponse(data.choices[0].message.content));
    return { resposta: content.resposta || data.choices[0].message.content };
  } catch (e: any) { throw e; }
}

async function callPuterChat(pergunta: string, historico: any[]) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...historico, { role: 'user', content: pergunta }];
  try {
    const response = await fetch('https://api.puter.com/v2/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-5', messages, stream: false })
    });
    if (!response.ok) throw new Error(`PUTER_CHAT_ERR_${response.status}`);
    const data = await response.json();
    const content = JSON.parse(cleanJsonResponse(data.message.content[0].text));
    return { resposta: content.resposta || data.message.content[0].text };
  } catch (e: any) { throw e; }
}

export const chatAIFlow = ai.defineFlow(
  {
    name: 'chatAIFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async input => {
    const hist = Array.isArray(input.historico) ? input.historico : [];
    const model = input.preferredModel;
    
    try {
      if (model === 'xai') return await callXAIChat(input.pergunta, hist, input.deepThinking);
      if (model === 'airforce') return await callAirforceChat(input.pergunta, hist);
      if (model === 'puter') return await callPuterChat(input.pergunta, hist);
      return await callGroqChat(input.pergunta, hist, input.deepThinking);
    } catch (e) {
      // Failover Circular
      try { return await callGroqChat(input.pergunta, hist, input.deepThinking); }
      catch (e2) {
        try { return await callAirforceChat(input.pergunta, hist); }
        catch (e3) { return await callPuterChat(input.pergunta, hist); }
      }
    }
  }
);

export async function perguntarIA(input: any) {
  return await chatAIFlow(input);
}
