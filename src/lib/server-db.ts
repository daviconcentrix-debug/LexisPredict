import { supabase, isSupabaseConfigured } from './supabase';
import { LegalCase, CaseNote } from './case-logic';

/**
 * MOTOR DE PERSISTÊNCIA RELACIONAL LEXISPREDICT (SUPABASE)
 * Implementação resiliente via UPSERT.
 */

export async function getStoredCases(): Promise<LegalCase[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('processos')
      .select('dados')
      .order('created_at', { ascending: false });

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
    if (cases.length > 0) {
      const updates = cases.map(c => ({
        id: c.protocolo || c.id,
        dados: c
      }));
      
      const { error } = await supabase.from('processos').upsert(updates, { onConflict: 'id' });
      if (error) throw error;
    }
    return { success: true, message: "Nuvem Sincronizada." };
  } catch (error: any) {
    console.error('Supabase save processes error:', error);
    return { success: false, message: error.message };
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
      id: item.id,
      title: item.title,
      content: item.content,
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
    // Sincronização de Notas: Mapeamento direto para colunas SQL
    // Nota: Como as notas não têm um identificador único estável no frontend MVP,
    // limpamos e reinserimos para manter o "Keep" sincronizado.
    await supabase.from('notes').delete().neq('title', '___GUARD_NOTE___');
    
    if (notes.length > 0) {
      const dbNotes = notes.map(n => ({
        title: n.title || 'Sem Título',
        content: n.content || ''
      }));
      
      const { error } = await supabase.from('notes').insert(dbNotes);
      if (error) throw error;
    }
    return { success: true };
  } catch (error) {
    console.error('Supabase save notes error:', error);
    return { success: false };
  }
}
