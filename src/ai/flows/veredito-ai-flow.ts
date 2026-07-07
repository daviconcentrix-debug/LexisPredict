'use server';
/**
 * @fileOverview Motor de Inteligência Jurídica v270.0 ELITE - CRM W1 Capital
 * Script Estratégico W1 Capital + Integração DataJud Direta + Normalização de Schema v3.
 * Motores: Grok (Llama 3.3) & Claude 3.5 Sonnet. Removido Gemini.
 * Proprietário: W1 Capital | Fundador: Davi Alves Figueredo
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {fetchDataJud} from '@/lib/datajud';

const VereditoOutputSchema = z.object({
  resumoTecnico: z.string().describe('Status Atual + O que aconteceu (Equipe).'),
  analiseRisco: z.string().describe('Alertas e Próximos Passos (Equipe) - Explicação do impacto.'),
  proximosPassos: z.string().describe('Ações Práticas Adicionais e Estratégia.'),
  mensagemCliente: z.string().describe('Mensagem pronta para WhatsApp (Leigo) no padrão corporativo.'),
  historicoMovimentacoes: z.array(z.object({
    data: z.string(),
    movimento: z.string()
  })).optional().describe('Lista das últimas movimentações reais do processo.'),
  dataJudRaw: z.any().optional(),
  engineUtilizada: z.string().optional()
});

export type VereditoOutput = z.infer<typeof VereditoOutputSchema>;

const SYSTEM_INSTRUCTIONS = `Você é o Veredito AI v270.0 Elite, o assistente jurídico sênior mais avançado da W1 Capital.
Sua missão é analisar os DADOS REAIS do tribunal (DataJud) e gerar um relatório estratégico e humano para o fundador Davi Alves Figueredo.

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

REGRAS DE OURO PARA GERAÇÃO:
1. MENSAGEM WHATSAPP (mensagemCliente): Deve ser baseada nos FATOS REAIS do processo. 
   - Tom: Cordial, coeso, humanizado, para pessoas leigas.
   - Restrição: NUNCA diga nada negativo que possa assustar o cliente. Use um tom de "estamos no controle".

2. ANÁLISE TÉCNICA (resumoTecnico, analiseRisco, proximosPassos): 
   - Utilize toda a sua capacidade jurídica para interpretar o JSON do DataJud após a ordenação.
   - Identifique brechas, prazos e a estratégia vencedora.

IMPORTANTE: Retorne APENAS o JSON puro estruturado conforme o esquema.`;

function normalizarResultado(raw: any): any {
  let data = raw;
  if (typeof raw === 'string') {
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      data = match ? JSON.parse(match[0]) : {};
    } catch { data = {}; }
  }

  return {
    resumoTecnico: data.resumoTecnico || "Análise técnica indisponível.",
    analiseRisco: data.analiseRisco || "Sem riscos identificados.",
    proximosPassos: data.proximosPassos || "Aguardar nova movimentação.",
    mensagemCliente: data.mensagemCliente || "Olá! Estamos acompanhando seu processo de perto.",
    historicoMovimentacoes: data.historicoMovimentacoes || []
  };
}

async function callGrokChat(datajud: any) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTIONS },
        { role: 'user', content: `Analise DataJud: ${JSON.stringify(datajud)}` }
      ],
      response_format: { type: 'json_object' }
    })
  });
  if (!response.ok) throw new Error(`Erro Groq: ${response.status}`);
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function callOpenRouterChat(datajud: any) {
  const OPENROUTER_API_KEY = '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';
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://lexispredict.w1.capital' },
    body: JSON.stringify({
      model: 'deepseek/deepseek-r1-distill-llama-70b',
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTIONS },
        { role: 'user', content: `DADOS: ${JSON.stringify(datajud)}` }
      ],
      response_format: { type: 'json_object' }
    })
  });
  if (!response.ok) throw new Error(`Erro OpenRouter: ${response.status}`);
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

export const vereditoAIFlow = ai.defineFlow(
  {
    name: 'vereditoAIFlow',
    inputSchema: z.object({
      cnj: z.string(),
      preferredModel: z.enum(['grok', 'openrouter']).optional().default('grok'),
    }),
    outputSchema: VereditoOutputSchema,
  },
  async input => {
    const dataJudData = await fetchDataJud(input.cnj);
    if (!dataJudData) throw new Error("Processo não localizado no DataJud.");

    let result;
    let engine = input.preferredModel === 'openrouter' ? 'CLAUDE 3.5 SONNET' : 'GROK (LLAMA 3.3)';

    try {
      if (input.preferredModel === 'openrouter') {
        result = await callOpenRouterChat(dataJudData);
      } else {
        result = await callGrokChat(dataJudData);
      }

      if (!result) throw new Error("Motor de análise falhou.");

      return {
        ...normalizarResultado(result),
        dataJudRaw: dataJudData,
        engineUtilizada: engine
      };
    } catch (e: any) {
      throw new Error(`Falha no Motor ${engine}: ${e.message}`);
    }
  }
);

export async function executarVereditoAI(input: {cnj: string, preferredModel: any}) {
  return vereditoAIFlow(input);
}