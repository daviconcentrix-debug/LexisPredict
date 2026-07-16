'use server';
/**
 * @fileOverview Motor de Auditoria 3D v940.0 ELITE
 * Núcleo: Pentade de Motores Neurais com Triagem de Dados do DataJud.
 * Integrado ao fluxo de Comunicação WhatsApp.
 * Proprietário: W1 Capital | Fundador: Davi Alves Figueredo
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {fetchDataJud} from '@/lib/datajud';

const API_KEYS = {
  XAI: 'xai-m2nfN0fkMwh5sbe0tKgoAAQxOfCF3pfb2OLjgE4FOxxMkqiMuTsTAtNoMrfxuYWfon3f4ryyMUPl3fDE',
  GROQ: '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'
};

const SYSTEM_INSTRUCTIONS = `Você é o Veredito AI Elite do Gabinete Jurídico Get Assessoria. 
Analise os dados processuais (DataJud ou Histórico Bruto) e retorne um parecer técnico-comercial em JSON.

REGRAS DE OURO:
1. RESUMO DIRETO (MÁX 6 LINHAS).
2. Defenda os interesses da Assessoria.
3. Se houver menção a custos, cite a Cláusula 3.2 do contrato.
4. Gere uma 'mensagemCliente' pronta para WhatsApp, cordial e profissional.
5. Se não houver dados claros, sugira que a equipe técnica está analisando.

FORMATO JSON OBRIGATÓRIO:
{ 
  "resumoTecnico": "O que aconteceu no processo", 
  "analiseRisco": "Risco baseado na Cláusula 3.2", 
  "proximosPassos": "O que o escritório vai fazer agora", 
  "mensagemCliente": "Texto pronto para enviar ao cliente no WhatsApp assinado pelo Setor Processual" 
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
    // Resgate de Texto Plano caso o JSON falhe
    if (text.length > 20) {
      return { resumoTecnico: text.substring(0, 500), mensagemCliente: text };
    }
    return null;
  } catch (e) { return null; }
}

async function callNeuralEngine(context: string, preferredModel: string = 'xai') {
  const engineUrl = preferredModel === 'xai' ? 'https://api.x.ai/v1/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions';
  const apiKey = preferredModel === 'xai' ? API_KEYS.XAI : API_KEYS.GROQ;
  const modelName = preferredModel === 'xai' ? 'grok-4.5' : 'llama-3.3-70b-versatile';

  try {
    const res = await fetch(engineUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'system', content: SYSTEM_INSTRUCTIONS }, { role: 'user', content: context }],
        response_format: preferredModel === 'xai' ? { type: 'json_object' } : undefined
      })
    });
    
    if (!res.ok) return null;
    const data = await res.json();
    return cleanJsonResponse(data?.choices?.[0]?.message?.content);
  } catch (e) { return null; }
}

export const vereditoAIFlow = ai.defineFlow(
  { name: 'vereditoAIFlow', inputSchema: z.any(), outputSchema: z.any() },
  async input => {
    try {
      let dataContext = "";
      
      // 1. Tenta DataJud
      const dataJudData = await fetchDataJud(input.cnj);
      if (dataJudData) {
        dataContext = `DADOS DATAJUD: ${JSON.stringify(dataJudData).substring(0, 10000)}`;
      } else if (input.historicoBruto) {
        // 2. Se DataJud falhar, usa o histórico colado pelo usuário
        dataContext = `HISTÓRICO BRUTO DO TRIBUNAL: ${input.historicoBruto.substring(0, 10000)}`;
      } else {
        return { error: true, message: "DADOS_INSUFICIENTES" };
      }

      const result = await callNeuralEngine(dataContext, input.preferredModel || 'xai');
      
      if (result) {
        return { ...result, success: true, source: dataJudData ? 'DATAJUD' : 'MANUAL' };
      }

      return { error: true, message: "FALHA_NA_ANALISE" };
    } catch (e) {
      return { error: true, message: "ERRO_INTERNO" };
    }
  }
);

export async function executarVereditoAI(input: any) {
  return await vereditoAIFlow(input);
}
