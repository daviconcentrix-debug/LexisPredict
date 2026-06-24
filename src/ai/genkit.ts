
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * ORQUESTRADOR GENKIT (W1 CAPITAL)
 * Suporte nativo ao Gemini.
 * Grok/Groq operando via Fetch Nativo para evitar erros de dependência.
 * Proprietário: W1 Capital | Fundador: Davi Alves Figueredo
 */
export const ai = genkit({
  plugins: [
    googleAI()
  ],
  model: googleAI.model('gemini-1.5-flash'), // Define o modelo padrão para evitar INVALID_ARGUMENT
});
