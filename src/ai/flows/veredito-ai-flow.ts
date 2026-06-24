
'use server';
/**
 * @fileOverview Motor de Programação Veredito IA v3.0
 * Integração Direta DataJud (CNJ) + Lógica Cognitiva Gemini/DeepSeek.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {fetchDataJud} from '@/lib/datajud';

const VereditoInputSchema = z.object({
  cnj: z.string().describe('O número do processo no formato CNJ.'),
  preferredModel: z.enum(['gemini', 'deepseek']).optional().default('gemini'),
});

const VereditoOutputSchema = z.object({
  resumoTecnico: z.string().describe('Resumo sintetizado do processo.'),
  analiseRisco: z.string().describe('Análise de risco baseada nas últimas movimentações.'),
  proximosPassos: z.string().describe('Sugestão estratégica de próximos passos.'),
  dataJudRaw: z.any().optional(),
  engineUtilizada: z.string().optional()
});

const vereditoPrompt = ai.definePrompt({
  name: 'vereditoPrompt',
  input: {schema: z.object({datajud: z.any()})},
  output: {schema: VereditoOutputSchema},
  prompt: `Você é o Veredito AI v3.0, um assistente jurídico de elite da W1 Capital.
Analise os seguintes dados brutos extraídos do DataJud (CNJ) e gere um relatório executivo.

DADOS DO PROCESSO:
{{{json datajud}}}

Diretrizes:
- Seja extremamente técnico e preciso.
- Identifique a classe processual e o órgão julgador.
- Analise a última movimentação para determinar a urgência.
- O relatório é para o fundador Davi Alves Figueredo.

Saída: JSON estruturado conforme o esquema.`,
});

export const vereditoAIFlow = ai.defineFlow(
  {
    name: 'vereditoAIFlow',
    inputSchema: VereditoInputSchema,
    outputSchema: VereditoOutputSchema,
  },
  async input => {
    const dataJudData = await fetchDataJud(input.cnj);
    
    if (!dataJudData) {
      throw new Error("Processo não encontrado na base pública do DataJud.");
    }

    const modelId = input.preferredModel === 'deepseek' ? 'openai/deepseek-chat' : 'googleai/gemini-2.0-flash';

    const {output} = await vereditoPrompt({datajud: dataJudData}, {
      model: modelId
    });
    
    return {
      ...output!,
      dataJudRaw: dataJudData,
      engineUtilizada: input.preferredModel.toUpperCase()
    };
  }
);

export async function executarVereditoAI(input: z.infer<typeof VereditoInputSchema>) {
  return vereditoAIFlow(input);
}
