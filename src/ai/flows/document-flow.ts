
'use server';
/**
 * @fileOverview Motor de Extração de Dados Jurídicos v2700.0 ELITE
 * Soberania Grok 4.5.
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const API_KEYS = {
  XAI: process.env.XAI_API_KEY
};

const BANCA_DATA = {
  "DIEGO GOMES DIAS": {
    oabs: { "BA": "77510", "CE": "52996-A", "MT": "34044-A", "PI": "22858", "RN": "21766A", "SP": "370.898" },
    endereco: "Av. São Miguel, nº 4810 – Jardim Cotinha – São Paulo – SP – CEP: 03870-100",
    email: "diego_gomesdias@yahoo.com.br",
    genero: "M"
  },
  "PABLO MATHEUS SILVA BASTOS PEREIRA": {
    oabs: { "SP": "520783", "MG": "249550", "PR": "520783", "RN": "520783", "PI": "520783", "MT": "520783", "CE": "520783", "BA": "520783", "SC": "520783", "ES": "520783", "MS": "520783" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-071",
    email: "pablobastos@adv.oabsp.org.br",
    genero: "M"
  }
};

const SYSTEM_PROMPT = `Você é o Arquiteto Jurídico Sênior da W1 Capital. Extraia meticulosamente todos os dados.
MODELO: Grok 4.5.
REGRAS CRÍTICAS:
1. CAPTURE O NOME COMPLETO.
2. IDENTIFIQUE A DATA DE NASCIMENTO (YYYY-MM-DD).
3. EXTRAIA CEP e ENDEREÇO.
4. Identifique o BANCO réu.
5. RETORNE JSON PLANO.`;

async function callNeuralEngine(text: string) {
  if (!API_KEYS.XAI) return null;
  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEYS.XAI}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'grok-4.5',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: `DOCUMENTO: ${text}` }],
        response_format: { type: 'json_object' }
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return JSON.parse(data?.choices?.[0]?.message?.content);
  } catch (e) { return null; }
}

export const documentFlow = ai.defineFlow(
  { name: 'documentFlow', inputSchema: z.any(), outputSchema: z.any() },
  async (input) => {
    const text = (input.text || "").substring(0, 15000);
    let parsed = await callNeuralEngine(text);

    if (!parsed) throw new Error("FALHA_MOTOR_NEURAL");

    const targetLawyer = input.preferredLawyer || "PABLO MATHEUS SILVA BASTOS PEREIRA";
    const lawyerInfo = (BANCA_DATA as any)[targetLawyer] || BANCA_DATA["PABLO MATHEUS SILVA BASTOS PEREIRA"];
    const finalState = (input.preferredState || parsed?.processos?.[0]?.estado || "SP").toUpperCase();
    const selectedOAB = lawyerInfo.oabs[finalState] || lawyerInfo.oabs["SP"] || Object.values(lawyerInfo.oabs)[0];

    return {
      cliente: {
        nome: (parsed?.cliente?.nome || "NÃO IDENTIFICADO").toUpperCase(),
        estadoCivil: parsed?.cliente?.estadoCivil || "casado(a)",
        profissao: parsed?.cliente?.profissao || "autônomo(a)",
        rg: parsed?.cliente?.rg || "---",
        cpf: parsed?.cliente?.cpf || "---",
        endereco: parsed?.cliente?.endereco || "Não localizado",
        cep: parsed?.cliente?.cep || "",
        dataNascimento: parsed?.cliente?.dataNascimento || "",
        email: parsed?.cliente?.email || "",
        telefone: parsed?.cliente?.telefone || "",
        genero: parsed?.cliente?.genero || 'M',
        nacionalidade: parsed?.cliente?.nacionalidade || 'brasileiro(a)'
      },
      advogado: {
        nome: targetLawyer.toUpperCase(),
        oab: selectedOAB,
        endereco: lawyerInfo.endereco,
        email: lawyerInfo.email,
        cargo: lawyerInfo.genero === 'F' ? 'advogada' : 'advogado',
      },
      processos: (parsed?.processos || []).map((p: any) => ({
        banco: (p.banco || "BANCO").toUpperCase(),
        cnpjBanco: p.cnpjBanco || '',
        numero: p.numero || "S/N",
        acao: p.acao || 'AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA',
        estado: finalState
      }))
    };
  }
);

export async function extrairDadosProcuracao(input: any) {
  return await documentFlow(input);
}
