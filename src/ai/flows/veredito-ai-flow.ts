
'use server';
/**
 * @fileOverview Motor de Auditoria 3D v620.0 ELITE - CRM W1 Capital
 * Núcleo: xAI (Grok 4.5) | Backup: Groq (Llama 3.3) | Reserva 1: Puter (Claude) | Reserva 2: Airforce (DeepSeek).
 * Proprietário: W1 Capital | Fundador: Davi Alves Figueredo
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {fetchDataJud} from '@/lib/datajud';

const VereditoOutputSchema = z.object({
  resumoTecnico: z.string(),
  analiseRisco: z.string(),
  proximosPassos: z.string(),
  mensagemCliente: z.string(),
  dataJudRaw: z.any().optional(),
  engineUtilizada: z.string().optional()
});

const SYSTEM_INSTRUCTIONS = `Você é o Veredito AI v620.0 Elite da W1 Capital. 
Analise os dados do DataJud e retorne APENAS JSON plano. Não inclua explicações ou markdown.
{ "resumoTecnico": "", "analiseRisco": "", "proximosPassos": "", "mensagemCliente": "" }`;

const XAI_API_KEY = 'xai-m2nfN0fkMwh5sbe0tKgoAAQxOfCF3pfb2OLjgE4FOxxMkqiMuTsTAtNoMrfxuYWfon3f4ryyMUPl3fDE';
const AIRFORCE_API_KEY = 'sk-air-Rxc7ygo5b0XpkZqUBqwSnhjwS0bZbWFnzwRLjfPtdAbYK6nj';

function cleanJsonResponse(text: string): string {
  if (!text) return "{}";
  let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

async function callXAIVeredito(datajud: any) {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${XAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'grok-4.5',
      messages: [{ role: 'system', content: SYSTEM_INSTRUCTIONS }, { role: 'user', content: `DADOS: ${JSON.stringify(datajud).substring(0, 8000)}` }],
      response_format: { type: 'json_object' }
    })
  });
  if (!response.ok) throw new Error(`XAI_ERR_${response.status}`);
  const data = await response.json();
  return JSON.parse(cleanJsonResponse(data.choices[0].message.content));
}

async function callAirforceVeredito(datajud: any) {
  const response = await fetch('https://api.airforce/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AIRFORCE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deepseek-v3',
      messages: [{ role: 'system', content: SYSTEM_INSTRUCTIONS }, { role: 'user', content: `DADOS: ${JSON.stringify(datajud).substring(0, 8000)}` }]
    })
  });
  if (!response.ok) throw new Error(`AIRFORCE_ERR_${response.status}`);
  const data = await response.json();
  return JSON.parse(cleanJsonResponse(data.choices[0].message.content));
}

async function callGroqVeredito(datajud: any) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: SYSTEM_INSTRUCTIONS }, { role: 'user', content: `DADOS: ${JSON.stringify(datajud).substring(0, 8000)}` }],
      response_format: { type: 'json_object' }
    })
  });
  if (!response.ok) throw new Error(`GROQ_ERR_${response.status}`);
  const data = await response.json();
  return JSON.parse(cleanJsonResponse(data.choices[0].message.content));
}

export const vereditoAIFlow = ai.defineFlow(
  {
    name: 'vereditoAIFlow',
    inputSchema: z.object({ cnj: z.string(), preferredModel: z.enum(['grok', 'xai', 'puter', 'airforce']).optional().default('xai') }),
    outputSchema: VereditoOutputSchema,
  },
  async input => {
    const dataJudData = await fetchDataJud(input.cnj);
    let result;
    const model = input.preferredModel;

    try {
      if (model === 'xai') result = await callXAIVeredito(dataJudData);
      else if (model === 'airforce') result = await callAirforceVeredito(dataJudData);
      else if (model === 'puter') {
         const response = await fetch('https://api.puter.com/v2/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'claude-sonnet-5', messages: [{ role: 'system', content: SYSTEM_INSTRUCTIONS }, { role: 'user', content: `DADOS: ${JSON.stringify(dataJudData).substring(0, 8000)}` }] })
         });
         const data = await response.json();
         result = JSON.parse(cleanJsonResponse(data.message.content[0].text));
      } else result = await callGroqVeredito(dataJudData);
      
      return { ...result, dataJudRaw: dataJudData, engineUtilizada: model.toUpperCase() };
    } catch (e) {
       try { result = await callGroqVeredito(dataJudData); return { ...result, dataJudRaw: dataJudData, engineUtilizada: 'FAILOVER GROQ' }; }
       catch (e2) {
          try { result = await callAirforceVeredito(dataJudData); return { ...result, dataJudRaw: dataJudData, engineUtilizada: 'FAILOVER AIRFORCE' }; }
          catch (e3) { throw new Error("FALHA_SISTEMA_SERVER_ACTION"); }
       }
    }
  }
);

export async function executarVereditoAI(input: any) {
  return await vereditoAIFlow(input);
}
