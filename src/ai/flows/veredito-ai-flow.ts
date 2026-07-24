/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 */
'use server';

import { ai, z } from '@/ai/genkit';
import { fetchDataJud } from '@/lib/datajud';
import { processChat } from '@/lib/ai/chat-service';
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts';

export const vereditoAIFlow = ai.defineFlow(
  { 
    name: 'vereditoAIFlow', 
    inputSchema: z.object({ cnj: z.string(), preferredModel: z.string().optional() }), 
    outputSchema: z.any() 
  },
  async input => {
    const dataJudData = await fetchDataJud(input.cnj);
    if (dataJudData?.error) return { success: false, message: dataJudData.message };

    const res = await processChat({
      message: `DADOS DO PROCESSO:\n${JSON.stringify(dataJudData)}`,
      preferredProvider: input.preferredModel as any,
      responseFormat: 'json',
      temperature: 0.1
    });

    if (res.success) {
      try {
        return {
          ...JSON.parse(res.content),
          success: true,
          dataJudRaw: dataJudData
        };
      } catch (e) {
        return { success: false, message: "Falha na decodificação do parecer." };
      }
    }

    return { success: false, message: res.content };
  }
);

export async function executarVereditoAI(input: any) {
  return await vereditoAIFlow(input);
}
