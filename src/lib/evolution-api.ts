/**
 * @fileOverview MOTOR DE MENSAGERIA EVOLUTION API v810.0 ELITE
 * Central de integração oficial para disparos via WhatsApp do Gabinete.
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 */

const EVOLUTION_CONFIG = {
  baseUrl: 'https://evolution-api-0edm.onrender.com',
  globalApiKey: 'lexis2026',
  instanceName: 'Lexis',
  instanceToken: '39188EC8330F-4CA2-9AA4-36B71FD06B0C'
};

/**
 * Realiza requisições autenticadas à Evolution API.
 */
async function evolutionRequest(endpoint: string, method: string, data?: any) {
  const url = `${EVOLUTION_CONFIG.baseUrl}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_CONFIG.globalApiKey
      },
      body: data ? JSON.stringify(data) : undefined
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`[Evolution API Error] ${response.status}:`, result);
      throw new Error(result.message || 'Falha na comunicação com Evolution API');
    }

    return result;
  } catch (error: any) {
    console.error(`[Evolution API Critical]`, error.message);
    throw error;
  }
}

/**
 * Envia uma mensagem de texto simples para um número.
 * @param to Número no formato 5511999999999
 * @param message Conteúdo da mensagem
 */
export async function sendTextMessage(to: string, message: string) {
  // Evolution API espera o número sem o '+' no endpoint sendText
  const cleanNumber = to.replace(/\D/g, '');
  
  return evolutionRequest(`/message/sendText/${EVOLUTION_CONFIG.instanceName}`, 'POST', {
    number: cleanNumber,
    options: {
      delay: 1200,
      presence: 'composing',
      linkPreview: true
    },
    textMessage: {
      text: message
    }
  });
}

/**
 * Exemplo de função para Template ou Media se necessário futuramente
 */
export async function sendMediaMessage(to: string, caption: string, mediaUrl: string, type: 'image' | 'video' | 'document' = 'image') {
  const cleanNumber = to.replace(/\D/g, '');
  
  return evolutionRequest(`/message/sendMedia/${EVOLUTION_CONFIG.instanceName}`, 'POST', {
    number: cleanNumber,
    mediaMessage: {
      mediatype: type,
      caption: caption,
      media: mediaUrl
    }
  });
}
