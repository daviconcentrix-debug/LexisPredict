
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {openAI} from 'genkitx-openai';

/**
 * ORQUESTRADOR MULTI-ENGINE GENKIT (W1 CAPITAL)
 * Suporte a Gemini e DeepSeek (via OpenAI compatibility)
 * Proprietário: Davi Alves Figueredo
 */
export const ai = genkit({
  plugins: [
    googleAI(),
    openAI({
      apiKey: process.env.DEEPSEEK_API_KEY || 'sk-4236f7cfc66b4c8592e551b4cd7a89c5',
      baseURL: 'https://api.deepseek.com/v1',
    }),
  ],
});
