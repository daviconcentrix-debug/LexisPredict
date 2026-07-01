
'use server';
/**
 * @fileOverview Motor de Programação Veredito IA v3.0 - Gateway de IA Blindado
 * Integração Direta DataJud (CNJ) + Lógica Multi-Engine Transparente.
 * Proprietário: W1 Capital | Fundador: Davi Alves Figueredo
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {fetchDataJud} from '@/lib/datajud';

const VereditoInputSchema = z.object({
  cnj: z.string().describe('O número do processo no formato CNJ.'),
  preferredModel: z.enum(['gemini', 'grok', 'openrouter']).optional().default('gemini'),
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

### Correção da Cronologia (obrigatória) ###
Antes de iniciar qualquer análise do processo, organize todos os eventos pela data e hora reais em ordem cronológica crescente (do mais antigo para o mais recente).

Regras obrigatórias:
1. Nunca utilize a ordem em que os eventos aparecem no JSON. 
2. Sempre ordene pelo campo de data/hora completo (dataHora, dataHoraMovimento ou equivalente). 
3. Quando existir dataHoraUltimaAtualizacao, trate esse campo apenas como a última sincronização do processo e NÃO como um movimento processual. 
4. A cronologia deve refletir exclusivamente os movimentos efetivamente praticados no processo. 
5. Se houver vários eventos no mesmo dia, respeite também o horário. 
6. Após ordenar, faça toda a análise utilizando essa sequência cronológica.

Ao informar o andamento, diferencie obrigatoriamente:
- Último movimento processual: último evento da cronologia ordenada. 
- Última atualização do sistema: valor de dataHoraUltimaAtualizacao, apenas para indicar quando os dados foram sincronizados.

É proibido afirmar que dataHoraUltimaAtualizacao corresponde ao último movimento do processo. Esse campo representa apenas a última atualização do registro no sistema e não um ato processual. Isso evita análises desincronizadas e cronologias fora de ordem.

DADOS DO PROCESSO:
{{{json datajud}}}

Diretrizes de Análise Técnica:
- Seja extremamente técnico e preciso no resumo, risco e passos estratégicos.
- Identifique a classe processual e o órgão julgador.
- Analise a última movimentação para determinar a urgência.

Diretriz de Comunicação (campo mensagemCliente):
- Gere uma mensagem para o cliente que seja: tranquilizadora, humanizada, acolhedora, conciliativa, com coesão, coerência, cortesia, cordialidade, direta e para pessoas leigas no assunto.
- Explique o que está acontecendo sem termos técnicos assustadores. Use um tom de "estamos cuidando de tudo".

O relatório final é para o fundador Davi Alves Figueredo.
Saída: JSON estruturado conforme o esquema.`,
});

async function callGrokNativo(datajud: any) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Você é o Veredito AI v3.0 da W1 Capital. Responda estritamente em JSON: {resumoTecnico, analiseRisco, proximosPassos, mensagemCliente}. Respeite a cronologia obrigatória, tratando dataHoraUltimaAtualizacao apenas como sincronia.' },
          { role: 'user', content: `Analise DataJud: ${JSON.stringify(datajud)}` }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after') || '20';
      throw new Error(`RATE_LIMIT:${retryAfter}`);
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Erro Groq API: ${response.status}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error: any) {
    if (error.message.includes('RATE_LIMIT')) throw error;
    throw new Error(error.message || "Falha na comunicação com motor Grok.");
  }
}

async function callOpenRouterNativo(datajud: any) {
  const OPENROUTER_API_KEY = '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';
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lexispredict.w1.capital',
        'X-Title': 'LexisPredict Veredito AI'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1-distill-llama-70b',
        messages: [
          { role: 'system', content: 'Você é o Veredito AI v3.0 da W1 Capital. Responda estritamente em JSON: {resumoTecnico, analiseRisco, proximosPassos, mensagemCliente}. Respeite a cronologia obrigatória, tratando dataHoraUltimaAtualizacao apenas como sincronia.' },
          { role: 'user', content: `DADOS: ${JSON.stringify(datajud)}` }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after') || '30';
      throw new Error(`RATE_LIMIT:${retryAfter}`);
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Erro OpenRouter: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    return JSON.parse(content);
  } catch (error: any) {
    if (error.message.includes('RATE_LIMIT')) throw error;
    throw new Error(error.message || "O motor OpenRouter (DeepSeek) está indisponível.");
  }
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
      throw new Error("Processo não localizado na base do DataJud.");
    }

    let result;
    let engine;

    if (input.preferredModel === 'grok') {
      result = await callGrokNativo(dataJudData);
      engine = 'GROK (LLAMA 3.3 70B)';
    } else if (input.preferredModel === 'openrouter') {
      result = await callOpenRouterNativo(dataJudData);
      engine = 'OPENROUTER (DEEPSEEK R1)';
    } else {
      const {output} = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        prompt: vereditoPrompt({datajud: dataJudData}),
      });
      if (!output) throw new Error("Gemini não retornou resposta.");
      result = output;
      engine = 'GEMINI 1.5 FLASH';
    }

    return {
      ...result,
      dataJudRaw: dataJudData,
      engineUtilizada: engine
    };
  }
);

export async function executarVereditoAI(input: z.infer<typeof VereditoInputSchema>) {
  return vereditoAIFlow(input);
}
