'use server';
/**
 * @fileOverview Motor de Consultoria Estratégica LexisPredict v350.0 Elite
 * Memória de Contexto Ativa. Motores: Claude 3.5 Sonnet | Grok (Llama 3.3).
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
  preferredModel: z.enum(['grok', 'openrouter']).optional().default('grok'),
  deepThinking: z.boolean().optional().default(false),
});

const ChatOutputSchema = z.object({
  resposta: z.string().describe('A resposta estratégica completa.'),
  engineUtilizada: z.string().optional()
});

const SYSTEM_PROMPT = `Você é o Consultor Estratégico Sênior de Elite da W1 Capital.
Sua missão é fornecer orientações técnicas e resolutivas sobre processos judiciais.

DIRETRIZES DE OURO:
1. MEMÓRIA: Utilize as mensagens anteriores para manter a continuidade do raciocínio.
2. COMPLETUDE: Nunca corte a resposta pela metade. Entregue a análise completa, mesmo que seja extensa.
3. TOM: Profissional, assertivo e focado em proteger a operação e acelerar os resultados.
4. FORMATO: Responda de forma estratégica, identificando riscos e brechas.
5. ASSINATURA: Finalize sempre com "Gabinete Técnico — W1 Capital".

RESTRIÇÃO TÉCNICA: Retorne estritamente um JSON plano: { "resposta": "todo_o_texto_aqui" }.`;

function forceStringResponse(raw: any): string {
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object' && raw !== null) {
    if (raw.resposta && typeof raw.resposta === 'string') return raw.resposta;
    return JSON.stringify(raw, null, 2);
  }
  return String(raw);
}

async function callGrokChat(pergunta: string, historico: any[], deepThinking: boolean) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
  
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...historico.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: pergunta }
  ];

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: deepThinking ? 0.1 : 0.4,
      max_tokens: 4096,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) throw new Error(`Erro Groq Chat: ${response.status}`);
  
  const data = await response.json();
  try {
    const rawContent = data.choices[0].message.content;
    const cleanContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
    const content = JSON.parse(cleanContent);
    return { resposta: forceStringResponse(content) };
  } catch {
    return { resposta: data.choices[0].message.content };
  }
}

async function callOpenRouterChat(pergunta: string, historico: any[], deepThinking: boolean) {
  const OPENROUTER_API_KEY = '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';
  
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...historico.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: pergunta }
  ];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://lexispredict.w1.capital',
      'X-Title': 'LexisPredict Chat Elite'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages,
      temperature: deepThinking ? 0.2 : 0.5,
      max_tokens: 4096
    })
  });

  if (!response.ok) throw new Error(`Erro OpenRouter Chat: ${response.status}`);

  const data = await response.json();
  try {
    const rawContent = data.choices[0].message.content;
    const cleanContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    const content = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(cleanContent);
    return { resposta: forceStringResponse(content) };
  } catch {
    return { resposta: data.choices[0].message.content };
  }
}

export const chatAIFlow = ai.defineFlow(
  {
    name: 'chatAIFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async input => {
    let result;
    let engine;
    try {
      if (input.preferredModel === 'openrouter') {
        result = await callOpenRouterChat(input.pergunta, input.historico, input.deepThinking);
        engine = `CLAUDE 3.5 SONNET`;
      } else {
        result = await callGrokChat(input.pergunta, input.historico, input.deepThinking);
        engine = `GROK (LLAMA 3.3)`;
      }
      return { resposta: result.resposta, engineUtilizada: engine };
    } catch (e: any) { 
      throw new Error(e.message || "Erro no processamento do Diálogo.");
    }
  }
);

export async function perguntarIA(input: any) {
  return chatAIFlow(input);
}
