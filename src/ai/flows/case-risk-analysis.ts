'use server';
/**
 * @fileOverview A Genkit flow for analyzing legal case details.
 * Removido Vertex AI / Gemini. Migrado para OpenRouter (DeepSeek R1).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CaseRiskAnalysisInputSchema = z.object({
  clientName: z.string(),
  protocolNumber: z.string(),
  caseSituation: z.string(),
  nextDeadline: z.string().optional(),
  responsibleLawyer: z.string().optional(),
  caseDetails: z.string().optional(),
});

const CaseRiskAnalysisOutputSchema = z.object({
  riskScore: z.number().min(0).max(100),
  priorityLevel: z.enum(['Low', 'Medium', 'High', 'Critical']),
  technicalSummary: z.string(),
});

export async function caseRiskAnalysis(input: any): Promise<any> {
  const OPENROUTER_API_KEY = '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';
  
  const prompt = `Analise este caso jurídico brasileiro e retorne apenas um JSON:
  Cliente: ${input.clientName}
  Protocolo: ${input.protocolNumber}
  Situação: ${input.caseSituation}
  Prazo: ${input.nextDeadline || 'N/A'}
  Detalhes: ${input.caseDetails || 'N/A'}
  
  JSON esperado: { "riskScore": número, "priorityLevel": "Low"|"Medium"|"High"|"Critical", "technicalSummary": "string" }`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1-distill-llama-70b',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) throw new Error("Falha na análise de risco.");
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    return { riskScore: 50, priorityLevel: 'Medium', technicalSummary: 'Erro no motor de análise.' };
  }
}