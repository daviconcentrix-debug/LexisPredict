
'use server';
/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved. See LICENSE file.
 */
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { extrairDadosProcuracao } from '@/ai/flows/document-flow';

export async function generateHabilitacaoPecaPDFAction(data: any) {
  try {
    const { HabilitacaoPecaPDF } = await import('@/components/pdf/habilitacao-peca-pdf');
    const pdfBuffer = await renderToBuffer(React.createElement(HabilitacaoPecaPDF, { data }));
    return { success: true, base64: Buffer.from(pdfBuffer).toString('base64') };
  } catch (e: any) {
    return { error: "Falha ao selar a Habilitação." };
  }
}

export async function generatePecaSubstabelecimentoPDFAction(data: any) {
  try {
    const { PecaSubstabelecimentoPDF } = await import('@/components/pdf/peca-substabelecimento-pdf');
    const pdfBuffer = await renderToBuffer(React.createElement(PecaSubstabelecimentoPDF, { data }));
    return { success: true, base64: Buffer.from(pdfBuffer).toString('base64') };
  } catch (e: any) {
    return { error: "Falha ao selar a Peça de Substabelecimento." };
  }
}

export async function generateProcuracaoPDFAction(data: any) {
  try {
    const { ProcuracaoPDF } = await import('@/components/pdf/procuracao-pdf');
    const pdfBuffer = await renderToBuffer(React.createElement(ProcuracaoPDF, { data }));
    return { success: true, base64: Buffer.from(pdfBuffer).toString('base64') };
  } catch (e: any) {
    return { error: "Falha ao selar o PDF." };
  }
}

export async function generateSubstabelecimentoPDFAction(data: any) {
  try {
    const { SubstabelecimentoPDF } = await import('@/components/pdf/substabelecimento-pdf');
    const pdfBuffer = await renderToBuffer(React.createElement(SubstabelecimentoPDF, { data }));
    return { success: true, base64: Buffer.from(pdfBuffer).toString('base64') };
  } catch (e: any) {
    return { error: "Falha ao selar o PDF do Substabelecimento." };
  }
}

export async function extrairTextoDoPDFAction(formData: FormData) {
  try {
    const file = formData.get('pdf') as File;
    if (!file) return { error: "Nenhum arquivo enviado" };
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdf = (await import('pdf-parse')).default;
    const data = await pdf(buffer);
    return { success: true, text: data.text };
  } catch (e: any) {
    return { error: "Falha na transcrição do arquivo." };
  }
}

export async function extrairDadosProcuracaoAction(inputText: string, lawyer: string, state: string) {
  try {
    const res = await extrairDadosProcuracao({ 
      text: inputText, 
      preferredLawyer: lawyer, 
      preferredState: state 
    });
    
    if (!res || (res as any).error) {
       return { success: false, error: (res as any).code || "Erro na triagem neural." };
    }
    
    return { success: true, ...res };
  } catch (e: any) {
    return { success: false, error: e.message || "Falha na triagem neural." };
  }
}
