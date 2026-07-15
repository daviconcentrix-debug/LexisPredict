
'use server';
/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved. See LICENSE file.
 */
import React from 'react';
import { extrairDadosProcuracao } from '@/ai/flows/document-flow';

/**
 * Motor de Selagem Digital v730.0 ELITE
 * Processa e converte documentos jurídicos em buffers PDF via @react-pdf/renderer.
 */

async function getRenderToBuffer() {
  const { renderToBuffer } = await import('@react-pdf/renderer');
  return renderToBuffer;
}

export async function generateHabilitacaoPecaPDFAction(data: any) {
  try {
    const renderToBuffer = await getRenderToBuffer();
    const { HabilitacaoPecaPDF } = await import('@/components/pdf/habilitacao-peca-pdf');
    const pdfBuffer = await renderToBuffer(React.createElement(HabilitacaoPecaPDF as any, { data }));
    return { success: true, base64: Buffer.from(pdfBuffer).toString('base64') };
  } catch (e: any) {
    console.error("PDF Habilitacao Fail:", e);
    return { error: "Falha ao selar a Habilitação Digital." };
  }
}

export async function generatePecaSubstabelecimentoPDFAction(data: any) {
  try {
    const renderToBuffer = await getRenderToBuffer();
    const { PecaSubstabelecimentoPDF } = await import('@/components/pdf/peca-substabelecimento-pdf');
    const pdfBuffer = await renderToBuffer(React.createElement(PecaSubstabelecimentoPDF as any, { data }));
    return { success: true, base64: Buffer.from(pdfBuffer).toString('base64') };
  } catch (e: any) {
    console.error("PDF Peca Substabelecimento Fail:", e);
    return { error: "Falha ao selar a Peça de Substabelecimento." };
  }
}

export async function generateProcuracaoPDFAction(data: any) {
  try {
    const renderToBuffer = await getRenderToBuffer();
    const { ProcuracaoPDF } = await import('@/components/pdf/procuracao-pdf');
    const pdfBuffer = await renderToBuffer(React.createElement(ProcuracaoPDF as any, { data }));
    return { success: true, base64: Buffer.from(pdfBuffer).toString('base64') };
  } catch (e: any) {
    console.error("PDF Procuracao Fail:", e);
    return { error: "Falha ao selar o PDF da Procuração." };
  }
}

export async function generateSubstabelecimentoPDFAction(data: any) {
  try {
    const renderToBuffer = await getRenderToBuffer();
    const { SubstabelecimentoPDF } = await import('@/components/pdf/substabelecimento-pdf');
    const pdfBuffer = await renderToBuffer(React.createElement(SubstabelecimentoPDF as any, { data }));
    return { success: true, base64: Buffer.from(pdfBuffer).toString('base64') };
  } catch (e: any) {
    console.error("PDF Substabelecimento Fail:", e);
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
    console.error("PDF Extraction Fail:", e);
    return { error: "Falha na transcrição forense do arquivo." };
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
    console.error("Neural Extraction Action Fail:", e);
    return { success: false, error: e.message || "Falha na triagem neural de gabinete." };
  }
}
