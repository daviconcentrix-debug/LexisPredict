/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @fileOverview Validador de Respostas da Unidade Neural.
 */

export function validateAIResponse(content: string, format: 'text' | 'json'): boolean {
  if (!content || content.trim().length < 2) {
    console.warn('[VALIDATOR] Resposta vazia detectada.');
    return false;
  }

  if (format === 'json') {
    try {
      const clean = content.replace(/```json/gi, '').replace(/```/g, '').trim();
      JSON.parse(clean);
      return true;
    } catch (e) {
      console.warn('[VALIDATOR] JSON inválido detectado.');
      return false;
    }
  }

  // Hallucination Check simples
  const bannedPhrases = ["como um modelo de linguagem", "infelizmente não posso", "estou recalibrando"];
  if (bannedPhrases.some(p => content.toLowerCase().includes(p))) {
    console.warn('[VALIDATOR] Alucinação de negação detectada.');
    return false;
  }

  return true;
}

export function cleanResponse(content: string): string {
  return content.replace(/```json/gi, '').replace(/```/g, '').trim();
}
