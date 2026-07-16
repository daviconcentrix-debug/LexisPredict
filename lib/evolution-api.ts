/**
 * @fileOverview MOTOR DE MENSAGERIA EVOLUTION API v890.0 ELITE
 * Integração estável com Evolution API via Fetch Nativo.
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 */

const EVOLUTION_CONFIG = {
  baseUrl: 'https://evolution-api-0edm.onrender.com',
  apiKey: 'lexis2026',
  instanceName: 'Lexis'
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
        'apikey': EVOLUTION_CONFIG.apiKey
      },
      body: data ? JSON.stringify(data) : undefined
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`[Evolution API Error ${response.status}]`, result);
      throw new Error(result.message || 'Erro ao comunicar com Evolution API');
    }

    return result;
  } catch (error: any) {
    console.error(`[Evolution API Critical]`, error.message);
    throw new Error(error.message || 'Falha de comunicação com o servidor de mensagens.');
  }
}

/**
 * Envia mensagem de texto via Evolution API utilizando mapeamento direto.
 */
export async function sendTextMessage(to: string, message: string) {
  let cleanNumber = to.replace(/\D/g, '');
  
  if (cleanNumber.length === 10 || cleanNumber.length === 11) {
    cleanNumber = `55${cleanNumber}`;
  }

  if (!cleanNumber) throw new Error("Número de telefone inválido.");

  return evolutionRequest(`/message/sendText/${EVOLUTION_CONFIG.instanceName}`, 'POST', {
    number: cleanNumber,
    text: message,
    options: {
      delay: 1500,
      presence: 'composing',
      linkPreview: true
    }
  });
}
