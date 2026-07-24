/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 */
'use server';

import { ai, z } from '@/ai/genkit';
import { processChat } from '@/lib/ai/chat-service';

export const chatAIFlow = ai.defineFlow(
  { 
    name: 'chatAIFlow', 
    inputSchema: z.object({
      pergunta: z.string(),
      historico: z.array(z.any()).optional(),
      preferredModel: z.string().optional()
    }), 
    outputSchema: z.object({
      resposta: z.string(),
      engineUtilizada: z.string(),
      latencia: z.number(),
      tokensConsumidos: z.number(),
      sucesso: z.boolean()
    }) 
  },
  async input => {
    const res = await processChat({
      message: input.pergunta,
      history: input.historico,
      preferredProvider: input.preferredModel as any
    });

    return { 
      resposta: res.content,
      engineUtilizada: res.provider.toUpperCase(),
      latencia: res.metrics.durationMs,
      tokensConsumidos: res.usage.totalTokens,
      sucesso: res.success
    };
  }
);

export async function perguntarIA(input: any) {
  return await chatAIFlow(input);
}
