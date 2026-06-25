'use server';
/**
 * @fileOverview Motor de Inteligência Jurídica v5.5 Elite - CRM Get Assessoria
 * Script Estratégico W1 Capital + Claude 3.5 Sonnet via OpenRouter.
 * Proprietário: W1 Capital | Fundador: Davi Alves Figueredo
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {fetchDataJud} from '@/lib/datajud';

const VereditoOutputSchema = z.object({
  resumoTecnico: z.string().describe('Status Atual + O que aconteceu (Equipe).'),
  analiseRisco: z.string().describe('Alertas e Próximos Passos (Equipe) - Explicação do impacto.'),
  proximosPassos: z.string().describe('Ações Práticas Adicionais e Estratégia.'),
  mensagemCliente: z.string().describe('Mensagem pronta para WhatsApp (Leigo) no padrão Get Assessoria.'),
  dataJudRaw: z.any().optional(),
  engineUtilizada: z.string().optional()
});

export type VereditoOutput = z.infer<typeof VereditoOutputSchema>;

const vereditoPrompt = ai.definePrompt({
  name: 'vereditoPrompt',
  input: {schema: z.object({datajud: z.any(), deepThinking: z.boolean()})},
  output: {schema: VereditoOutputSchema},
  prompt: `Você é um assistente jurídico sênior e especialista em relacionamento com o cliente (CRM) da Get Assessoria (W1 Capital).
Seu objetivo é analisar os dados do DataJud e entregar ações práticas para a equipe e para o cliente.

DADOS BRUTOS DO PROCESSO:
{{{json datajud}}}

{{#if deepThinking}}
MODO PENSAMENTO PROFUNDO (ATIVADO):
- Analise minuciosamente os prazos e riscos de sucumbência.
- Identifique o último andamento RELEVANTE que altera o direito do cliente.
{{/if}}

Ao analisar o andamento, divida sua resposta obrigatoriamente nestas duas partes:

📋 1. ANÁLISE INTERNA (Para o CRM / Equipe Jurídica):
- Status Atual: Fase exata em que o processo se encontra.
- O que aconteceu: Traduza a última decisão/movimentação de forma técnica, mas direta. Explique o porquê de ser BOM ou RUIM.
- Alertas e Próximos Passos: Prazos críticos, custas (ex: JG negada), ou o que protocolar agora.

💬 2. MENSAGEM SUGERIDA PARA O CLIENTE (WhatsApp):
- Tom: Profissional, empático, transparente e acolhedor (Padrão Get Assessoria).
- Linguagem: ZERO JURIDIQUÊS. Explique para um leigo.
- Gestão de Expectativa: Se negou liminar, acalme o cliente (processo continua). Se extinto, explique o motivo.
- Finalização: Indique se ele precisa fazer algo ou apenas aguardar nosso trabalho.

SAÍDA: Retorne estritamente um objeto JSON com a palavra JSON no prompt de sistema.`,
});

function cleanJsonResponse(raw: string): any {
  try {
    let cleaned = raw.trim();
    cleaned = cleaned.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      cleaned = cleaned.substring(start, end + 1);
    }
    const parsed = JSON.parse(cleaned);
    
    const fields = ['resumoTecnico', 'analiseRisco', 'proximosPassos', 'mensagemCliente'];
    fields.forEach(f => {
      if (parsed[f] && typeof parsed[f] === 'object') {
        parsed[f] = JSON.stringify(parsed[f], null, 2);
      }
    });
    
    return parsed;
  } catch (e) {
    throw new Error("Erro na formatação da IA. Tente novamente ou use outro motor.");
  }
}

async function callOpenRouter(datajud: any, deepThinking: boolean) {
  const OPENROUTER_API_KEY = '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';
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://lexispredict.w1.capital',
      'X-Title': 'LexisPredict Veredito AI'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'system', content: 'Você é Assistente Jurídico Sênior W1 Capital. Responda apenas em JSON com os campos: resumoTecnico, analiseRisco, proximosPassos, mensagemCliente. Use a palavra JSON.' },
        { role: 'user', content: `Analise estes dados do DataJud e aplique o script v5.5: ${JSON.stringify(datajud)}` }
      ],
      temperature: deepThinking ? 0.2 : 0.5
    })
  });

  if (response.status === 429) {
    const retryAfter = response.headers.get('retry-after') || '30';
    throw new Error(`RATE_LIMIT:${retryAfter}`);
  }
  if (!response.ok) throw new Error(`Erro OpenRouter: ${response.status}`);
  
  const data = await response.json();
  return cleanJsonResponse(data.choices[0].message.content);
}

async function callGrok(datajud: any, deepThinking: boolean) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Você é Assistente Jurídico W1 Capital. Retorne obrigatoriamente um objeto JSON com campos de texto string: {resumoTecnico, analiseRisco, proximosPassos, mensagemCliente}. Use a palavra JSON na resposta.' },
        { role: 'user', content: `Analise DataJud sob o script v5.5: ${JSON.stringify(datajud)}` }
      ],
      temperature: deepThinking ? 0.1 : 0.3,
      response_format: { type: 'json_object' }
    })
  });

  if (response.status === 429) {
    const retryAfter = response.headers.get('retry-after') || '25';
    throw new Error(`RATE_LIMIT:${retryAfter}`);
  }
  if (!response.ok) throw new Error(`Erro Groq: ${response.status}`);

  const data = await response.json();
  return cleanJsonResponse(data.choices[0].message.content);
}

export const vereditoAIFlow = ai.defineFlow(
  {
    name: 'vereditoAIFlow',
    inputSchema: z.object({
      cnj: z.string(),
      preferredModel: z.enum(['gemini', 'grok', 'openrouter']).optional().default('gemini'),
      deepThinking: z.boolean().optional().default(false),
    }),
    outputSchema: VereditoOutputSchema,
  },
  async input => {
    const dataJudData = await fetchDataJud(input.cnj);
    if (!dataJudData) throw new Error("Processo não localizado.");

    let result;
    let engine;

    try {
      if (input.preferredModel === 'grok') {
        result = await callGrok(dataJudData, input.deepThinking);
        engine = `GROK (LLAMA 3.3)`;
      } else if (input.preferredModel === 'openrouter') {
        result = await callOpenRouter(dataJudData, input.deepThinking);
        engine = `CLAUDE 3.5 SONNET`;
      } else {
        const {output} = await ai.generate({
          model: 'googleai/gemini-1.5-flash',
          prompt: vereditoPrompt({datajud: dataJudData, deepThinking: input.deepThinking}),
        });
        result = output;
        engine = `GEMINI 1.5 FLASH`;
      }

      return {
        ...result,
        dataJudRaw: dataJudData,
        engineUtilizada: engine
      };
    } catch (e: any) {
      if (e.message.includes('RATE_LIMIT')) throw e;
      throw new Error(`Falha no Motor ${engine || 'IA'}: ${e.message}`);
    }
  }
);

export async function executarVereditoAI(input: any) {
  return vereditoAIFlow(input);
}
