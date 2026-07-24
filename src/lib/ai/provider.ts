/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @fileOverview Camada Técnica de Comunicação com Provedores.
 */

import { AIProvider, ChatMessage, AIResponse } from './types';

const CONFIG = {
  xai: { url: 'https://api.x.ai/v1/chat/completions', key: process.env.XAI_API_KEY, model: 'grok-4.5' },
  groq: { url: 'https://api.groq.com/openai/v1/chat/completions', key: process.env.GROQ_API_KEY, model: 'llama-3.3-70b-versatile' },
  airforce: { url: 'https://api.airforce/v1/chat/completions', key: process.env.AIRFORCE_API_KEY, model: 'deepseek-v3' }
};

const TIMEOUT_MS = 30000;

export async function callProvider(
  provider: AIProvider, 
  messages: ChatMessage[], 
  options: { temperature?: number; responseFormat?: string } = {}
): Promise<any> {
  const cfg = CONFIG[provider as keyof typeof CONFIG];
  if (!cfg || !cfg.key) {
    throw new Error(`[PROVIDER] Configuração ausente para: ${provider}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const startTime = Date.now();
    console.log(`[PROVIDER] [${provider.toUpperCase()}] Iniciando chamada...`);

    const response = await fetch(cfg.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfg.key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        temperature: options.temperature ?? 0.6,
        response_format: options.responseFormat === 'json' ? { type: 'json_object' } : undefined
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const duration = Date.now() - startTime;

    console.log(`[PROVIDER] [${provider.toUpperCase()}] Sucesso em ${duration}ms`);

    return {
      content: data.choices?.[0]?.message?.content || '',
      provider,
      model: cfg.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      },
      duration
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error(`[PROVIDER] [${provider.toUpperCase()}] Erro:`, err.message);
    throw err;
  }
}
