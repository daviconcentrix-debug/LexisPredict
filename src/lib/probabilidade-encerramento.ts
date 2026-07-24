/**
 * @fileOverview Motor de Estimativa de Encerramento v100.0
 * Função pura para cálculo heurístico baseado em padrões textuais e tempo de atraso.
 * @copyright 2026 W1 Capital / Davi Alves Figueredo
 */

export function calcularProbabilidadeEncerramento(input: {
  status?: string; 
  situacao?: string; 
  observacao?: string; 
  diasVencidos?: number | null;
}): number {
  const text = `${input.status || ''} ${input.situacao || ''} ${input.observacao || ''}`.toLowerCase();
  
  // Condição de parada: Já encerrado
  if (/(encerrado|arquivado|extinto|baixa definitiva|arquivamento definitivo)/.test(text)) return 100;
  
  let score = 5; // Base mínima de probabilidade operacional

  // Padrões de Desistência ou Acordo próximo
  if (/(desistência|desistencia).*(homolog|arquiv)/.test(text)) score += 45;
  
  // Padrões de Finalização Financeira
  if (/(cumprimento de sentença|alvará|alvara|levantamento)/.test(text)) score += 22;
  
  // Padrões de Sentença Prolatada
  if (/(improcedente|procedente|sentença|sentenca)/.test(text)) score += 12;
  
  // Padrões de Recursos (diminuem velocidade mas indicam fase avançada)
  if (/(recurso|apelação|apelacao|agravo)/.test(text)) score += 5;
  
  // Padrões de Movimentação de Gabinete
  if (/(conclusos|réplica|replica|contestação|contestacao|em andamento)/.test(text)) score += 4;

  // Ponderação por Tempo (Inércia Crítica)
  const d = input.diasVencidos ?? 0;
  if (d > 60) score += 15;
  else if (d > 30) score += 10;
  else if (d > 14) score += 6;
  else if (d > 0) score += 3;

  return Math.max(0, Math.min(100, Math.round(score)));
}
