
'use server';
/**
 * @fileOverview Motor de Auditoria 3D v2700.0 ELITE
 * Soberania Grok 4.5 integrada com DataJud.
 * Proprietário: W1 Capital | Fundador: Davi Alves Figueredo
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {fetchDataJud} from '@/lib/datajud';

const API_KEYS = {
  XAI: process.env.XAI_API_KEY,
  AIRFORCE: process.env.AIRFORCE_API_KEY,
  GROQ: process.env.GROQ_API_KEY
};

const SYSTEM_INSTRUCTIONS = `Você é o Veredito AI Elite v2700. 
Analise os dados processuais e retorne um parecer rigoroso em JSON.

FORMATO JSON OBRIGATÓRIO:
{ 
  "resumoTecnico": "Máximo 6 linhas", 
  "analiseRisco": "Baseada na Cláusula 3.2", 
  "proximosPassos": "Estratégia operativa", 
  "mensagemCliente": "Texto para WhatsApp assinado pelo Setor Processual" 
}`;

function cleanJsonResponse(text: string): any {
  if (!text) return null;
  try {
    let clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      return JSON.parse(clean.substring(firstBrace, lastBrace + 1));
    }
    // Fallback: se não for JSON, tenta organizar em campos básicos
    return {
      resumoTecnico: text.substring(0, 300),
      analiseRisco: "Análise técnica extraída de texto livre.",
      proximosPassos: "Monitoramento mantido conforme orientação da IA.",
      mensagemCliente: text
    };
  } catch { 
    return {
      resumoTecnico: "Falha na formatação da resposta neural.",
      analiseRisco: "Risco não determinado.",
      proximosPassos: "Repetir triagem.",
      mensagemCliente: "Identificamos uma movimentação processual que exige revisão manual."
    }; 
  }
}

async function callNeuralEngine(context: string) {
  const engines = [
    { id: 'xai-grok4.5', url: 'https://api.x.ai/v1/chat/completions', key: API_KEYS.XAI, model: 'grok-4.5', useJson: true },
    { id: 'airforce-deepseek', url: 'https://api.airforce/v1/chat/completions', key: API_KEYS.AIRFORCE, model: 'deepseek-v3', useJson: false },
    { id: 'groq-llama', url: 'https://api.groq.com/openai/v1/chat/completions', key: API_KEYS.GROQ, model: 'llama-3.3-70b-versatile', useJson: false }
  ];

  for (const engine of engines) {
    if (!engine.key) continue;
    try {
      const res = await fetch(engine.url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${engine.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: engine.model,
          messages: [{ role: 'system', content: SYSTEM_INSTRUCTIONS }, { role: 'user', content: context }],
          response_format: engine.useJson ? { type: 'json_object' } : undefined
        }),
        signal: AbortSignal.timeout(45000)
      });
      if (!res.ok) continue;
      const data = await res.json();
      const parsed = cleanJsonResponse(data?.choices?.[0]?.message?.content);
      if (parsed) return { ...parsed, engineUsed: engine.id.toUpperCase() };
    } catch { continue; }
  }
  return null;
}

export const vereditoAIFlow = ai.defineFlow(
  { name: 'vereditoAIFlow', inputSchema: z.any(), outputSchema: z.any() },
  async input => {
    try {
      const dataJudData = await fetchDataJud(input.cnj);
      
      // Garantimos que o contexto sempre tenha o CNJ mesmo em falha do DataJud
      const dataJudContext = (dataJudData && !dataJudData.error)
        ? `DADOS DATAJUD: ${JSON.stringify(dataJudData)}` 
        : `CNJ IDENTIFICADO: ${input.cnj}. HISTÓRICO MANUAL: ${input.historicoBruto || "Sem dados adicionais de tribunal."}`;

      const result = await callNeuralEngine(dataJudContext);
      
      // Retornamos um objeto consistente mesmo se a IA falhar
      if (!result) {
        return {
          success: false,
          resumoTecnico: "Indisponibilidade temporária dos motores de triagem.",
          analiseRisco: "Risco não calculado.",
          proximosPassos: "Tentar via Groq Llama manual.",
          mensagemCliente: "Olá! Recebemos sua dúvida. Nossa equipe jurídica está analisando o último andamento do seu processo e logo retornaremos com o parecer completo.",
          dataJudRaw: dataJudData || { numeroProcesso: input.cnj, movimentos: [] }
        };
      }
      
      return { 
        ...result, 
        success: true,
        dataJudRaw: dataJudData || { numeroProcesso: input.cnj, movimentos: [] } 
      };
    } catch (e) {
      console.error("Veredito Crash:", e);
      return { 
        error: true, 
        success: false,
        message: "ERRO_SISTEMICO_DE_TRIAGEM", 
        dataJudRaw: { numeroProcesso: input.cnj, movimentos: [] } 
      };
    }
  }
);

export async function executarVereditoAI(input: any) {
  return await vereditoAIFlow(input);
}
