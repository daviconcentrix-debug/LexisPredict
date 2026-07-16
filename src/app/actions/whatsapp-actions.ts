'use server';

/**
 * @fileOverview Motor de Disparo Programático WhatsApp (Evolution API Elite)
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 */

import { sendTextMessage } from '@/lib/evolution-api';

/**
 * Server Action para envio de mensagens oficiais de gabinete via Evolution API.
 */
export async function sendWhatsAppAction(to: string, message: string) {
  const cleanPhone = to.replace(/\D/g, '');
  let finalPhone = cleanPhone;
  
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
    console.error('[Evolution API] Delivery Failure:', error.message);
    return { 
      success: false, 
      message: error.message || 'Erro ao processar envio via Evolution API' 
    };
  }
}
