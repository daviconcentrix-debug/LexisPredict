"use client";
/**
 * @fileOverview LexisPredict - W1 Capital Advanced Legal Operations
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 */

import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';

const BANCA_DATA: Record<string, any> = {
  "DIEGO GOMES DIAS": {
    oabs: { "SP": "370.898/SP" },
    endereco: "Av. São Miguel, nº 4810 – Jardim Cotinha – São Paulo – SP – CEP: 03870-100",
    email: "lucenadiasadvogados@gmail.com",
    genero: "M",
    estadoCivil: "casado"
  },
  "ERALDO FRANCISCO DA SILVA JUNIOR": {
    oabs: { "SP": "327.677/SP" },
    endereco: "Av. São Miguel, nº 4810 – Jardim Cotinha – São Paulo – SP – CEP: 03870-100",
    email: "eraldojr@adv.oabsp.org.br",
    genero: "M",
    estadoCivil: "casado"
  }
};

const SYSTEM_PROMPT = `Extraia dados do contrato para JSON plano: { "cliente": { "nome": "", "rg": "", "cpf": "", "endereco": "", "profissao": "", "estadoCivil": "" }, "processos": [{ "banco": "", "numero": "", "acao": "" }] }`;

export async function extrairTextoDoPDFAction(formData: FormData) {
  try {
    const file = formData.get('pdf') as File;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = (await import('pdf-parse')).default;
    const data = await pdf(Buffer.from(arrayBuffer));
    return { success: true, text: data.text };
  } catch (e) { return { error: "Falha na leitura." }; }
}

export async function extrairDadosProcuracaoAction(inputText: string, lawyer: string, state: string) {
  // Simulação de extração (em produção usaria as chaves xAI/Airforce como no vveredito)
  return {
    success: true,
    cliente: { nome: "CLIENTE TESTE", rg: "---", cpf: "---", endereco: "Endereço extraído", profissao: "Autônomo", estadoCivil: "casado" },
    advogado: { nome: lawyer, oab: "370.898", endereco: "Av. São Miguel", email: "doc@docs.com", cargo: "advogado" },
    processos: [{ banco: "BANCO ITAU", numero: "0000000-00.0000.8.26.0000", acao: "REVISIONAL", estado: state }]
  };
}

export async function generateProcuracaoPDFAction(data: any) {
  try {
    const { ProcuracaoPDF } = await import('@/components/pdf/procuracao-pdf');
    const pdfBuffer = await renderToBuffer(React.createElement(ProcuracaoPDF, { data }) as any);
    return { success: true, base64: Buffer.from(pdfBuffer).toString('base64') };
  } catch (e) { return { error: "Falha no PDF." }; }
}

export async function generateSubstabelecimentoPDFAction(data: any) {
  try {
    const { SubstabelecimentoPDF } = await import('@/components/pdf/substabelecimento-pdf');
    const pdfBuffer = await renderToBuffer(React.createElement(SubstabelecimentoPDF, { data }) as any);
    return { success: true, base64: Buffer.from(pdfBuffer).toString('base64') };
  } catch (e) { return { error: "Falha no PDF." }; }
}

export async function generatePecaSubstabelecimentoPDFAction(data: any) {
  try {
    const { PecaSubstabelecimentoPDF } = await import('@/components/pdf/peca-substabelecimento-pdf');
    const pdfBuffer = await renderToBuffer(React.createElement(PecaSubstabelecimentoPDF, { data }) as any);
    return { success: true, base64: Buffer.from(pdfBuffer).toString('base64') };
  } catch (e) { return { error: "Falha no PDF." }; }
}

export async function generateHabilitacaoPDFAction(data: any) {
  try {
    const { HabilitacaoPDF } = await import('@/components/pdf/habilitacao-pdf');
    const pdfBuffer = await renderToBuffer(React.createElement(HabilitacaoPDF, { data }) as any);
    return { success: true, base64: Buffer.from(pdfBuffer).toString('base64') };
  } catch (e) { return { error: "Falha no PDF." }; }
}
