import { supabase } from '@/lib/supabaseClient';

export async function getStoredCases() {
  // Busca tudo na tabela 'processos' que criámos no Supabase
  const { data, error } = await supabase
    .from('processos')
    .select('dados');

  if (error) {
    console.error("Erro ao buscar no Supabase:", error);
    return [];
  }
  
  // Extrai o objeto 'dados' de cada linha
  return data ? data.map(item => item.dados) : [];
}

export async function saveStoredCases(cases: any[]) {
  // Limpa a tabela antes de salvar para garantir que é a versão mais recente
  await supabase.from('processos').delete().neq('id', 0);
  
  // Insere os novos dados
  const { error } = await supabase
    .from('processos')
    .insert(cases.map(c => ({ dados: c })));

  return { success: !error };
}
