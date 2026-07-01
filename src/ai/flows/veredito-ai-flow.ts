
'use server';
/**
 * @fileOverview Motor de Inteligência Jurídica v26.0 ELITE - CRM W1 Capital
 * Script Estratégico W1 Capital + Integração DataJud Direta + Normalização de Schema v2.
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

const SYSTEM_INSTRUCTIONS = `Você é o Veredito AI v26.0 Elite, o assistente jurídico sênior mais avançado da W1 Capital.
Sua missão é analisar os DADOS REAIS do tribunal (DataJud) e gerar um relatório estratégico e humano.

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
1. MENSAGEM WHATSAPP (mensagemCliente): Deve ser baseada nos FATOS REAIS do processo. Não use mensagens prontas genéricas. 
   - Tom: Cordial, coeso, humanizado, para pessoas leigas.
   - Restrição: NUNCA diga nada negativo que possa prejudicar o escritório ou assustar o cliente. Use um tom de "estamos no controle".
   - Contexto: Explique de forma simples o que aconteceu no último movimento do tribunal.

2. ANÁLISE TÉCNICA (resumoTecnico, analiseRisco, proximosPassos): 
   - Utilize toda a sua capacidade de raciocínio jurídico para interpretar o JSON do DataJud após a ordenação correta.
   - Identifique brechas, prazos e a estratégia vencedora para o fundador Davi Alves Figueredo.

3. HISTÓRICO: Extraia os movimentos reais em ordem cronológica decrescente para exibição, mas utilize a crescente para sua análise interna.

ESTRUTURA DE JSON OBRIGATÓRIA (USE EXATAMENTE ESTAS CHAVES):
{
  "resumoTecnico": "...",
  "analiseRisco": "...",
  "proximosPassos": "...",
  "mensagemCliente": "...",
  "historicoMovimentacoes": [ { "data": "DD/MM/AAAA HH:MM:SS", "movimento": "..." } ]
}

IMPORTANTE: Retorne APENAS o JSON puro. Não adicione comentários antes ou depois.`;

/**
 * Função de Normalização Ultra-Resiliente v2
 * Mapeia variações de chaves de diferentes motores para o VereditoOutputSchema.
 */
function normalizarResultado(raw: any): any {
  let data = raw;
  if (typeof raw === 'string') {
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      data = match ? JSON.parse(match[0]) : {};
    } catch {
      data = {};
    }
  }

  return {
    resumoTecnico: data.resumoTecnico || data.analise_interna?.status || data.resumo_tecnico || data.status_atual || "Análise técnica indisponível no momento.",
    analiseRisco: data.analiseRisco || data.analise_interna?.riscos || data.analise_risco || data.riscos || "Sem riscos críticos identificados nesta movimentação.",
    proximosPassos: data.proximosPassos || data.analise_interna?.prazos || data.proximos_passos || data.estrategia || "Aguardar nova movimentação processual para ação.",
    mensagemCliente: data.mensagemCliente || data.mensagem_cliente || data.whatsapp || "Olá! Estamos acompanhando seu processo de perto e traremos novidades em breve. Fique tranquilo, estamos cuidando de tudo.",
    historicoMovimentacoes: data.historicoMovimentacoes || data.historico?.map((h: any) => ({ 
      data: h.data || h.dataHora || "N/A", 
      movimento: h.movimento || h.descricao || h.nome || "Movimentação registrada." 
    })) || []
  };
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
      model: deepThinking ? 'deepseek/deepseek-r1' : 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTIONS },
        { role: 'user', content: `DADOS TRIBUNAL (DataJud): ${JSON.stringify(datajud)}` }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) throw new Error(`Erro API OpenRouter: ${response.status}`);
  const result = await response.json();
  const rawResult = JSON.parse(result.choices[0].message.content);
  return normalizarResultado(rawResult);
}

async function callGrok(datajud: any) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTIONS },
        { role: 'user', content: `ANALISE ESTE PROCESSO E GERE O JSON: ${JSON.stringify(datajud)}` }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) throw new Error(`Erro Groq: ${response.status}`);
  const result = await response.json();
  const rawResult = JSON.parse(result.choices[0].message.content);
  return normalizarResultado(rawResult);
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
    if (!dataJudData) throw new Error("Processo não localizado ou indisponível no momento.");

    let result;
    let engine = input.preferredModel.toUpperCase();

    try {
      if (input.preferredModel === 'grok') {
        result = await callGrok(dataJudData);
        engine = 'GROK (LLAMA 3.3 70B)';
      } else if (input.preferredModel === 'openrouter') {
        result = await callOpenRouter(dataJudData, input.deepThinking);
        engine = input.deepThinking ? 'OPENROUTER (DEEPSEEK R1)' : 'OPENROUTER (CLAUDE 3.5)';
      } else {
        const {output} = await ai.generate({
          model: 'googleai/gemini-1.5-flash',
          system: SYSTEM_INSTRUCTIONS,
          prompt: `Analise DataJud: ${JSON.stringify(dataJudData)}`,
          output: { schema: VereditoOutputSchema }
        });
        result = output;
        engine = 'GEMINI 1.5 FLASH';
      }

      if (!result) throw new Error("O motor de análise falhou em processar os dados.");

      return {
        ...result,
        dataJudRaw: dataJudData,
        engineUtilizada: engine
      };
    } catch (e: any) {
      throw new Error(`Falha no Motor ${engine}: ${e.message}`);
    }
  }
);

export async function executarVereditoAI(input: any) {
  return vereditoAIFlow(input);
}
