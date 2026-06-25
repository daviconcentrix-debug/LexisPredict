'use server';
/**
 * @fileOverview Motor de Chat Consultivo LexisPredict v1.5 Elite
 * Claude 3.5 Sonnet + Grok com tratamento resiliente de formato.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatInputSchema = z.object({
  pergunta: z.string().describe('A pergunta do usuário.'),
  preferredModel: z.enum(['gemini', 'grok', 'openrouter']).optional().default('gemini'),
  deepThinking: z.boolean().optional().default(false),
});

const ChatOutputSchema = z.object({
  resposta: z.string().describe('A resposta estratégica da IA.'),
  engineUtilizada: z.string().optional()
});

const chatPrompt = ai.definePrompt({
  name: 'chatPrompt',
  input: {schema: z.object({pergunta: z.string(), deepThinking: z.boolean()})},
  output: {schema: z.object({resposta: z.string()})},
  prompt: `Você é o Consultor Jurídico Sênior da W1 Capital e Get Assessoria.
Responda de forma estratégica, técnica e clara.

{{#if deepThinking}}
MODO PENSAMENTO PROFUNDO (ATIVADO):
- Analise exaustivamente os riscos.
- Identifique brechas estratégicas e precedentes.
{{/if}}

PERGUNTA: {{{pergunta}}}

DIRETRIZES:
1. TOM: Profissional e assertivo.
2. FOCO: Acelerar o processo e proteger o cliente.
3. ASSINATURA: "Setor Processual — Get Assessoria".

SAÍDA: Retorne estritamente um JSON plano { "resposta": "texto_da_resposta" }.
IMPORTANTE: O campo "resposta" deve conter apenas uma string de texto formatado, NUNCA um objeto.`,
});

function forceStringResponse(raw: any): string {
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object' && raw !== null) {
    if (raw.resposta && typeof raw.resposta === 'string') return raw.resposta;
    return JSON.stringify(raw, null, 2);
  }
  return String(raw);
}

async function callGrokChat(pergunta: string, deepThinking: boolean) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Você é Consultor Jurídico Sênior. Retorne apenas JSON com campo string "resposta". Use a palavra JSON.' },
        { role: 'user', content: pergunta }
      ],
      temperature: deepThinking ? 0.1 : 0.4,
      response_format: { type: 'json_object' }
    })
  });

  if (response.status === 429) {
    const retryAfter = response.headers.get('retry-after') || '25';
    throw new Error(`RATE_LIMIT:${retryAfter}`);
  }
  if (!response.ok) throw new Error(`Erro Groq Chat: ${response.status}`);
  
  const data = await response.json();
  try {
    const content = JSON.parse(data.choices[0].message.content);
    return { resposta: forceStringResponse(content) };
  } catch {
    return { resposta: data.choices[0].message.content };
  }
}

async function callOpenRouterChat(pergunta: string, deepThinking: boolean) {
  const OPENROUTER_API_KEY = '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';
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://lexispredict.w1.capital',
      'X-Title': 'LexisPredict Chat'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'system', content: 'Você é Consultor Jurídico Sênior W1 Capital. Responda apenas em JSON: { "resposta": "texto" }.' },
        { role: 'user', content: pergunta }
      ],
      temperature: deepThinking ? 0.2 : 0.5
    })
  });

  if (response.status === 429) {
    const retryAfter = response.headers.get('retry-after') || '30';
    throw new Error(`RATE_LIMIT:${retryAfter}`);
  }
  if (!response.ok) throw new Error(`Erro OpenRouter Chat: ${response.status}`);

  const data = await response.json();
  try {
    const content = JSON.parse(data.choices[0].message.content);
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
      if (input.preferredModel === 'grok') {
        result = await callGrokChat(input.pergunta, input.deepThinking);
        engine = `GROK (LLAMA 3.3)`;
      } else if (input.preferredModel === 'openrouter') {
        result = await callOpenRouterChat(input.pergunta, input.deepThinking);
        engine = `CLAUDE 3.5 SONNET`;
      } else {
        const {output} = await ai.generate({
          model: 'googleai/gemini-1.5-flash',
          prompt: chatPrompt({pergunta: input.pergunta, deepThinking: input.deepThinking}),
        });
        result = { resposta: forceStringResponse(output.resposta) };
        engine = `GEMINI 1.5 FLASH`;
      }
      return { resposta: result.resposta, engineUtilizada: engine };
    } catch (e: any) { 
      if (e.message.includes('RATE_LIMIT')) throw e;
      throw new Error(e.message || "Erro no processamento do Chat.");
    }
  }
);

export async function perguntarIA(input: any) {
  return chatAIFlow(input);
}
