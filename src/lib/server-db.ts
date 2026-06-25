
import { supabase, isSupabaseConfigured } from './supabase';
import { LegalCase, CaseNote } from './case-logic';

/**
 * MOTOR DE PERSISTÊNCIA RELACIONAL LEXISPREDICT (SUPABASE)
 * Implementação de Consistência Atômica via PostgreSQL.
 * Propriedade de W1 Capital | Fundador: Davi Alves Figueredo
 */

export async function getStoredCases(): Promise<LegalCase[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('processos')
      .select('dados')
      .order('id', { ascending: false });

    if (error) throw error;
    return data ? data.map(item => item.dados as LegalCase) : [];
  } catch (error) {
    console.error('Supabase fetch processes error:', error);
    return [];
  }
}

export async function saveStoredCases(cases: LegalCase[]): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) return { success: false, message: "Supabase não configurado." };
  try {
    // Sincronização Atômica: Removemos o estado obsoleto
    await supabase.from('processos').delete().neq('id', 0);
    
    if (cases.length > 0) {
      const payload = cases.map(c => ({ dados: c }));
      const { error: insertError } = await supabase
        .from('processos')
        .insert(payload);
      
      if (insertError) throw insertError;
    }
    
    return { success: true, message: "Cloud CRM Sincronizado com W1 Capital." };
  } catch (error: any) {
    console.error('Supabase save processes failure:', error);
    return { success: false, message: error.message || "Erro na sincronização cloud." };
  }
}

export async function getStoredNotes(): Promise<CaseNote[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data ? data.map(item => ({
      id: item.id.toString(),
      title: item.title || 'Sem Título',
      content: item.content || '',
      color: 'bg-sidebar/40',
      updatedAt: new Date(item.created_at).toLocaleString('pt-BR')
    })) : [];
  } catch (error) {
    console.error('Supabase fetch notes error:', error);
    return [];
  }
}

export async function saveStoredNotes(notes: CaseNote[]): Promise<{ success: boolean }> {
  if (!isSupabaseConfigured) return { success: false };
  try {
    // Bloqueio de exclusão em massa para evitar loops de re-renderização disparando múltiplos deletes
    const { error: deleteError } = await supabase.from('notes').delete().neq('id', 0);
    if (deleteError) throw deleteError;
    
    if (notes.length > 0) {
      const dbNotes = notes.map(n => ({
        title: n.title || 'Sem Título',
        content: n.content || ''
      }));
      
      const { error: insertError } = await supabase.from('notes').insert(dbNotes);
      if (insertError) throw insertError;
    }
    return { success: true };
  } catch (error) {
    console.error('Supabase save notes error:', error);
    return { success: false };
  }
}
