'use server';

/**
 * @fileOverview Motor de Disparo Programático WhatsApp (Evolution API Elite)
 * Substituição integral do motor YCloud.
 * Proprietário: W1 Capital | Fundador: Davi Alves Figueredo
 */

import { sendTextMessage } from '@/lib/evolution-api';

/**
 * Server Action para envio de mensagens oficiais de gabinete via Evolution API.
 */
export async function sendWhatsAppAction(to: string, message: string) {
  // Normalização de telefone para formato Evolution (Ex: 5511999999999)
  const cleanPhone = to.replace(/\D/g, '');
  let finalPhone = cleanPhone;
  
  // Garante o DDI Brasil se não houver
  if (cleanPhone.length === 10 || cleanPhone.length === 11) {
    finalPhone = `55${cleanPhone}`;
  }

  try {
    const result = await sendTextMessage(finalPhone, message);

    return { 
      success: true, 
      data: result,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.error('Evolution API Delivery Failure:', error.message);
    return { 
      success: false, 
      message: error.message || 'Erro ao processar envio via Evolution API' 
    };
  }
}
