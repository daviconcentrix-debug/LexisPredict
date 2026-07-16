
/**
 * @fileOverview MOTOR DE MENSAGERIA EVOLUTION API v840.0 ELITE
 * Central de integração oficial para disparos via WhatsApp do Gabinete.
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 */

const EVOLUTION_CONFIG = {
  baseUrl: 'https://evolution-api-0edm.onrender.com',
  apiKey: 'lexis2026',
  instanceName: 'Lexis'
};

/**
 * Realiza requisições autenticadas à Evolution API com tratamento de erros verboso.
 */
async function evolutionRequest(endpoint: string, method: string, data?: any) {
  const url = `${EVOLUTION_CONFIG.baseUrl}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_CONFIG.apiKey
      },
      body: data ? JSON.stringify(data) : undefined
    });

    const result = await response.json();

    if (!response.ok) {
      const errorMsg = result.message || `Erro HTTP ${response.status}`;
      console.error(`[Evolution API Error] ${response.status}:`, result);
      throw new Error(errorMsg);
    }

    return result;
  } catch (error: any) {
    console.error(`[Evolution API Critical]`, error.message);
    throw new Error(error.message || 'Falha de comunicação com o servidor de mensagens.');
  }
}

/**
 * Envia uma mensagem de texto simples para um número.
 * @param to Número no formato 5511999999999
 * @param message Conteúdo da mensagem
 */
export async function sendTextMessage(to: string, message: string) {
  // Normalização agressiva de número
  const cleanNumber = to.replace(/\D/g, '');
  if (!cleanNumber) throw new Error("Número de telefone inválido.");

  return evolutionRequest(`/message/sendText/${EVOLUTION_CONFIG.instanceName}`, 'POST', {
    number: cleanNumber,
    options: {
      delay: 1500,
      presence: 'composing',
      linkPreview: true
    },
    textMessage: {
      text: message
    }
  });
}
