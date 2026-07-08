'use server';
/**
 * @fileOverview Motor de Inteligência Jurídica v390.0 ELITE - CRM W1 Capital
 * Script Estratégico W1 Capital + Integração DataJud Direta + Normalização de Schema v3.
 * Motores: Grok (Llama 3.3) & Claude 3.5 Sonnet.
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

const SYSTEM_INSTRUCTIONS = `Return strictly valid JSON only.
Você é o Veredito AI v390.0 Elite, o assistente jurídico sênior da W1 Capital.
Sua missão é analisar dados reais do DataJud para o fundador Davi Alves Figueredo.

### Correção da Cronologia (obrigatória) ###
Organize todos os eventos pela data/hora em ordem cronológica crescente.
O último movimento é o evento final dessa lista organizada.

REGRAS DE OURO:
1. MENSAGEM WHATSAPP: Cordial, humanizada, tom de "estamos no controle".
2. ANÁLISE TÉCNICA: Identifique brechas e estratégias vencedoras.
3. FORMATO: Retorne APENAS um objeto JSON. Do not include markdown blocks.`;

function normalizarResultado(raw: any): any {
  let data = raw;
  if (typeof raw === 'string') {
    try {
      const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const match = clean.match(/\{[\s\S]*\}/);
      data = match ? JSON.parse(match[0]) : {};
    } catch { data = {}; }
  }

  return {
    resumoTecnico: data.resumoTecnico || data.analise_interna || "Análise técnica indisponível.",
    analiseRisco: data.analiseRisco || "Sem riscos identificados no momento.",
    proximosPassos: data.proximosPassos || "Aguardar nova movimentação processual.",
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
        { role: 'user', content: `Analise DataJud: ${JSON.stringify(datajud).substring(0, 10000)}` }
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
    headers: { 
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 
      'Content-Type': 'application/json', 
      'HTTP-Referer': 'https://lexispredict.w1.capital' 
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTIONS },
        { role: 'user', content: `DADOS DATAJUD: ${JSON.stringify(datajud).substring(0, 10000)}` }
      ]
    })
  });
  if (!response.ok) throw new Error(`Erro OpenRouter: ${response.status}`);
  const data = await response.json();
  const rawContent = data.choices[0].message.content;
  const clean = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
  const match = clean.match(/\{[\s\S]*\}/);
  return match ? JSON.parse(match[0]) : JSON.parse(clean);
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

      if (!result) throw new Error("Motor de análise falhou ao retornar dados.");

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
