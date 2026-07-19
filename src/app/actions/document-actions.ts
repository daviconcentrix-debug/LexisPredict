/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved. See LICENSE file.
 */
'use server';

import React from 'react';
import { extrairDadosProcuracao } from '@/ai/flows/document-flow';

/**
 * Motor de Selagem Digital v950.0 Elite
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
    console.error("[Selagem] Falha na Habilitação:", e.message || e);
    return { error: "Falha técnica ao selar a Habilitação. Verifique os dados e tente novamente." };
  }
}

export async function generatePecaSubstabelecimentoPDFAction(data: any) {
  try {
    const renderToBuffer = await getRenderToBuffer();
    const { PecaSubstabelecimentoPDF } = await import('@/components/pdf/peca-substabelecimento-pdf');
    const pdfBuffer = await renderToBuffer(React.createElement(PecaSubstabelecimentoPDF as any, { data }));
    return { success: true, base64: Buffer.from(pdfBuffer).toString('base64') };
  } catch (e: any) {
    console.error("[Selagem] Falha na Peça Substabelecimento:", e.message || e);
    return { error: "Falha técnica ao selar a Peça de Substabelecimento." };
  }
}

export async function generateProcuracaoPDFAction(data: any) {
  try {
    const renderToBuffer = await getRenderToBuffer();
    const { ProcuracaoPDF } = await import('@/components/pdf/procuracao-pdf');
    const pdfBuffer = await renderToBuffer(React.createElement(ProcuracaoPDF as any, { data }));
    return { success: true, base64: Buffer.from(pdfBuffer).toString('base64') };
  } catch (e: any) {
    console.error("[Selagem] Falha na Procuração:", e.message || e);
    return { error: "Falha técnica ao selar o PDF da Procuração." };
  }
}

export async function generateSubstabelecimentoPDFAction(data: any) {
  try {
    const renderToBuffer = await getRenderToBuffer();
    const { SubstabelecimentoPDF } = await import('@/components/pdf/substabelecimento-pdf');
    const pdfBuffer = await renderToBuffer(React.createElement(SubstabelecimentoPDF as any, { data }));
    return { success: true, base64: Buffer.from(pdfBuffer).toString('base64') };
  } catch (e: any) {
    console.error("[Selagem] Falha no Substabelecimento:", e.message || e);
    return { error: "Falha técnica ao selar o PDF do Substabelecimento." };
  }
}

/**
 * Extração de Texto Forense v2.0
 * Otimizado para ambientes Serverless (Vercel) e Supabase.
 */
export async function extrairTextoDoPDFAction(formData: FormData) {
  try {
    const file = formData.get('pdf') as File;
    if (!file || file.size === 0) return { error: "Nenhum arquivo enviado ou arquivo corrompido." };

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Import dinâmico do pdf-parse para economizar memória no startup da action
    const pdf = (await import('pdf-parse')).default;
    
    // Opções para melhorar a extração de textos densos
    const options = {
      max: 0, // Sem limite de páginas para triagem completa
    };

    const data = await pdf(buffer, options);
    
    if (!data || !data.text || data.text.trim().length < 10) {
      return { 
        error: "O PDF parece não conter texto extraível (provavelmente é uma imagem/foto). Utilize o 'Motor de OCR' para este arquivo." 
      };
    }

    return { success: true, text: data.text };
  } catch (e: any) {
    console.error("[Transcrição Forense Error]:", e.message || e);
    return { 
      error: "Falha técnica na transcrição. Tente converter o documento para PDF de texto ou use a aba Motor de OCR." 
    };
  }
}

export async function extrairDadosProcuracaoAction(inputText: string, lawyer: string, state: string) {
  try {
    const res = await extrairDadosProcuracao({ 
      text: inputText, 
      preferredLawyer: lawyer, 
      preferredState: state 
    });
    
    if (!res) {
       return { success: false, error: "TRIAGEM_INDISPONIVEL_TEMPORARIAMENTE" };
    }
    
    return { success: true, ...res };
  } catch (e: any) {
    console.error("Neural Extraction Action Fail:", e);
    return { success: false, error: e.message || "FALHA_NA_TRIAGEM_TECNICA" };
  }
}
