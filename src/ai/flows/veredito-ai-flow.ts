
'use server';
/**
 * @fileOverview Motor de Programação Veredito IA v3.0
 * Integração Direta DataJud (CNJ) + Lógica Cognitiva Gemini/Grok.
 * Proprietário: W1 Capital | Fundador: Davi Alves Figueredo
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {fetchDataJud} from '@/lib/datajud';

const VereditoInputSchema = z.object({
  cnj: z.string().describe('O número do processo no formato CNJ.'),
  preferredModel: z.enum(['gemini', 'grok']).optional().default('gemini'),
});

const VereditoOutputSchema = z.object({
  resumoTecnico: z.string().describe('Resumo sintetizado do processo.'),
  analiseRisco: z.string().describe('Análise de risco baseada nas últimas movimentações.'),
  proximosPassos: z.string().describe('Sugestão estratégica de próximos passos.'),
  mensagemCliente: z.string().describe('Mensagem humanizada e acolhedora para o cliente leigo.'),
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

Diretrizes de Análise Técnica:
- Seja extremamente técnico e preciso no resumo, risco e passos estratégicos.
- Identifique a classe processual e o órgão julgador.
- Analise a última movimentação para determinar a urgência.

Diretriz de Comunicação (campo mensagemCliente):
- Gere uma mensagem para o cliente que seja: tranquilizadora, humanizada, acolhedora, conciliativa, com coesão, coerência, cortesia, cordialidade, direta e para pessoas leigas no assunto.
- Explique o que está acontecendo sem termos técnicos assustadores.

O relatório final é para o fundador Davi Alves Figueredo.
Saída: JSON estruturado conforme o esquema.`,
});

/**
 * CHAMADA NATIVA PARA GROK (VIA GROQ)
 */
async function callGrokNativo(datajud: any) {
  const GROQ_API_KEY = process.env.GROK_API_KEY || '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';
  const prompt = `Você é o Veredito AI v3.0 da W1 Capital. Analise este processo do DataJud para o Fundador Davi Alves Figueredo.
  Responda APENAS em JSON seguindo este esquema:
  {
    "resumoTecnico": "string",
    "analiseRisco": "string",
    "proximosPassos": "string",
    "mensagemCliente": "string"
  }
  
  DIRETRIZ PARA mensagemCliente: Deve ser tranquilizadora, humanizada, acolhedora, conciliativa, cortês, cordial, direta e em linguagem simples para leigos.
  
  DADOS: ${JSON.stringify(datajud)}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) throw new Error("Falha na comunicação com motor Grok/Groq.");
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

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

    if (input.preferredModel === 'grok') {
      const output = await callGrokNativo(dataJudData);
      return {
        ...output,
        dataJudRaw: dataJudData,
        engineUtilizada: 'GROK/GROQ'
      };
    }

    // Default: Gemini via Genkit
    const {output} = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: vereditoPrompt({datajud: dataJudData}),
    });
    
    return {
      ...output!,
      dataJudRaw: dataJudData,
      engineUtilizada: 'GEMINI 1.5 FLASH'
    };
  }
);

export async function executarVereditoAI(input: z.infer<typeof VereditoInputSchema>) {
  return vereditoAIFlow(input);
}
