
/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 */
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const API_KEYS = {
  XAI: process.env.XAI_API_KEY,
  AIRFORCE: process.env.AIRFORCE_API_KEY,
  GROQ: process.env.GROQ_API_KEY
};

/**
 * PROTOCOLO DE TRANSCRIÇÃO SOBERANA GET v27.0
 * Instruções de OCR Visual e Extração Integral Incondicional.
 */
const SYSTEM_PROMPT = `Você é um especialista em elaboração de peças jurídicas para a GET Assessoria Financeira Ltda. Sua tarefa é atuar como um sistema de OCR jurídico soberano.

INSTRUÇÃO OBRIGATÓRIA:
NÃO ANALISE O DOCUMENTO ANTES DE LER TODO O CONTEÚDO.
Se o documento contiver páginas digitalizadas, imagens ou texto não selecionável:
1. Sua tarefa é atuar como um sistema de OCR jurídico. Leia visualmente cada página do documento (mesmo que sejam imagens).
2. Extraia integralmente o texto, preservando nomes, CPF/CNPJ, números de processo, datas, endereços, assinaturas identificáveis, tabelas e formatação lógica.
3. NÃO faça resumo. Não analise antes de terminar a transcrição completa.
4. Se alguma palavra estiver ilegível, indique [ilegível] no local correspondente.
5. É PROIBIDO responder que "o PDF parece conter imagens" ou "não foi possível extrair". Primeiro faça a transcrição integral, depois utilize esse texto para preencher o JSON.

REGRAS DE PRIORIDADE:
- Se houver HTML junto ao PDF, utilize o HTML como fonte principal. 
- Use o PDF apenas para conferir layout, tabelas e gráficos.
- O HTML possui prioridade absoluta sobre o PDF.

SCHEMA OBRIGATÓRIO (RETORNE APENAS JSON):
{
  "outorgante": {
    "nome": "",
    "nacionalidade": "",
    "estado_civil": "",
    "profissao": "",
    "rg": "",
    "cpf": "",
    "endereco": "",
    "email": ""
  },
  "outorgados": [
    {
      "nome": "",
      "nacionalidade": "",
      "estado_civil": "",
      "profissao": "Advogado",
      "oab": ""
    }
  ],
  "poderes_especificos": "AÇÃO REVISIONAL DE CONTRATO COM PEDIDO DE TUTELA DE URGÊNCIA",
  "cidade": "São Paulo",
  "data": "",
  "erro": ""
}

REGRAS ADICIONAIS:
1. Outorgante: Extraia nome completo (Sempre em MAIÚSCULO).
2. Outorgados: Sempre coloque a OAB no formato XXXXX/SP.
3. Se algum dado não existir, coloque null ou "". Nunca devolva texto solto fora do JSON.`;

function cleanJsonResponse(text: string): any {
  if (!text) return null;
  try {
    let clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      return JSON.parse(clean.substring(firstBrace, lastBrace + 1));
    }
    return null;
  } catch { return null; }
}

async function callNeuralEngine(text: string, html?: string) {
  const engines = [
    { id: 'xai-grok', url: 'https://api.x.ai/v1/responses', key: API_KEYS.XAI, model: 'grok-4.5' },
    { id: 'airforce-deepseek', url: 'https://api.airforce/v1/chat/completions', key: API_KEYS.AIRFORCE, model: 'deepseek-v3' }
  ];

  const contentToAnalyze = `FONTE HTML (PRIORIDADE ABSOLUTA): ${html || 'N/A'}\n\nFONTE PDF/TEXTO: ${text || '[SOLICITADA LEITURA VISUAL OCR]'}`;

  for (const engine of engines) {
    if (!engine.key) continue;
    try {
      const isResponses = engine.url.endsWith('/responses');
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT }, 
        { role: 'user', content: `INICIAR TRIAGEM SOBERANA GET:\n${contentToAnalyze}` }
      ];
      
      const body: any = { 
        model: engine.model, 
        temperature: 0.1,
        max_tokens: 4096
      };

      if (isResponses) {
        body.input = messages;
        body.reasoning_effort = "high";
      } else {
        body.messages = messages;
      }

      const res = await fetch(engine.url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${engine.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60000)
      });
      
      if (!res.ok) continue;
      const data = await res.json();
      
      const content = data?.choices?.[0]?.message?.content || 
                      data?.output?.message?.content || 
                      (Array.isArray(data?.output) ? data?.output?.[0]?.text : null);
      
      const parsed = cleanJsonResponse(content);
      if (parsed) return parsed;
    } catch { continue; }
  }
  return null;
}

export const documentFlow = ai.defineFlow(
  { name: 'documentFlow', inputSchema: z.any(), outputSchema: z.any() },
  async (input) => {
    const text = (input.text || "").substring(0, 50000);
    const html = (input.html || "").substring(0, 50000);
    return await callNeuralEngine(text, html);
  }
);
