'use server';

import { createClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';

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

export async function generateProcuracaoPDFAction(data: any) {
  try {
    const { ProcuracaoPDF } = await import('@/components/pdf/procuracao-pdf');
    const pdfBuffer = await renderToBuffer(React.createElement(ProcuracaoPDF, { data }));
    return { success: true, base64: Buffer.from(pdfBuffer).toString('base64') };
  } catch (e: any) {
    console.error('[PDF Generation]', e);
    return { error: "Falha ao selar o PDF." };
  }
}
