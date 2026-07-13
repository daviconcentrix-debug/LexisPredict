'use server';
/**
 * @fileOverview Análise de Risco de Gabinete v550.0 Elite
 * Motor: xAI Grok 4.5.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const XAI_API_KEY = 'xai-m2nfN0fkMwh5sbe0tKgoAAQxOfCF3pfb2OLjgE4FOxxMkqiMuTsTAtNoMrfxuYWfon3f4ryyMUPl3fDE';

export async function caseRiskAnalysis(input: any): Promise<any> {
  const prompt = `Analise este caso jurídico e retorne JSON: { "riskScore": 0-100, "priorityLevel": "Low"|"Medium"|"High"|"Critical", "technicalSummary": "" }
  Dados: ${JSON.stringify(input)}`;

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${XAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'grok-4.5',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) throw new Error("Falha xAI.");
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    return { riskScore: 50, priorityLevel: 'Medium', technicalSummary: 'Erro no motor xAI.' };
  }
}
