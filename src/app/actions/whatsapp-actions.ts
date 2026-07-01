
'use server';

/**
 * @fileOverview Motor de Disparo Programático WhatsApp (YCloud Elite)
 * Integração de API para envio de mensagens oficiais de gabinete.
 * Proprietário: W1 Capital | Fundador: Davi Alves Figueredo
 */

export async function sendYCloudWhatsApp(to: string, message: string) {
  const API_KEY = '6d6558e4ddfd8aec794de3a92f0c7893';
  
  // Normalização de telefone para formato E.164 (Ex: +5511999999999)
  const cleanPhone = to.replace(/\D/g, '');
  let finalPhone = cleanPhone;
  
  if (cleanPhone.length === 10 || cleanPhone.length === 11) {
    finalPhone = `55${cleanPhone}`;
  }
  
  const formattedPhone = `+${finalPhone}`;

  try {
    const response = await fetch('https://api.ycloud.com/v1/messages', {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formattedPhone,
        type: 'whatsapp',
        whatsapp: {
          type: 'text',
          text: {
            body: message
          }
        }
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `Erro API YCloud: ${response.status}`);
    }

    return { success: true, data: result };
  } catch (error: any) {
    console.error('YCloud Delivery Failure:', error.message);
    return { success: false, message: error.message };
  }
}
