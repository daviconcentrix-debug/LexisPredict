'use server';
/**
 * @fileOverview Motor de Geração de Documentos Jurídicos v8.0 Definitivo
 * Extração de dados e preenchimento de Procuração Ad Judicia.
 * Formatação de ALTA FIDELIDADE baseada no modelo definitivo da Get Assessoria.
 * Proprietário: W1 Capital | Fundador: Davi Alves Figueredo
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DocumentInputSchema = z.object({
  dadosBrutos: z.string().describe('O texto bruto, contrato ou PDF extraído para análise.'),
  preferredModel: z.enum(['gemini', 'grok', 'openrouter']).optional().default('openrouter'),
});

const DocumentOutputSchema = z.object({
  conteudoFormatado: z.string().describe('O documento preenchido e formatado para Word.'),
  engineUtilizada: z.string().optional()
});

const documentPrompt = ai.definePrompt({
  name: 'documentPrompt',
  input: {schema: z.object({dados: z.string(), today: z.string()})},
  output: {schema: z.object({documento: z.string()})},
  prompt: `Aja como um Assistente Jurídico Sênior da Get Assessoria (W1 Capital). Sua tarefa é extrair dados do texto fornecido e preencher a procuração "Ad Judicia" com precisão cirúrgica, seguindo RIGOROSAMENTE o modelo definitivo fornecido.

INSTRUÇÕES DE EXECUÇÃO:
1. Analise o texto de entrada e extraia: Nome Completo, Nacionalidade, Estado Civil, Profissão, RG, CPF, Endereço Completo e E-mail.
2. Caso algum dado esteja faltando, coloque [INSERIR DADO] no local correspondente.
3. Mantenha os dados do procurador DIEGO GOMES DIAS e o CNPJ do Banco Votorantim (59.588.111/0001-03) exatamente como no modelo.
4. Use a data: {{{today}}}.

REGRAS DE FORMATO (CRÍTICO):
- O resultado deve ser APENAS o texto da procuração. NÃO RETORNE OBJETOS JSON OU ESTRUTURAS DE DADOS DENTRO DO CAMPO DOCUMENTO.
- Use **texto** para negritos.
- Use a tag [CENTER] no início e [/CENTER] no fim das linhas que devem ser centralizadas (Título, Data e Bloco de Assinatura).

MODELO DE SAÍDA EXATO (SIGA CADA NEGRITO E ESPAÇO):
[CENTER]**PROCURAÇÃO “AD JUDICIA”**[/CENTER]

**[NOME DO CLIENTE]**, [nacionalidade], [estado civil], [profissão], portador do RG sob Nº [RG] e devidamente inscrito no CPF sob Nº [CPF], residente e domiciliado à [Endereço Completo], com endereço eletrônico: [Email], neste ato nomeia como seu procurador:

**DIEGO GOMES DIAS**, brasileiro, advogado, inscrito na OAB/SP sob o número 370.898, com endereço profissional na Av. São Miguel, nº 4810 – Jardim Cotinha – São Paulo – SP – CEP: 03870-100, e endereço eletrônico: diego_gomesdias@yahoo.com.br.

**PODERES:** Por este instrumento particular de mandato, a outorgante retro referenciada nomeia e constitui seu bastante procurador o advogado também acima qualificado, a quem confere amplos poderes para o foro em geral, com a cláusula “AD JUDICIA”, em qualquer Juízo, Instância ou Tribunal, podendo propor contra quem de direito as ações competentes e defendê-la nas contrárias, seguindo umas e outras, até final decisão, usando os recursos legais e acompanhando-os, conferindo-lhes, ainda, poderes especiais para desistir, transigir, firmar compromissos ou acordos, receber e dar quitação, agindo em conjunto ou separadamente e independente da ordem de nomeação, podendo substabelecer esta em outrem, com ou sem reservas de iguais poderes, especialmente para, na defesa dos interesses da outorgante, agir nos autos da **AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA** promovida contra o **BANCO VOTORANTIM S/A**, inscrito no CNPJ nº **59.588.111/0001-03**.

[CENTER]São Paulo, {{{today}}}.[/CENTER]

[CENTER]____________________________________________________[/CENTER]
[CENTER]**[NOME DO CLIENTE]**[/CENTER]

TEXTO PARA ANÁLISE:
{{{dados}}}

SAÍDA: Retorne um JSON plano: { "documento": "texto_formatado_da_procuração" }.`,
});

function forceStringDocument(raw: any): string {
  if (!raw) return "";
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object') {
    if (raw.documento && typeof raw.documento === 'string') return raw.documento;
    if (raw.documento && typeof raw.documento === 'object') {
      // Se a IA retornar o documento como um objeto de dados em vez de texto
      return `ERRO: A IA retornou dados estruturados em vez de texto. Por favor, tente novamente com o motor CLAUDE 3.5 SONNET.`;
    }
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
            'HTTP-Referer': 'https://lexispredict.w1.capital',
            'X-Title': 'LexisPredict Docs Elite'
          },
          body: JSON.stringify({
            model: 'anthropic/claude-3.5-sonnet',
            messages: [
              { role: 'system', content: 'Você é Assistente Jurídico Sênior. Gere a procuração exclusivamente como TEXTO FORMATADO no campo "documento". NUNCA retorne objetos ou estruturas JSON dentro do texto. Use JSON apenas para o envelope externo.' },
              { role: 'user', content: `Extraia e preencha a procuração exatamente conforme o modelo visual para: ${input.dadosBrutos}. Data: ${today}` }
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
      } else if (input.preferredModel === 'grok') {
        const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'Retorne apenas JSON com campo string "documento" contendo a procuração completa em texto puro formatado conforme o modelo. Use a palavra JSON.' },
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
      } else {
        const {output} = await ai.generate({
          model: 'googleai/gemini-1.5-flash',
          prompt: documentPrompt({dados: input.dadosBrutos, today}),
        });
        result = { documento: forceStringDocument(output) };
        engine = `GEMINI 1.5 FLASH`;
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
