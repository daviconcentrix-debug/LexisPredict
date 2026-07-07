'use server';
/**
 * @fileOverview Motor de Geração de Documentos Jurídicos v16.1 ELITE (DEFINITIVO)
 * Motores: Grok (Llama 3.3) & Claude 3.5 Sonnet. Removido Gemini.
 * Proprietário: W1 Capital | Fundador: Davi Alves Figueredo
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DocumentInputSchema = z.object({
  dadosBrutos: z.string().describe('O texto bruto, contrato ou PDF extraído para análise.'),
  preferredModel: z.enum(['grok', 'openrouter']).optional().default('openrouter'),
});

const DocumentOutputSchema = z.object({
  conteudoFormatado: z.string().describe('O documento preenchido e formatado para Word.'),
  engineUtilizada: z.string().optional()
});

function forceStringDocument(raw: any): string {
  if (!raw) return "";
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object') {
    if (raw.documento && typeof raw.documento === 'string') return raw.documento;
    return JSON.stringify(raw, null, 2);
  }
  return String(raw);
}

export const documentFlow = ai.defineFlow(
  {
    name: 'documentFlow',
    inputSchema: DocumentInputSchema,
    outputSchema: DocumentOutputSchema,
  },
  async input => {
    let result;
    let engine;
    const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    try {
      if (input.preferredModel === 'openrouter') {
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
              { role: 'system', content: 'Você é Assistente Jurídico Sênior da Get Assessoria. Gere a procuração exclusivamente como TEXTO FORMATADO no campo "documento". Mantenha os dados do advogado DIEGO GOMES DIAS e o CNPJ do Banco Votorantim 59.588.111/0001-03 sempre.' },
              { role: 'user', content: `Extraia dados e preencha a procuração exatamente conforme o modelo visual para: ${input.dadosBrutos}. Data de hoje: ${today}` }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
          })
        });

        if (!response.ok) throw new Error(`Erro API OpenRouter: ${response.status}`);
        const data = await response.json();
        const content = JSON.parse(data.choices[0].message.content);
        result = { documento: forceStringDocument(content) };
        engine = `CLAUDE 3.5 SONNET`;
      } else {
        const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'Retorne apenas JSON com campo string "documento" contendo a procuração completa em texto puro formatado conforme o modelo oficial da Get Assessoria (W1 Capital).' },
              { role: 'user', content: `Gere a procuração conforme o script visual para os dados: ${input.dadosBrutos}` }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
          })
        });
        
        if (!response.ok) throw new Error(`Erro API Groq: ${response.status}`);
        const data = await response.json();
        const content = JSON.parse(data.choices[0].message.content);
        result = { documento: forceStringDocument(content) };
        engine = `GROK (LLAMA 3.3)`;
      }
      
      return { conteudoFormatado: forceStringDocument(result.documento), engineUtilizada: engine };
    } catch (e: any) {
      throw new Error(e.message || "Erro na geração do documento.");
    }
  }
);

export async function gerarDocumentoIA(input: any) {
  return documentFlow(input);
}