
'use server';
/**
 * @fileOverview Motor de Auditoria Operacional Jurídica v1000.0 ELITE
 * Analisa anotações para extrair pontos fortes e riscos detectados.
 * Motor: Cascata xAI Grok 4.5 -> DeepSeek V3.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const API_KEYS = {
  XAI: 'xai-m2nfN0fkMwh5sbe0tKgoAAQxOfCF3pfb2OLjgE4FOxxMkqiMuTsTAtNoMrfxuYWfon3f4ryyMUPl3fDE',
  AIRFORCE: 'sk-air-Rxc7ygo5b0XpkZqUBqwSnhjwS0bZbWFnzwRLjfPtdAbYK6nj'
};

/**
 * Limpa metadados técnicos antes de enviar para a IA
 */
function limparEvidencias(texto: string) {
  return texto
    // Remove datas e horas automáticas (Ex: 13/07/2026, 19:27:43 ou 13/07/2026 19:27:43)
    .replace(/\d{2}\/\d{2}\/\d{4}[,\s]+\d{2}:\d{2}:\d{2}/g, '')
    .replace(/Note Attachment/gi, '')
    .replace(/Atualização sem Título/gi, '')
    .trim();
}

const SYSTEM_PROMPT = `Você é um Auditor Operacional Jurídico.

Analise exclusivamente o relatório de atividades fornecido.

O texto contém registros internos de trabalho, atendimento ao cliente, manutenção de sistemas e acompanhamento jurídico.

Ignore completamente:
- datas automáticas repetidas;
- horários gerados pelo sistema;
- palavras como "Note Attachment";
- títulos vazios como "Atualização sem Título";
- informações técnicas sem relação com impacto operacional.

Sua função é identificar:

PONTOS FORTES:
Inclua:
- clientes atendidos;
- procurações enviadas;
- casos críticos tratados;
- reclamações resolvidas;
- melhorias no aplicativo;
- automações criadas;
- apoio à equipe.

RISCOS DETECTADOS:
Inclua:
- falhas operacionais;
- problemas causados por atualizações;
- clientes sem retorno;
- documentos pendentes;
- casos críticos;
- riscos jurídicos.

Não invente informações.

Retorne SOMENTE JSON plano, sem markdown, sem explicações:
{
 "pontosFortes": [],
 "riscosDetectados": []
}`;

function cleanJsonResponse(text: string): any {
  if (!text) return null;
  try {
    // Remoção agressiva de markdown e ruídos de texto
    let clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      const jsonStr = clean.substring(firstBrace, lastBrace + 1);
      return JSON.parse(jsonStr);
    }
    return null;
  } catch (e) { 
    console.error("JSON Parse Error:", e);
    return null; 
  }
}

async function callXAI(notesText: string) {
  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEYS.XAI}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'grok-4.5',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: `RELATÓRIO DE ATIVIDADES:\n${notesText}` }],
        response_format: { type: 'json_object' }
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return cleanJsonResponse(data?.choices?.[0]?.message?.content);
  } catch { return null; }
}

async function callAirforce(notesText: string) {
  try {
    const res = await fetch('https://api.airforce/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEYS.AIRFORCE}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-v3',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: `RELATÓRIO DE ATIVIDADES:\n${notesText}` }]
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return cleanJsonResponse(data?.choices?.[0]?.message?.content);
  } catch { return null; }
}

export const noteAnalysisFlow = ai.defineFlow(
  { name: 'noteAnalysisFlow', inputSchema: z.any(), outputSchema: z.any() },
  async (input) => {
    // Agrupa todas as notas em um único texto para análise de contexto
    const rawText = input.notes.map((n: any) => `[${n.updatedAt}] ${n.title}: ${n.content}`).join('\n\n');
    const cleanText = limparEvidencias(rawText);
    
    if (cleanText.length < 5) return { error: "Notas insuficientes para análise estratégica." };

    let result = await callXAI(cleanText);
    if (!result || (!result.pontosFortes && !result.riscosDetectados)) {
      result = await callAirforce(cleanText);
    }

    return result || { pontosFortes: [], riscosDetectados: [] };
  }
);

export async function analisarNotasIA(notes: any[]) {
  return await noteAnalysisFlow({ notes });
}
