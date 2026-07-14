'use server';
/**
 * @fileOverview Motor de Auditoria Operacional Jurídica v230000.0 ELITE
 * Analisa anotações para extrair pontos fortes e riscos detectados.
 * Estratégia: Triagem Local (Keywords) + Refinamento Neural (xAI/DeepSeek).
 * Proprietário: W1 Capital | Fundador: Davi Alves Figueredo
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const API_KEYS = {
  XAI: 'xai-m2nfN0fkMwh5sbe0tKgoAAQxOfCF3pfb2OLjgE4FOxxMkqiMuTsTAtNoMrfxuYWfon3f4ryyMUPl3fDE',
  AIRFORCE: 'sk-air-Rxc7ygo5b0XpkZqUBqwSnhjwS0bZbWFnzwRLjfPtdAbYK6nj'
};

/**
 * Motor de Inteligência de Evidências v230000.0 ELITE (Local & Offline)
 * Realiza a classificação imediata baseada em padrões de gabinete.
 */
export async function analisarEvidenciasLocais(notas: string[]) {
  const pontosFortes: string[] = [];
  const riscosDetectados: string[] = [];

  // 1. Unifica e limpa o texto, removendo timestamps do sistema
  const textoUnificado = notas.join('\n')
    .replace(/\d{2}\/\d{2}\/\d{4},\s\d{2}:\d{2}:\d{2}/g, '') // Remove HH:MM:SS do sistema
    .replace(/(dia\s+)?\d{2}\/\d{2}\/\d{4}/gi, '');        // Remove datas isoladas que confundem o motor

  // 2. Divide em linhas/tópicos para análise cirúrgica
  const linhas = textoUnificado.split('\n')
    .map(l => l.trim().replace(/^-\s*/, ''))
    .filter(l => l.length > 5);

  // Dicionário de palavras-chave para classificação inteligente
  const keywordsRisco = [
    'falha', 'erro', 'critico', 'crítico', 'atrasado', 'reclamar', 
    'reclame aqui', 'não assinou', 'busca e apreensão', 'vencido', 'problema'
  ];

  const keywordsForca = [
    'atendido', 'respondido', 'resolvido', 'enviado', 'procurações', 
    'procuração', 'ia criada', 'implementado', 'atualização', 
    'melhoria', 'manutenção', 'ajudando', 'suporte', 'crescimento'
  ];

  linhas.forEach(linha => {
    const linhaMinuscula = linha.toLowerCase();

    // Verifica se a linha indica um risco/negativo
    const ehRisco = keywordsRisco.some(kw => linhaMinuscula.includes(kw));
    // Verifica se indica um ponto forte
    const ehForca = keywordsForca.some(kw => linhaMinuscula.includes(kw));

    if (ehRisco) {
      riscosDetectados.push(linha);
    } else if (ehForca) {
      pontosFortes.push(linha);
    }
  });

  return {
    pontosFortes: pontosFortes.length > 0 ? pontosFortes : ["Monitoramento de rotina mantido."],
    riscosDetectados: riscosDetectados.length > 0 ? riscosDetectados : ["Nenhum risco operacional crítico identificado."]
  };
}

const SYSTEM_PROMPT = `Você é um Auditor Operacional Jurídico da W1 Capital.
Analise exclusivamente o relatório de atividades fornecido.
O texto contém registros internos de trabalho, atendimento ao cliente e manutenção.

Ignore completamente:
- datas automáticas repetidas;
- horários gerados pelo sistema;
- palavras como "Note Attachment";
- títulos vazios como "Atualização sem Título".

Sua função é identificar PONTOS FORTES e RISCOS DETECTADOS de forma resumida e executiva.

RETORNE EXCLUSIVAMENTE JSON PLANO:
{
 "pontosFortes": [],
 "riscosDetectados": []
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
    return null;
  } catch { return null; }
}

async function callNeuralEngine(text: string) {
  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEYS.XAI}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'grok-4.5',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: `RELATÓRIO:\n${text}` }],
        response_format: { type: 'json_object' }
      })
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return cleanJsonResponse(data?.choices?.[0]?.message?.content);
  } catch {
    try {
      const res = await fetch('https://api.airforce/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${API_KEYS.AIRFORCE}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'deepseek-v3',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: `RELATÓRIO:\n${text}` }]
        })
      });
      const data = await res.json();
      return cleanJsonResponse(data?.choices?.[0]?.message?.content);
    } catch { return null; }
  }
}

export const noteAnalysisFlow = ai.defineFlow(
  { name: 'noteAnalysisFlow', inputSchema: z.any(), outputSchema: z.any() },
  async (input) => {
    const rawNotes = input.notes.map((n: any) => `${n.title}: ${n.content}`);
    
    // 1. ANÁLISE LOCAL (IMEDIATA)
    const localResult = await analisarEvidenciasLocais(rawNotes);
    
    // 2. REFINAMENTO NEURAL (OPCIONAL/FALLBACK)
    // Tenta enriquecer a análise se houver conteúdo suficiente
    if (rawNotes.join(' ').length > 20) {
      const neuralResult = await callNeuralEngine(rawNotes.join('\n'));
      if (neuralResult && (neuralResult.pontosFortes?.length || neuralResult.riscosDetectados?.length)) {
        return {
          pontosFortes: Array.from(new Set([...localResult.pontosFortes, ...(neuralResult.pontosFortes || [])])).filter(s => !s.includes("Nenhum") && !s.includes("Monitoramento")),
          riscosDetectados: Array.from(new Set([...localResult.riscosDetectados, ...(neuralResult.riscosDetectados || [])])).filter(s => !s.includes("Nenhum"))
        };
      }
    }

    return localResult;
  }
);

export async function analisarNotasIA(notes: any[]) {
  return await noteAnalysisFlow({ notes });
}
