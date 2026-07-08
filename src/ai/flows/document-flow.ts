'use server';
/**
 * @fileOverview Motor de Extração e Triagem de Dados Jurídicos v480.0 ELITE
 * Especializado em filtrar dados relevantes de textos ruidosos.
 * Inclui Banco de Dados de Banca com OABs Territoriais Suplementares e Sanitização Neural.
 * Proprietário: W1 Capital | Fundador: Davi Alves Figueredo
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DocumentInputSchema = z.object({
  text: z.string().describe('Texto bruto ou contrato do cliente.'),
  preferredLawyer: z.string().optional().describe('Nome do advogado selecionado.'),
  preferredState: z.string().optional().describe('Estado da OAB selecionado.'),
});

const DocumentOutputSchema = z.object({
  cliente: z.object({
    nome: z.string(),
    estadoCivil: z.string(),
    profissao: z.string(),
    rg: z.string(),
    cpf: z.string(),
    endereco: z.string(),
    email: z.string(),
    genero: z.enum(['M', 'F']).default('M'),
  }),
  processos: z.array(z.object({
    banco: z.string(),
    cnpjBanco: z.string().optional().default(''),
    numero: z.string(),
    acao: z.string().default('AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA'),
    estado: z.string().optional(),
  })),
  advogado: z.object({
    nome: z.string(),
    oab: z.string(),
    endereco: z.string(),
    email: z.string(),
    cargo: z.string().default('advogado'),
  }),
});

export type DocumentOutput = z.infer<typeof DocumentOutputSchema>;

function sanitizeInputText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\x00-\x1F\x7F-\x9F]/g, "") 
    .replace(/[^\x20-\x7E\xA1-\xFF]/g, " ") 
    .replace(/\s+/g, " ") 
    .trim()
    .substring(0, 7000); 
}

const BANCA_DATA = {
  "DIEGO GOMES DIAS": {
    oabs: { 
      "BA": "77.510/BA", 
      "CE": "52.996-A/CE", 
      "MT": "34.044-A/MT", 
      "PI": "22.858/PI", 
      "RN": "21.766A/RN", 
      "SP": "370.898/SP" 
    },
    endereco: "Av. São Miguel, nº 4810 – Jardim Cotinha – São Paulo – SP – CEP: 03870-100",
    email: "diego_gomesdias@yahoo.com.br",
    genero: "M"
  },
  "LETICIA ALVES GODOY DA CRUZ": {
    oabs: { 
      "TO": "12.528-A/TO", 
      "AC": "6.572/AC", 
      "RS": "131.831-A/RS", 
      "PB": "31.888 A/PB", 
      "PA": "36.417-A/PA", 
      "SP": "490.641/SP" 
    },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-070",
    email: "leticiagodoy.adv@gmail.com",
    genero: "F"
  },
  "PABLO MATHEUS SILVA BASTOS PEREIRA": {
    oabs: { 
      "SP": "520.783/SP", 
      "RN": "520.783/SP", 
      "PI": "520.783/SP", 
      "MT": "520.783/SP", 
      "CE": "520.783/SP", 
      "BA": "520.783/SP", 
      "SC": "520.783/SP", 
      "ES": "520.783/SP", 
      "MS": "520.783/SP", 
      "MG": "249.550/MG", 
      "PR": "520.783/PR" 
    },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-071",
    email: "pablobastos@adv.oabsp.org.br",
    genero: "M"
  },
  "INGRID MICHAELLY TELES PACHECO OLIVEIRA ALVES": {
    oabs: { 
      "MA": "490.641/SP", 
      "RO": "13.438/RO", 
      "AP": "5.819-A/AP", 
      "SE": "1.601A/SE", 
      "RR": "844-A/RR", 
      "GO": "70.699/GO", 
      "SP": "490.641/SP" 
    },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-070",
    email: "pachecoingrid.adv@gmail.com",
    genero: "F"
  },
  "LUCAS DOS SANTOS DE JESUS": {
    oabs: { 
      "DF": "78.116/DF", 
      "AL": "21.512A/AL", 
      "AM": "A2373/AM", 
      "PE": "66.465/PE", 
      "RJ": "261.767/RJ", 
      "SP": "520.783/SP" 
    },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-070",
    email: "lucassj.adv01@gmail.com",
    genero: "M"
  }
};

export const documentFlow = ai.defineFlow(
  {
    name: 'documentFlow',
    inputSchema: DocumentInputSchema,
    outputSchema: DocumentOutputSchema,
  },
  async (input) => {
    const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
    const cleanedText = sanitizeInputText(input.text);
    const targetLawyer = input.preferredLawyer || "PABLO MATHEUS SILVA BASTOS PEREIRA";
    
    const systemPrompt = `Você é o Arquiteto Jurídico da W1 Capital. Extraia os dados do outorgante e da ação.
Ignore ruído financeiro, taxas, seguros e dados irrelevantes.
RETORNE APENAS JSON.
ESTRUTURA OBRIGATÓRIA:
{
  "cliente": { "nome": "", "estadoCivil": "", "profissao": "", "rg": "", "cpf": "", "endereco": "", "email": "", "genero": "M"|"F" },
  "processos": [{ "banco": "", "cnpjBanco": "", "numero": "", "acao": "AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA", "estado": "" }]
}
IMPORTANTE: "processos" DEVE ser um ARRAY. Extraia o CNPJ do Banco se visível, senão deixe vazio.`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${GROQ_API_KEY}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `CONTRATO: ${cleanedText}` }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro API Groq (${response.status}): ${errorData.error?.message || 'Falha na geração'}`);
      }

      const data = await response.json();
      const rawContent = data.choices[0].message.content;
      const parsed = JSON.parse(rawContent);
      
      const rawProcessos = parsed.processos || parsed.processo || [];
      const processosArray = Array.isArray(rawProcessos) ? rawProcessos : [rawProcessos];

      const lawyerInfo = (BANCA_DATA as any)[targetLawyer] || BANCA_DATA["PABLO MATHEUS SILVA BASTOS PEREIRA"];
      
      // Lógica de seleção de OAB: Prioriza input manual, depois detecção de texto, depois SP
      const detectedState = (processosArray[0]?.estado || processosArray[0]?.uf || "SP").toUpperCase();
      const finalState = (input.preferredState || detectedState).toUpperCase();
      const selectedOAB = (lawyerInfo.oabs as any)[finalState] || lawyerInfo.oabs["SP"];

      return {
        cliente: {
          nome: (parsed.cliente?.nome || "NÃO IDENTIFICADO").toUpperCase(),
          estadoCivil: parsed.cliente?.estadoCivil || "casado(a)",
          profissao: parsed.cliente?.profissao || "autônomo(a)",
          rg: parsed.cliente?.rg || "---",
          cpf: parsed.cliente?.cpf || "---",
          endereco: parsed.cliente?.endereco || "Não localizado",
          email: parsed.cliente?.email || "---",
          genero: parsed.cliente?.genero || 'M',
        },
        advogado: {
          nome: targetLawyer.toUpperCase(),
          oab: selectedOAB,
          endereco: lawyerInfo.endereco,
          email: lawyerInfo.email,
          cargo: lawyerInfo.genero === 'F' ? 'advogada' : 'advogado',
        },
        processos: processosArray.map((p: any) => ({
          banco: (p.banco || "BANCO").toUpperCase(),
          cnpjBanco: p.cnpjBanco || '',
          numero: p.numero || "S/N",
          acao: p.acao || 'AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA',
          estado: finalState
        }))
      } as DocumentOutput;
    } catch (error: any) {
      console.error("Erro no documentFlow:", error.message);
      throw new Error(`Falha na triagem neural: ${error.message}`);
    }
  }
);

export async function extrairDadosProcuracao(input: {text: string, preferredLawyer?: string, preferredState?: string}) {
  return documentFlow(input);
}
