
'use server';
/**
 * @fileOverview Motor de Auditoria Operacional Jurídica v1200.0 ELITE
 * Analisa anotações para extrair pontos fortes e riscos detectados.
 * Motor: Cascata xAI Grok 4.5 -> DeepSeek V3.
 * Proprietário: W1 Capital | Fundador: Davi Alves Figueredo
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const API_KEYS = {
  XAI: 'xai-m2nfN0fkMwh5sbe0tKgoAAQxOfCF3pfb2OLjgE4FOxxMkqiMuTsTAtNoMrfxuYWfon3f4ryyMUPl3fDE',
  AIRFORCE: 'sk-air-Rxc7ygo5b0XpkZqUBqwSnhjwS0bZbWFnzwRLjfPtdAbYK6nj'
};

/**
 * Limpa metadados técnicos do sistema sem apagar as datas manuais do usuário.
 */
function limparEvidencias(texto: string) {
  if (!texto) return "";
  return texto
    // Remove apenas o padrão de data e hora do sistema: DD/MM/AAAA, HH:MM:SS
    .replace(/\d{2}\/\d{2}\/\d{4}[,\s]+\d{2}:\d{2}:\d{2}/g, '')
    // Remove tags de sistema
    .replace(/Note Attachment/gi, '')
    .replace(/Atualização sem Título/gi, '')
    // Remove ruídos de caracteres especiais repetidos
    .replace(/={3,}/g, '')
    .replace(/-{3,}/g, '')
    .trim();
}

const SYSTEM_PROMPT = `Você é um Auditor Operacional Jurídico Senior da W1 Capital.
Sua missão é ler o relatório de atividades e extrair KPIs qualitativos.

INSTRUÇÕES:
1. Ignore datas e horas geradas automaticamente pelo sistema.
2. Identifique PONTOS FORTES: Produtividade (ex: n procurações enviadas), suporte à equipe, melhorias no app, casos críticos resolvidos, atendimento WhatsApp.
3. Identifique RISCOS DETECTADOS: Falhas técnicas, clientes sem resposta, minutas não assinadas, atrasos operacionais, erros em atualizações.
4. Extraia o máximo de informações possível. Se houver texto, deve haver análise.

RETORNE EXCLUSIVAMENTE JSON PLANO:
{
 "pontosFortes": ["ponto 1", "ponto 2"],
 "riscosDetectados": ["risco 1", "risco 2"]
}`;

function cleanJsonResponse(text: string): any {
  if (!text) return null;
  try {
    let clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      const jsonStr = clean.substring(firstBrace, lastBrace + 1);
      return JSON.parse(jsonStr);
    }
    return null;
  } catch (e) { 
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
    const rawText = input.notes.map((n: any) => `${n.title}: ${n.content}`).join('\n\n');
    const cleanText = limparEvidencias(rawText);
    
    if (cleanText.length < 10) return { error: "Conteúdo insuficiente para auditoria." };

    let result = await callXAI(cleanText);
    if (!result || (!result.pontosFortes && !result.riscosDetectados)) {
      result = await callAirforce(cleanText);
    }

    // Garante estrutura mínima
    if (result) {
      if (!Array.isArray(result.pontosFortes)) result.pontosFortes = [];
      if (!Array.isArray(result.riscosDetectados)) result.riscosDetectados = [];
    }

    return result || { pontosFortes: [], riscosDetectados: [] };
  }
);

export async function analisarNotasIA(notes: any[]) {
  return await noteAnalysisFlow({ notes });
}
